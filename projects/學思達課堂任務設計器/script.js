const STORAGE_KEY = "sharestartLessonDesigner";

const defaultFlowInput = {
  flowTopic: "",
  flowDuration: "45",
  flowGoal: "",
  flowQuestion: "",
  useThreeTracks: false,
  useGroupDiscussion: true,
  useExitTicket: true,
  classStatus: "安靜型"
};

const defaultTicketInput = {
  ticketTopic: "",
  ticketGoal: "",
  ticketFocus: "",
  ticketCount: "3",
  ticketLanguage: "中文",
  feedbackType: "學習理解"
};

const defaultData = {
  topic: "",
  essentialQuestion: "",
  grade: "",
  duration: "40",
  learningGoal: "",
  materials: "",
  taskType: "閱讀理解",
  sentenceSupport: false,
  flowInput: { ...defaultFlowInput },
  flowRows: [],
  ticketInput: { ...defaultTicketInput },
  ticketQuestions: [],
  generated: null
};

const form = document.querySelector("#lessonForm");
const resetButton = document.querySelector("#resetButton");
const copyTasksButton = document.querySelector("#copyTasksButton");
const copyStatus = document.querySelector("#copyStatus");
const flowForm = document.querySelector("#flowForm");
const addFlowRowButton = document.querySelector("#addFlowRowButton");
const ticketForm = document.querySelector("#ticketForm");
const copyTicketButton = document.querySelector("#copyTicketButton");
const ticketCopyStatus = document.querySelector("#ticketCopyStatus");
const tabButtons = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".output-panel");
const taskOutput = document.querySelector("#taskOutput");
const flowOutput = document.querySelector("#flowOutput");
const ticketOutput = document.querySelector("#ticketOutput");
const studentTicketOutput = document.querySelector("#studentTicketOutput");

function readState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...defaultData };
  }

  try {
    const parsed = JSON.parse(saved);

    return {
      ...defaultData,
      ...parsed,
      flowInput: {
        ...defaultFlowInput,
        ...parsed.flowInput
      },
      flowRows: Array.isArray(parsed.flowRows) ? parsed.flowRows : [],
      ticketInput: {
        ...defaultTicketInput,
        ...parsed.ticketInput
      },
      ticketQuestions: Array.isArray(parsed.ticketQuestions) ? parsed.ticketQuestions : []
    };
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

function getFlowFormData() {
  const formData = new FormData(flowForm);

  return {
    flowTopic: formData.get("flowTopic").trim(),
    flowDuration: formData.get("flowDuration").trim() || defaultFlowInput.flowDuration,
    flowGoal: formData.get("flowGoal").trim(),
    flowQuestion: formData.get("flowQuestion").trim(),
    useThreeTracks: formData.get("useThreeTracks") === "yes",
    useGroupDiscussion: formData.get("useGroupDiscussion") === "yes",
    useExitTicket: formData.get("useExitTicket") === "yes",
    classStatus: formData.get("classStatus")
  };
}

function fillFlowForm(flowInput) {
  Object.entries(flowInput).forEach(([key, value]) => {
    const field = flowForm.elements[key];

    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    field.value = value;
  });
}

function getTicketFormData() {
  const formData = new FormData(ticketForm);

  return {
    ticketTopic: formData.get("ticketTopic").trim(),
    ticketGoal: formData.get("ticketGoal").trim(),
    ticketFocus: formData.get("ticketFocus").trim(),
    ticketCount: formData.get("ticketCount"),
    ticketLanguage: formData.get("ticketLanguage"),
    feedbackType: formData.get("feedbackType")
  };
}

function fillTicketForm(ticketInput) {
  Object.entries(ticketInput).forEach(([key, value]) => {
    const field = ticketForm.elements[key];

    if (field) {
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

function splitMinutes(total) {
  const ratios = [0.18, 0.16, 0.27, 0.22, 0.17];
  const minutes = ratios.map((ratio) => Math.max(4, Math.round(total * ratio)));
  const diff = total - minutes.reduce((sum, minute) => sum + minute, 0);
  minutes[minutes.length - 1] += diff;

  return minutes;
}

function getClassReminder(status) {
  const reminders = {
    "安靜型": "先給 30 秒安靜思考，再邀請學生用便利貼或短句分享。",
    "活潑型": "先講清楚音量、時間與發言順序，使用倒數計時收束活動。",
    "程度落差大": "先確認 S3 學生有可完成的起點，再讓 S1 學生挑戰延伸問題。",
    "需要更多秩序提醒": "每個階段開始前先說明任務、時間、完成標準與停止信號。"
  };

  return reminders[status] || reminders["安靜型"];
}

function buildFlowRows(input) {
  const total = Number(input.flowDuration) || 45;
  const topic = safeText(input.flowTopic, "本節課主題");
  const goal = safeText(input.flowGoal, "完成本節課教學目標");
  const question = safeText(input.flowQuestion, "本節核心問題");
  const statusReminder = getClassReminder(input.classStatus);
  const [selfStudy, think, discuss, express, summarize] = splitMinutes(total);
  const discussionMode = input.useGroupDiscussion ? "小組分享答案，互相補充與修正。" : "先進行鄰座快速核對，再由教師帶全班確認。";
  const threeTrackNote = input.useThreeTracks
    ? "依程度提供 S1 挑戰、S2 標準、S3 支援任務，允許學生從可完成的軌道開始。"
    : "若學生卡住，提供關鍵字、句型或範例，不另外分軌。";
  const ticketTool = input.useExitTicket ? "Exit Ticket、便利貼、Google 表單" : "黑板整理、口頭回饋、學習單";

  return [
    {
      time: `${selfStudy} 分鐘`,
      phase: "自學",
      teacherTask: `提供「${topic}」教材、提示或範例，說明核心問題：${question}`,
      studentTask: "閱讀教材、觀看提示，完成基礎理解任務，圈出看懂與不確定的地方。",
      tools: "教材短文、提示卡、投影片、計時器",
      reminder: `先讓學生自己試，不急著講解。${statusReminder}`,
      differentiation: `S3 可先做圈選與配對，S2 完成基本題，S1 先找證據。${threeTrackNote}`
    },
    {
      time: `${think} 分鐘`,
      phase: "思考",
      teacherTask: `要求學生個人作答，提醒回答要對準教學目標：${goal}`,
      studentTask: "個人整理想法，寫下答案、理由或還不確定的問題。",
      tools: "學習單、筆記格、關鍵字提示",
      reminder: "給足安靜作答時間，先不要讓學生直接討論。",
      differentiation: "S1 寫理由與證據，S2 依步驟完成答案，S3 可用填空或選項完成核心理解。"
    },
    {
      time: `${discuss} 分鐘`,
      phase: "討論",
      teacherTask: "巡迴聽小組討論，記下值得全班分享的答案與常見迷思。",
      studentTask: discussionMode,
      tools: "小白板、便利貼、分組任務卡、計時器",
      reminder: input.useGroupDiscussion ? "指定發言順序，要求每組至少補充一個理由。" : "討論時間較短時，用快速核對避免活動失焦。",
      differentiation: input.useThreeTracks ? "讓不同軌道學生先分享自己能完成的部分，再互相補上理由與證據。" : "請程度好的學生負責追問理由，需要協助的學生先說出關鍵字。"
    },
    {
      time: `${express} 分鐘`,
      phase: "表達",
      teacherTask: "邀請學生或小組發表，追問理由、證據與不同想法。",
      studentTask: "向全班說明答案，回應教師追問，聆聽其他組的補充。",
      tools: "投影、黑板、小白板、發表句型",
      reminder: "追問可以短而準，例如：你從哪裡看出來？還有不同想法嗎？",
      differentiation: "S1 可發表完整推論，S2 補充證據，S3 可用一句話或選項說明理解。"
    },
    {
      time: `${summarize} 分鐘`,
      phase: "統整",
      teacherTask: "整理重點、補充概念，連結下一次課程或生活情境。",
      studentTask: input.useExitTicket ? "完成 Exit Ticket，寫下已懂、卡住與下一步想挑戰的內容。" : "完成一句課堂總結，說出今天最重要的學習。",
      tools: ticketTool,
      reminder: "收尾要回扣核心問題與教學目標，不只公布答案。",
      differentiation: input.useExitTicket ? "Exit Ticket 可設計三種答題方式：完整句、句型填空、圈選加短答。" : "允許學生用口說、畫圖或短句完成回饋。"
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

function makeQuestion(language, chinese, english) {
  if (language === "英文") {
    return english;
  }

  if (language === "中英雙語") {
    return `${chinese}\n${english}`;
  }

  return chinese;
}

function buildExitTicketQuestions(input) {
  const topic = safeText(input.ticketTopic, "今天的課程");
  const goal = safeText(input.ticketGoal, "今天的學習目標");
  const focus = safeText(input.ticketFocus, "今天的學習重點");
  const language = input.ticketLanguage;
  const count = Math.min(5, Math.max(3, Number(input.ticketCount) || 3));
  const type = input.feedbackType;
  const bank = [
    {
      type: "學習理解",
      label: "學習理解",
      question: makeQuestion(
        language,
        `今天關於「${topic}」，我學會了什麼？請寫出 1 個重點。`,
        `What did I learn about "${topic}" today? Write one key point.`
      )
    },
    {
      type: "困難回報",
      label: "困難回報",
      question: makeQuestion(
        language,
        `關於「${focus}」，我還不太懂的是什麼？`,
        `What do I still not understand about "${focus}"?`
      )
    },
    {
      type: "學習理解",
      label: "重點句型",
      question: makeQuestion(
        language,
        `請用一句話寫出今天的重點，對應學習目標：「${goal}」。`,
        `Write one sentence to show today's key point: "${goal}".`
      )
    },
    {
      type: "學習理解",
      label: "小組討論",
      question: makeQuestion(
        language,
        "今天小組討論時，我的貢獻是什麼？",
        "What was my contribution during group discussion today?"
      )
    },
    {
      type: "自我評分",
      label: "自我評分",
      question: makeQuestion(
        language,
        "我給自己今天的學習表現幾分？為什麼？",
        "What score would I give my learning performance today? Why?"
      )
    },
    {
      type: "情緒狀態",
      label: "情緒狀態",
      question: makeQuestion(
        language,
        "離開教室前，我現在的心情是什麼？這和今天的學習有什麼關係？",
        "How do I feel before leaving class? How is it connected to today's learning?"
      )
    },
    {
      type: "下次想學什麼",
      label: "下次想學什麼",
      question: makeQuestion(
        language,
        `下次如果繼續學「${topic}」，我想再練習或了解什麼？`,
        `If we continue learning "${topic}" next time, what do I want to practice or understand more?`
      )
    }
  ];
  const preferred = bank.filter((item) => item.type === type);
  const ordered = [...preferred, ...bank.filter((item) => item.type !== type)];

  return ordered.slice(0, count);
}

function generateDesign(data) {
  return {
    tasks: buildTasks(data),
    tickets: buildTickets(data)
  };
}

function renderEmpty() {
  taskOutput.innerHTML = '<p class="empty-state">請先填寫課程資料，按下「產生三軌任務」。</p>';
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

}

function renderFlowRows(rows) {
  if (!rows.length) {
    flowOutput.innerHTML = `
      <tr>
        <td class="empty-table" colspan="8">請先填寫流程資料，按下「產生課堂流程」。</td>
      </tr>
    `;
    return;
  }

  flowOutput.innerHTML = rows
    .map((row, index) => `
      <tr>
        <td contenteditable="true" data-index="${index}" data-field="time">${escapeHtml(row.time)}</td>
        <td contenteditable="true" data-index="${index}" data-field="phase">${escapeHtml(row.phase)}</td>
        <td contenteditable="true" data-index="${index}" data-field="teacherTask">${escapeHtml(row.teacherTask)}</td>
        <td contenteditable="true" data-index="${index}" data-field="studentTask">${escapeHtml(row.studentTask)}</td>
        <td contenteditable="true" data-index="${index}" data-field="tools">${escapeHtml(row.tools)}</td>
        <td contenteditable="true" data-index="${index}" data-field="reminder">${escapeHtml(row.reminder)}</td>
        <td contenteditable="true" data-index="${index}" data-field="differentiation">${escapeHtml(row.differentiation)}</td>
        <td>
          <button class="delete-row-button" type="button" data-delete-index="${index}">刪除</button>
        </td>
      </tr>
    `)
    .join("");
}

function renderTickets(questions, input) {
  if (!questions.length) {
    ticketOutput.innerHTML = '<p class="empty-state">請先填寫資料，按下「產生 Exit Ticket」。</p>';
    studentTicketOutput.innerHTML = '<p class="empty-state">尚未產生學生填寫版。</p>';
    copyTicketButton.disabled = true;
    ticketCopyStatus.textContent = "";
    return;
  }

  copyTicketButton.disabled = false;
  ticketOutput.innerHTML = questions
    .map((ticket, index) => `
      <section class="ticket-item">
        <strong>第 ${index + 1} 題｜${escapeHtml(ticket.label)}</strong>
        <p>${escapeHtml(ticket.question).replaceAll("\n", "<br>")}</p>
      </section>
    `)
    .join("");

  studentTicketOutput.innerHTML = `
    <div class="student-ticket-meta">
      <span>主題：${escapeHtml(safeText(input.ticketTopic, "今日課程"))}</span>
      <span>姓名：__________</span>
      <span>日期：__________</span>
    </div>
    <ol class="student-ticket-list">
      ${questions.map((ticket) => `
        <li>
          <p>${escapeHtml(ticket.question).replaceAll("\n", "<br>")}</p>
          <div class="answer-line"></div>
        </li>
      `).join("")}
    </ol>
  `;
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

function ticketsToText(questions, input) {
  if (!questions.length) {
    return "";
  }

  return [
    `Exit Ticket：${safeText(input.ticketTopic, "今日課程")}`,
    `學習目標：${safeText(input.ticketGoal, "今日學習目標")}`,
    `檢查重點：${safeText(input.ticketFocus, "今日學習重點")}`,
    "",
    ...questions.map((ticket, index) => `${index + 1}. ${ticket.question}`)
  ].join("\n");
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

async function copyTickets() {
  const text = ticketsToText(state.ticketQuestions, state.ticketInput);

  if (!text) {
    ticketCopyStatus.textContent = "尚未產生內容。";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    ticketCopyStatus.textContent = "已複製，可以貼到講義或 Google Classroom。";
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    ticketCopyStatus.textContent = "已複製，可以貼到講義或 Google Classroom。";
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
fillFlowForm(state.flowInput);
fillTicketForm(state.ticketInput);
renderGenerated(state.generated);
renderFlowRows(state.flowRows);
renderTickets(state.ticketQuestions, state.ticketInput);

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

flowForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const flowInput = getFlowFormData();
  state = {
    ...state,
    flowInput,
    flowRows: buildFlowRows(flowInput)
  };

  saveState(state);
  renderFlowRows(state.flowRows);
});

flowForm.addEventListener("input", () => {
  state = {
    ...state,
    flowInput: getFlowFormData()
  };

  saveState(state);
});

ticketForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const ticketInput = getTicketFormData();
  state = {
    ...state,
    ticketInput,
    ticketQuestions: buildExitTicketQuestions(ticketInput)
  };

  saveState(state);
  renderTickets(state.ticketQuestions, state.ticketInput);
});

ticketForm.addEventListener("input", () => {
  state = {
    ...state,
    ticketInput: getTicketFormData()
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
  fillFlowForm(defaultFlowInput);
  fillTicketForm(defaultTicketInput);
  renderEmpty();
  renderFlowRows([]);
  renderTickets([], defaultTicketInput);
});

copyTasksButton.addEventListener("click", copyTasks);
copyTicketButton.addEventListener("click", copyTickets);

addFlowRowButton.addEventListener("click", () => {
  const nextRow = {
    time: "5 分鐘",
    phase: "自訂",
    teacherTask: "請輸入教師任務",
    studentTask: "請輸入學生任務",
    tools: "請輸入可使用工具",
    reminder: "請輸入教師提醒語",
    differentiation: "請輸入差異化提醒"
  };

  state = {
    ...state,
    flowRows: [...state.flowRows, nextRow]
  };

  saveState(state);
  renderFlowRows(state.flowRows);
});

flowOutput.addEventListener("input", (event) => {
  const cell = event.target.closest("[data-index][data-field]");

  if (!cell) {
    return;
  }

  const index = Number(cell.dataset.index);
  const field = cell.dataset.field;
  const nextRows = state.flowRows.map((row, rowIndex) => (
    rowIndex === index ? { ...row, [field]: cell.textContent.trim() } : row
  ));

  state = {
    ...state,
    flowRows: nextRows
  };

  saveState(state);
});

flowOutput.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-index]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.deleteIndex);
  state = {
    ...state,
    flowRows: state.flowRows.filter((_, rowIndex) => rowIndex !== index)
  };

  saveState(state);
  renderFlowRows(state.flowRows);
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchPanel(button.dataset.panel);
  });
});
