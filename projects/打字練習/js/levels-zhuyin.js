/**
 * levels-zhuyin.js — 注音鍵位關卡（第 1～6 關）
 *
 * 參考校園打字 GAME 的中打指法順序：ㄇ列 → ㄇ+ㄈ → ㄇ+ㄆ → ㄇ+ㄅ →
 * ㄇ+ㄆ+ㄈ → 全部注音。這裡只練實體鍵位，不碰輸入法組字與選字。
 */
(function (global) {
  'use strict';

  var LEVELS_ZHUYIN = [
    {
      id: 'zh-1',
      name: '第 1 關：基準 ㄇ 列',
      rows: ['home'],
      focusRows: ['home'],
      includeTonesInFocus: false,
      desc: '先熟悉手指放在基準列的位置：ㄇ、ㄋ、ㄎ、ㄑ、ㄕ、ㄘ、ㄨ、ㄜ、ㄠ、ㄤ。',
      goalCount: 10,
      drills: ['ㄇ', 'ㄋ', 'ㄎ', 'ㄑ', 'ㄕ', 'ㄘ', 'ㄨ', 'ㄜ', 'ㄠ', 'ㄤ',
               'ㄇㄤ', 'ㄋㄠ', 'ㄎㄜ', 'ㄑㄨ', 'ㄕㄨ', 'ㄘㄠ', 'ㄨㄤ', 'ㄜㄋ', 'ㄠㄎ', 'ㄤㄕ'],
      words: ['ㄇㄠ', 'ㄇㄨ', 'ㄋㄠ', 'ㄋㄨ', 'ㄎㄨ', 'ㄎㄠ', 'ㄕㄨ', 'ㄕㄠ',
              'ㄘㄨ', 'ㄘㄠ', 'ㄨㄤ', 'ㄜㄜ', 'ㄠㄠ', 'ㄤㄤ']
    },
    {
      id: 'zh-2',
      name: '第 2 關：ㄇ + ㄈ 列',
      rows: ['home', 'bottom'],
      focusRows: ['bottom'],
      includeTonesInFocus: false,
      desc: '手指從基準列往下伸，按完立刻回到原來的位置。',
      goalCount: 10,
      drills: ['ㄈ', 'ㄌ', 'ㄏ', 'ㄒ', 'ㄖ', 'ㄙ', 'ㄩ', 'ㄝ', 'ㄡ', 'ㄥ',
               'ㄇㄈ', 'ㄋㄌ', 'ㄎㄏ', 'ㄑㄒ', 'ㄕㄖ', 'ㄘㄙ', 'ㄨㄩ', 'ㄜㄝ', 'ㄠㄡ', 'ㄤㄥ',
               'ㄈㄌ', 'ㄏㄒ', 'ㄖㄙ', 'ㄩㄝ', 'ㄡㄥ'],
      words: ['ㄈㄤ', 'ㄈㄨ', 'ㄌㄨ', 'ㄌㄠ', 'ㄏㄜ', 'ㄏㄨ', 'ㄒㄩ', 'ㄖㄨ',
              'ㄙㄜ', 'ㄙㄨ', 'ㄇㄡ', 'ㄋㄥ', 'ㄎㄥ', 'ㄘㄝ']
    },
    {
      id: 'zh-3',
      name: '第 3 關：ㄇ + ㄆ 列',
      rows: ['home', 'top'],
      focusRows: ['top'],
      includeTonesInFocus: false,
      desc: '往上排找 ㄆ、ㄊ、ㄍ、ㄐ、ㄔ、ㄗ，也要記得回到基準列。',
      goalCount: 10,
      drills: ['ㄆ', 'ㄊ', 'ㄍ', 'ㄐ', 'ㄔ', 'ㄗ', 'ㄧ', 'ㄛ', 'ㄟ', 'ㄣ',
               'ㄇㄆ', 'ㄋㄊ', 'ㄎㄍ', 'ㄑㄐ', 'ㄕㄔ', 'ㄘㄗ', 'ㄨㄧ', 'ㄜㄛ', 'ㄠㄟ', 'ㄤㄣ',
               'ㄆㄊ', 'ㄍㄐ', 'ㄔㄗ', 'ㄧㄛ', 'ㄟㄣ'],
      words: ['ㄆㄠ', 'ㄆㄧ', 'ㄊㄨ', 'ㄊㄠ', 'ㄍㄜ', 'ㄍㄨ', 'ㄐㄧ', 'ㄐㄛ',
              'ㄔㄨ', 'ㄗㄨ', 'ㄧㄣ', 'ㄧㄤ', 'ㄛㄛ', 'ㄟㄟ']
    },
    {
      id: 'zh-4',
      name: '第 4 關：ㄇ + ㄅ 列',
      rows: ['home', 'num'],
      focusRows: ['num'],
      includeTonesInFocus: false,
      desc: '數字列也有注音，手指移動比較遠，先求準再求快。',
      goalCount: 10,
      drills: ['ㄅ', 'ㄉ', 'ㄓ', 'ㄚ', 'ㄞ', 'ㄢ', 'ㄦ',
               'ㄇㄅ', 'ㄋㄉ', 'ㄕㄓ', 'ㄨㄚ', 'ㄠㄞ', 'ㄤㄢ', 'ㄜㄦ',
               'ㄅㄉ', 'ㄓㄚ', 'ㄞㄢ', 'ㄢㄦ', 'ㄅㄚ', 'ㄉㄠ'],
      words: ['ㄅㄚ', 'ㄅㄠ', 'ㄅㄢ', 'ㄉㄚ', 'ㄉㄠ', 'ㄉㄢ', 'ㄓㄨ', 'ㄓㄠ',
              'ㄇㄚ', 'ㄋㄢ', 'ㄕㄢ', 'ㄨㄢ', 'ㄦㄦ']
    },
    {
      id: 'zh-5',
      name: '第 5 關：ㄇ + ㄆ + ㄈ 混合',
      rows: ['home', 'top', 'bottom'],
      focusRows: [],
      includeTonesInFocus: false,
      desc: '三列注音一起練，眼睛盯題目，不要低頭找鍵盤。',
      goalCount: 12,
      drills: ['ㄇㄈㄆ', 'ㄋㄌㄊ', 'ㄎㄏㄍ', 'ㄑㄒㄐ', 'ㄕㄖㄔ', 'ㄘㄙㄗ',
               'ㄨㄩㄧ', 'ㄜㄝㄛ', 'ㄠㄡㄟ', 'ㄤㄥㄣ', 'ㄆㄧㄣ', 'ㄊㄧㄥ', 'ㄍㄨㄥ', 'ㄒㄩㄝ'],
      words: ['ㄆㄧㄥ', 'ㄊㄧㄥ', 'ㄍㄨㄥ', 'ㄐㄧㄥ', 'ㄒㄩㄝ', 'ㄔㄨㄣ',
              'ㄗㄨㄛ', 'ㄈㄥ', 'ㄏㄨ', 'ㄌㄧㄣ', 'ㄙㄨㄥ', 'ㄕㄨㄟ']
    },
    {
      id: 'zh-6',
      name: '第 6 關：全部注音 + 聲調',
      rows: ['num', 'top', 'home', 'bottom'],
      focusRows: [],
      focusTones: true,
      desc: '全部注音與聲調一起上場。空白鍵代表一聲，數字列也要穩。',
      goalCount: 12,
      drills: ['ㄅㄆㄇㄈ', 'ㄉㄊㄋㄌ', 'ㄍㄎㄏ', 'ㄐㄑㄒ', 'ㄓㄔㄕㄖ', 'ㄗㄘㄙ',
               'ㄧㄨㄩ', 'ㄚㄛㄜㄝ', 'ㄞㄟㄠㄡ', 'ㄢㄣㄤㄥㄦ', 'ˉˊˇˋ˙',
               'ㄇㄚˉ', 'ㄇㄚˊ', 'ㄇㄚˇ', 'ㄇㄚˋ', 'ㄇㄚ˙'],
      words: ['ㄅㄚˋ', 'ㄆㄧㄥˊ', 'ㄇㄠˉ', 'ㄈㄥˉ', 'ㄉㄧˋ', 'ㄊㄧㄢˉ',
              'ㄋㄧˇ', 'ㄌㄨˋ', 'ㄍㄨㄛˊ', 'ㄒㄩㄝˊ', 'ㄓㄨˇ', 'ㄔㄜˉ']
    }
  ];

  function isTone(ch) {
    return ch === 'ˉ' || ch === 'ˊ' || ch === 'ˇ' || ch === 'ˋ' || ch === '˙';
  }

  function computeFocusChars(lv) {
    var out = [];
    var inDrills = {};
    lv.drills.forEach(function (text) {
      for (var i = 0; i < text.length; i++) inDrills[text[i]] = true;
    });
    global.KeyMap.ROWS.forEach(function (row) {
      if ((lv.focusRows || []).indexOf(row.id) === -1) return;
      row.keyObjects.forEach(function (k) {
        if (!k.bopomofo || isTone(k.bopomofo)) return;
        if (inDrills[k.bopomofo]) out.push(k.bopomofo);
      });
    });
    if (lv.focusTones) {
      ['ˉ', 'ˊ', 'ˇ', 'ˋ', '˙'].forEach(function (tone) {
        if (inDrills[tone]) out.push(tone);
      });
    }
    return out;
  }

  function validateLevels() {
    var problems = [];
    LEVELS_ZHUYIN.forEach(function (lv) {
      var allowed = {};
      global.KeyMap.ROWS.forEach(function (row) {
        if (lv.rows.indexOf(row.id) === -1) return;
        row.keyObjects.forEach(function (k) {
          if (k.bopomofo) allowed[k.bopomofo] = true;
        });
      });
      allowed['ˉ'] = lv.rows.indexOf('num') !== -1;

      lv.drills.concat(lv.words).forEach(function (text) {
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (!allowed[ch]) {
            problems.push(lv.id + ' 的「' + text + '」用到了本關範圍外的注音「' + ch + '」');
          }
        }
      });

      var inDrills = {};
      lv.drills.forEach(function (text) {
        for (var j = 0; j < text.length; j++) inDrills[text[j]] = true;
      });
      (lv.focusRows || []).forEach(function (rowId) {
        global.KeyMap.ROWS.forEach(function (row) {
          if (row.id !== rowId) return;
          row.keyObjects.forEach(function (k) {
            if (!k.bopomofo || isTone(k.bopomofo)) return;
            if (!inDrills[k.bopomofo]) {
              problems.push(lv.id + ' 說要教「' + row.labelZh + '」，但練習題裡沒有「' +
                            k.bopomofo + '」，這顆鍵等於沒教到');
            }
          });
        });
      });
    });
    return problems;
  }

  LEVELS_ZHUYIN.forEach(function (lv) { lv.focusChars = computeFocusChars(lv); });

  var issues = validateLevels();
  if (issues.length) {
    console.error('[levels-zhuyin] 關卡題目有問題：\n - ' + issues.join('\n - '));
  }

  global.LevelsZhuyin = { levels: LEVELS_ZHUYIN, issues: issues };
})(window);
