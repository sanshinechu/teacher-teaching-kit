/**
 * levels-en.js — 英打指法關卡（第 1～6 關）
 *
 * 編排原則跟坊間打字教學一致：從基準列出發，一次只加一列，最後才全部混合。
 * 每一關分成兩段：
 *   drills — 純鍵位練習，練「手指記得位置」，不要求意義
 *   words  — 只用該關已學過的字母組成的真單字，讓孩子知道學這些鍵有什麼用
 * words 裡的每個字母都必須落在該關的 rows 範圍內，超出範圍就是編錯了，
 * validateLevels() 會在載入時檢查並在 console 指出來。
 */
(function (global) {
  'use strict';

  var LEVELS_EN = [
    {
      id: 'en-1',
      name: '第 1 關：基準列 ASDF JKL;',
      rows: ['home'],
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
      desc: '手指從基準列往下伸，按完馬上收回來——這個「回家」的習慣要現在養成。',
      goalCount: 10,
      drills: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/',
               'az', 'sx', 'dc', 'fv', 'jn', 'km', 'l.', 'fb', 'jm', 'a/'],
      words: ['can', 'man', 'ban', 'and', 'hand', 'land', 'sand', 'band',
              'cash', 'mask', 'class', 'black', 'snack', 'lamb', 'calm']
    },
    {
      id: 'en-3',
      name: '第 3 關：基準列 + 上排 QWER',
      rows: ['home', 'top'],
      desc: '往上伸的距離比往下遠，注意手腕不要跟著抬起來。',
      goalCount: 10,
      drills: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
               'aq', 'sw', 'de', 'fr', 'jy', 'ku', 'il', 'p;', 'ft', 'ju'],
      words: ['the', 'for', 'are', 'you', 'her', 'his', 'out', 'our',
              'they', 'were', 'quiet', 'paper', 'water', 'house', 'those', 'together']
    },
    {
      id: 'en-4',
      name: '第 4 關：三列混合',
      rows: ['home', 'top', 'bottom'],
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
      desc: '數字列離基準列最遠，小指要伸最多。慢慢來，先求準再求快。',
      goalCount: 10,
      drills: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
               '12', '34', '56', '78', '90', '147', '258', '369', '1470', '2580'],
      // 這一關只有數字列，小數點在下排、還沒教，所以不出現「3.14」這類題目
      words: ['2026', '1234', '5678', '911', '100', '365', '24', '60',
              '2026-09', '10-20', '1+2=3', '50%', '9-5=4']
    },
    {
      id: 'en-6',
      name: '第 6 關：全部按鍵',
      rows: ['num', 'top', 'home', 'bottom'],
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
   * 檢查每一關的題目有沒有用到還沒教的鍵。
   * 空白鍵、Shift 大寫視為合法（第 6 關才出現大寫，前面關卡的 words 全小寫）。
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
          if (!allowed[text[i]]) {
            problems.push(lv.id + ' 的「' + text + '」用到了本關範圍外的字元「' + text[i] + '」');
          }
        }
      });
    });
    return problems;
  }

  var issues = validateLevels();
  if (issues.length) {
    console.error('[levels-en] 關卡題目超出該關教過的鍵：\n - ' + issues.join('\n - '));
  }

  global.LevelsEN = { levels: LEVELS_EN, issues: issues };
})(window);
