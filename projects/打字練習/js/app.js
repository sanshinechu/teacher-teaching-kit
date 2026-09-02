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
  var MODES = {
    en: {
      label: '英打指法',
      levels: global.LevelsEN.levels,
      speedLabel: '每分鐘字數',
      speedUnit: '字／分'
    },
    zh: {
      label: '注音鍵位',
      levels: global.LevelsZhuyin.levels,
      speedLabel: '每分鐘鍵數',
      speedUnit: '鍵／分'
    }
  };

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
  function showNotice(html, sticky) {
    $('noticeText').innerHTML = html;
    $('notice').classList.add('show');
    global.clearTimeout(noticeTimer);
    if (!sticky) {
      noticeTimer = global.setTimeout(hideNotice, 6000);
    }
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
    $('inputSeat').value = s.seat;

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

  function renderLevels() {
    var progress = Engine.loadProgress();
    var box = $('levels');
    box.innerHTML = '';
    LEVELS.forEach(function (lv, idx) {
      var rec = progress[lv.id];
      var stars = rec ? rec.stars : 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-card' + (idx === levelIndex ? ' is-current' : '');
      card.innerHTML =
        '<h3>' + lv.name + '</h3>' +
        '<p>' + lv.desc + '</p>' +
        '<span class="level-stars">' +
          '<span class="' + (stars >= 1 ? 'on' : '') + '">★</span>' +
          '<span class="' + (stars >= 2 ? 'on' : '') + '">★</span>' +
          '<span class="' + (stars >= 3 ? 'on' : '') + '">★</span>' +
          (rec ? ' <span class="level-best">最佳 ' + rec.accuracy + '%</span>' : '') +
        '</span>';
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
    $('modeLabel').textContent = MODES[currentMode].label;
    $('statWpmLabel').textContent = MODES[currentMode].speedLabel;
    document.title = '羅東國小打字練習網 — ' + MODES[currentMode].label;
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
    var box = $('word');
    box.innerHTML = '';
    for (var i = 0; i < state.text.length; i++) {
      var ch = state.text[i];
      var node = document.createElement('span');
      node.className = 'ch' +
        (ch === ' ' ? ' is-space' : '') +
        (i < state.charIndex ? ' is-done' : '') +
        (i === state.charIndex ? ' is-current' : '');
      node.id = 'ch-' + i;
      node.textContent = ch === ' ' ? '空白' : ch;
      box.appendChild(node);
    }
    updateFingerHint(state.expected);
    keyboard.highlightChar(state.expected);
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
    updateStats(session.stats());
    renderLevels();
    if ($('studentLabel')) renderStudent();
    closeModal(false);
    if (mascot) mascot.say('idle');
    if (focusStage) $('practiceStage').focus({ preventScroll: true });
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

  // ---- 鍵盤輸入 ----------------------------------------------------------

  function handleKeydown(e) {
    if (handleModalKeydown(e)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

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
      var doneNode = $('ch-' + (session.itemState().charIndex - 1));
      if (doneNode) {
        doneNode.classList.remove('is-current');
        doneNode.classList.add('is-done');
        sparkle(doneNode);
      }
      var nextNode = $('ch-' + session.itemState().charIndex);
      if (nextNode) nextNode.classList.add('is-current');
      updateFingerHint(session.expected());
      keyboard.highlightChar(session.expected());

      // 連續答對才換台詞，每打對一個字就洗一次版面反而吵
      // 第 6 關教的是「用 Shift 打大寫」。開著 Caps Lock 一樣打得出大寫、
      // 一樣判對，但練到的是錯的手法，而且沒人會發現。判對不變，只是講一聲。
      if (typeof expected === 'string' && KeyMap.needsShift(expected) && !e.shiftKey &&
          e.getModifierState && e.getModifierState('CapsLock')) {
        showNotice('打對了，不過你是用 <b>Caps Lock</b> 打的。' +
                   '這一關要練的是<b>壓住 Shift</b>，把 Caps Lock 關掉再試試看～');
      }

      var combo = session.stats().combo;
      if (combo > 0 && combo % 5 === 0) mascot.say('combo');
      else if (res.itemDone) mascot.say('good');
      else mascot.mood('happy', 700);
    } else {
      var cur = $('ch-' + session.itemState().charIndex);
      if (cur) {
        cur.classList.add('is-wrong');
        global.setTimeout(function () { cur.classList.remove('is-wrong'); }, 260);
      }
      mascot.say('oops');

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

    $('btnRestart').addEventListener('click', function () { startLevel(levelIndex, true); });

    $('modeEN').addEventListener('click', function () { switchMode('en'); });
    $('modeZH').addEventListener('click', function () { switchMode('zh'); });

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
      .concat(global.LevelsZhuyin.issues || []);
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
