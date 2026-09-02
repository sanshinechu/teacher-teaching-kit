/**
 * levels-en.js — 英打指法關卡（第 1～6 關）
 *
 * 編排原則跟坊間打字教學一致：從基準列出發，一次只加一列，最後才全部混合。
 * 每一關分成兩段：
 *   drills — 純鍵位練習，練「手指記得位置」，不要求意義
 *   words  — 只用該關已學過的字母組成的真單字，讓孩子知道學這些鍵有什麼用
 * words 裡的每個字母都必須落在該關的 rows 範圍內，超出範圍就是編錯了，
 * validateLevels() 會在載入時檢查並在 console 指出來。
 *
 * 每一關另外標兩件事，都是 2026-09-02 補的：
 *
 *   focusRows  這一關「新教」的是哪幾列。出題時會保證這些列的鍵每個都練到
 *              （見 engine.js 的 pickCovering）。混合複習關留空陣列。
 *   allowShift 這一關教過 Shift 了沒。沒教過卻出了要按 Shift 的題目，
 *              validateLevels 會擋下來——第 5 關原本的「1+2=3」「50%」
 *              就是這樣混進去的，孩子會卡在一個沒人教過的鍵上。
 */
(function (global) {
  'use strict';

  var LEVELS_EN = [
    {
      id: 'en-1',
      name: '第 1 關：基準列 ASDF JKL;',
      rows: ['home'],
      focusRows: ['home'],
      allowShift: false,
      desc: '八根手指放在基準列上，F 和 J 有小凸起，閉著眼睛也摸得到。',
      goalCount: 10,
      drills: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'g', 'h',
               'as', 'df', 'jk', 'l;', 'fj', 'dk', 'sl', 'a;', 'gh', 'fg'],
      words: ['ask', 'sad', 'dad', 'has', 'had', 'lad', 'gas', 'fall',
              'hall', 'glass', 'salad', 'flash', 'flag', 'half']
    },
    {
      id: 'en-2',
      name: '第 2 關：基準列 + 下排 ZXCV',
      rows: ['home', 'bottom'],
      focusRows: ['bottom'],
      allowShift: false,
      desc: '手指從基準列往下伸，按完馬上收回來——這個「回家」的習慣要現在養成。',
      goalCount: 10,
      // 前兩排是單鍵與「同一根手指上下移動」的配對；
      // 最後一排是下排相鄰兩鍵，一題帶兩個新鍵，讓 6 個名額蓋得完整排。
      drills: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/',
               'az', 'sx', 'dc', 'fv', 'jn', 'km', 'l.', 'fb', 'jm', 'a/',
               'zx', 'cv', 'bn', 'm,', './'],
      words: ['can', 'man', 'ban', 'and', 'hand', 'land', 'sand', 'band',
              'cash', 'mask', 'class', 'black', 'snack', 'lamb', 'calm']
    },
    {
      id: 'en-3',
      name: '第 3 關：基準列 + 上排 QWER',
      rows: ['home', 'top'],
      focusRows: ['top'],
      allowShift: false,
      desc: '往上伸的距離比往下遠，注意手腕不要跟著抬起來。',
      goalCount: 10,
      drills: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
               'aq', 'sw', 'de', 'fr', 'jy', 'ku', 'il', 'p;', 'ft', 'ju',
               'qw', 'er', 'ty', 'ui', 'op'],
      words: ['the', 'for', 'are', 'you', 'her', 'his', 'out', 'our',
              'they', 'were', 'quiet', 'paper', 'water', 'house', 'those', 'together']
    },
    {
      id: 'en-4',
      name: '第 4 關：三列混合',
      rows: ['home', 'top', 'bottom'],
      // 複習關，沒有新列。題庫本來就大到十幾題蓋不完，不強制全覆蓋。
      focusRows: [],
      allowShift: false,
      desc: '三列都用上了。這一關開始，眼睛要練習不看鍵盤。',
      goalCount: 12,
      drills: ['azq', 'sxw', 'dce', 'fvr', 'jnu', 'kmi', 'l.o', ';/p',
               'fgh', 'jhg', 'cvb', 'nm,', 'ert', 'yui'],
      words: ['about', 'because', 'children', 'school', 'family', 'friend',
              'morning', 'number', 'people', 'please', 'question', 'answer',
              'computer', 'keyboard', 'practice', 'welcome']
    },
    {
      id: 'en-5',
      name: '第 5 關：數字列',
      rows: ['num'],
      focusRows: ['num'],
      allowShift: false,
      desc: '數字列離基準列最遠，小指要伸最多。慢慢來，先求準再求快。',
      goalCount: 10,
      drills: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
               '12', '34', '56', '78', '90', '147', '258', '369', '1470', '2580'],
      // 這一關只有數字列，小數點在下排、還沒教，所以不出現「3.14」這類題目。
      // 🕳️ 原本還有「1+2=3」與「50%」，2026-09-02 拿掉：那兩題的 + 和 %
      // 都要按 Shift，但 Shift 是第 6 關才教的。13 題抽 4 題，
      // 實測有 54% 的機率會抽中——一半以上的孩子會卡在沒人教過的鍵上。
      words: ['2026', '1234', '5678', '911', '100', '365', '24', '60',
              '2026-09', '10-20', '9-5=4', '2025', '48', '96']
    },
    {
      id: 'en-6',
      name: '第 6 關：全部按鍵',
      rows: ['num', 'top', 'home', 'bottom'],
      // 總複習關，54 種字元不可能在 12 題內蓋完，所以不強制全覆蓋。
      focusRows: [],
      allowShift: true,
      desc: '所有鍵都上場，還要用 Shift 打大寫。左邊的字母用右手 Shift，右邊的用左手 Shift。',
      goalCount: 12,
      drills: ['Aa', 'Ss', 'Dd', 'Ff', 'Jj', 'Kk', 'Ll', 'Qq', 'Pp', 'Zz',
               'A1', 'B2', 'C3', 'X9', 'Y0'],
      words: ['Taiwan', 'Yilan', 'Monday', 'English', 'Happy Day', 'Good Job',
              'I am happy', 'See you soon', 'Thank you', 'Have a nice day',
              'Hello, World!', 'How are you?']
    }
  ];

  /**
   * 算出這一關「必須練到」的字元：focusRows 指定的那幾列，
   * 而且真的出現在 drills 裡的鍵。engine 的 pickCovering 拿這個當覆蓋目標。
   *
   * 只認 drills 不認 words 是刻意的——words 是為了讓孩子看到「這些鍵能拼出什麼」，
   * 覆蓋鍵位是 drill 段的責任。
   */
  function computeFocusChars(lv) {
    if (!lv.focusRows || !lv.focusRows.length) return [];
    var inDrills = {};
    lv.drills.forEach(function (text) {
      for (var i = 0; i < text.length; i++) inDrills[text[i]] = true;
    });
    var out = [];
    global.KeyMap.ROWS.forEach(function (row) {
      if (lv.focusRows.indexOf(row.id) === -1) return;
      row.keyObjects.forEach(function (k) {
        if (inDrills[k.lower]) out.push(k.lower);
      });
    });
    return out;
  }

  /**
   * 三道檢查，全部在載入時跑，出問題直接在畫面上跳提示：
   *
   *   1. 題目不能用到本關 rows 以外的鍵
   *   2. 沒教過 Shift 的關卡不能出要按 Shift 的題目
   *   3. focusRows 裡的字母／數字鍵都要在 drills 出現過
   *
   * 🕳️ 第 2 道是 2026-09-02 補的。原本的檢查把 upper 也當成合法字元，
   * 所以第 5 關的「1+2=3」「50%」一路過關——那兩題要按 Shift，
   * 但 Shift 是第 6 關才教的。檢查通過、畫面正常、孩子卡住。
   *
   * 🕳️ 第 3 道防的是另一種安靜失效：focusRows 說要教某一列，
   * 但 drills 裡漏了其中一顆鍵，那顆鍵這一關就等於沒教到，
   * 而且 pickCovering 會默默地蓋不完。
   */
  function validateLevels() {
    var problems = [];
    LEVELS_EN.forEach(function (lv) {
      var allowed = {};
      global.KeyMap.ROWS.forEach(function (row) {
        if (lv.rows.indexOf(row.id) === -1) return;
        row.keyObjects.forEach(function (k) {
          allowed[k.lower] = true;
          allowed[k.upper] = true;
        });
      });
      allowed[' '] = true;

      lv.drills.concat(lv.words).forEach(function (text) {
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (!allowed[ch]) {
            problems.push(lv.id + ' 的「' + text + '」用到了本關範圍外的字元「' + ch + '」');
          }
          if (!lv.allowShift && global.KeyMap.needsShift(ch)) {
            problems.push(lv.id + ' 的「' + text + '」要按 Shift 才打得出「' + ch +
                          '」，但這一關還沒教 Shift');
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
            if (!/^[a-z0-9]$/.test(k.lower)) return;   // 標點與符號不強制
            if (!inDrills[k.lower]) {
              problems.push(lv.id + ' 說要教「' + rowId + '」列，但練習題裡沒有「' +
                            k.lower + '」，這顆鍵等於沒教到');
            }
          });
        });
      });
    });
    return problems;
  }

  LEVELS_EN.forEach(function (lv) { lv.focusChars = computeFocusChars(lv); });

  var issues = validateLevels();
  if (issues.length) {
    console.error('[levels-en] 關卡題目有問題：\n - ' + issues.join('\n - '));
  }

  global.LevelsEN = { levels: LEVELS_EN, issues: issues };
})(window);
