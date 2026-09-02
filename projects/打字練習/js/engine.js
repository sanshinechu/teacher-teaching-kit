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
  var STUDENT_KEY = 'typing.student.v1';
  var IDLE_GAP_MS = 5000;

  /**
   * 每一關的速度參考值（WPM，只影響第 3 顆星，不影響能不能過關）。
   *
   * ⚠️ 這裡的 WPM 是英打慣例：「正確擊鍵數 ÷ 5」當作一個 word。
   * 第②批的注音鍵位不能直接沿用這個口徑——一個中文字要按 2～4 鍵，
   * 除以 5 會算出離譜的低分。中打要另定（例如以「字」為單位），
   * 到時候在 createSession 依 mode 分流，不要偷懶共用這張表。
   */
  var WPM_TARGET = { 1: 8, 2: 8, 3: 10, 4: 12, 5: 10, 6: 14 };

  /**
   * 注音鍵位用「每分鐘鍵數」而不是英打 WPM。
   * 這一批只練 ㄅㄆㄇ 實體鍵位，不是在量完整中文輸入速度；若拿英打慣例
   * 「擊鍵數 ÷ 5」來算，學生明明按對很多鍵，畫面卻會顯示很低的 WPM。
   */
  var ZHUYIN_KPM_TARGET = { 1: 22, 2: 22, 3: 24, 4: 24, 5: 28, 6: 30 };

  /**
   * 年段係數。同一套速度標準給三年級和六年級是不公平的：
   * 三年級手小、還在認鍵，六年級多半打過兩年了。
   * 年級直接從班級號碼的第一碼推（601 → 六年級），推不出來就用 1.0。
   */
  var GRADE_FACTOR = { 1: 0.6, 2: 0.6, 3: 0.7, 4: 0.85, 5: 1, 6: 1.15 };

  function now() { return Date.now(); }

  // ---- 學生身分 ----------------------------------------------------------
  //
  // 電腦教室的機器是共用的，孩子每週不一定坐同一台。進度若只存一個 key，
  // 下一節課的孩子一坐下就看到上一個人的星星，自己的不見了。
  // 所以進度的 key 綁「班級-座號」，不是綁這台電腦。沒填就當訪客。

  function readJSON(key, fallback) {
    try {
      var parsed = JSON.parse(global.localStorage.getItem(key) || 'null');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      // 無痕視窗、瀏覽器擋了網站資料，都會走到這裡。不能讓它擋住整個遊戲。
      console.warn('[engine] 讀不到本機資料（' + key + '），這次的成績不會被記住：', e.message);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[engine] 存不進本機資料（' + key + '）：', e.message);
      return false;
    }
  }

  function loadStudent() {
    var s = readJSON(STUDENT_KEY, {});
    return {
      klass: typeof s.klass === 'string' ? s.klass.trim() : '',
      seat: typeof s.seat === 'string' ? s.seat.trim() : ''
    };
  }

  function saveStudent(student) {
    var clean = {
      klass: String(student && student.klass || '').trim().slice(0, 8),
      seat: String(student && student.seat || '').trim().slice(0, 4)
    };
    writeJSON(STUDENT_KEY, clean);
    return clean;
  }

  /** 沒填班級座號時回 'guest'——照樣能練，只是進度跟別人混在一起。 */
  function studentId(student) {
    var s = student || loadStudent();
    return (s.klass && s.seat) ? (s.klass + '-' + s.seat) : 'guest';
  }

  /** 從班級號碼第一碼推年級：'601' → 6、'三年二班' → null（推不出來就算了）。 */
  function gradeOf(klass) {
    var m = String(klass || '').match(/[1-6]/);
    return m ? Number(m[0]) : null;
  }

  function gradeFactor(student) {
    var g = gradeOf((student || loadStudent()).klass);
    return GRADE_FACTOR[g] || 1;
  }

  function progressKey(student) {
    return STORAGE_KEY + ':' + studentId(student);
  }

  // ---- 進度儲存 ----------------------------------------------------------

  function loadProgress(student) {
    return readJSON(progressKey(student), {});
  }

  function saveProgress(progress, student) {
    return writeJSON(progressKey(student), progress);
  }

  /**
   * 回傳 { record, improved }。`improved` 是給雲端同步用的——
   * 只有破紀錄才值得送上去，不然每打完一關就打一次網路，
   * 一節課 30 個孩子會把免費額度浪費在沒有意義的寫入上。
   */
  function recordResult(levelId, result) {
    var progress = loadProgress();
    var prev = progress[levelId];
    // 只往上覆蓋，不讓一次失常洗掉之前的好成績
    var improved = !prev || result.stars > prev.stars ||
        (result.stars === prev.stars && result.accuracy > prev.accuracy) ||
        (result.stars === prev.stars && result.accuracy === prev.accuracy &&
         result.wpm > (Number(prev.wpm) || 0));
    if (improved) {
      progress[levelId] = {
        stars: result.stars,
        accuracy: result.accuracy,
        wpm: result.wpm,
        at: new Date().toISOString()
      };
      saveProgress(progress);
    }
    return { record: progress[levelId], improved: improved };
  }

  /**
   * 把雲端抓回來的成績併進本機進度。
   * 「併」不是「覆蓋」：兩邊哪一筆好就留哪一筆，比較順序跟 recordResult 一致。
   * 孩子可能在 A 電腦離線打了好成績、又在 B 電腦打過——兩邊都不該被洗掉。
   */
  function mergeRemote(remote, student) {
    if (!remote) return { merged: 0 };
    var progress = loadProgress(student);
    var merged = 0;
    Object.keys(remote).forEach(function (levelId) {
      var r = remote[levelId];
      var mine = progress[levelId];
      if (!r) return;
      var better = !mine || r.stars > mine.stars ||
        (r.stars === mine.stars && r.accuracy > mine.accuracy) ||
        (r.stars === mine.stars && r.accuracy === mine.accuracy &&
         (Number(r.wpm) || 0) > (Number(mine.wpm) || 0));
      if (better) {
        progress[levelId] = {
          stars: r.stars, accuracy: r.accuracy, wpm: r.wpm,
          at: r.at || new Date().toISOString()
        };
        merged++;
      }
    });
    if (merged) saveProgress(progress, student);
    return { merged: merged };
  }

  // ---- 出題 --------------------------------------------------------------

  /**
   * 組出這一關要打的題目序列。
   * 前半是 drills（練鍵位），後半是 words（用學過的鍵組成的真單字），
   * 讓孩子先熟悉手指位置，再看到這些鍵可以拼出什麼。
   *
   * drill 段不是純隨機抽的，理由見 pickCovering。
   */
  function buildQueue(level, count) {
    var drillCount = Math.ceil(count * 0.6);
    var wordCount = count - drillCount;
    return pickCovering(level.drills, drillCount, level.focusChars)
      .concat(takeRepeated(level.words, wordCount));
  }

  /**
   * 挑 drill 題目，並且保證「這一關新教的鍵每一個都至少出現一次」。
   *
   * 🕳️ 為什麼不能純隨機抽：題庫每關寫了 20 題，但一關只抽 6 題
   * （goalCount 10 × 0.6）。2026-09-02 跑 300 次模擬，教 QWER 的第 3 關
   * 平均漏掉 6.8 個新鍵、最壞漏 11 個——孩子整關打完，有可能一個上排的鍵
   * 都沒碰到。而那一關的存在意義就是教上排。
   *
   * 作法是貪婪法：每一輪挑「能補上最多還沒練到的鍵」的那一題。
   * 名額不夠蓋完就寧可多出幾題（教到才是重點，題數是其次）；
   * 蓋完還有剩的名額，再隨機補滿。
   *
   * focusChars 沒給（第 4、6 關這種混合複習關）就退化成隨機抽，
   * 那兩關的題庫本來就大到不可能在十幾題內蓋完。
   */
  function pickCovering(source, count, mustCover) {
    if (!source || !source.length) return [];

    var need = {};
    var needLeft = 0;
    (mustCover || []).forEach(function (ch) {
      if (!need[ch]) { need[ch] = true; needLeft++; }
    });

    var pool = shuffle(source);
    var used = {};
    var picked = [];

    while (needLeft > 0) {
      var bestIdx = -1;
      var bestGain = 0;
      for (var i = 0; i < pool.length; i++) {
        if (used[i]) continue;
        var gain = 0;
        var counted = {};
        for (var j = 0; j < pool[i].length; j++) {
          var ch = pool[i][j];
          if (need[ch] && !counted[ch]) { counted[ch] = true; gain++; }
        }
        if (gain > bestGain) { bestGain = gain; bestIdx = i; }
      }
      // 題庫本身蓋不完這些鍵——這是資料的問題，validateLevels 會在載入時吵。
      if (bestIdx === -1) break;
      used[bestIdx] = true;
      picked.push(pool[bestIdx]);
      for (var k = 0; k < pool[bestIdx].length; k++) {
        var c = pool[bestIdx][k];
        if (need[c]) { delete need[c]; needLeft--; }
      }
    }

    if (picked.length < count) {
      var rest = pool.filter(function (item, idx) { return !used[idx]; });
      picked = picked.concat(takeRepeated(rest.length ? rest : pool, count - picked.length));
    }
    // 洗一次，免得「為了覆蓋而挑的那幾題」永遠排在最前面
    return shuffle(picked);
  }

  /** 題庫不夠長時以不同洗牌順序循環補足，保證題數符合設定值。 */
  function takeRepeated(source, count) {
    var out = [];
    if (!source || !source.length || count <= 0) return out;
    while (out.length < count) {
      out = out.concat(shuffle(source).slice(0, count - out.length));
    }
    return out;
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

    // 速度標準要看年段：三年級手小、還在認鍵，六年級多半打過兩年了。
    var baseTarget = mode === 'zh'
      ? (ZHUYIN_KPM_TARGET[levelNo] || 24)
      : (WPM_TARGET[levelNo] || 10);
    var wpmTarget = Math.round(baseTarget * gradeFactor() * 10) / 10;

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
    var pausedAt = null;
    var pausedMs = 0;
    var idleMs = 0;
    var lastInputAt = null;
    var missMap = {};       // 期待的字元 → { total, got: { 實際按成什麼: 次數 } }

    function stats() {
      var accuracy = totalKeystrokes > 0
        ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
        : 100;
      var endAt = finishedAt || now();
      var openPauseMs = pausedAt ? endAt - pausedAt : 0;
      var elapsedMs = startedAt
        ? Math.max(0, endAt - startedAt - pausedMs - openPauseMs - idleMs)
        : 0;
      var minutes = elapsedMs / 60000;
      var speed = mode === 'zh' ? correctKeystrokes : (correctKeystrokes / 5);
      var wpm = !freePractice && minutes > 0.008   // 少於半秒不算，避免第一擊噴出天文數字
        ? Math.round((speed / minutes) * 10) / 10
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
      var target = wpmTarget;
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

    /**
     * 最常打錯的鍵，連「被按成什麼」一起回報。
     *
     * 只知道「d 常打錯」對老師沒用。知道他把 d 按成 f（手指右移一格）
     * 還是按成 k（左右手搞混），要糾正的東西完全不同。
     */
    function topMisses(n) {
      return Object.keys(missMap)
        .map(function (ch) {
          var got = missMap[ch].got;
          var typed = Object.keys(got)
            .map(function (g) { return { char: g, count: got[g] }; })
            .sort(function (a, b) { return b.count - a.count; });
          return { char: ch, count: missMap[ch].total, typed: typed.slice(0, 2) };
        })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, n);
    }

    /** 換題動畫或其他明確中斷不列入速度。 */
    function pause() {
      if (!freePractice && startedAt !== null && finishedAt === null && pausedAt === null) {
        pausedAt = now();
      }
    }

    function resume() {
      if (pausedAt !== null) {
        pausedMs += now() - pausedAt;
        pausedAt = null;
        lastInputAt = now();
      }
    }

    /**
     * 收一次輸入。傳進來的是「這一擊代表的字元」：
     * 英打是 e.key（分大小寫），中打是鍵位換算出來的注音符號。
     */
    function input(ch) {
      if (finishedAt) return { ignored: true };
      var exp = expected();
      if (exp == null) return { ignored: true };

      var inputAt = now();
      if (!freePractice) {
        if (startedAt === null) startedAt = inputAt;
        if (lastInputAt !== null && inputAt - lastInputAt > IDLE_GAP_MS) {
          // 孩子舉手、老師講解或暫時離開：整段空檔都不算進 WPM。
          idleMs += inputAt - lastInputAt;
        }
        lastInputAt = inputAt;
      }

      totalKeystrokes++;
      var ok = (ch === exp);

      if (ok) {
        correctKeystrokes++;
        charIndex++;
        combo++;
        if (combo > bestCombo) bestCombo = combo;
      } else {
        combo = 0;
        var entry = missMap[exp] || (missMap[exp] = { total: 0, got: {} });
        entry.total++;
        entry.got[ch] = (entry.got[ch] || 0) + 1;
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
      pause: pause,
      resume: resume,
      level: level,
      mode: mode,
      freePractice: freePractice,
      wpmTarget: wpmTarget
    };
  }

  global.TypingEngine = {
    createSession: createSession,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    loadStudent: loadStudent,
    saveStudent: saveStudent,
    studentId: studentId,
    gradeOf: gradeOf,
    gradeFactor: gradeFactor,
    progressKey: progressKey,
    pickCovering: pickCovering,
    mergeRemote: mergeRemote,
    WPM_TARGET: WPM_TARGET,
    ZHUYIN_KPM_TARGET: ZHUYIN_KPM_TARGET,
    GRADE_FACTOR: GRADE_FACTOR,
    IDLE_GAP_MS: IDLE_GAP_MS,
    STORAGE_KEY: STORAGE_KEY,
    STUDENT_KEY: STUDENT_KEY
  };
})(window);
