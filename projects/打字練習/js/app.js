/**
 * app.js — 把資料、引擎、鍵盤接起來，處理實際的鍵盤輸入
 *
 * 這裡有四個「電腦教室現場」才會遇到的守門，全部都是安靜失敗型的問題
 * ——不會報錯、畫面也沒反應，孩子只會覺得電腦壞了或自己笨：
 *
 *   輸入法沒切成英文  → keydown 收到的鍵名是 Process / Unidentified，
 *                      整個被丟掉，畫面完全沒反應。
 *   Caps Lock 亮著    → 打出來的大小寫全反，孩子照著提示按卻一直被判錯。
 *   忘了按 Shift      → 第 6 關要打大寫，按成小寫就一直錯、游標卡在原地。
 *                      2026-09-02 補：在那之前這個情境「完全沒有任何提示」，
 *                      跟 Caps Lock 在孩子眼裡是一模一樣的「我明明按對了」。
 *   習慣性按退格      → 引擎設計是打錯不前進也不退，Backspace 本來被整個丟掉，
 *                      按了毫無反應。與其沉默，不如告訴他不必退格。
 */
(function (global) {
  'use strict';

  var KeyMap = global.KeyMap;
  var Keyboard = global.Keyboard;
  var Engine = global.TypingEngine;
  var Cloud = global.TypingCloud || { available: function () { return false; },
    save: function () { return global.Promise.resolve('disabled'); },
    fetchMine: function () { return global.Promise.resolve(null); },
    flushPending: function () { return global.Promise.resolve(0); },
    pendingCount: function () { return 0; } };
  // 每個模式是「指法六關 + 進階四關」接起來的一條路。
  // 進階關的判分方式可能跟前六關完全不同（中打進階要走真輸入法），
  // 差別寫在關卡自己的 kind 欄位上，不是寫在模式上——同一個模式底下兩種都有。
  var MODES = {
    en: {
      label: '英打指法',
      advLabel: '英打進階',
      levels: global.LevelsEN.levels.concat(global.LevelsENAdv.levels),
      speedLabel: '每分鐘字數',
      speedUnit: '字／分'
    },
    zh: {
      label: '注音鍵位',
      advLabel: '中文進階',
      levels: global.LevelsZhuyin.levels.concat(global.LevelsZHAdv.levels),
      speedLabel: '每分鐘鍵數',
      speedUnit: '鍵／分'
    }
  };

  var ZhuyinOf = (global.LevelsZHAdv && global.LevelsZHAdv.zhuyinOf) || {};
  var PunctNote = (global.LevelsZHAdv && global.LevelsZHAdv.punctNote) || {};

  /** 這一關是不是走真輸入法（中文進階）。判分、提示、輸入路徑三處都靠它分流。 */
  function isIMELevel(level) {
    return !!(level && level.kind === 'ime');
  }

  function currentLevel() {
    return LEVELS[levelIndex];
  }

  /** 徽章文字看的是「這一關」，不是「這個模式」——同一個模式底下兩種都有。 */
  function stageLabelOf(level) {
    var m = MODES[currentMode];
    return level && level.stage === 'adv' ? m.advLabel : m.label;
  }

  /**
   * 速度單位也是一關一關看的。
   * 注音鍵位量「鍵」，中文進階量「字」——一個中文字要按 3～4 鍵，
   * 兩個混在一起看會以為孩子突然變慢三倍。
   */
  function speedLabelOf(level) {
    return isIMELevel(level) ? '每分鐘字數' : MODES[currentMode].speedLabel;
  }

  var FINGER_COLOR = {
    L5: 'var(--f-L5)', L4: 'var(--f-L4)', L3: 'var(--f-L3)', L2: 'var(--f-L2)',
    R2: 'var(--f-R2)', R3: 'var(--f-R3)', R4: 'var(--f-R4)', R5: 'var(--f-R5)',
    TH: 'var(--f-TH)'
  };

  var $ = function (id) { return document.getElementById(id); };

  var keyboard = null;
  var mascot = null;
  var session = null;
  var currentMode = 'en';
  var LEVELS = MODES[currentMode].levels;
  var levelIndex = 0;
  var freePractice = false;
  var advancing = false;   // 換題動畫進行中，擋掉這段時間的輸入
  var focusBeforeModal = null;

  var SPARKS = ['✨', '⭐', '💫', '🌟'];
  var CONFETTI_COLORS = ['#FF8A5B', '#3FC5BB', '#FFC53D', '#8E88E0', '#4BC57F', '#DE83BD'];

  /** 打對時從字上冒一顆小星星。純裝飾，動畫結束就自己移除。 */
  function sparkle(node) {
    if (!node) return;
    var s = document.createElement('span');
    s.className = 'spark';
    s.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
    node.appendChild(s);
    global.setTimeout(function () { s.remove(); }, 640);
  }

  /** 通關彩帶。用 CSS 動畫做，不為了這個去載一個套件。 */
  function dropConfetti() {
    var box = $('confetti');
    if (!box) return;
    box.innerHTML = '';
    for (var i = 0; i < 34; i++) {
      var bit = document.createElement('i');
      bit.style.left = Math.random() * 100 + '%';
      bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      bit.style.animationDuration = (1.5 + Math.random() * 1.4) + 's';
      bit.style.animationDelay = (Math.random() * 0.5) + 's';
      box.appendChild(bit);
    }
    global.setTimeout(function () { box.innerHTML = ''; }, 3600);
  }

  // ---- 提醒條 ------------------------------------------------------------

  var noticeTimer = null;

  // 提示條是浮在畫面上方的，會蓋住模式切換與班級座號那排按鈕。
  //
  // 🕳️ **sticky 不等於「永遠不收」。** 原本 sticky 的提示只有在孩子「打對一個鍵」
  // 時才會消失——但會跳這種提示的情境（輸入法沒切對），孩子**根本打不對任何一個鍵**，
  // 於是它就一直蓋在那裡，連想去點模式切換都被擋住。
  //
  // 改成久一點但仍然會自己收。收掉不會讓孩子失去指引：那些條件每按一次鍵
  // 都會重新觸發一次提示，真的還沒解決的話，一按就又跳出來。
  var STICKY_MS = 12000;
  var NORMAL_MS = 6000;

  function showNotice(html, sticky) {
    $('noticeText').innerHTML = html;
    $('notice').classList.add('show');
    global.clearTimeout(noticeTimer);
    noticeTimer = global.setTimeout(hideNotice, sticky ? STICKY_MS : NORMAL_MS);
  }
  function hideNotice() {
    $('notice').classList.remove('show');
  }

  // ---- 我是誰（班級座號） --------------------------------------------------
  //
  // 電腦教室的機器是共用的，孩子每週不一定坐同一台。進度若只存一個 key，
  // 下一節課的孩子一坐下就看到上一個人的星星、自己的不見了。
  // 所以進度綁「班級-座號」，不是綁這台電腦。沒填照樣能練，只是記在訪客名下。

  var GRADE_NAME = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' };

  // 班級先填好，孩子只要打座號——一個班的班級號碼都一樣，
  // 讓三十個人各打一次是白費的。座號才是每個人不同的那一格。
  // 換班級上課時老師改一次就好（改了會被記住，下次自動帶出來）。
  var DEFAULT_CLASS = '301';
  var DEFAULT_SEAT = '01';

  function setIdPanel(open) {
    $('idPanel').hidden = !open;
    $('btnStudent').setAttribute('aria-expanded', String(open));
    // 班級已經有值（預設或上次記住的）就直接跳到座號，
    // 焦點停在一格已經填好的欄位上，孩子會愣一下不知道要打哪裡
    if (open) {
      var target = $('inputClass').value ? $('inputSeat') : $('inputClass');
      target.focus();
    }
  }

  /**
   * 雲端狀態就一個小圖示，不搶版面也不用文字解釋。
   * 傳不上去不是錯誤——成績本來就先進 localStorage，雲端只是加值。
   */
  function renderSync(state) {
    var badge = $('syncBadge');
    if (!badge) return;
    if (!Cloud.available()) { badge.hidden = true; return; }
    var pending = Cloud.pendingCount();
    badge.hidden = false;

    if (state === 'saving') {
      badge.textContent = '⏳';
      badge.title = '正在存到雲端…';
    } else if (pending > 0) {
      badge.textContent = '☁️' + pending;
      badge.title = '有 ' + pending + ' 筆還沒傳上去，下次連得上會自動補送';
    } else if (state === 'rejected') {
      // 多半是「這次成績沒有比雲端那筆好」，那是正常的，不要嚇孩子
      badge.textContent = '☁️';
      badge.title = '雲端上的成績比這次好，所以沒有更新';
    } else {
      badge.textContent = '☁️';
      badge.title = '成績已經存到雲端了';
    }
  }

  function renderStudent() {
    var s = Engine.loadStudent();
    var known = !!(s.klass && s.seat);

    $('studentLabel').textContent = known
      ? '👤 ' + s.klass + ' 班 ' + s.seat + ' 號'
      : '👤 點我填班級座號';
    $('btnStudent').classList.toggle('is-unset', !known);
    $('inputClass').value = s.klass || DEFAULT_CLASS;
    $('inputSeat').value = s.seat || DEFAULT_SEAT;

    var grade = Engine.gradeOf(s.klass);
    if (!known) {
      $('idHint').textContent = '這台電腦別人也會用，填了星星才記得住是你的。';
    } else if (grade) {
      $('idHint').textContent = GRADE_NAME[grade] + '年級的速度標準' +
        (session ? '：這一關第三顆星要打到 ' + session.wpmTarget + ' ' +
          MODES[currentMode].speedUnit : '');
    } else {
      $('idHint').textContent = '班級看不出年級，速度標準用一般的。';
    }
  }

  // ---- 關卡選單 ----------------------------------------------------------

  function getLevelIconSvg(idx, isZhuyin) {
    var orangeSide = '#E0693A', orangeTop = '#FF8A5B';
    var mintSide = '#2AA299', mintTop = '#3FC5BB';
    var goldSide = '#D99B00', goldTop = '#FFC53D';

    function makeTwoRowKeys(row1, row2, color1, color2) {
      var n1 = row1.length, n2 = row2.length;
      var W = 46, marginX = 2;
      var w1 = (W - (n1 - 1) * 1) / n1;
      var w2 = (W - (n2 - 1) * 1) / n2;
      var svg = '<svg viewBox="0 0 50 44" class="level-icon-svg">';
      for (var i = 0; i < n1; i++) {
        var x1 = marginX + i * (w1 + 1);
        svg += '<rect x="' + x1.toFixed(1) + '" y="5" width="' + w1.toFixed(1) + '" height="17" rx="2.5" fill="' + color1.side + '"/>' +
          '<rect x="' + x1.toFixed(1) + '" y="2" width="' + w1.toFixed(1) + '" height="17" rx="2" fill="' + color1.top + '"/>' +
          '<text x="' + (x1 + w1 / 2).toFixed(1) + '" y="10.5" font-size="7.5" font-weight="900" fill="' + (color1.txt || '#fff') + '" text-anchor="middle" dominant-baseline="central">' + row1[i] + '</text>';
      }
      for (var j = 0; j < n2; j++) {
        var x2 = marginX + j * (w2 + 1);
        svg += '<rect x="' + x2.toFixed(1) + '" y="24" width="' + w2.toFixed(1) + '" height="17" rx="2.5" fill="' + color2.side + '"/>' +
          '<rect x="' + x2.toFixed(1) + '" y="21" width="' + w2.toFixed(1) + '" height="17" rx="2" fill="' + color2.top + '"/>' +
          '<text x="' + (x2 + w2 / 2).toFixed(1) + '" y="29.5" font-size="7.5" font-weight="900" fill="' + (color2.txt || '#fff') + '" text-anchor="middle" dominant-baseline="central">' + row2[j] + '</text>';
      }
      svg += '</svg>';
      return svg;
    }

    function makeThreeRowKeys(row1, row2, row3, c1, c2, c3) {
      var rows = [row1, row2, row3];
      var colors = [c1, c2, c3];
      var W = 46, marginX = 2;
      var svg = '<svg viewBox="0 0 50 44" class="level-icon-svg">';
      var yPositions = [{side:4,top:2}, {side:17,top:15}, {side:30,top:28}];
      for (var r = 0; r < 3; r++) {
        var keys = rows[r];
        var n = keys.length;
        var w = (W - (n - 1) * 1) / n;
        var col = colors[r];
        for (var i = 0; i < n; i++) {
          var x = marginX + i * (w + 1);
          svg += '<rect x="' + x.toFixed(1) + '" y="' + yPositions[r].side + '" width="' + w.toFixed(1) + '" height="12" rx="2" fill="' + col.side + '"/>' +
            '<rect x="' + x.toFixed(1) + '" y="' + yPositions[r].top + '" width="' + w.toFixed(1) + '" height="12" rx="1.8" fill="' + col.top + '"/>' +
            '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (yPositions[r].top + 6) + '" font-size="6.5" font-weight="900" fill="' + (col.txt || '#fff') + '" text-anchor="middle" dominant-baseline="central">' + keys[i] + '</text>';
        }
      }
      svg += '</svg>';
      return svg;
    }

    if (isZhuyin) {
      if (idx === 0) {
        return makeTwoRowKeys(
          ['ㄇ','ㄋ','ㄎ','ㄑ','ㄕ'],
          ['ㄘ','ㄨ','ㄜ','ㄠ','ㄤ'],
          { top: orangeTop, side: orangeSide },
          { top: orangeTop, side: orangeSide }
        );
      }
      if (idx === 1) {
        return makeTwoRowKeys(
          ['ㄈ','ㄌ','ㄏ','ㄒ','ㄖ'],
          ['ㄙ','ㄩ','ㄝ','ㄡ','ㄥ'],
          { top: mintTop, side: mintSide },
          { top: mintTop, side: mintSide }
        );
      }
      if (idx === 2) {
        return makeTwoRowKeys(
          ['ㄆ','ㄊ','ㄍ','ㄐ','ㄔ'],
          ['ㄗ','ㄧ','ㄛ','ㄟ','ㄣ'],
          { top: goldTop, side: goldSide, txt: '#4A3326' },
          { top: goldTop, side: goldSide, txt: '#4A3326' }
        );
      }
      if (idx === 3) {
        return makeTwoRowKeys(
          ['ㄅ','ㄉ','ㄓ','ㄚ'],
          ['ㄞ','ㄢ','ㄦ'],
          { top: orangeTop, side: orangeSide },
          { top: orangeTop, side: orangeSide }
        );
      }
      if (idx === 4) {
        return makeThreeRowKeys(
          ['ㄆ','ㄊ','ㄍ','ㄐ'],
          ['ㄇ','ㄋ','ㄎ','ㄑ'],
          ['ㄈ','ㄌ','ㄏ','ㄒ'],
          { top: goldTop, side: goldSide, txt: '#4A3326' },
          { top: orangeTop, side: orangeSide },
          { top: mintTop, side: mintSide }
        );
      }
      if (idx === 5) {
        return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
          '<rect x="5" y="8" width="40" height="32" rx="7" fill="' + orangeSide + '"/>' +
          '<rect x="5" y="4" width="40" height="32" rx="6" fill="' + orangeTop + '"/>' +
          '<text x="25" y="20" font-size="13" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">ㄅㄆㄇ</text>' +
          '</svg>';
      }
      if (idx === 6) {
        return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
          '<rect x="5" y="8" width="40" height="32" rx="7" fill="' + mintSide + '"/>' +
          '<rect x="5" y="4" width="40" height="32" rx="6" fill="' + mintTop + '"/>' +
          '<text x="25" y="20" font-size="15" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">字</text>' +
          '</svg>';
      }
      if (idx === 7) {
        return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
          '<rect x="4" y="10" width="20" height="28" rx="5" fill="' + mintSide + '"/>' +
          '<rect x="4" y="6"  width="20" height="28" rx="5" fill="' + mintTop + '"/>' +
          '<text x="14" y="20" font-size="14" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">，</text>' +
          '<rect x="26" y="10" width="20" height="28" rx="5" fill="' + orangeSide + '"/>' +
          '<rect x="26" y="6"  width="20" height="28" rx="5" fill="' + orangeTop + '"/>' +
          '<text x="36" y="20" font-size="14" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">。</text>' +
          '</svg>';
      }
      if (idx === 8) {
        return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
          '<rect x="5" y="8" width="40" height="32" rx="7" fill="' + goldSide + '"/>' +
          '<rect x="5" y="4" width="40" height="32" rx="6" fill="' + goldTop + '"/>' +
          '<text x="25" y="20" font-size="13" font-weight="900" fill="#4A3326" text-anchor="middle" dominant-baseline="central">詞語</text>' +
          '</svg>';
      }
      if (idx === 9) {
        return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
          '<path d="M5 14 L25 5 L45 14 L45 38 L5 38 Z" fill="' + mintSide + '"/>' +
          '<path d="M5 10 L25 1 L45 10 L45 34 L5 34 Z" fill="' + mintTop + '"/>' +
          '<text x="25" y="19" font-size="13" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">文章</text>' +
          '</svg>';
      }
    }

    if (idx === 0) {
      return makeTwoRowKeys(
        ['A','S','D','F','G'],
        ['H','J','K','L',';'],
        { top: orangeTop, side: orangeSide },
        { top: mintTop, side: mintSide }
      );
    }
    if (idx === 1) {
      return makeTwoRowKeys(
        ['Z','X','C','V','B'],
        ['N','M',',','.','/'],
        { top: mintTop, side: mintSide },
        { top: mintTop, side: mintSide }
      );
    }
    if (idx === 2) {
      return makeTwoRowKeys(
        ['Q','W','E','R','T'],
        ['Y','U','I','O','P'],
        { top: orangeTop, side: orangeSide },
        { top: orangeTop, side: orangeSide }
      );
    }
    if (idx === 3) {
      return makeThreeRowKeys(
        ['Q','W','E','R'],
        ['A','S','D','F'],
        ['Z','X','C','V'],
        { top: orangeTop, side: orangeSide },
        { top: mintTop, side: mintSide },
        { top: goldTop, side: goldSide, txt: '#4A3326' }
      );
    }
    if (idx === 4) {
      return makeTwoRowKeys(
        ['1','2','3','4','5'],
        ['6','7','8','9','0'],
        { top: goldTop, side: goldSide, txt: '#4A3326' },
        { top: goldTop, side: goldSide, txt: '#4A3326' }
      );
    }
    if (idx === 5) {
      return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
        '<rect x="5" y="8" width="40" height="32" rx="7" fill="' + orangeSide + '"/>' +
        '<rect x="5" y="4" width="40" height="32" rx="6" fill="' + orangeTop + '"/>' +
        '<polygon points="25,9 27.5,16 35,16 29,20 31.5,27 25,23 18.5,27 21,20 15,16 22.5,16" fill="' + goldTop + '"/>' +
        '</svg>';
    }
    if (idx === 6) {
      return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
        '<rect x="5" y="8" width="40" height="32" rx="7" fill="' + mintSide + '"/>' +
        '<rect x="5" y="4" width="40" height="32" rx="6" fill="' + mintTop + '"/>' +
        '<text x="25" y="20" font-size="13" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">ABC</text>' +
        '</svg>';
    }
    if (idx === 7) {
      return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
        '<rect x="4" y="10" width="20" height="28" rx="5" fill="' + mintSide + '"/>' +
        '<rect x="4" y="6"  width="20" height="28" rx="5" fill="' + mintTop + '"/>' +
        '<text x="14" y="20" font-size="14" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">!</text>' +
        '<rect x="26" y="10" width="20" height="28" rx="5" fill="' + orangeSide + '"/>' +
        '<rect x="26" y="6"  width="20" height="28" rx="5" fill="' + orangeTop + '"/>' +
        '<text x="36" y="20" font-size="14" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">?</text>' +
        '</svg>';
    }
    if (idx === 8) {
      return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
        '<rect x="5" y="8" width="40" height="32" rx="10" fill="' + orangeSide + '"/>' +
        '<rect x="5" y="4" width="40" height="32" rx="10" fill="' + orangeTop + '"/>' +
        '<line x1="13" y1="16" x2="37" y2="16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="13" y1="24" x2="29" y2="24" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
        '</svg>';
    }
    return '<svg viewBox="0 0 50 44" class="level-icon-svg">' +
      '<path d="M5 14 L25 5 L45 14 L45 38 L5 38 Z" fill="' + mintSide + '"/>' +
      '<path d="M5 10 L25 1 L45 10 L45 34 L5 34 Z" fill="' + mintTop + '"/>' +
      '<text x="25" y="19" font-size="13" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">TEXT</text>' +
      '</svg>';
  }

  function renderLevels() {
    var progress = Engine.loadProgress();
    var box = $('levels');
    box.innerHTML = '';
    var isZhuyin = currentMode === 'zh';

    LEVELS.forEach(function (lv, idx) {
      var rec = progress[lv.id];
      var stars = rec ? rec.stars : 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-card' +
        (idx === levelIndex ? ' is-current' : '') +
        (lv.stage === 'adv' ? ' is-adv' : '');

      card.innerHTML =
        (lv.stage === 'adv' ? '<span class="level-tag">進階</span>' : '') +
        getLevelIconSvg(idx, isZhuyin) +
        '<h3>' + lv.name + '</h3>' +
        '<span class="level-stars">' +
          '<span class="' + (stars >= 1 ? 'on' : '') + '">★</span>' +
          '<span class="' + (stars >= 2 ? 'on' : '') + '">★</span>' +
          '<span class="' + (stars >= 3 ? 'on' : '') + '">★</span>' +
        '</span>' +
        (rec ? '<span class="level-best">' + rec.accuracy + '%</span>' : '');
      card.addEventListener('click', function () { startLevel(idx, true); });
      box.appendChild(card);
    });
  }

  function renderModeButtons() {
    ['en', 'zh'].forEach(function (mode) {
      var button = $('mode' + mode.toUpperCase());
      if (!button) return;
      button.classList.toggle('is-active', currentMode === mode);
      button.setAttribute('aria-pressed', String(currentMode === mode));
    });
    var level = currentLevel();
    $('modeLabel').textContent = stageLabelOf(level);
    $('statWpmLabel').textContent = speedLabelOf(level);
    if ($('modalWpmLabel')) $('modalWpmLabel').textContent = speedLabelOf(level);
    document.title = '羅東國小打字練習網 — ' + stageLabelOf(level);
  }

  function switchMode(mode) {
    if (!MODES[mode] || currentMode === mode) return;
    currentMode = mode;
    LEVELS = MODES[currentMode].levels;
    levelIndex = 0;
    advancing = false;
    keyboard.setMode(currentMode);
    renderModeButtons();
    startLevel(0, true);
    var who = Engine.loadStudent();
    if (who.klass && who.seat) pullFromCloud(who);
  }

  // ---- 手指圖例 ----------------------------------------------------------

  function renderLegend() {
    var order = ['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5'];
    $('legend').innerHTML = order.map(function (f) {
      return '<span><i class="finger-dot" style="background:' + FINGER_COLOR[f] + '"></i>' +
             KeyMap.FINGER_NAME[f] + '</span>';
    }).join('');
  }

  // ---- 題目 --------------------------------------------------------------

  function renderWord(state) {
    var level = currentLevel();
    // 文章關一題有六七十個字元，一個字一顆鍵帽會直接把畫面撐爆，
    // 所以改成整段文字排版，只保留「打完變綠、目前這個字highlight」。
    var asText = !!(level && level.display === 'text');
    var box = $('word');
    box.className = 'word' + (asText ? ' is-text' : '');
    box.innerHTML = '';
    for (var i = 0; i < state.text.length; i++) {
      var ch = state.text[i];
      var node = document.createElement('span');
      node.className = 'ch' +
        (ch === ' ' ? (asText ? ' is-gap' : ' is-space') : '') +
        (i < state.charIndex ? ' is-done' : '') +
        (i === state.charIndex ? ' is-current' : '');
      node.id = 'ch-' + i;
      node.textContent = ch === ' ' ? (asText ? ' ' : '空白') : ch;
      box.appendChild(node);
    }
    updateHint(state.expected);
  }

  /** 提示要看這一關是哪一種：指法關講手指，中文進階關講注音怎麼拼。 */
  function updateHint(ch) {
    if (isIMELevel(currentLevel())) {
      updateZhuyinHint(ch);
    } else {
      updateFingerHint(ch);
      keyboard.highlightChar(ch);
    }
  }

  var TONE_MARKS = 'ˊˇˋ˙';

  /**
   * 中文進階關的提示：這個字的注音怎麼拼。
   *
   * 這裡**不講按哪一顆鍵打標點**——全形標點對到哪顆鍵是輸入法決定的，
   * 微軟注音、新酷音、自然輸入法各有各的排法，寫死了只要有一台不一樣，
   * 孩子就會照著提示按然後打不出來，比沒提示更糟。理由詳見 levels-zh-adv.js。
   */
  function updateZhuyinHint(ch) {
    var text = $('fingerText');
    if (ch == null) {
      text.textContent = '';
      keyboard.clearHighlight();
      return;
    }
    $('fingerDot').style.background = 'var(--brand)';

    // 文章關不逐字提示。一段話六七十個字，每打一個字提示就換一次，
    // 眼睛得在句子和提示之間來回跳，反而看不下去；而且多數字沒有注音表可查，
    // 只會一直跳「用注音輸入法打出「我」」這種等於沒說的話。
    if (currentLevel() && currentLevel().display === 'text') {
      text.textContent = '照著上面那段話打，標點也要打出來';
      keyboard.clearHighlight();
      return;
    }

    if (PunctNote[ch]) {
      text.textContent = '「' + ch + '」' + PunctNote[ch];
      keyboard.clearHighlight();
      return;
    }
    var zhuyin = ZhuyinOf[ch];
    if (!zhuyin) {
      text.textContent = '用注音輸入法打出「' + ch + '」';
      keyboard.clearHighlight();
      return;
    }
    var hasTone = false;
    for (var i = 0; i < zhuyin.length; i++) {
      if (TONE_MARKS.indexOf(zhuyin[i]) !== -1) hasTone = true;
    }
    text.textContent = '「' + ch + '」拼作 ' + zhuyin +
      (hasTone ? '' : '（一聲，拼完直接選字）');
    keyboard.highlightMany(zhuyin.split(''));
  }

  function updateFingerHint(ch) {
    if (ch == null) return;
    var k = currentMode === 'zh' ? KeyMap.byBopomofo(ch) : KeyMap.byChar(ch);
    if (!k) {
      $('fingerText').textContent = '';
      return;
    }
    var needShift = currentMode === 'en' && KeyMap.needsShift(ch);
    var shiftHand = k.finger.charAt(0) === 'L' ? '右手' : '左手';
    $('fingerDot').style.background = FINGER_COLOR[k.finger] || 'var(--f-TH)';
    $('fingerText').textContent = currentMode === 'zh'
      ? k.fingerName + (ch === 'ˉ' ? ' 按空白鍵（一聲）' : ' 按 ' + ch + '（' + k.upper + '）')
      : needShift
      ? k.fingerName + ' 按 ' + k.lower + '，同時用' + shiftHand + '小指壓住 Shift'
      : k.fingerName + (ch === ' ' ? ' 按空白鍵' : ' 按 ' + k.upper);
  }

  function updateStats(s) {
    $('statAcc').innerHTML = s.accuracy + '<small>%</small>';
    $('statWpm').textContent = freePractice ? '—' : s.wpm;
    $('statCombo').textContent = s.combo;
    $('statProgress').innerHTML = s.done + '<small>/' + s.total + '</small>';
    $('progressFill').style.width = Math.round((s.done / s.total) * 100) + '%';
  }

  // ---- 開始一關 ----------------------------------------------------------

  function startLevel(idx, focusStage) {
    levelIndex = idx;
    advancing = false;
    var level = LEVELS[idx];

    session = Engine.createSession({
      level: level,
      mode: currentMode,
      freePractice: freePractice,
      onItemChange: function (state, s) {
        renderWord(state);
        if (s) updateStats(s);
      },
      onUpdate: function (s) { updateStats(s); },
      onItemComplete: function () {
        // 讓孩子看見整題變綠，再換下一題
        advancing = true;
        var completingSession = session;
        if (completingSession) completingSession.pause();
        global.setTimeout(function () {
          // 動畫途中若切換關卡，舊計時器不能推進新關卡。
          if (session !== completingSession) return;
          advancing = false;
          if (completingSession) {
            completingSession.resume();
            completingSession.nextItem();
          }
        }, 260);
      },
      // 最後一題打完是直接進 onFinish 的，不經過 onItemChange，
      // 這裡不補一次的話進度會停在「9/10」
      onFinish: function (result, s) {
        if (s) updateStats(s);
        showResult(result);

        // 只有破紀錄才送上雲端。每打完一關就傳一次的話，
        // 一節課 30 個孩子會把免費額度花在沒有意義的重複寫入上。
        if (result.saved && result.saved.improved && !result.freePractice) {
          renderSync('saving');
          Cloud.save(Engine.loadStudent(), level.id, result.saved.record)
            .then(function (state) { renderSync(state); renderLevels(); });
        }
      }
    });

    $('stageLabel').textContent = level.desc;
    document.body.classList.toggle('is-free-practice', freePractice);
    // 上一關留下的提醒條在這一關多半已經不成立了，尤其「要切成注音」那種
    // 是 sticky 的，不清掉會一路跟著跨關卡，變成看起來很嚴重的假警告。
    hideNotice();
    setupInputMode(level);
    updateStats(session.stats());
    renderModeButtons();
    renderLevels();
    if ($('studentLabel')) renderStudent();
    closeModal(false);
    if (mascot) mascot.say('idle');
    if (focusStage) {
      // 中文進階關的鍵盤輸入要落在輸入框裡，焦點放錯的話孩子打了完全沒反應
      var target = isIMELevel(level) ? $('imeInput') : $('practiceStage');
      if (target) target.focus({ preventScroll: true });
    }
  }

  // ---- 結果 --------------------------------------------------------------

  function showResult(result) {
    var on = function (n) { return result.stars >= n ? 'on' : ''; };
    $('modalStars').innerHTML =
      '<span class="' + on(1) + '">★</span>' +
      '<span class="' + on(2) + '">★</span>' +
      '<span class="' + on(3) + '">★</span>';

    $('modalTitle').textContent =
      result.freePractice ? '自由練習結束！' :
      result.stars === 3 ? '又快又準，太厲害了！' :
      result.stars === 2 ? '打得很準！再快一點就三顆星' :
      '完成了！再練一次會更順';

    $('modalAcc').textContent = result.accuracy + '%';
    $('modalWpm').textContent = result.wpm;
    $('modalStars').style.display = result.freePractice ? 'none' : '';
    $('modalWpmStat').style.display = result.freePractice ? 'none' : '';

    // 只講「d 常打錯」對老師沒用。要看見他把 d 按成 f（手指右移一格）
    // 還是按成 k（左右手搞混）——那是兩種完全不同的毛病。
    if (result.missTop && result.missTop.length) {
      $('modalMisses').innerHTML = '最常打錯的鍵：' + result.missTop.map(function (m) {
        var k = KeyMap.byChar(m.char);
        var label = m.char === ' ' ? '空白鍵' : m.char;
        var typed = (m.typed || []).map(function (t) {
          return '<code>' + (t.char === ' ' ? '空白' : t.char) + '</code>';
        });
        return '<code>' + label + '</code>' + (k ? '（' + k.fingerName + '）' : '') +
               ' ' + m.count + ' 次' +
               (typed.length ? '，按成了 ' + typed.join('、') : '');
      }).join('；');
      $('modalMisses').style.display = '';
    } else {
      $('modalMisses').innerHTML = '這一關一個字都沒打錯，指法很穩！';
      $('modalMisses').style.display = '';
    }

    $('modalNext').style.display = levelIndex + 1 < LEVELS.length ? '' : 'none';
    focusBeforeModal = document.activeElement;
    $('modalBackdrop').classList.add('show');
    $('modalBackdrop').setAttribute('aria-hidden', 'false');
    if (result.stars >= 1 && global.TypingSound) global.TypingSound.playCheer();
    if (result.stars >= 2) dropConfetti();
    mascot.say('clear', 0);
    renderLevels();
    global.setTimeout(function () {
      var firstButton = $('modalNext').style.display === 'none' ? $('modalRetry') : $('modalNext');
      firstButton.focus();
    }, 0);
  }

  function closeModal(restoreFocus) {
    var wasOpen = $('modalBackdrop').classList.contains('show');
    $('modalBackdrop').classList.remove('show');
    $('modalBackdrop').setAttribute('aria-hidden', 'true');
    if (wasOpen && restoreFocus !== false && focusBeforeModal && focusBeforeModal.focus) {
      focusBeforeModal.focus({ preventScroll: true });
    }
  }

  function handleModalKeydown(e) {
    if (!$('modalBackdrop').classList.contains('show')) return false;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(true);
      return true;
    }
    if (e.key !== 'Tab') return true;

    var buttons = [$('modalRetry'), $('modalNext')].filter(function (button) {
      return button.style.display !== 'none';
    });
    var first = buttons[0];
    var last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
    return true;
  }

  // ---- 判分後的畫面回饋（兩條輸入路徑共用）--------------------------------

  function markCorrect() {
    var st = session.itemState();
    var doneNode = $('ch-' + (st.charIndex - 1));
    if (doneNode) {
      doneNode.classList.remove('is-current');
      doneNode.classList.add('is-done');
      sparkle(doneNode);
    }
    var nextNode = $('ch-' + st.charIndex);
    if (nextNode) nextNode.classList.add('is-current');
    updateHint(session.expected());
    if (global.TypingSound) global.TypingSound.playCorrect();
  }

  function markWrong() {
    var cur = $('ch-' + session.itemState().charIndex);
    if (cur) {
      cur.classList.add('is-wrong');
      global.setTimeout(function () { cur.classList.remove('is-wrong'); }, 260);
    }
    mascot.say('oops');
    if (global.TypingSound) global.TypingSound.playWrong();
  }

  function cheerFor(res) {
    var combo = session.stats().combo;
    if (combo > 0 && combo % 5 === 0) mascot.say('combo');
    else if (res.itemDone) mascot.say('good');
    else mascot.mood('happy', 700);
  }

  // ---- 真輸入法輸入（中文進階第 7～10 關）---------------------------------
  //
  // 前六關收的是「按了哪一顆實體鍵」，這四關收的是「組完字之後出來的那個字」。
  // 中間拼了幾顆鍵、選了第幾個候選字，瀏覽器一概不告訴我們——
  // 我們只會在 compositionend 之後拿到一個中文字。所以：
  //
  //   * 一個「字」算一次判分，速度單位是字／分（不是鍵／分）
  //   * 螢幕鍵盤改成把整組注音一起打光，不假裝知道他拼到第幾顆
  //   * 「打錯不用退格」那條規則在這裡不適用——注音輸入法本來就要靠退格
  //     修改組字中的拼音，所以輸入框讓他自由編輯，我們只收送出來的結果

  function setupInputMode(level) {
    var ime = isIMELevel(level);
    document.body.classList.toggle('is-ime-level', ime);
    var box = $('imeBox');
    if (box) box.hidden = !ime;
    var input = $('imeInput');
    if (input) {
      input.value = '';
      input.disabled = !ime;
    }
  }

  /**
   * 把輸入框裡已經組好的字送進引擎。
   *
   * 🕳️ **不要在確認 advancing 之前就清空輸入框。** 換題動畫那 260 毫秒裡，
   * 孩子已經選完的字若被清掉就真的不見了（keydown 那條路徑丟掉的是「還沒按下去」
   * 的鍵，感覺完全不同）。所以動畫期間值留在框裡，等一下再送。
   */
  function feedIME() {
    var input = $('imeInput');
    if (!input || !input.value) return;
    if (!session) { input.value = ''; return; }
    if (advancing) { global.setTimeout(feedIME, 60); return; }

    var value = input.value;
    input.value = '';
    for (var i = 0; i < value.length; i++) {
      if (!session || advancing) {
        // 這一批剩下的字碰上換題，補回輸入框等動畫結束
        input.value = value.slice(i) + input.value;
        global.setTimeout(feedIME, 60);
        return;
      }
      judgeIMEChar(value[i]);
    }
  }

  function judgeIMEChar(ch) {
    var expected = session.expected();
    var res = session.input(ch);
    if (res.ignored) return;

    if (res.correct) {
      hideNotice();
      markCorrect();
      cheerFor(res);
      return;
    }

    markWrong();

    // 輸入法根本沒切過去。這一關的「怎麼按都不對」長這樣：
    // 打出來的是 abc 而不是中文字，而且孩子多半不會發現差在哪。
    if (/^[a-zA-Z0-9]$/.test(ch)) {
      showNotice('<b>要先把輸入法切成注音喔！</b>按 <b>Shift</b> 或 ' +
                 '<b>Ctrl + 空白鍵</b> 切換，畫面右下角顯示「中」就對了。' +
                 '這一關要用注音拼出中文字，不是打英文字母。', true);
      return;
    }
    // 半形標點也是同一種：看起來很像，但這一關要的是全形。
    if (PunctNote[expected] && ch.charCodeAt(0) < 128) {
      showNotice('這個標點要用<b>全形</b>的（比較寬的那種）。' +
                 '先把輸入法切成注音，再按同一顆鍵試試看。');
    }
  }

  // ---- 鍵盤輸入 ----------------------------------------------------------

  function handleKeydown(e) {
    if (global.TypingSound) global.TypingSound.resume();
    if (handleModalKeydown(e)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // 先給回音，再談判分。
    //
    // 底下每一道 return 都是有道理的（面板開著讓給輸入框、輸入法沒切、
    // 這一關收不了這個鍵……），但它們共同的副作用是**整個按鍵被丟掉，
    // 螢幕鍵盤一點反應都沒有**。孩子第一次坐下來、還沒填完座號就隨手試按的
    // 那一刻，看到的就是一塊死掉的鍵盤——他的結論會是「程式壞了」。
    // 所以回音放在所有 return 之前：它不影響判分，只回答「我按到的是哪一顆」。
    if (keyboard) keyboard.echo(e.code);

    // 提示條擋到東西時，Esc 直接關掉（過關視窗優先，所以排在它後面）
    if (e.key === 'Escape' && $('notice').classList.contains('show')) {
      e.preventDefault();
      hideNotice();
      return;
    }

    // 使用 Tab 導覽到按鈕時，按鍵應保留原本的控制用途，不拿去判分。
    if (e.target && e.target.closest &&
        e.target.closest('button, a, input, select, textarea')) return;

    // 輸入法沒切成英文。這是電腦教室最常見的「怎麼按都沒反應」。
    if (e.isComposing || e.key === 'Process' || e.key === 'Unidentified') {
      showNotice('<b>要先把輸入法切成英文喔！</b>按鍵盤上的 <b>Shift</b> 鍵就可以切換，' +
                 '畫面右下角顯示「英」就對了。', true);
      e.preventDefault();
      return;
    }

    // 正在填班級座號，鍵盤讓給輸入框
    if (!$('idPanel').hidden) return;

    if (e.key === 'Shift') return;                       // 單按 Shift 不算一次擊鍵

    // 打錯了會習慣性按退格，但引擎是「打錯不前進也不退」，退格什麼都不會發生。
    // 沉默的話孩子只會一直按、然後舉手。
    if (e.key === 'Backspace') {
      e.preventDefault();
      showNotice('打錯了<b>不用按退格</b>喔！直接按對的那一顆就好，游標會在原地等你。');
      return;
    }

    if (e.key.length > 1 && e.key !== ' ') return;       // F1、Tab、方向鍵…略過
    if (!session || advancing) { e.preventDefault(); return; }

    e.preventDefault();
    hideNotice();

    var expected = session.expected();
    var pressed = KeyMap.byCode(e.code);
    var typed = currentMode === 'zh' ? (pressed && pressed.bopomofo) : e.key;
    if (currentMode === 'zh' && !typed) {
      showNotice('這一關先練注音鍵位，請按畫面上有注音的那一顆鍵。');
      return;
    }

    var res = session.input(typed);
    if (res.ignored) return;

    keyboard.flash(e.code, res.correct);

    if (res.correct) {
      markCorrect();

      // 連續答對才換台詞，每打對一個字就洗一次版面反而吵
      // 第 6 關教的是「用 Shift 打大寫」。開著 Caps Lock 一樣打得出大寫、
      // 一樣判對，但練到的是錯的手法，而且沒人會發現。判對不變，只是講一聲。
      if (typeof expected === 'string' && KeyMap.needsShift(expected) && !e.shiftKey &&
          e.getModifierState && e.getModifierState('CapsLock')) {
        showNotice('打對了，不過你是用 <b>Caps Lock</b> 打的。' +
                   '這一關要練的是<b>壓住 Shift</b>，把 Caps Lock 關掉再試試看～');
      }

      cheerFor(res);
    } else {
      markWrong();

      // 他按的那顆實體鍵是對的、只是少壓了 Shift。
      // 用 e.code 比對而不是比字串，這樣大寫（KeyA→A）和符號（Digit5→%）都涵蓋得到。
      var needShift = typeof expected === 'string' && KeyMap.needsShift(expected);
      if (currentMode === 'en' && needShift && !e.shiftKey && pressed && pressed.upper === expected) {
        var shiftHand = pressed.finger.charAt(0) === 'L' ? '右手' : '左手';
        showNotice('<b>就差一個 Shift！</b>先用<b>' + shiftHand + '小指</b>壓住 ' +
                   '<b>Shift</b> 不要放，另一隻手再按 <b>' + pressed.lower + '</b>，' +
                   '就會打出「' + expected + '」了。');
      } else if (e.getModifierState && e.getModifierState('CapsLock') &&
          typeof expected === 'string' && /[a-zA-Z]/.test(expected) &&
          e.key.toLowerCase() === expected.toLowerCase()) {
        // Caps Lock 亮著的話，孩子會照提示按卻一直錯，而且看不出原因
        showNotice('<b>Caps Lock 好像開著！</b>按一下鍵盤左邊的 <b>Caps Lock</b> 把它關掉，' +
                   '大小寫就會正常了。');
      }
    }
  }

  /**
   * 把這個學生在雲端的成績拉回來併進本機。
   * 這是「換一台電腦坐，星星還在」的那一步——也是雲端存在的主要理由。
   */
  function pullFromCloud(student) {
    if (!Cloud.available()) return;
    var levelIds = LEVELS.map(function (lv) { return lv.id; });
    renderSync('saving');
    Cloud.fetchMine(student, levelIds).then(function (remote) {
      var r = Engine.mergeRemote(remote, student);
      renderSync();
      if (r.merged > 0) {
        renderLevels();
        showNotice('把你之前在別台電腦的成績抓回來了（<b>' + r.merged + ' 關</b>）。');
      }
    });
  }

  // ---- 啟動 --------------------------------------------------------------

  function init() {
    keyboard = new Keyboard($('keyboard'), currentMode);
    mascot = new global.Mascot($('mascot'), $('mascotBubble'));
    renderLegend();
    renderModeButtons();
    startLevel(0, false);
    renderStudent();

    // 還沒填就先把面板打開——這是每節課第一件要做的事，
    // 藏在按鈕後面的話沒有人會主動去點。
    var who = Engine.loadStudent();
    if (!who.klass || !who.seat) {
      setIdPanel(true);
    } else {
      pullFromCloud(who);
    }

    // 上次離線時積欠的成績，開頁面就默默補送
    renderSync();
    Cloud.flushPending().then(function (sent) {
      if (sent > 0) renderSync();
    });

    global.addEventListener('keydown', handleKeydown);

    // 真輸入法那條路徑：組字期間（isComposing）什麼都不做，
    // 等 compositionend 之後才有一個真正的中文字可以判。
    // 兩個事件都掛是因為各家瀏覽器送出的順序不一致，feedIME 送完會清空，
    // 重複呼叫只是撈到空字串，不會重複判分。
    var imeInput = $('imeInput');
    if (imeInput) {
      imeInput.addEventListener('input', function (e) {
        if (e.isComposing) return;
        feedIME();
      });
      imeInput.addEventListener('compositionend', function () {
        global.setTimeout(feedIME, 0);
      });
    }
    // 點練習區任何地方都把焦點送回輸入框——孩子很容易點一下畫面就打不動了
    $('practiceStage').addEventListener('click', function (e) {
      if (!isIMELevel(currentLevel())) return;
      if (e.target && e.target.closest && e.target.closest('button, a, input')) return;
      if (imeInput) imeInput.focus({ preventScroll: true });
    });

    $('noticeClose').addEventListener('click', function () {
      hideNotice();
      // 關掉提示後焦點要回到能打字的地方，否則按鍵會被當成「在按鈕上按」而略過
      var back = isIMELevel(currentLevel()) ? $('imeInput') : $('practiceStage');
      if (back) back.focus({ preventScroll: true });
    });

    $('btnRestart').addEventListener('click', function () { startLevel(levelIndex, true); });

    $('modeEN').addEventListener('click', function () { switchMode('en'); });
    $('modeZH').addEventListener('click', function () { switchMode('zh'); });

    var soundBtn = $('btnSound');
    if (soundBtn && global.TypingSound) {
      var updateSoundBtn = function () {
        var on = global.TypingSound.isEnabled();
        soundBtn.textContent = '🔊 音效：' + (on ? '開' : '關');
        soundBtn.setAttribute('aria-pressed', String(on));
      };
      updateSoundBtn();
      soundBtn.addEventListener('click', function () {
        global.TypingSound.toggle();
        updateSoundBtn();
      });
    }

    $('btnFree').addEventListener('click', function () {
      freePractice = !freePractice;
      this.textContent = '🐢 自由練習：' + (freePractice ? '開' : '關');
      this.setAttribute('aria-pressed', String(freePractice));
      if (freePractice) {
        showNotice('自由練習模式：題目變成三倍長，<b>不計時、不計星星</b>，慢慢打沒關係。');
      }
      startLevel(levelIndex, true);
    });

    $('btnStudent').addEventListener('click', function () {
      setIdPanel($('idPanel').hidden);
    });

    $('idPanel').addEventListener('submit', function (e) {
      e.preventDefault();
      var saved = Engine.saveStudent({
        klass: $('inputClass').value,
        seat: $('inputSeat').value
      });
      setIdPanel(false);
      // 換人了：進度換一份、星等的速度標準也跟著年段換，整關重開
      startLevel(levelIndex, true);
      renderStudent();
      if (saved.klass && saved.seat) {
        showNotice('好了！<b>' + saved.klass + ' 班 ' + saved.seat + ' 號</b>，' +
                   '接下來的星星都記在你名下。');
        pullFromCloud(saved);
      }
    });

    $('modalRetry').addEventListener('click', function () { startLevel(levelIndex, true); });
    $('modalNext').addEventListener('click', function () {
      if (levelIndex + 1 < LEVELS.length) startLevel(levelIndex + 1, true);
      else closeModal(true);
    });
    $('modalBackdrop').addEventListener('click', function (e) {
      if (e.target === this) closeModal(true);
    });

    // 資料層自我檢查沒過就直說，不要讓孩子練到錯的指法
    var dataIssues = (KeyMap.integrityIssues || [])
      .concat(global.LevelsEN.issues || [])
      .concat(global.LevelsZhuyin.issues || [])
      .concat((global.LevelsENAdv && global.LevelsENAdv.issues) || [])
      .concat((global.LevelsZHAdv && global.LevelsZHAdv.issues) || []);
    if (dataIssues.length) {
      showNotice('<b>題庫資料有問題，請通知老師：</b>' + dataIssues[0], true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
