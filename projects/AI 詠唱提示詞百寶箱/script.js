const prompts = [
  {
    title: "影像生成：角色設定",
    category: "image",
    categoryLabel: "影像生成",
    purpose: "快速描述主角、服裝、動作與場景。",
    text: "請生成一張圖片：主體是「{角色或物件}」，正在「{動作}」，位於「{場景}」。畫面風格為「{畫風}」，色彩感覺是「{色彩情緒}」，細節清楚，適合課堂展示。",
    variables: [
      ["{角色或物件}", "例如：未來城市裡的學生、會飛的圖書館"],
      ["{動作}", "例如：觀察星空、設計機器人"],
      ["{畫風}", "例如：水彩、像素風、3D 卡通"]
    ]
  },
  {
    title: "影像生成：光線與鏡頭",
    category: "image",
    categoryLabel: "影像生成",
    purpose: "補強畫面的光線、構圖與視角。",
    text: "延續上一張圖的主題，請改成「{鏡頭視角}」構圖，光線是「{光線描述}」，背景加入「{背景元素}」，整體氣氛要像「{氣氛關鍵字}」。",
    variables: [
      ["{鏡頭視角}", "例如：俯視、低角度、近距離特寫"],
      ["{光線描述}", "例如：清晨柔光、舞台聚光、夕陽逆光"],
      ["{氣氛關鍵字}", "例如：神秘、溫暖、科技感"]
    ]
  },
  {
    title: "影像生成：四格分鏡",
    category: "image",
    categoryLabel: "影像生成",
    purpose: "把一個故事拆成四個畫面。",
    text: "請把「{故事主題}」設計成四格分鏡圖。第 1 格是開場，第 2 格是遇到問題，第 3 格是嘗試解決，第 4 格是結果。每格都要有簡短畫面描述，風格統一為「{畫風}」。",
    variables: [
      ["{故事主題}", "例如：小組合作完成任務"],
      ["{畫風}", "例如：漫畫風、童書插畫、黑板粉筆風"]
    ]
  },
  {
    title: "劇本創作：短片大綱",
    category: "story",
    categoryLabel: "劇本創作",
    purpose: "從主題快速產出一段可拍攝的短片架構。",
    text: "請幫我寫一個 1 分鐘短片大綱。主題是「{主題}」，角色有「{角色}」，故事要包含開場、衝突、轉折、結尾。語氣適合「{年級}」學生理解，結尾要有一句有力量的台詞。",
    variables: [
      ["{主題}", "例如：網路禮儀、團隊合作、環境保護"],
      ["{角色}", "例如：兩位學生、一位老師、一個 AI 助手"],
      ["{年級}", "例如：五年級、六年級、國中"]
    ]
  },
  {
    title: "劇本創作：角色對話",
    category: "story",
    categoryLabel: "劇本創作",
    purpose: "讓學生練習改寫語氣與角色觀點。",
    text: "請寫一段兩人對話。角色 A 是「{角色A}」，角色 B 是「{角色B}」。他們正在討論「{事件}」。對話要有 8 句，語氣自然，最後要留下可以繼續討論的問題。",
    variables: [
      ["{角色A}", "例如：剛學會 Scratch 的學生"],
      ["{角色B}", "例如：負責提醒安全規則的同學"],
      ["{事件}", "例如：作品要不要使用別人的圖片"]
    ]
  },
  {
    title: "劇本創作：改寫成不同風格",
    category: "story",
    categoryLabel: "劇本創作",
    purpose: "把同一段內容改成不同語氣或媒體形式。",
    text: "請把下面這段內容改寫成「{風格}」，保留原本重點，但讓文字更適合「{使用情境}」。內容如下：\n「{貼上原文}」",
    variables: [
      ["{風格}", "例如：新聞報導、冒險故事、校園廣播"],
      ["{使用情境}", "例如：課堂發表、短影片旁白、海報文案"],
      ["{貼上原文}", "貼入學生自己的草稿"]
    ]
  },
  {
    title: "學習任務：提問小幫手",
    category: "learning",
    categoryLabel: "學習任務",
    purpose: "把模糊想法變成可以問 AI 的清楚問題。",
    text: "我正在學「{學習主題}」。請先用 3 句話解釋重點，再給我 3 個檢查理解的問題。請不要直接給很難的答案，要用「{年級或程度}」能懂的說法。",
    variables: [
      ["{學習主題}", "例如：變數、電路、議論文"],
      ["{年級或程度}", "例如：國小五年級、初學者"]
    ]
  },
  {
    title: "學習任務：作品回饋",
    category: "learning",
    categoryLabel: "學習任務",
    purpose: "讓 AI 用具體條列協助學生修正作品。",
    text: "請看我的作品說明，幫我用「優點 2 點、可以改進 2 點、下一步建議 1 點」給回饋。請用鼓勵但具體的語氣。作品說明：\n「{作品說明}」",
    variables: [
      ["{作品說明}", "貼上學生對圖片、劇本、程式或簡報的說明"]
    ]
  }
];

const grid = document.querySelector("#prompt-grid");
const template = document.querySelector("#prompt-card-template");
const editor = document.querySelector("#prompt-editor");
const statusText = document.querySelector("#copy-status");
const searchInput = document.querySelector("#prompt-search");
const tabs = document.querySelectorAll(".tab");
const copyEditorButton = document.querySelector("#copy-editor");
const clearEditorButton = document.querySelector("#clear-editor");

let activeFilter = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function getFilteredPrompts() {
  const keyword = normalize(searchInput.value);

  return prompts.filter((prompt) => {
    const matchesFilter = activeFilter === "all" || prompt.category === activeFilter;
    const targetText = `${prompt.title} ${prompt.categoryLabel} ${prompt.purpose} ${prompt.text}`;
    const matchesSearch = !keyword || normalize(targetText).includes(keyword);
    return matchesFilter && matchesSearch;
  });
}

function setStatus(message) {
  statusText.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    statusText.textContent = "";
  }, 2200);
}

async function copyText(text) {
  if (!text.trim()) {
    setStatus("目前沒有可複製的提示詞。");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    editor.value = text;
    editor.select();
    document.execCommand("copy");
  }

  setStatus("已複製，可以貼到 AI 工具裡。");
}

function renderPrompts() {
  grid.innerHTML = "";
  const filteredPrompts = getFilteredPrompts();

  if (filteredPrompts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "找不到符合條件的提示詞。";
    grid.append(empty);
    return;
  }

  filteredPrompts.forEach((prompt) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const variables = card.querySelector(".variables");

    card.dataset.category = prompt.category;
    card.querySelector(".category-pill").textContent = prompt.categoryLabel;
    card.querySelector("h2").textContent = prompt.title;
    card.querySelector(".prompt-purpose").textContent = prompt.purpose;
    card.querySelector(".prompt-text").textContent = prompt.text;

    prompt.variables.forEach(([name, hint]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = name;
      detail.textContent = hint;
      row.append(term, detail);
      variables.append(row);
    });

    card.addEventListener("click", (event) => {
      if (event.target.closest(".copy-button")) {
        copyText(prompt.text);
        return;
      }

      editor.value = prompt.text;
      editor.focus();
    });

    grid.append(card);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderPrompts();
  });
});

searchInput.addEventListener("input", renderPrompts);
copyEditorButton.addEventListener("click", () => copyText(editor.value));
clearEditorButton.addEventListener("click", () => {
  editor.value = "";
  editor.focus();
});

renderPrompts();
