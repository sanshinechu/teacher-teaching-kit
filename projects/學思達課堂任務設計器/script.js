const STORAGE_KEY = "sharestartLessonDesigner";

const defaultData = {
  topic: "",
  essentialQuestion: "",
  grade: "",
  duration: "40",
  learningGoal: "",
  materials: "",
  taskType: "閱讀理解",
  sentenceSupport: false,
  generated: null
};

const form = document.querySelector("#lessonForm");
const resetButton = document.querySelector("#resetButton");
const copyTasksButton = document.querySelector("#copyTasksButton");
const copyStatus = document.querySelector("#copyStatus");
const tabButtons = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".output-panel");
const taskOutput = document.querySelector("#taskOutput");
const flowOutput = document.querySelector("#flowOutput");
const ticketOutput = document.querySelector("#ticketOutput");

function readState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...defaultData };
  }

  try {
    return { ...defaultData, ...JSON.parse(saved) };
  } catch {
    return { ...defaultData };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isModernGenerated(generated) {
  return Array.isArray(generated?.tasks) && generated.tasks.every((task) => Array.isArray(task.questions));
}

function getFormData() {
  const formData = new FormData(form);

  return {
    topic: formData.get("topic").trim(),
    essentialQuestion: formData.get("essentialQuestion").trim(),
    grade: formData.get("grade").trim(),
    duration: formData.get("duration"),
    learningGoal: formData.get("learningGoal").trim(),
    materials: formData.get("materials").trim(),
    taskType: formData.get("taskType"),
    sentenceSupport: formData.get("sentenceSupport") === "yes"
  };
}

function fillForm(state) {
  Object.entries(state).forEach(([key, value]) => {
    const field = form.elements[key];

    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    if (typeof value === "string") {
      field.value = value;
    }
  });
}

function safeText(value, fallback) {
  return value || fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSupportFrames(data, level) {
  if (!data.sentenceSupport) {
    return ["依任務需求使用中文或課本中的關鍵句完成回答。"];
  }

  const topic = safeText(data.topic, "the topic");
  const frames = {
    s1: [
      `I think ${topic} changed because ...`,
      "The evidence from the text is ...",
      "This connects to my life because ..."
    ],
    s2: [
      `${topic} changed because ...`,
      "In the text, I found ...",
      "I agree / disagree because ..."
    ],
    s3: [
      "I see ...",
      "It changed from ... to ...",
      "The answer is ... because ..."
    ]
  };

  return frames[level];
}

function buildTasks(data) {
  const topic = safeText(data.topic, "本節課主題");
  const question = safeText(data.essentialQuestion, "本節核心問題");
  const grade = safeText(data.grade, "學生");
  const goal = safeText(data.learningGoal, "完成老師指定的學習目標");
  const materials = safeText(data.materials, "教材內容");
  const taskType = safeText(data.taskType, "學習任務");

  return [
    {
      level: "S1 挑戰軌",
      className: "level-s1",
      taskName: `${topic} 進階推論與遷移任務`,
      description: `給程度較好的 ${grade} 學生。任務聚焦「${question}」，要求學生整合教材、提出理由、找出證據，並把學習連結到生活或新情境。`,
      questions: [
        `根據教材內容，推論「${question}」的可能答案，至少提出 2 個理由。`,
        "請找出教材中最能支持你想法的 2 個證據，並說明這些證據為什麼重要。",
        `把「${goal}」連結到自己的生活經驗，設計一個可以延伸討論的問題。`
      ],
      sentenceFrames: getSupportFrames(data, "s1"),
      teacherReminder: `少給步驟，多追問「你怎麼知道？」和「還有沒有其他可能？」讓學生練習 ${taskType} 的高層次表達。`,
      extension: `請學生把結論改寫成一段短講、海報重點或 3 題同儕挑戰題。`
    },
    {
      level: "S2 標準軌",
      className: "level-s2",
      taskName: `${topic} 關鍵理解與有依據回答任務`,
      description: `給中等程度學生。學習方向與 S1 相同，但提供關鍵字、句型提示與作答步驟，幫助學生完成「${goal}」。`,
      questions: [
        `先圈出教材中和「${question}」有關的 3 個關鍵字。`,
        "依照「原因、證據、說明」三步驟，寫出或說出你的答案。",
        `請完成一句總結：我認為這節課最重要的學習是「${goal}」，因為……`
      ],
      sentenceFrames: getSupportFrames(data, "s2"),
      teacherReminder: "先確認學生有找到正確線索，再要求完整表達。若學生卡住，可提供關鍵字或半句提示。",
      extension: "請學生和同伴交換答案，互相補上一個更清楚的理由或例子。"
    },
    {
      level: "S3 支援軌",
      className: "level-s3",
      taskName: `${topic} 核心理解支援任務`,
      description: `給需要更多協助的學生。任務以理解、辨識、選擇、填空、配對為主，讓學生能掌握核心內容，不放棄學習。`,
      questions: [
        `從教材中找出和「${topic}」有關的 3 個單字或句子，並和中文意思配對。`,
        `選一選：「${question}」最可能的答案是哪一個？請從教師提供的選項中選出。`,
        "完成填空：我知道這篇內容主要在說 ______，因為我看到 ______。"
      ],
      sentenceFrames: getSupportFrames(data, "s3"),
      teacherReminder: `先讓學生找到教材中的明顯線索。可以把材料切成小段，搭配中文提示、單字卡或選項：${materials.slice(0, 90)}${materials.length > 90 ? "..." : ""}`,
      extension: "完成後請學生用一句話說出今天學到的重點，或選一張圖卡說明自己的答案。"
    }
  ];
}

function buildFlow(data) {
  const total = Number(data.duration) || 40;
  const topic = safeText(data.topic, "本節課主題");
  const grade = safeText(data.grade, "學生");
  const question = safeText(data.essentialQuestion, "本節核心問題");
  const goal = safeText(data.learningGoal, "完成本節課學習目標");
  const materials = safeText(data.materials, "課堂工具與學習素材");
  const times = total >= 80 ? [10, 15, 25, 20, 10] : [5, 8, 13, 9, 5];

  return [
    {
      title: "學：建立問題與自學方向",
      time: times[0],
      text: `${grade} 先閱讀或聆聽教材，圈出和「${topic}」有關的線索。教師提出核心問題：${question}。`
    },
    {
      title: "思：個人嘗試與策略整理",
      time: times[1],
      text: `學生獨立嘗試第一版任務，根據程度選擇 S1 / S2 / S3。教師提醒本節目標：${goal}。`
    },
    {
      title: "達：小組互助與作品推進",
      time: times[2],
      text: `同組學生互測、互問、互改，使用素材：${materials}。教師巡迴協助卡關學生。`
    },
    {
      title: "展：展示解法與聚焦討論",
      time: times[3],
      text: "挑選不同軌道學生展示作品或答案，讓學生說明做法、問題與修正方式。"
    },
    {
      title: "評：收斂重點與回饋",
      time: times[4],
      text: "教師整理本節關鍵概念，學生完成 Exit Ticket，回報自己已懂、卡住與下一步想挑戰的內容。"
    }
  ];
}

function buildTickets(data) {
  const topic = safeText(data.topic, "今天的課程");
  const question = safeText(data.essentialQuestion, "今天的核心問題");
  const goal = safeText(data.learningGoal, "本節課目標");

  return [
    {
      label: "理解確認",
      question: `今天關於「${topic}」，我會怎麼回答「${question}」？`
    },
    {
      label: "困難回報",
      question: `完成「${goal}」時，我最卡住的地方是什麼？我需要哪一種幫助？`
    },
    {
      label: "任務軌道回饋",
      question: "我今天選的是 S1、S2 還是 S3？這個難度對我來說太簡單、剛剛好，還是太難？"
    },
    {
      label: "下一步挑戰",
      question: "如果下一堂課可以繼續改進，我想新增或修正哪一個部分？"
    }
  ];
}

function generateDesign(data) {
  return {
    tasks: buildTasks(data),
    flow: buildFlow(data),
    tickets: buildTickets(data)
  };
}

function renderEmpty() {
  taskOutput.innerHTML = '<p class="empty-state">請先填寫課程資料，按下「產生三軌任務」。</p>';
  flowOutput.innerHTML = '<li class="empty-state">尚未產生課堂流程。</li>';
  ticketOutput.innerHTML = '<p class="empty-state">尚未產生 Exit Ticket。</p>';
  copyTasksButton.disabled = true;
  copyStatus.textContent = "";
}

function renderGenerated(generated) {
  if (!generated) {
    renderEmpty();
    return;
  }

  copyTasksButton.disabled = false;

  taskOutput.innerHTML = generated.tasks
    .map((task) => `
      <section class="task-column ${task.className}">
        <h3>${escapeHtml(task.level)}</h3>
        <strong>任務名稱</strong>
        <p class="task-name">${escapeHtml(task.taskName)}</p>
        <strong>任務說明</strong>
        <p>${escapeHtml(task.description)}</p>
        <strong>學生要完成的題目</strong>
        <ul>
          ${task.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
        </ul>
        <strong>可使用的句型</strong>
        <ul>
          ${task.sentenceFrames.map((frame) => `<li>${escapeHtml(frame)}</li>`).join("")}
        </ul>
        <p><strong>教師提醒：</strong>${escapeHtml(task.teacherReminder)}</p>
        <p><strong>延伸任務：</strong>${escapeHtml(task.extension)}</p>
      </section>
    `)
    .join("");

  flowOutput.innerHTML = generated.flow
    .map((item) => `
      <li class="flow-item">
        <span class="flow-time">${escapeHtml(item.time)} 分鐘</span>
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </li>
    `)
    .join("");

  ticketOutput.innerHTML = generated.tickets
    .map((ticket, index) => `
      <section class="ticket-item">
        <strong>第 ${index + 1} 題｜${escapeHtml(ticket.label)}</strong>
        <p>${escapeHtml(ticket.question)}</p>
      </section>
    `)
    .join("");
}

function tasksToText(tasks) {
  if (!tasks) {
    return "";
  }

  return tasks
    .map((task) => [
      task.level,
      `任務名稱：${task.taskName}`,
      `任務說明：${task.description}`,
      "學生要完成的題目：",
      ...task.questions.map((question, index) => `${index + 1}. ${question}`),
      "可使用的句型：",
      ...task.sentenceFrames.map((frame) => `- ${frame}`),
      `教師提醒：${task.teacherReminder}`,
      `延伸任務：${task.extension}`
    ].join("\n"))
    .join("\n\n");
}

async function copyTasks() {
  const text = tasksToText(state.generated?.tasks);

  if (!text) {
    copyStatus.textContent = "尚未產生內容。";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "已複製，可以貼到講義中。";
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    copyStatus.textContent = "已複製，可以貼到講義中。";
  }
}

function switchPanel(panelId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.panel === panelId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === panelId);
  });
}

let state = readState();
if (!isModernGenerated(state.generated)) {
  state.generated = null;
}
fillForm(state);
renderGenerated(state.generated);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = getFormData();
  state = {
    ...data,
    generated: generateDesign(data)
  };

  saveState(state);
  renderGenerated(state.generated);
});

form.addEventListener("input", () => {
  state = {
    ...state,
    ...getFormData()
  };

  saveState(state);
});

resetButton.addEventListener("click", () => {
  state = { ...defaultData };
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  form.elements.duration.value = defaultData.duration;
  form.elements.taskType.value = defaultData.taskType;
  form.elements.sentenceSupport.checked = defaultData.sentenceSupport;
  renderEmpty();
});

copyTasksButton.addEventListener("click", copyTasks);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchPanel(button.dataset.panel);
  });
});
