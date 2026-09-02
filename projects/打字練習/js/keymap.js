/**
 * keymap.js — 鍵盤佈局與指法對照（中英共用）
 *
 * 這份表以 KeyboardEvent.code 當主鍵（KeyA、Digit1、Semicolon…），不是 e.key。
 * 原因：中打指法關要求學生把輸入法切成英數，按下 a 鍵時 e.key 是 'a'，
 * 但我們要判定的是「ㄇ」。用實體鍵位（code）當主鍵，中英兩套就能共用同一份佈局，
 * 差別只在顯示哪一層標籤。
 *
 * 注音為大千式（Windows 稱「標準」），台灣市售鍵盤印的就是這一套。
 * 校驗方式：大千式是「直行」排列，1/q/a/z 直下來是 ㄅㄆㄇㄈ，2/w/s/x 是 ㄉㄊㄋㄌ，
 * 依此類推剛好把 37 個注音填滿、不多不少。少一個或重複都代表表填錯了。
 * bopomofoIntegrityCheck() 會在載入時自動驗這件事。
 */
(function (global) {
  'use strict';

  // 手指代號：L=左手 R=右手，5=小指 4=無名指 3=中指 2=食指
  var FINGER_NAME = {
    L5: '左手小指', L4: '左手無名指', L3: '左手中指', L2: '左手食指',
    R2: '右手食指', R3: '右手中指', R4: '右手無名指', R5: '右手小指'
  };

  // 每一列的鍵。row 名稱同時也是關卡分組的依據。
  // [code, 小寫/主字元, Shift 上檔, 注音（沒有就是 null）, 手指]
  var ROWS = [
    {
      id: 'num', labelEn: '數字列', labelZh: 'ㄅ 列（數字列）',
      keys: [
        ['Backquote', '`', '~', null, 'L5'],
        ['Digit1', '1', '!', 'ㄅ', 'L5'],
        ['Digit2', '2', '@', 'ㄉ', 'L4'],
        ['Digit3', '3', '#', 'ˇ', 'L3'],
        ['Digit4', '4', '$', 'ˋ', 'L2'],
        ['Digit5', '5', '%', 'ㄓ', 'L2'],
        ['Digit6', '6', '^', 'ˊ', 'R2'],
        ['Digit7', '7', '&', '˙', 'R2'],
        ['Digit8', '8', '*', 'ㄚ', 'R3'],
        ['Digit9', '9', '(', 'ㄞ', 'R4'],
        ['Digit0', '0', ')', 'ㄢ', 'R5'],
        ['Minus', '-', '_', 'ㄦ', 'R5'],
        ['Equal', '=', '+', null, 'R5']
      ]
    },
    {
      id: 'top', labelEn: 'Q 列（上排）', labelZh: 'ㄆ 列（上排）',
      keys: [
        ['KeyQ', 'q', 'Q', 'ㄆ', 'L5'],
        ['KeyW', 'w', 'W', 'ㄊ', 'L4'],
        ['KeyE', 'e', 'E', 'ㄍ', 'L3'],
        ['KeyR', 'r', 'R', 'ㄐ', 'L2'],
        ['KeyT', 't', 'T', 'ㄔ', 'L2'],
        ['KeyY', 'y', 'Y', 'ㄗ', 'R2'],
        ['KeyU', 'u', 'U', 'ㄧ', 'R2'],
        ['KeyI', 'i', 'I', 'ㄛ', 'R3'],
        ['KeyO', 'o', 'O', 'ㄟ', 'R4'],
        ['KeyP', 'p', 'P', 'ㄣ', 'R5'],
        ['BracketLeft', '[', '{', null, 'R5'],
        ['BracketRight', ']', '}', null, 'R5']
      ]
    },
    {
      id: 'home', labelEn: 'A 列（基準列）', labelZh: 'ㄇ 列（基準列）',
      keys: [
        ['KeyA', 'a', 'A', 'ㄇ', 'L5'],
        ['KeyS', 's', 'S', 'ㄋ', 'L4'],
        ['KeyD', 'd', 'D', 'ㄎ', 'L3'],
        ['KeyF', 'f', 'F', 'ㄑ', 'L2'],
        ['KeyG', 'g', 'G', 'ㄕ', 'L2'],
        ['KeyH', 'h', 'H', 'ㄘ', 'R2'],
        ['KeyJ', 'j', 'J', 'ㄨ', 'R2'],
        ['KeyK', 'k', 'K', 'ㄜ', 'R3'],
        ['KeyL', 'l', 'L', 'ㄠ', 'R4'],
        ['Semicolon', ';', ':', 'ㄤ', 'R5'],
        ['Quote', "'", '"', null, 'R5']
      ]
    },
    {
      id: 'bottom', labelEn: 'Z 列（下排）', labelZh: 'ㄈ 列（下排）',
      keys: [
        ['KeyZ', 'z', 'Z', 'ㄈ', 'L5'],
        ['KeyX', 'x', 'X', 'ㄌ', 'L4'],
        ['KeyC', 'c', 'C', 'ㄏ', 'L3'],
        ['KeyV', 'v', 'V', 'ㄒ', 'L2'],
        ['KeyB', 'b', 'B', 'ㄖ', 'L2'],
        ['KeyN', 'n', 'N', 'ㄙ', 'R2'],
        ['KeyM', 'm', 'M', 'ㄩ', 'R2'],
        ['Comma', ',', '<', 'ㄝ', 'R3'],
        ['Period', '.', '>', 'ㄡ', 'R4'],
        ['Slash', '/', '?', 'ㄥ', 'R5']
      ]
    }
  ];

  // 空白鍵：英打是空格，中打是一聲。兩者都由兩手拇指按。
  var SPACE_KEY = ['Space', ' ', ' ', 'ˉ', 'TH'];

  // ---- 建立查表用的索引 ----
  var byCode = {};      // code → 鍵物件
  var byChar = {};      // 英打字元（含大寫）→ 鍵物件
  var byBopomofo = {};  // 注音符號 → 鍵物件

  function makeKey(row, tuple) {
    return {
      code: tuple[0],
      lower: tuple[1],
      upper: tuple[2],
      bopomofo: tuple[3],
      finger: tuple[4],
      fingerName: FINGER_NAME[tuple[4]] || '兩手拇指',
      row: row
    };
  }

  ROWS.forEach(function (row) {
    row.keyObjects = row.keys.map(function (tuple) {
      var k = makeKey(row.id, tuple);
      byCode[k.code] = k;
      byChar[k.lower] = k;
      if (k.upper !== k.lower) byChar[k.upper] = k;
      if (k.bopomofo) byBopomofo[k.bopomofo] = k;
      return k;
    });
  });

  var spaceKey = makeKey('space', SPACE_KEY);
  byCode[spaceKey.code] = spaceKey;
  byChar[' '] = spaceKey;
  byBopomofo['ˉ'] = spaceKey;

  /**
   * 大千式完整性自我校驗。
   * 37 個注音符號必須剛好各佔一鍵，多、少、重複都代表表被改壞了。
   * 這是資料層唯一的真相來源，寧可在載入時就吵出來，也不要讓學生練到錯的鍵位。
   */
  var ALL_BOPOMOFO = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
  // 聲調符號另外算：大千式在數字列放了四個（ˊ ˇ ˋ ˙），一聲在空白鍵。
  // 它們跟 37 個注音要分開數，不然「多了 4 個」會被誤判成表填錯。
  var TONE_MARKS = 'ˊˇˋ˙';

  function bopomofoIntegrityCheck() {
    var problems = [];
    var seen = {};
    var tones = {};
    ROWS.forEach(function (row) {
      row.keyObjects.forEach(function (k) {
        if (!k.bopomofo) return;
        var bucket = TONE_MARKS.indexOf(k.bopomofo) !== -1 ? tones : seen;
        if (bucket[k.bopomofo]) {
          problems.push('「' + k.bopomofo + '」重複出現在 ' + bucket[k.bopomofo] + ' 與 ' + k.code);
        }
        bucket[k.bopomofo] = k.code;
      });
    });
    for (var i = 0; i < ALL_BOPOMOFO.length; i++) {
      var b = ALL_BOPOMOFO[i];
      if (!seen[b]) problems.push('注音「' + b + '」沒有對應到任何鍵');
    }
    for (var j = 0; j < TONE_MARKS.length; j++) {
      var t = TONE_MARKS[j];
      if (!tones[t]) problems.push('聲調「' + t + '」沒有對應到任何鍵');
    }
    var count = Object.keys(seen).length;
    if (count !== 37) problems.push('注音鍵數是 ' + count + '，應為 37');
    var toneCount = Object.keys(tones).length;
    if (toneCount !== 4) problems.push('聲調鍵數是 ' + toneCount + '，應為 4（一聲在空白鍵不算）');
    return problems;
  }

  var issues = bopomofoIntegrityCheck();
  if (issues.length) {
    console.error('[keymap] 注音鍵位表有問題，中打會練到錯的指法：\n - ' + issues.join('\n - '));
  }

  global.KeyMap = {
    ROWS: ROWS,
    FINGER_NAME: FINGER_NAME,
    spaceKey: spaceKey,
    byCode: function (code) { return byCode[code] || null; },
    byChar: function (ch) { return byChar[ch] || null; },
    byBopomofo: function (b) { return byBopomofo[b] || null; },

    /** 某個字元需不需要按 Shift（英打用） */
    needsShift: function (ch) {
      var k = byChar[ch];
      if (!k) return false;
      return k.upper === ch && k.lower !== ch;
    },

    /** 取某幾列的所有可打字元，供關卡出題用 */
    charsOfRows: function (rowIds, opts) {
      opts = opts || {};
      var out = [];
      ROWS.forEach(function (row) {
        if (rowIds.indexOf(row.id) === -1) return;
        row.keyObjects.forEach(function (k) {
          if (opts.lettersOnly && !/^[a-z]$/.test(k.lower)) return;
          if (opts.excludeCodes && opts.excludeCodes.indexOf(k.code) !== -1) return;
          out.push(k.lower);
        });
      });
      return out;
    },

    /** 取某幾列的所有注音符號，供中打關卡出題用 */
    bopomofoOfRows: function (rowIds) {
      var out = [];
      ROWS.forEach(function (row) {
        if (rowIds.indexOf(row.id) === -1) return;
        row.keyObjects.forEach(function (k) {
          if (k.bopomofo) out.push(k.bopomofo);
        });
      });
      return out;
    },

    integrityIssues: issues
  };
})(window);
