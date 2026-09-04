/**
 * sound.js — 打字練習音效模組 (Web Audio API)
 *
 * 設計原則：
 * 1. 使用 Web Audio API 原生合成音效，無需加載外部 MP3/WAV 檔案，保證離線可用與零延遲。
 * 2. 音效音量與頻率經專門調校：
 *    - 正確音：清亮歡快的升階二連音 (784Hz -> 1046Hz)，給予良好節奏回饋。
 *    - 錯誤音：低沉雙音 (220Hz -> 140Hz)，具提示效果但不刺耳。
 *    - 過關音：長達約 8 秒的歡慶過關樂章 (含序曲、主旋律與終曲三和弦)。
 * 3. 處理瀏覽器 Autoplay 政策：首個點擊/按鍵時自動呼叫 resume() 啟動 AudioContext。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'typing.sound.enabled.v1';
  var audioCtx = null;
  var enabled = true;
  var activeCheerGain = null;

  function loadSetting() {
    try {
      var val = global.localStorage.getItem(STORAGE_KEY);
      return val === null ? true : val === 'true';
    } catch (e) {
      return true;
    }
  }

  function saveSetting(val) {
    try {
      global.localStorage.setItem(STORAGE_KEY, String(val));
    } catch (e) {}
  }

  function getAudioContext() {
    if (!audioCtx) {
      var AudioContextClass = global.AudioContext || global.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function resume() {
    getAudioContext();
  }

  function playCorrect() {
    if (!enabled) return;
    var ctx = getAudioContext();
    if (!ctx) return;

    var now = ctx.currentTime;
    
    // 第一音 (G5 - 783.99 Hz)
    var osc1 = ctx.createOscillator();
    var gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.linearRampToValueAtTime(0.001, now + 0.09);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // 第二音 (C6 - 1046.50 Hz)
    var osc2 = ctx.createOscillator();
    var gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.04);
    gain2.gain.setValueAtTime(0.32, now + 0.04);
    gain2.gain.linearRampToValueAtTime(0.001, now + 0.16);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.16);
  }

  function playWrong() {
    if (!enabled) return;
    var ctx = getAudioContext();
    if (!ctx) return;

    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  function stopCheer() {
    if (activeCheerGain && audioCtx) {
      try {
        var now = audioCtx.currentTime;
        activeCheerGain.gain.cancelScheduledValues(now);
        activeCheerGain.gain.setValueAtTime(activeCheerGain.gain.value, now);
        activeCheerGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      } catch (e) {}
      activeCheerGain = null;
    }
  }

  /**
   * 約 8 秒的歡慶通關樂章
   * 包含 C 大調升階序曲、高潮 Victory Fanfare 與溫馨終曲三和弦
   */
  function playCheer() {
    if (!enabled) return;
    var ctx = getAudioContext();
    if (!ctx) return;

    stopCheer();

    var masterGain = ctx.createGain();
    activeCheerGain = masterGain;
    masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);

    var now = ctx.currentTime;

    var melody = [
      // 0.0s - 2.0s: 歡慶序曲 (C大調琶音升階)
      { t: 0.00, f: 523.25, d: 0.25, v: 0.25, type: 'triangle' }, // C5
      { t: 0.18, f: 659.25, d: 0.25, v: 0.25, type: 'triangle' }, // E5
      { t: 0.36, f: 783.99, d: 0.25, v: 0.25, type: 'triangle' }, // G5
      { t: 0.54, f: 1046.50, d: 0.55, v: 0.32, type: 'sine' },    // C6

      { t: 1.15, f: 587.33, d: 0.22, v: 0.25, type: 'triangle' }, // D5
      { t: 1.33, f: 698.46, d: 0.22, v: 0.25, type: 'triangle' }, // F5
      { t: 1.51, f: 880.00, d: 0.22, v: 0.25, type: 'triangle' }, // A5
      { t: 1.69, f: 1174.66, d: 0.55, v: 0.32, type: 'sine' },    // D6

      // 2.3s - 5.0s: 主旋律熱烈進行 (Victory Fanfare)
      { t: 2.30, f: 659.25, d: 0.25, v: 0.28, type: 'sine' },    // E5
      { t: 2.52, f: 783.99, d: 0.25, v: 0.28, type: 'sine' },    // G5
      { t: 2.74, f: 880.00, d: 0.28, v: 0.28, type: 'sine' },    // A5
      { t: 3.05, f: 1046.50, d: 0.35, v: 0.32, type: 'sine' },   // C6
      { t: 3.45, f: 1174.66, d: 0.35, v: 0.32, type: 'sine' },   // D6
      { t: 3.85, f: 1318.51, d: 1.10, v: 0.35, type: 'sine' },   // E6 (高潮)

      // 和弦伴奏 (3.85s)
      { t: 3.85, f: 659.25, d: 1.10, v: 0.15, type: 'triangle' },// E5
      { t: 3.85, f: 783.99, d: 1.10, v: 0.15, type: 'triangle' },// G5

      // 5.1s - 8.0s: 溫馨過關結尾
      { t: 5.10, f: 1174.66, d: 0.30, v: 0.28, type: 'sine' },   // D6
      { t: 5.42, f: 1046.50, d: 0.30, v: 0.28, type: 'sine' },   // C6
      { t: 5.74, f: 880.00, d: 0.35, v: 0.28, type: 'sine' },    // A5
      { t: 6.10, f: 1046.50, d: 1.80, v: 0.35, type: 'sine' },   // C6 主音

      // 終曲三和弦
      { t: 6.10, f: 523.25, d: 1.80, v: 0.18, type: 'triangle' },// C5
      { t: 6.10, f: 659.25, d: 1.80, v: 0.18, type: 'triangle' },// E5
      { t: 6.10, f: 783.99, d: 1.80, v: 0.18, type: 'triangle' } // G5
    ];

    melody.forEach(function (n) {
      var startTime = now + n.t;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = n.type || 'sine';
      osc.frequency.setValueAtTime(n.f, startTime);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(n.v, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + n.d);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + n.d);
    });
  }

  function setEnabled(val) {
    enabled = !!val;
    saveSetting(enabled);
    if (enabled) {
      resume();
      playCorrect();
    } else {
      stopCheer();
    }
  }

  function toggle() {
    setEnabled(!enabled);
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  if (typeof window !== 'undefined') {
    var unlock = function () {
      resume();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  enabled = loadSetting();

  global.TypingSound = {
    playCorrect: playCorrect,
    playWrong: playWrong,
    playCheer: playCheer,
    stopCheer: stopCheer,
    resume: resume,
    setEnabled: setEnabled,
    toggle: toggle,
    isEnabled: isEnabled
  };
})(window);
