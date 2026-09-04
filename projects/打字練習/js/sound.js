/**
 * sound.js — 打字練習音效模組 (Web Audio API)
 *
 * 設計原則：
 * 1. 使用 Web Audio API 原生合成音效，無需加載外部 MP3/WAV 檔案，保證離線可用與零延遲。
 * 2. 音效音量與頻率經專門調校：
 *    - 正確音：清亮歡快的升階二連音 (784Hz -> 1046Hz)，給予良好節奏回饋。
 *    - 錯誤音：低沉雙音 (220Hz -> 140Hz)，具提示效果但不刺耳。
 *    - 過關音：歡快短促的音階 (C5 -> E5 -> G5 -> C6)。
 * 3. 處理瀏覽器 Autoplay 政策：首個點擊/按鍵時自動呼叫 resume() 啟動 AudioContext。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'typing.sound.enabled.v1';
  var audioCtx = null;
  var enabled = true;

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

    // 使用 triangle/sawtooth 低音組合
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

  function playCheer() {
    if (!enabled) return;
    var ctx = getAudioContext();
    if (!ctx) return;

    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    var now = ctx.currentTime;

    notes.forEach(function (freq, i) {
      var startTime = now + i * 0.09;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  function setEnabled(val) {
    enabled = !!val;
    saveSetting(enabled);
    if (enabled) {
      resume();
      playCorrect(); // 開啟時播放測試聲
    }
  }

  function toggle() {
    setEnabled(!enabled);
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  // 自動綁定互動解鎖
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
    resume: resume,
    setEnabled: setEnabled,
    toggle: toggle,
    isEnabled: isEnabled
  };
})(window);
