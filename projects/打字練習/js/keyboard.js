/**
 * keyboard.js — 螢幕鍵盤：畫出來、把目標鍵打光、按下時閃一下
 *
 * 每根手指一個顏色，而且左右手是兩個色系。這不是裝飾——孩子看到「同一個顏色
 * 的鍵都是這根手指管的」，比讀十行文字說明有效。手指配色的定義在 styles.css
 * 的 .finger-L5 … .finger-R5。
 *
 * 中打模式的鍵帽會同時印英文字母和注音，跟他手邊那張真鍵盤一模一樣，
 * 這樣練完抬頭看實體鍵盤才對得起來。
 */
(function (global) {
  'use strict';

  var KeyMap = global.KeyMap;

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function Keyboard(container, mode) {
    this.container = container;
    this.mode = mode || 'en';
    this.keyNodes = {};   // code → DOM
    this.render();
  }

  Keyboard.prototype.render = function () {
    var self = this;
    this.container.innerHTML = '';
    this.keyNodes = {};

    KeyMap.ROWS.forEach(function (row, rowIdx) {
      var rowNode = el('div', 'kb-row kb-row-' + row.id);

      // 每一列左邊的修飾鍵，讓鍵盤看起來像真的
      if (row.id === 'top') rowNode.appendChild(self.makeFillerKey('Tab', 'kb-filler kb-w-tab'));
      if (row.id === 'home') rowNode.appendChild(self.makeFillerKey('Caps', 'kb-filler kb-w-caps'));
      if (row.id === 'bottom') rowNode.appendChild(self.makeShiftKey('ShiftLeft'));

      row.keyObjects.forEach(function (k) {
        rowNode.appendChild(self.makeKey(k));
      });

      if (row.id === 'num') rowNode.appendChild(self.makeFillerKey('Backspace', 'kb-filler kb-w-back'));
      if (row.id === 'home') rowNode.appendChild(self.makeFillerKey('Enter', 'kb-filler kb-w-enter'));
      if (row.id === 'bottom') rowNode.appendChild(self.makeShiftKey('ShiftRight'));

      self.container.appendChild(rowNode);
    });

    // 空白列
    var spaceRow = el('div', 'kb-row kb-row-space');
    var spaceNode = this.makeKey(KeyMap.spaceKey, true);
    spaceRow.appendChild(spaceNode);
    this.container.appendChild(spaceRow);
  };

  Keyboard.prototype.makeKey = function (k, isSpace) {
    var node = el('div', 'kb-key finger-' + k.finger + (isSpace ? ' kb-w-space' : ''));
    node.dataset.code = k.code;
    node.setAttribute('aria-hidden', 'true');

    if (isSpace) {
      node.appendChild(el('span', 'kb-main', this.mode === 'zh' ? '空白鍵（一聲）' : '空白鍵'));
    } else if (this.mode === 'zh') {
      // 中打：英文字母小小的在左上，注音是主角
      node.appendChild(el('span', 'kb-sub', k.upper));
      node.appendChild(el('span', 'kb-main kb-bopomofo', k.bopomofo || ''));
    } else {
      // 英打：上檔符號小小的在上面（只有跟主字元不同時才顯示）
      if (k.upper !== k.lower && !/^[a-z]$/.test(k.lower)) {
        node.appendChild(el('span', 'kb-sub', k.upper));
      }
      node.appendChild(el('span', 'kb-main', /^[a-z]$/.test(k.lower) ? k.upper : k.lower));
    }

    this.keyNodes[k.code] = node;
    return node;
  };

  Keyboard.prototype.makeShiftKey = function (code) {
    var node = el('div', 'kb-key kb-shift kb-w-shift finger-' + (code === 'ShiftLeft' ? 'L5' : 'R5'));
    node.dataset.code = code;
    node.appendChild(el('span', 'kb-main', '⇧ Shift'));
    this.keyNodes[code] = node;
    return node;
  };

  Keyboard.prototype.makeFillerKey = function (label, className) {
    var node = el('div', 'kb-key ' + className);
    node.appendChild(el('span', 'kb-main', label));
    return node;
  };

  /** 清掉所有提示狀態 */
  Keyboard.prototype.clearHighlight = function () {
    Object.keys(this.keyNodes).forEach(function (code) {
      this.keyNodes[code].classList.remove('is-target', 'is-shift-hint');
    }, this);
  };

  /**
   * 把目標字元對應的鍵打光。需要 Shift 的話兩顆 Shift 一起亮，
   * 並回傳該用哪一隻手的 Shift（左邊的字母配右手 Shift，反之亦然）。
   */
  Keyboard.prototype.highlightChar = function (ch) {
    this.clearHighlight();
    if (ch == null) return null;

    var k = this.mode === 'zh' ? KeyMap.byBopomofo(ch) : KeyMap.byChar(ch);
    if (!k) return null;

    var node = this.keyNodes[k.code];
    if (node) node.classList.add('is-target');

    var needShift = this.mode === 'en' && KeyMap.needsShift(ch);
    if (needShift) {
      // 左手管的鍵用右手 Shift，右手管的鍵用左手 Shift
      var shiftCode = k.finger.charAt(0) === 'L' ? 'ShiftRight' : 'ShiftLeft';
      var shiftNode = this.keyNodes[shiftCode];
      if (shiftNode) shiftNode.classList.add('is-shift-hint');
      return { key: k, needShift: true, shiftCode: shiftCode };
    }
    return { key: k, needShift: false, shiftCode: null };
  };

  /**
   * 把一整串注音同時打光（中打進階關用）。
   *
   * 指法關是「只亮下一顆」，因為一次就是一顆鍵。但中文進階關要打的是「字」，
   * 一個字得按 ㄋ、ㄧ、ˇ 三顆才組得出來，而且順序由孩子自己拼——
   * 我們收到的只有組完字的結果，中間按了什麼根本看不到。
   * 所以整組亮起來讓他照著拼，不假裝知道他打到第幾顆。
   */
  Keyboard.prototype.highlightMany = function (chars) {
    this.clearHighlight();
    if (!chars || !chars.length) return;
    var self = this;
    chars.forEach(function (ch) {
      var k = KeyMap.byBopomofo(ch) || KeyMap.byChar(ch);
      if (!k) return;
      var node = self.keyNodes[k.code];
      if (node) node.classList.add('is-target');
    });
  };

  /**
   * 按鍵回音：不管對錯、也不管這一擊會不會被判分，先讓孩子看見「我按到的是這顆」。
   *
   * 判分是有前提的（班級座號面板關著、輸入法切對、這一關收得了這個鍵），
   * 前提不成立時整個按鍵會被丟掉，鍵盤就一點反應都沒有——而那往往正是
   * 孩子第一次坐下來的那一刻。死掉的鍵盤會被讀成「程式壞了」。
   */
  Keyboard.prototype.echo = function (code) {
    var node = this.keyNodes[code];
    if (!node) return;
    node.classList.add('is-echo');
    global.clearTimeout(node.echoTimer);
    node.echoTimer = global.setTimeout(function () {
      node.classList.remove('is-echo');
    }, 160);
  };

  /** 按下去閃一下，讓孩子確認「我按到的是這顆」，順便告訴他對不對 */
  Keyboard.prototype.flash = function (code, correct) {
    var node = this.keyNodes[code];
    if (!node) return;
    // 判分結果比回音明確，蓋掉同一顆鍵上還沒散的回音，免得兩種底色打架
    node.classList.remove('is-echo');
    global.clearTimeout(node.echoTimer);
    var cls = correct ? 'is-hit' : 'is-miss';
    node.classList.add(cls);
    global.setTimeout(function () { node.classList.remove(cls); }, 160);
  };

  Keyboard.prototype.setMode = function (mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.render();
  };

  global.Keyboard = Keyboard;
})(window);
