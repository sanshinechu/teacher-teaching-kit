const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_DIR = path.join(__dirname, '..');

function loadApp(initialStorage = {}) {
  let clock = 1000;
  const storage = { ...initialStorage };

  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock]));
    }
    static now() { return clock; }
  }

  const window = {
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
      setItem(key, value) { storage[key] = String(value); }
    }
  };
  const context = vm.createContext({ window, console, Date: FakeDate, Math, JSON, Object, Number, String, RegExp });

  ['js/keymap.js', 'js/levels-en.js', 'js/levels-zhuyin.js',
   'js/levels-en-adv.js', 'js/levels-zh-adv.js', 'js/engine.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(PROJECT_DIR, file), 'utf8'), context, { filename: file });
  });

  return {
    window,
    storage,
    setClock(value) { clock = value; }
  };
}

test('六關題庫與鍵位表通過資料檢查', () => {
  const { window } = loadApp();
  assert.deepEqual(Array.from(window.KeyMap.integrityIssues), []);
  assert.deepEqual(Array.from(window.LevelsEN.issues), []);
  assert.deepEqual(Array.from(window.LevelsZhuyin.issues), []);
});

test('自由練習每一關都精確產生三倍題數', () => {
  const { window } = loadApp();
  for (const level of window.LevelsEN.levels) {
    const session = window.TypingEngine.createSession({ level, freePractice: true });
    assert.equal(session.stats().total, level.goalCount * 3, level.id);
  }
});

test('自由練習不計時間與 WPM', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };
  const session = app.window.TypingEngine.createSession({ level, freePractice: true });
  session.input('a');
  app.setClock(61000);
  session.input('b');
  assert.equal(session.stats().elapsedSec, 0);
  assert.equal(session.stats().wpm, 0);
});

test('WPM 排除超過五秒的停頓', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['abc'], words: ['abc'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('a');
  app.setClock(2000);
  session.input('b');
  app.setClock(12000);
  session.input('c');
  assert.equal(session.stats().elapsedSec, 1);
  assert.equal(session.stats().wpm, 36);
});

test('WPM 排除明確暫停區段', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['abc'], words: ['abc'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('a');
  app.setClock(2000);
  session.input('b');
  session.pause();
  app.setClock(5000);
  session.resume();
  app.setClock(6000);
  session.input('c');
  assert.equal(session.stats().elapsedSec, 2);
  assert.equal(session.stats().wpm, 18);
});

test('合法但錯誤的進度格式會安全回復成空物件', () => {
  const { window } = loadApp({ 'typing.progress.v1:guest': 'null' });
  assert.deepEqual({ ...window.TypingEngine.loadProgress() }, {});
});

test('星等與正確率相同時保留較快 WPM', () => {
  const previous = JSON.stringify({
    'en-1': { stars: 3, accuracy: 100, wpm: 9, at: '2026-01-01T00:00:00.000Z' }
  });
  const app = loadApp({ 'typing.progress.v1:guest': previous });
  const level = { id: 'en-1', goalCount: 1, drills: ['abc'], words: ['abc'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('a');
  app.setClock(2000);
  session.input('b');
  app.setClock(3000);
  session.input('c');
  const saved = JSON.parse(app.storage['typing.progress.v1:guest']);
  assert.equal(saved['en-1'].accuracy, 100);
  assert.equal(saved['en-1'].wpm, 18);
});

// ---- 判分本身 --------------------------------------------------------------
// 🕳️ 原本七個測試全在測計時與儲存，判分一條都沒測——而判分才是這支程式的本體。

test('打錯不前進、也不倒退，游標停在原地等他打對', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };
  const session = app.window.TypingEngine.createSession({ level });

  const wrong = session.input('z');
  assert.equal(wrong.correct, false);
  assert.equal(session.itemState().charIndex, 0, '打錯不該前進');
  assert.equal(session.expected(), 'a', '游標要停在原地');

  session.input('a');
  assert.equal(session.itemState().charIndex, 1);
});

test('正確率算的是擊鍵，打錯一次就會反映出來', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('z');   // 錯
  session.input('a');   // 對
  session.input('b');   // 對
  assert.equal(session.stats().totalKeystrokes, 3);
  assert.equal(session.stats().correctKeystrokes, 2);
  assert.equal(session.stats().accuracy, 67);
});

test('連續答對會累積，打錯歸零但最佳紀錄留著', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['abc'], words: ['abc'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('a');
  session.input('b');
  assert.equal(session.stats().combo, 2);
  session.input('z');
  assert.equal(session.stats().combo, 0);
  assert.equal(session.stats().bestCombo, 2);
});

test('錯誤統計要記得「按成了什麼」，不只是「哪個鍵錯了」', () => {
  const app = loadApp();
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };
  let finished = null;
  const session = app.window.TypingEngine.createSession({
    level,
    onFinish: (result) => { finished = result; }
  });
  session.input('s');   // a 按成 s
  session.input('s');   // 又一次
  session.input('f');   // a 按成 f
  session.input('a');
  session.input('b');

  const miss = finished.missTop[0];
  assert.equal(miss.char, 'a');
  assert.equal(miss.count, 3);
  assert.equal(miss.typed[0].char, 's', '最常被按成的應該排第一');
  assert.equal(miss.typed[0].count, 2);
});

// ---- 出題覆蓋 --------------------------------------------------------------

test('教新鍵的關卡，該關每一顆新鍵都保證會出現', () => {
  const { window } = loadApp();
  const levels = Array.from(window.LevelsEN.levels).concat(Array.from(window.LevelsZhuyin.levels));
  for (const level of levels) {
    const focus = level.focusChars || [];
    if (!focus.length) continue;          // 第 4、6 關是複習關，不強制
    for (let round = 0; round < 40; round++) {
      const session = window.TypingEngine.createSession({ level });
      const seen = new Set();
      for (let i = 0; i < 3000; i++) {
        const ch = session.expected();
        if (ch == null) break;
        seen.add(ch);
        session.input(ch);
      }
      // Array.from：focus 是 vm context 裡建的陣列，跟這邊不是同一個 realm，
      // 直接 deepEqual 會因為 prototype 不同而失敗（同檔上方的資料檢查測試也這樣寫）。
      const missing = Array.from(focus).filter((ch) => !seen.has(ch));
      assert.equal(missing.length, 0, `${level.id} 第 ${round + 1} 次漏掉了 ${missing}`);
    }
  }
});

test('保證覆蓋不會讓題數暴增', () => {
  const { window } = loadApp();
  const levels = Array.from(window.LevelsEN.levels).concat(Array.from(window.LevelsZhuyin.levels));
  for (const level of levels) {
    for (let round = 0; round < 20; round++) {
      const session = window.TypingEngine.createSession({ level });
      assert.ok(session.stats().total >= level.goalCount, level.id);
      assert.ok(session.stats().total <= level.goalCount + 4,
        `${level.id} 題數 ${session.stats().total} 比設定的 ${level.goalCount} 多太多`);
    }
  }
});

test('注音模式用每分鐘鍵數，不用英打擊鍵數除以五', () => {
  const app = loadApp();
  const level = { id: 'zh-1', goalCount: 1, drills: ['ㄇㄠ'], words: ['ㄇㄠ'] };
  const session = app.window.TypingEngine.createSession({ level, mode: 'zh' });
  session.input('ㄇ');
  app.setClock(2000);
  session.input('ㄠ');
  assert.equal(session.stats().wpm, 120);
});

test('注音第 1 到 4 關的新教鍵位都被列為覆蓋目標', () => {
  const { window } = loadApp();
  const expected = {
    'zh-1': 'ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ',
    'zh-2': 'ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ',
    'zh-3': 'ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ',
    'zh-4': 'ㄅㄉㄓㄚㄞㄢㄦ'
  };
  for (const level of window.LevelsZhuyin.levels) {
    if (!expected[level.id]) continue;
    assert.equal(Array.from(level.focusChars).join(''), expected[level.id], level.id);
  }
});

// ---- 共用電腦：進度要綁人，不是綁這台機器 ----------------------------------

test('換一個班級座號就是換一份進度', () => {
  const app = loadApp();
  const E = app.window.TypingEngine;
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };

  E.saveStudent({ klass: '601', seat: '15' });
  const s1 = E.createSession({ level });
  s1.input('a'); s1.input('b');
  assert.ok(app.storage['typing.progress.v1:601-15'], '應該存在這個學生名下');

  E.saveStudent({ klass: '601', seat: '16' });
  assert.equal(Object.keys({ ...E.loadProgress() }).length, 0, '換一個座號應該看不到別人的進度');

  E.saveStudent({ klass: '601', seat: '15' });
  assert.ok(E.loadProgress()['en-1'], '換回來要看得到自己的');
});

test('沒填班級座號照樣能練，記在訪客名下', () => {
  const app = loadApp();
  const E = app.window.TypingEngine;
  assert.equal(E.studentId(), 'guest');
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };
  const s = E.createSession({ level });
  s.input('a'); s.input('b');
  assert.ok(app.storage['typing.progress.v1:guest']);
});

// ---- 年段：同一套速度標準給三年級和六年級並不公平 --------------------------

test('速度標準跟著班級推出來的年級走', () => {
  const app = loadApp();
  const E = app.window.TypingEngine;
  const level = { id: 'en-1', goalCount: 1, drills: ['ab'], words: ['ab'] };

  E.saveStudent({ klass: '301', seat: '1' });
  const low = E.createSession({ level }).wpmTarget;

  E.saveStudent({ klass: '601', seat: '1' });
  const high = E.createSession({ level }).wpmTarget;

  assert.equal(E.gradeOf('301'), 3);
  assert.equal(E.gradeOf('601'), 6);
  assert.ok(low < high, `三年級的門檻 ${low} 應該低於六年級的 ${high}`);
});

test('班級看不出年級時用預設標準，不會壞掉', () => {
  const app = loadApp();
  const E = app.window.TypingEngine;
  E.saveStudent({ klass: '資源班', seat: '1' });
  assert.equal(E.gradeOf('資源班'), null);
  assert.equal(E.gradeFactor(), 1);
});

// ---- 進階八關（第 7～10 關）--------------------------------------------

test('進階八關題庫通過資料檢查', () => {
  const { window } = loadApp();
  assert.deepEqual(Array.from(window.LevelsENAdv.issues), []);
  assert.deepEqual(Array.from(window.LevelsZHAdv.issues), []);
});

test('中文拼字關每個字都查得到注音', () => {
  // 這一關的存在意義就是練拼音，缺提示等於把孩子丟在原地——
  // 而且是安靜失效：畫面只會顯示「用注音輸入法打出「X」」，看起來很正常。
  const { window } = loadApp();
  const level = window.LevelsZHAdv.levels.find((lv) => lv.id === 'zh-7');
  const missing = [];
  for (const item of level.items) {
    for (const ch of item) {
      if (!window.LevelsZHAdv.zhuyinOf[ch]) missing.push(ch);
    }
  }
  assert.deepEqual(missing, []);
});

test('中文題庫不會混進半形字元', () => {
  // `,` 跟 `，` 在編輯器裡幾乎看不出差別，但學生用注音輸入法永遠打不出半形的那個，
  // 會整格卡死。這條在資料層擋掉，不要等上課才發現。
  const { window } = loadApp();
  const halfWidth = [];
  for (const level of window.LevelsZHAdv.levels) {
    for (const item of level.items) {
      for (const ch of item) {
        if (ch.charCodeAt(0) < 128) halfWidth.push(`${level.id}:${item}:${ch}`);
      }
    }
  }
  assert.deepEqual(halfWidth, []);
});

test('進階關的題數精確，題庫比題數短也補得滿', () => {
  const { window } = loadApp();
  const levels = window.LevelsENAdv.levels.concat(window.LevelsZHAdv.levels);
  for (const level of levels) {
    const session = window.TypingEngine.createSession({ level });
    assert.equal(session.stats().total, level.goalCount, level.id);
    const free = window.TypingEngine.createSession({ level, freePractice: true });
    assert.equal(free.stats().total, level.goalCount * 3, level.id + '（自由練習）');
  }
});

test('進階關用自己的速度標準，不吃指法關那張表', () => {
  // 注音鍵位量「鍵／分」、中文進階量「字／分」，一個中文字要按 3～4 鍵。
  // 沿用同一張表的話，孩子在進階關會被一個高三四倍的門檻擋住卻找不出原因。
  const app = loadApp();
  const E = app.window.TypingEngine;
  const advanced = E.createSession({
    level: { id: 'zh-7', goalCount: 1, items: ['山'], kind: 'ime', speedTarget: 8 },
    mode: 'zh'
  });
  assert.equal(advanced.wpmTarget, 8);

  // 沒帶 speedTarget 的指法關維持查表，不受影響
  const basic = E.createSession({ level: app.window.LevelsZhuyin.levels[0], mode: 'zh' });
  assert.equal(basic.wpmTarget, E.ZHUYIN_KPM_TARGET[1]);
});

test('中文進階關一個「字」算一次，速度是字／分不是鍵／分', () => {
  const app = loadApp();
  const E = app.window.TypingEngine;

  function run(level, mode, text) {
    const session = E.createSession({ level, mode });
    let t = 1000;
    for (const ch of text) {
      app.setClock(t);
      session.input(ch);
      t += 1000;   // 間隔小於閒置門檻，不會被扣掉
    }
    return session.stats().wpm;
  }

  const en = run({ id: 'en-10', goalCount: 1, items: ['abcde'] }, 'en', 'abcde');
  const zh = run({ id: 'zh-10', goalCount: 1, items: ['山水火木土'], kind: 'ime' }, 'zh', '山水火木土');

  // 英打的口徑是「擊鍵數 ÷ 5」，中文是一個字算一個，同樣五個字元差正好五倍。
  assert.ok(en > 0, '英打關應該量得到速度');
  assert.equal(zh, en * 5);
});
