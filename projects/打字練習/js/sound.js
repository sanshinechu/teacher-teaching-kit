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
   * 約 8 秒的多樂器/多聲部歡慶過關樂章 (Multi-track Fanfare)
   * 包含：
   *  1. Bass 低音底座 (Sawtooth + Lowpass Filter)
   *  2. Warm Strings / Pad 溫馨和旋 (Triangle 波)
   *  3. Lead Marimba / Glockenspiel 木琴主旋律 (Sine 波)
   *  4. Sparkle Chimes 風鈴星光特效音 (High Sine)
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

    // --- 聲部 1：Bass 低音底座 (Sawtooth + Lowpass Filter) ---
    var bassNotes = [
      { t: 0.00, f: 130.81, d: 1.0, v: 0.18 }, // C3
      { t: 1.15, f: 146.83, d: 1.0, v: 0.18 }, // D3
      { t: 2.30, f: 164.81, d: 1.4, v: 0.20 }, // E3
      { t: 3.85, f: 174.61, d: 1.2, v: 0.20 }, // F3
      { t: 5.10, f: 196.00, d: 0.9, v: 0.20 }, // G3
      { t: 6.10, f: 130.81, d: 1.9, v: 0.22 }  // C3 (終曲)
    ];

    bassNotes.forEach(function (b) {
      var st = now + b.t;
      var osc = ctx.createOscillator();
      var filter = ctx.createBiquadFilter();
      var gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(b.f, st);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, st);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(b.v, st);
      gain.gain.linearRampToValueAtTime(0.001, st + b.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(st);
      osc.stop(st + b.d);
    });

    // --- 聲部 2：Strings / Warm Pad 溫馨和聲 (Triangle 波) ---
    var padNotes = [
      { t: 0.00, f: 261.63, d: 1.1, v: 0.12 }, // C4
      { t: 0.00, f: 329.63, d: 1.1, v: 0.10 }, // E4
      { t: 1.15, f: 293.66, d: 1.0, v: 0.12 }, // D4
      { t: 1.15, f: 349.23, d: 1.0, v: 0.10 }, // F4
      { t: 2.30, f: 329.63, d: 1.4, v: 0.12 }, // E4
      { t: 2.30, f: 392.00, d: 1.4, v: 0.10 }, // G4
      { t: 3.85, f: 349.23, d: 1.2, v: 0.14 }, // F4
      { t: 3.85, f: 440.00, d: 1.2, v: 0.12 }, // A4
      { t: 5.10, f: 392.00, d: 0.9, v: 0.14 }, // G4
      { t: 6.10, f: 261.63, d: 1.9, v: 0.15 }, // C4
      { t: 6.10, f: 329.63, d: 1.9, v: 0.13 }, // E4
      { t: 6.10, f: 392.00, d: 1.9, v: 0.13 }  // G4
    ];

    padNotes.forEach(function (p) {
      var st = now + p.t;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p.f, st);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(p.v, st);
      gain.gain.linearRampToValueAtTime(0.001, st + p.d);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(st);
      osc.stop(st + p.d);
    });

    // --- 聲部 3：Lead Marimba 主旋律木琴聲 (Sine 波) ---
    var leadNotes = [
      { t: 0.00, f: 523.25, d: 0.22, v: 0.28 }, // C5
      { t: 0.18, f: 659.25, d: 0.22, v: 0.28 }, // E5
      { t: 0.36, f: 783.99, d: 0.22, v: 0.28 }, // G5
      { t: 0.54, f: 1046.50, d: 0.55, v: 0.35 },// C6

      { t: 1.15, f: 587.33, d: 0.20, v: 0.28 }, // D5
      { t: 1.33, f: 698.46, d: 0.20, v: 0.28 }, // F5
      { t: 1.51, f: 880.00, d: 0.20, v: 0.28 }, // A5
      { t: 1.69, f: 1174.66, d: 0.55, v: 0.35 },// D6

      { t: 2.30, f: 659.25, d: 0.22, v: 0.30 }, // E5
      { t: 2.52, f: 783.99, d: 0.22, v: 0.30 }, // G5
      { t: 2.74, f: 880.00, d: 0.25, v: 0.30 }, // A5
      { t: 3.05, f: 1046.50, d: 0.35, v: 0.35 },// C6
      { t: 3.45, f: 1174.66, d: 0.35, v: 0.35 },// D6
      { t: 3.85, f: 1318.51, d: 1.10, v: 0.38 },// E6

      { t: 5.10, f: 1174.66, d: 0.28, v: 0.30 },// D6
      { t: 5.42, f: 1046.50, d: 0.28, v: 0.30 },// C6
      { t: 5.74, f: 880.00, d: 0.35, v: 0.30 }, // A5
      { t: 6.10, f: 1046.50, d: 1.80, v: 0.38 } // C6
    ];

    leadNotes.forEach(function (l) {
      var st = now + l.t;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(l.f, st);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(l.v, st);
      gain.gain.linearRampToValueAtTime(0.001, st + l.d);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(st);
      osc.stop(st + l.d);
    });

    // --- 聲部 4：Sparkle Chimes 星光風鈴音 (High Sine) ---
    var chimeNotes = [
      { t: 0.54, f: 2093.00, d: 0.35, v: 0.12 }, // C7
      { t: 1.69, f: 2349.32, d: 0.35, v: 0.12 }, // D7
      { t: 3.85, f: 2637.02, d: 0.50, v: 0.15 }, // E7
      { t: 6.10, f: 2093.00, d: 0.80, v: 0.15 }  // C7
    ];

    chimeNotes.forEach(function (c) {
      var st = now + c.t;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f, st);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(c.v, st);
      gain.gain.linearRampToValueAtTime(0.001, st + c.d);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(st);
      osc.stop(st + c.d);
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
