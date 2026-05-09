const moodMessages = {
  happy: "很棒！把這份好心情分享給身邊的人吧。",
  calm: "平穩的一天也很好，慢慢來，一步一步完成任務。",
  sad: "辛苦了。難過的時候先照顧自己，你不是一個人。"
};

const messageElement = document.querySelector("#message");
const statusElement = document.querySelector("#status");
const buttons = document.querySelectorAll(".mood-button");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;

    messageElement.textContent = moodMessages[mood];
    statusElement.textContent = "今日簽到成功";
  });
});
