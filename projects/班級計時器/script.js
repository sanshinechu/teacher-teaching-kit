let remaining = 0;
let interval = null;
let running = false;

const display = document.getElementById('timerDisplay');
const message = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const emojiTop = document.getElementById('emojiTop');
const inputGroup = document.querySelector('.input-group');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');

const emojis = ['⏰', '⏳', '🕐', '🌈', '🎯'];
let emojiIndex = 0;

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateDisplay(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  display.textContent = `${pad(m)}:${pad(s)}`;
}

function toggleTimer() {
  running ? pauseTimer() : startTimer();
}

function startTimer() {
  if (!running && remaining === 0) {
    const m = parseInt(minutesInput.value) || 0;
    const s = parseInt(secondsInput.value) || 0;
    remaining = m * 60 + s;
    if (remaining <= 0) return;
  }

  running = true;
  startBtn.textContent = '⏸ 暫停';
  inputGroup.style.pointerEvents = 'none';
  inputGroup.style.opacity = '0.5';

  interval = setInterval(() => {
    remaining--;
    updateDisplay(remaining);

    // 換emoji增加趣味感
    emojiIndex = (emojiIndex + 1) % emojis.length;
    emojiTop.textContent = emojis[emojiIndex];

    if (remaining <= 0) {
      clearInterval(interval);
      running = false;
      timeUp();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(interval);
  running = false;
  startBtn.textContent = '▶ 繼續';
}

function resetTimer() {
  clearInterval(interval);
  running = false;
  remaining = 0;
  document.body.classList.remove('time-up');
  message.style.display = 'none';
  startBtn.textContent = '▶ 開始';
  emojiTop.textContent = '⏰';
  inputGroup.style.pointerEvents = '';
  inputGroup.style.opacity = '';

  const m = parseInt(minutesInput.value) || 0;
  const s = parseInt(secondsInput.value) || 0;
  updateDisplay(m * 60 + s);
}

function timeUp() {
  display.textContent = '00:00';
  emojiTop.textContent = '🎉';
  document.body.classList.add('time-up');
  message.style.display = 'block';
  startBtn.textContent = '▶ 開始';
}

// 輸入時即時更新顯示
minutesInput.addEventListener('input', () => {
  if (!running && remaining === 0) {
    const m = parseInt(minutesInput.value) || 0;
    const s = parseInt(secondsInput.value) || 0;
    updateDisplay(m * 60 + s);
  }
});

secondsInput.addEventListener('input', () => {
  if (!running && remaining === 0) {
    const m = parseInt(minutesInput.value) || 0;
    const s = parseInt(secondsInput.value) || 0;
    updateDisplay(m * 60 + s);
  }
});

resetTimer();
