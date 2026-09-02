/**
 * engine.js — 判分引擎（中英共用）
 *
 * 三個刻意的設計決定：
 *
 * 1. 計時從「第一次敲鍵」才起算，不是進關卡就開始。
 *    老師在中間停下來講解、孩子舉手發問，都不該讓速度被算差。
 *
 * 2. 過關用星等不是及格線。打完就有 1 星，準了 2 星，又準又快 3 星。
 *    指法練習的重點是把手指位置練到不用想，不是逼低年級追速度；
 *    但留一個追求給打順的孩子。
 *
 * 3. 打錯不前進、也不倒退。錯了只算進正確率，游標停在原地等他打對。
 *    孩子不必處理退格，注意力留在「這根手指該去哪裡」。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'typing.progress.v1';

  /** 每一關的速度參考值（WPM，只影響第 3 顆星，不影響能不能過關） */
  var WPM_TARGET = { 1: 8, 2: 8, 3: 10, 4: 12, 5: 10, 6: 14 };

  function now() { return Date.now(); }

  // ---- 進度儲存 ----------------------------------------------------------

  function loadProgress() {
    try {
      return JSON.parse(global.localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      // 無痕視窗、瀏覽器擋了網站資料，都會走到這裡。不能讓它擋住整個遊戲。
      console.warn('[engine] 讀不到本機進度，這次的成績不會被記住：', e.message);
      return {};
    }
  }

  function saveProgress(progress) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (e) {
      console.warn('[engine] 存不進本機進度：', e.message);
      return false;
    }
  }

  function recordResult(levelId, result) {
    var progress = loadProgress();
    var prev = progress[levelId];
    // 只往上覆蓋，不讓一次失常洗掉之前的好成績
    if (!prev || result.stars > prev.stars ||
        (result.stars === prev.stars && result.accuracy > prev.accuracy)) {
      progress[levelId] = {
        stars: result.stars,
        accuracy: result.accuracy,
        wpm: result.wpm,
        at: new Date().toISOString()
      };
      saveProgress(progress);
    }
    return progress[levelId];
  }

  // ---- 出題 --------------------------------------------------------------

  /**
   * 組出這一關要打的題目序列。
   * 前半是 drills（練鍵位），後半是 words（用學過的鍵組成的真單字），
   * 讓孩子先熟悉手指位置，再看到這些鍵可以拼出什麼。
   */
  function buildQueue(level, count) {
    var drillCount = Math.ceil(count * 0.6);
    var wordCount = count - drillCount;
    return shuffle(level.drills).slice(0, drillCount)
      .concat(shuffle(level.words).slice(0, wordCount));
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- 練習階段 ----------------------------------------------------------

  function createSession(opts) {
    var level = opts.level;
    var mode = opts.mode || 'en';
    var freePractice = !!opts.freePractice;
    var levelNo = parseInt(String(level.id).split('-')[1], 10) || 1;

    var queue = buildQueue(level, freePractice ? level.goalCount * 3 : level.goalCount);
    var queueIndex = 0;
    var current = queue[0] || '';
    var charIndex = 0;

    var totalKeystrokes = 0;
    var correctKeystrokes = 0;
    var combo = 0;
    var bestCombo = 0;
    var startedAt = null;   // 第一次敲鍵才設，這是刻意的
    var finishedAt = null;
    var missMap = {};       // 期待的字元 → 打錯幾次

    function stats() {
      var accuracy = totalKeystrokes > 0
        ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
        : 100;
      var elapsedMs = startedAt ? ((finishedAt || now()) - startedAt) : 0;
      var minutes = elapsedMs / 60000;
      var wpm = minutes > 0.008   // 少於半秒不算，避免第一擊噴出天文數字
        ? Math.round(((correctKeystrokes / 5) / minutes) * 10) / 10
        : 0;
      return {
        accuracy: accuracy,
        wpm: wpm,
        elapsedSec: Math.round(elapsedMs / 1000),
        combo: combo,
        bestCombo: bestCombo,
        done: queueIndex,
        total: queue.length,
        totalKeystrokes: totalKeystrokes,
        correctKeystrokes: correctKeystrokes
      };
    }

    function starsFor(s) {
      if (freePractice) return 0;
      var target = WPM_TARGET[levelNo] || 10;
      if (s.accuracy >= 90 && s.wpm >= target) return 3;
      if (s.accuracy >= 90) return 2;
      return 1;
    }

    /** 目前等著被打的那個字元 */
    function expected() {
      return current ? current[charIndex] : null;
    }

    /** 這一題已經打對的部分 / 還沒打的部分，給 UI 畫 */
    function itemState() {
      return {
        text: current,
        charIndex: charIndex,
        expected: expected(),
        index: queueIndex,
        total: queue.length
      };
    }

    function nextItem() {
      queueIndex++;
      if (queueIndex >= queue.length) {
        finishedAt = now();
        var s = stats();
        var result = {
          levelId: level.id,
          mode: mode,
          accuracy: s.accuracy,
          wpm: s.wpm,
          elapsedSec: s.elapsedSec,
          bestCombo: s.bestCombo,
          stars: starsFor(s),
          missTop: topMisses(3),
          freePractice: freePractice
        };
        if (!freePractice) result.saved = recordResult(level.id, result);
        if (opts.onFinish) opts.onFinish(result, s);
        return;
      }
      current = queue[queueIndex];
      charIndex = 0;
      // 統計一起送出去：queueIndex 是在這裡才遞增的，UI 只靠 onUpdate 的話
      // 「第幾題」會永遠慢一題，停在 0
      if (opts.onItemChange) opts.onItemChange(itemState(), stats());
    }

    function topMisses(n) {
      return Object.keys(missMap)
        .map(function (ch) { return { char: ch, count: missMap[ch] }; })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, n);
    }

    /**
     * 收一次輸入。傳進來的是「這一擊代表的字元」：
     * 英打是 e.key（分大小寫），中打是鍵位換算出來的注音符號。
     */
    function input(ch) {
      if (finishedAt) return { ignored: true };
      var exp = expected();
      if (exp == null) return { ignored: true };

      if (startedAt === null) startedAt = now();

      totalKeystrokes++;
      var ok = (ch === exp);

      if (ok) {
        correctKeystrokes++;
        charIndex++;
        combo++;
        if (combo > bestCombo) bestCombo = combo;
      } else {
        combo = 0;
        missMap[exp] = (missMap[exp] || 0) + 1;
      }

      if (opts.onUpdate) opts.onUpdate(stats(), itemState());

      if (ok && charIndex >= current.length) {
        // 這一題打完了，交給 UI 播完動畫再叫 nextItem
        if (opts.onItemComplete) opts.onItemComplete(itemState());
        else nextItem();
      }

      return { correct: ok, expected: exp, got: ch, itemDone: ok && charIndex >= current.length };
    }

    if (opts.onItemChange) opts.onItemChange(itemState());

    return {
      input: input,
      nextItem: nextItem,
      stats: stats,
      itemState: itemState,
      expected: expected,
      level: level,
      mode: mode,
      freePractice: freePractice,
      wpmTarget: WPM_TARGET[levelNo] || 10
    };
  }

  global.TypingEngine = {
    createSession: createSession,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    WPM_TARGET: WPM_TARGET,
    STORAGE_KEY: STORAGE_KEY
  };
})(window);
