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

const messageElement = document.querySelector("#message");
const statusElement = document.querySelector("#status");
const buttons = document.querySelectorAll(".mood-icon");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;

    buttons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");

    messageElement.textContent = moodMessages[mood];
    statusElement.textContent = "今日簽到成功";
  });
});
