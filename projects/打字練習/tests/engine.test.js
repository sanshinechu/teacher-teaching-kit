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
  const context = vm.createContext({ window, console, Date: FakeDate, Math, JSON, Object, Number });

  ['js/keymap.js', 'js/levels-en.js', 'js/engine.js'].forEach((file) => {
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
  const { window } = loadApp({ 'typing.progress.v1': 'null' });
  assert.deepEqual({ ...window.TypingEngine.loadProgress() }, {});
});

test('星等與正確率相同時保留較快 WPM', () => {
  const previous = JSON.stringify({
    'en-1': { stars: 3, accuracy: 100, wpm: 9, at: '2026-01-01T00:00:00.000Z' }
  });
  const app = loadApp({ 'typing.progress.v1': previous });
  const level = { id: 'en-1', goalCount: 1, drills: ['abc'], words: ['abc'] };
  const session = app.window.TypingEngine.createSession({ level });
  session.input('a');
  app.setClock(2000);
  session.input('b');
  app.setClock(3000);
  session.input('c');
  const saved = JSON.parse(app.storage['typing.progress.v1']);
  assert.equal(saved['en-1'].accuracy, 100);
  assert.equal(saved['en-1'].wpm, 18);
});
