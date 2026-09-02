/**
 * mascot.js — 吉祥物「小鍵」
 *
 * 造型刻意就是一顆鍵帽：圓角方身體、底部一道厚邊、上面一張臉。
 * 不用貓也不用兔子——這個工具從頭到尾在講鍵盤，吉祥物本身就是鍵盤的一部分，
 * 孩子看到它就會想到「按鍵」。
 *
 * 表情由 CSS 切換（data-mood），不重畫 SVG，這樣切換不會閃。
 * 台詞分四種情境，同一情境內隨機挑，避免整堂課聽到同一句。
 */
(function (global) {
  'use strict';

  var LINES = {
    idle: [
      '把手指放在有小凸起的 F 和 J 上，準備好囉！',
      '慢慢來，先求準再求快～',
      '眼睛看螢幕，手指自己會記住位置的！'
    ],
    good: [
      '就是這樣！',
      '手指好聽話～',
      '答對囉！',
      '節奏很棒！',
      '越打越順了！'
    ],
    combo: [
      '連續答對，好厲害！',
      '停不下來了！',
      '手指變超快！',
      '這個節奏太漂亮了！'
    ],
    oops: [
      '沒關係，再看一次發亮的鍵～',
      '慢一點點就會對了！',
      '手指回到基準列，再試一次～',
      '不急不急，我等你。'
    ],
    clear: [
      '這一關過關！',
      '太棒了，換下一關吧！',
      '你做到了！'
    ]
  };

  var moodByKind = {
    idle: 'idle',
    good: 'happy',
    combo: 'cheer',
    oops: 'oops',
    clear: 'cheer'
  };

  function Mascot(rootEl, bubbleEl) {
    this.root = rootEl;
    this.bubble = bubbleEl;
    this.resetTimer = null;
    this.lastLine = '';
    this.say('idle');
  }

  Mascot.prototype.pick = function (kind) {
    var pool = LINES[kind] || LINES.idle;
    if (pool.length === 1) return pool[0];
    var line;
    var guard = 0;
    do {
      line = pool[Math.floor(Math.random() * pool.length)];
    } while (line === this.lastLine && guard++ < 5);
    this.lastLine = line;
    return line;
  };

  /**
   * 換表情與台詞。holdMs 之後自動回到平常的樣子；
   * 傳 0 表示不自動回復（例如通關畫面）。
   */
  Mascot.prototype.say = function (kind, holdMs) {
    var mood = moodByKind[kind] || 'idle';
    this.root.dataset.mood = mood;
    this.bubble.textContent = this.pick(kind);

    // 重播一次彈跳動畫
    this.root.classList.remove('is-react');
    void this.root.offsetWidth;
    if (kind !== 'idle') this.root.classList.add('is-react');

    global.clearTimeout(this.resetTimer);
    var hold = holdMs == null ? 1800 : holdMs;
    if (hold > 0 && kind !== 'idle') {
      var self = this;
      this.resetTimer = global.setTimeout(function () {
        self.root.dataset.mood = 'idle';
        self.root.classList.remove('is-react');
      }, hold);
    }
  };

  /** 只換表情不換台詞，用在連續打對時不想一直洗版面 */
  Mascot.prototype.mood = function (mood, holdMs) {
    this.root.dataset.mood = mood;
    global.clearTimeout(this.resetTimer);
    if (holdMs) {
      var self = this;
      this.resetTimer = global.setTimeout(function () {
        self.root.dataset.mood = 'idle';
      }, holdMs);
    }
  };

  global.Mascot = Mascot;
})(window);
