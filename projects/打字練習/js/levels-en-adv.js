/**
 * levels-en-adv.js — 英打進階關卡（第 7～10 關）
 *
 * 對應校園打字 GAME 的 level13／15／16／17：拼字 → 大小寫與標點 → 詞語 → 文章。
 * 指法六關練的是「手指記得位置」，這四關練的是「把想打的東西打出來」，
 * 所以出題不再保證覆蓋某一列，改成整段有意義的文字。
 *
 * 判分方式跟指法關完全一樣（kind: 'key'，逐鍵比對 e.key），
 * 只有中打進階才需要另一條真輸入法的路——見 levels-zh-adv.js。
 *
 * 兩個欄位是這一批新加的：
 *
 *   items    直接就是題庫，不分 drills／words。
 *            進階關沒有「這一關新教哪幾顆鍵」可言，貪婪覆蓋法用不上，
 *            engine 的 buildQueue 看到 items 就走單純抽題那條。
 *   display  'tiles' 一個字一顆鍵帽（短題目）；'text' 整段文字排版（文章關）。
 *            文章有六七十個字元，用鍵帽排會直接把畫面撐爆。
 *
 * ⚠️ 文章關的文字是自己寫的校園主題短文，不是抄 tgame 的文章題庫——
 * 那是別人的內容。要新增文章就往 ARTICLES 加，內容只能用鍵盤打得出來的
 * 半形字元（沒有 \ 和 |，那兩顆不在 keymap.js 的佈局裡）。
 */
(function (global) {
  'use strict';

  var ARTICLES = [
    'Our school is in Luodong. We have a big playground and many old trees.',
    'I go to school by bike. The road is quiet in the morning.',
    'Yilan has a lot of rain. We keep a small umbrella in our bags.',
    'In computer class we make games with Scratch. My cat sprite can jump.',
    'The library is next to the office. I read a new book every week.',
    'After lunch we clean the classroom. Then we can play on the field.'
  ];

  var LEVELS_EN_ADV = [
    {
      id: 'en-7',
      stage: 'adv',
      kind: 'key',
      display: 'tiles',
      name: '第 7 關：英文拼字',
      allowShift: false,
      desc: '指法練熟了，現在把字母拼成真正的單字。全部小寫，先求準再求快。',
      goalCount: 12,
      speedTarget: 16,
      items: [
        'cat', 'dog', 'bird', 'fish', 'tree', 'book', 'desk', 'door',
        'rain', 'wind', 'star', 'moon', 'rice', 'milk', 'blue', 'green',
        'happy', 'water', 'apple', 'music', 'river', 'plant', 'chair',
        'school', 'friend', 'pencil', 'orange', 'garden', 'summer',
        'family', 'yellow', 'monkey', 'rabbit', 'island', 'animal'
      ]
    },
    {
      id: 'en-8',
      stage: 'adv',
      kind: 'key',
      display: 'tiles',
      name: '第 8 關：大小寫與半形標點',
      allowShift: true,
      desc: '英文的標點是「半形」的，比中文的窄。大寫要壓住 Shift，不要用 Caps Lock。',
      goalCount: 12,
      speedTarget: 14,
      items: [
        'Hi!', 'OK?', 'Yes.', 'No,', 'Wow!', 'Bye.', 'Oh!', 'Ah?',
        'Mr.', 'Ms.', 'Dr.', 'a.m.', 'p.m.',
        "It's", "I'm", "don't", "can't", "we're",
        'e-mail', 'T-shirt', 'ice-cream',
        '3+2=5', '10-4=6', '50%', '(box)', '[key]', 'a/b',
        'Ken;', 'Amy:', 'Tim.', 'Joy!', 'Sam?'
      ]
    },
    {
      id: 'en-9',
      stage: 'adv',
      kind: 'key',
      display: 'tiles',
      name: '第 9 關：英文詞語',
      allowShift: true,
      desc: '兩個字以上就要用到空白鍵了，用大拇指按，眼睛不用看鍵盤。',
      goalCount: 10,
      speedTarget: 16,
      items: [
        'a book', 'a cat', 'my dog', 'red car', 'blue sky', 'big tree',
        'It is', 'I am', 'You are', 'We can', 'He is', 'She has',
        'Good morning', 'Good night', 'Thank you', 'See you',
        'How are you', 'I am fine', 'Happy birthday', 'See you soon',
        'Open the door', 'Close the book', 'Wash your hand',
        'Look at me', 'Sit down', 'Stand up', 'Let us go'
      ]
    },
    {
      id: 'en-10',
      stage: 'adv',
      kind: 'key',
      display: 'text',
      name: '第 10 關：英文短文',
      allowShift: true,
      desc: '整段打下來。打錯不用退格，游標會停在原地等你按對的那一顆。',
      goalCount: 3,
      speedTarget: 14,
      items: ARTICLES
    }
  ];

  /**
   * 題庫自我檢查。跟指法關那兩支同一個用意：**寧可在載入時就吵**，
   * 也不要讓孩子卡在一顆這關根本沒教過、或這塊鍵盤上根本沒有的鍵上。
   *
   * 進階關不檢查「有沒有蓋滿某一列」（沒有 focusRows 這回事），
   * 改成檢查三件會讓孩子卡住的事：
   *   1. 用到鍵盤佈局上不存在的字元（例如全形標點混進英打關）
   *   2. 這一關還沒開放 Shift 卻出了要按 Shift 的題目
   *   3. 鍵帽模式的題目太長，排出來會把版面撐爆
   */
  var TILE_MAX = 14;

  function validateLevels() {
    var problems = [];
    LEVELS_EN_ADV.forEach(function (lv) {
      if (!lv.items || !lv.items.length) {
        problems.push(lv.id + ' 沒有任何題目');
        return;
      }
      lv.items.forEach(function (text) {
        if (lv.display === 'tiles' && text.length > TILE_MAX) {
          problems.push(lv.id + ' 的「' + text + '」有 ' + text.length +
                        ' 個字元，鍵帽模式排不下（上限 ' + TILE_MAX + '）');
        }
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (!global.KeyMap.byChar(ch)) {
            problems.push(lv.id + ' 的「' + text + '」用到了鍵盤上沒有的字元「' + ch + '」');
          } else if (!lv.allowShift && global.KeyMap.needsShift(ch)) {
            problems.push(lv.id + ' 的「' + text + '」要按 Shift 才打得出「' + ch +
                          '」，但這一關沒開放 Shift');
          }
        }
      });
    });
    return problems;
  }

  LEVELS_EN_ADV.forEach(function (lv) { lv.focusChars = []; });

  var issues = validateLevels();
  if (issues.length) {
    console.error('[levels-en-adv] 關卡題目有問題：\n - ' + issues.join('\n - '));
  }

  global.LevelsENAdv = { levels: LEVELS_EN_ADV, issues: issues };
})(window);
