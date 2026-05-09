const quotes = [
  "你今天的努力，會變成明天的能力。",
  "不怕慢，只怕停下來；一步一步也會到達。",
  "錯誤不是失敗，是大腦正在升級。",
  "勇敢試一次，你會發現自己比想像中更厲害。",
  "專心做好眼前的小事，就是成為高手的開始。",
  "遇到困難時，先深呼吸，再想下一步。",
  "願意發問的人，正在打開新的大門。",
  "每一次練習，都是送給未來自己的禮物。",
  "你不需要一下子完美，只需要比昨天更進步。",
  "把不會變成會，就是今天最棒的成就。",
  "相信自己可以學會，答案就已經靠近一半。",
  "保持好奇心，世界會變得更有趣。",
  "你認真思考的樣子，就是最亮的樣子。",
  "小小的堅持，會累積成大大的進步。",
  "今天多嘗試一點，明天就多一點自信。",
  "先開始，再慢慢變好，這就是進步的路。",
  "你願意努力，已經是一件很了不起的事。",
  "把困難拆小一點，就會變得容易一點。",
  "每個高手，都是從不熟練開始的。",
  "你的想法很重要，勇敢說出來試試看。",
  "今天的你，正在累積未來的力量。",
  "做錯沒關係，願意修正就是成長。",
  "一次完成一小步，也是在往前走。",
  "先不要說不可能，試過再說也不遲。",
  "學習像拼圖，一片一片就會越來越清楚。",
  "你可以慢慢來，但不要放棄自己。",
  "遇到卡住的地方，正是大腦在變強的地方。",
  "多想一分鐘，也許答案就會出現。",
  "你的努力不會白費，它正在悄悄累積。",
  "敢挑戰的人，會看見新的自己。",
  "保持專心，你會比自己想像得更厲害。",
  "今天學會一點點，就是很棒的一天。",
  "不會沒關係，我們可以一起找到方法。",
  "你每一次舉手，都是勇氣的練習。",
  "把注意力放在下一步，事情就會變簡單。",
  "好的作品，都是一次一次修改出來的。",
  "別急著跟別人比，先看見自己的進步。",
  "你正在練習解決問題，這是很重要的能力。",
  "試著換個方法，可能會有新的發現。",
  "今天的難題，會成為明天的經驗。",
  "你有能力學會，只是需要一點時間。",
  "願意再試一次的人，離成功更近了。",
  "安靜思考的時間，也是在努力。",
  "每一個問題，都是學習送來的線索。",
  "你已經比剛開始時更懂了。",
  "把心放穩，把事情一步一步做好。",
  "你的創意值得被看見，也值得被分享。",
  "學習不是比快，而是比願不願意前進。",
  "今天先完成一件事，就已經很棒了。",
  "當你願意幫助別人，也是在讓自己更強。"
];

const quoteElement = document.querySelector("#quote");
const quoteBox = document.querySelector("#quoteBox");
const drawStage = document.querySelector("#drawStage");
const drawBucket = document.querySelector("#drawBucket");
const rollingStick = document.querySelector("#rollingStick");
const drawHint = document.querySelector("#drawHint");
const resetButton = document.querySelector("#resetButton");

function resetDraw() {
  quoteBox.classList.add("is-hidden");
  drawStage.classList.remove("is-hidden");
  drawBucket.classList.remove("is-drawing");
  rollingStick.classList.remove("is-rolling");
  drawHint.textContent = "點一下抽籤桶，抽出今日課堂鼓勵";
  quoteElement.textContent = "";
}

drawBucket.addEventListener("click", () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);

  quoteBox.classList.add("is-hidden");
  drawStage.classList.remove("is-hidden");
  drawBucket.classList.add("is-drawing");
  rollingStick.classList.remove("is-rolling");
  drawHint.textContent = "抽籤中...";
  quoteElement.textContent = "";

  window.setTimeout(() => {
    rollingStick.classList.add("is-rolling");
  }, 180);

  window.setTimeout(() => {
    quoteElement.textContent = quotes[randomIndex];
    drawStage.classList.add("is-hidden");
    quoteBox.classList.remove("is-hidden");
    drawHint.textContent = "重新整理可以再抽一次";
    drawBucket.classList.remove("is-drawing");
  }, 1300);
});

resetButton.addEventListener("click", resetDraw);
