const moodMessages = {
  happy: "很棒！把這份好心情分享給身邊的人吧。",
  nervous: "緊張代表你很在乎，先深呼吸，再一步一步來。",
  calm: "平穩的一天也很好，穩穩做，你會完成得很漂亮。",
  tired: "辛苦了。可以慢一點，但不要忘記照顧自己。",
  sad: "難過的時候先陪陪自己，也可以找老師或同學聊聊。",
  confident: "很好！帶著這份信心，今天一定能挑戰新的任務。",
  curious: "好奇心很珍貴，問問題就是學習正在發生。",
  excited: "帶著期待出發，今天可能會有新的發現。",
  help: "願意說需要幫忙很勇敢，我們可以一起想辦法。",
  focused: "專心的你很有力量，現在就把一件事做好。"
};

const moodLabels = {
  happy: "開心",
  nervous: "緊張",
  calm: "平靜",
  tired: "疲累",
  sad: "難過",
  confident: "有信心",
  curious: "好奇",
  excited: "期待",
  help: "需要幫忙",
  focused: "專心"
};

const messageElement = document.querySelector("#message");
const statusElement = document.querySelector("#status");
const buttons = document.querySelectorAll(".mood-word");
const statsGrid = document.querySelector("#statsGrid");
const resetButton = document.querySelector("#resetStats");
const stats = Object.fromEntries(Object.keys(moodLabels).map((mood) => [mood, 0]));

function renderStats() {
  const selectedMoods = Object.entries(moodLabels).filter(([mood]) => stats[mood] > 0);

  if (selectedMoods.length === 0) {
    statsGrid.innerHTML = '<p class="empty-stats">尚未有心情簽到</p>';
    return;
  }

  statsGrid.innerHTML = selectedMoods
    .map(([mood, label]) => `
      <div class="stat-item">
        <span>${label}</span>
        <span class="stat-count">${stats[mood]}</span>
      </div>
    `)
    .join("");
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;

    buttons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");

    stats[mood] += 1;
    renderStats();

    messageElement.textContent = moodMessages[mood];
    statusElement.textContent = "今日簽到成功";
  });
});

resetButton.addEventListener("click", () => {
  Object.keys(stats).forEach((mood) => {
    stats[mood] = 0;
  });

  buttons.forEach((item) => item.classList.remove("is-selected"));
  renderStats();

  messageElement.textContent = "點一下心情詞，完成今天的心情簽到。";
  statusElement.textContent = "";
});

renderStats();
