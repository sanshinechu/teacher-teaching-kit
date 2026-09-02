/**
 * app.js — 把資料、引擎、鍵盤接起來，處理實際的鍵盤輸入
 *
 * 這裡有兩個「電腦教室現場」才會遇到的守門，兩個都是安靜失敗型的問題：
 *
 *   輸入法沒切成英文  → keydown 收到的鍵名是 Process / Unidentified，
 *                      整個被丟掉，畫面完全沒反應。孩子會以為電腦壞了。
 *   Caps Lock 亮著    → 打出來的大小寫全反，孩子照著提示按卻一直被判錯。
 *
 * 兩個都不會報錯，所以一定要主動偵測、主動講出來。
 */
(function (global) {
  'use strict';

  var KeyMap = global.KeyMap;
  var Keyboard = global.Keyboard;
  var Engine = global.TypingEngine;
  var LEVELS = global.LevelsEN.levels;

  var FINGER_COLOR = {
    L5: 'var(--f-L5)', L4: 'var(--f-L4)', L3: 'var(--f-L3)', L2: 'var(--f-L2)',
    R2: 'var(--f-R2)', R3: 'var(--f-R3)', R4: 'var(--f-R4)', R5: 'var(--f-R5)',
    TH: 'var(--f-TH)'
  };

  var $ = function (id) { return document.getElementById(id); };

  var keyboard = null;
  var mascot = null;
  var session = null;
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
    var k = KeyMap.byChar(ch);
    if (!k) {
      $('fingerText').textContent = '';
      return;
    }
    var needShift = KeyMap.needsShift(ch);
    var shiftHand = k.finger.charAt(0) === 'L' ? '右手' : '左手';
    $('fingerDot').style.background = FINGER_COLOR[k.finger] || 'var(--f-TH)';
    $('fingerText').textContent = needShift
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
      mode: 'en',
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
      }
    });

    $('stageLabel').textContent = level.desc;
    document.body.classList.toggle('is-free-practice', freePractice);
    updateStats(session.stats());
    renderLevels();
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

    if (result.missTop && result.missTop.length) {
      $('modalMisses').innerHTML = '最常打錯的鍵：' + result.missTop.map(function (m) {
        var k = KeyMap.byChar(m.char);
        var label = m.char === ' ' ? '空白鍵' : m.char;
        return '<code>' + label + '</code>' + (k ? '（' + k.fingerName + '）' : '') + ' ' + m.count + ' 次';
      }).join('、');
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

    if (e.key === 'Shift') return;                       // 單按 Shift 不算一次擊鍵
    if (e.key.length > 1 && e.key !== ' ') return;       // F1、Tab、方向鍵…略過
    if (!session || advancing) { e.preventDefault(); return; }

    e.preventDefault();
    hideNotice();

    var expected = session.expected();
    var res = session.input(e.key);
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
      // Caps Lock 亮著的話，孩子會照提示按卻一直錯，而且看不出原因
      if (e.getModifierState && e.getModifierState('CapsLock') &&
          typeof expected === 'string' && /[a-zA-Z]/.test(expected) &&
          e.key.toLowerCase() === expected.toLowerCase()) {
        showNotice('<b>Caps Lock 好像開著！</b>按一下鍵盤左邊的 <b>Caps Lock</b> 把它關掉，' +
                   '大小寫就會正常了。');
      }
    }
  }

  // ---- 啟動 --------------------------------------------------------------

  function init() {
    keyboard = new Keyboard($('keyboard'), 'en');
    mascot = new global.Mascot($('mascot'), $('mascotBubble'));
    renderLegend();
    startLevel(0, false);

    global.addEventListener('keydown', handleKeydown);

    $('btnRestart').addEventListener('click', function () { startLevel(levelIndex, true); });

    $('btnFree').addEventListener('click', function () {
      freePractice = !freePractice;
      this.textContent = '自由練習：' + (freePractice ? '開' : '關');
      this.setAttribute('aria-pressed', String(freePractice));
      if (freePractice) {
        showNotice('自由練習模式：題目變成三倍長，<b>不計時、不計星星</b>，慢慢打沒關係。');
      }
      startLevel(levelIndex, true);
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
    var dataIssues = (KeyMap.integrityIssues || []).concat(global.LevelsEN.issues || []);
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
