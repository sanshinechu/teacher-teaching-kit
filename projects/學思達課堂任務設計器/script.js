const STORAGE_KEY = "sharestartLessonWizard";

const defaultInput = {
  topic: "",
  grade: "",
  duration: "45",
  essentialQuestion: "",
  learningGoal: "",
  materials: "",
  classStatus: "安靜型",
  taskType: "閱讀理解",
  ticketLanguage: "中文",
  sentenceSupport: false,
  useGroupDiscussion: true,
  useExitTicket: true
};

const defaultState = {
  currentStep: 1,
  input: { ...defaultInput },
  tasks: [],
  flowRows: [],
  tickets: []
};

const stepTabs = document.querySelectorAll(".step-tab");
const panels = document.querySelectorAll(".wizard-panel");
const lessonForm = document.querySelector("#lessonForm");
const resetButton = document.querySelector("#resetButton");
const taskOutput = document.querySelector("#taskOutput");
const flowOutput = document.querySelector("#flowOutput");
const ticketOutput = document.querySelector("#ticketOutput");
const studentTicketOutput = document.querySelector("#studentTicketOutput");
const teacherOutput = document.querySelector("#teacherOutput");
const studentOutput = document.querySelector("#studentOutput");
const taskStatus = document.querySelector("#taskStatus");
const ticketStatus = document.querySelector("#ticketStatus");
const allCopyStatus = document.querySelector("#allCopyStatus");
const copyTasksButton = document.querySelector("#copyTasksButton");
const copyTicketButton = document.querySelector("#copyTicketButton");
const copyTeacherButton = document.querySelector("#copyTeacherButton");
const copyStudentButton = document.querySelector("#copyStudentButton");
const addFlowRowButton = document.querySelector("#addFlowRowButton");

function readState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...defaultState, input: { ...defaultInput } };
  }

  try {
    const parsed = JSON.parse(saved);

    return {
      ...defaultState,
      ...parsed,
      input: { ...defaultInput, ...parsed.input },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      flowRows: Array.isArray(parsed.flowRows) ? parsed.flowRows : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : []
    };
  } catch {
    return { ...defaultState, input: { ...defaultInput } };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeText(value, fallback) {
  return value || fallback;
}

function getFormInput() {
  const formData = new FormData(lessonForm);

  return {
    topic: formData.get("topic").trim(),
    grade: formData.get("grade").trim(),
    duration: formData.get("duration").trim() || defaultInput.duration,
    essentialQuestion: formData.get("essentialQuestion").trim(),
    learningGoal: formData.get("learningGoal").trim(),
    materials: formData.get("materials").trim(),
    classStatus: formData.get("classStatus"),
    taskType: formData.get("taskType"),
    ticketLanguage: formData.get("ticketLanguage"),
    sentenceSupport: formData.get("sentenceSupport") === "yes",
    useGroupDiscussion: formData.get("useGroupDiscussion") === "yes",
    useExitTicket: formData.get("useExitTicket") === "yes"
  };
}

function fillForm(input) {
  Object.entries(input).forEach(([key, value]) => {
    const field = lessonForm.elements[key];

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

function sentenceFrames(input, level) {
  if (!input.sentenceSupport) {
    return ["依任務需求使用中文、課文關鍵句或老師提供的提示完成回答。"];
  }

  const topic = safeText(input.topic, "the topic");
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

function buildTasks(input) {
  const topic = safeText(input.topic, "本節課主題");
  const grade = safeText(input.grade, "學生");
  const question = safeText(input.essentialQuestion, "本節核心問題");
  const goal = safeText(input.learningGoal, "完成本節課學習目標");
  const taskType = safeText(input.taskType, "學習任務");
  const materialHint = safeText(input.materials, "教材內容").slice(0, 90);

  return [
    {
      code: "S1",
      level: "S1 挑戰軌",
      className: "level-s1",
      taskName: `${topic} 進階推論與遷移任務`,
      description: `給程度較好的 ${grade} 學生。任務聚焦「${question}」，要求學生整合教材、提出理由、找證據，並連結生活或新情境。`,
      questions: [
        `根據教材內容，推論「${question}」的可能答案，至少提出 2 個理由。`,
        "找出教材中最能支持你想法的 2 個證據，並說明這些證據為什麼重要。",
        `把「${goal}」連結到自己的生活經驗，設計一個延伸討論問題。`
      ],
      sentenceFrames: sentenceFrames(input, "s1"),
      teacherReminder: `少給步驟，多追問「你怎麼知道？」與「還有沒有其他可能？」讓學生練習 ${taskType} 的高層次表達。`,
      extension: "把結論改寫成一段短講、海報重點或 3 題同儕挑戰題。"
    },
    {
      code: "S2",
      level: "S2 標準軌",
      className: "level-s2",
      taskName: `${topic} 關鍵理解與有依據回答任務`,
      description: `給中等程度學生。學習方向與 S1 相同，但提供關鍵字、句型提示與作答步驟，幫助學生完成「${goal}」。`,
      questions: [
        `圈出教材中和「${question}」有關的 3 個關鍵字。`,
        "依照「原因、證據、說明」三步驟，寫出或說出你的答案。",
        `完成一句總結：我認為這節課最重要的學習是「${goal}」，因為……`
      ],
      sentenceFrames: sentenceFrames(input, "s2"),
      teacherReminder: "先確認學生有找到正確線索，再要求完整表達。若學生卡住，可提供關鍵字或半句提示。",
      extension: "和同伴交換答案，互相補上一個更清楚的理由或例子。"
    },
    {
      code: "S3",
      level: "S3 支援軌",
      className: "level-s3",
      taskName: `${topic} 核心理解支援任務`,
      description: "給需要更多協助的學生。任務以理解、辨識、選擇、填空、配對為主，讓學生掌握核心內容，不放棄學習。",
      questions: [
        `從教材中找出和「${topic}」有關的 3 個單字或句子，並和中文意思配對。`,
        `選一選：「${question}」最可能的答案是哪一個？請從老師提供的選項中選出。`,
        "完成填空：我知道這篇內容主要在說 ______，因為我看到 ______。"
      ],
      sentenceFrames: sentenceFrames(input, "s3"),
      teacherReminder: `先讓學生找到明顯線索。可以把材料切小段，搭配中文提示、單字卡或選項：${materialHint}${materialHint.length >= 90 ? "..." : ""}`,
      extension: "完成後用一句話說出今天學到的重點，或選一張圖卡說明自己的答案。"
    }
  ];
}

function splitMinutes(total) {
  const ratios = [0.18, 0.16, 0.27, 0.22, 0.17];
  const minutes = ratios.map((ratio) => Math.max(4, Math.round(total * ratio)));
  minutes[4] += total - minutes.reduce((sum, minute) => sum + minute, 0);

  return minutes;
}

function classReminder(status) {
  const reminders = {
    "安靜型": "先給安靜思考時間，再邀請學生用短句或便利貼分享。",
    "活潑型": "先講清楚音量、時間與發言順序，用倒數計時收束活動。",
    "程度落差大": "先確認 S3 有可完成起點，再讓 S1 挑戰延伸問題。",
    "需要更多秩序提醒": "每階段開始前先說明任務、時間、完成標準與停止信號。"
  };

  return reminders[status] || reminders["安靜型"];
}

function buildFlowRows(input, tasks) {
  const total = Number(input.duration) || 45;
  const [selfStudy, think, discuss, express, summarize] = splitMinutes(total);
  const topic = safeText(input.topic, "本節課主題");
  const question = safeText(input.essentialQuestion, "本節核心問題");
  const goal = safeText(input.learningGoal, "本節課學習目標");
  const s1 = tasks.find((task) => task.code === "S1")?.taskName || "S1 挑戰任務";
  const s2 = tasks.find((task) => task.code === "S2")?.taskName || "S2 標準任務";
  const s3 = tasks.find((task) => task.code === "S3")?.taskName || "S3 支援任務";
  const discussionText = input.useGroupDiscussion ? "小組分享答案，互相補充與修正。" : "鄰座快速核對，再由老師帶全班確認。";
  const ticketText = input.useExitTicket ? "完成 Exit Ticket，寫下已懂、卡住與下一步。" : "完成一句課堂總結，說出今天最重要的學習。";

  return [
    {
      time: `${selfStudy} 分鐘`,
      phase: "自學",
      teacherTask: `提供「${topic}」教材與提示，說明核心問題：${question}`,
      studentTask: `依程度開始任務：S3 做基礎理解，S2 找關鍵字，S1 先找證據。`,
      tools: "教材短文、提示卡、投影片、計時器",
      reminder: `先讓學生自己試，不急著講解。${classReminder(input.classStatus)}`,
      differentiation: `S1：${s1}；S2：${s2}；S3：${s3}。`
    },
    {
      time: `${think} 分鐘`,
      phase: "思考",
      teacherTask: `要求學生個人作答，提醒回答要對準目標：${goal}`,
      studentTask: "個人整理答案、理由、證據，寫下仍不確定的地方。",
      tools: "學習單、筆記格、關鍵字提示",
      reminder: "給足安靜作答時間，先不要讓學生直接討論。",
      differentiation: "S1 寫完整理由與證據；S2 依步驟完成答案；S3 用填空、圈選或配對完成核心理解。"
    },
    {
      time: `${discuss} 分鐘`,
      phase: "討論",
      teacherTask: "巡迴聽討論，記下可全班分享的答案與常見迷思。",
      studentTask: discussionText,
      tools: "小白板、便利貼、分組任務卡、計時器",
      reminder: input.useGroupDiscussion ? "指定發言順序，要求每組至少補充一個理由。" : "討論時間短時，用快速核對避免失焦。",
      differentiation: "讓不同軌道學生先分享自己能完成的部分，再互相補上理由與證據。"
    },
    {
      time: `${express} 分鐘`,
      phase: "表達",
      teacherTask: "邀請學生或小組發表，追問理由、證據與不同想法。",
      studentTask: "向全班說明答案，回應追問，聆聽其他組補充。",
      tools: "投影、黑板、小白板、發表句型",
      reminder: "追問短而準，例如：你從哪裡看出來？還有不同想法嗎？",
      differentiation: "S1 發表完整推論，S2 補充證據，S3 用一句話或選項說明理解。"
    },
    {
      time: `${summarize} 分鐘`,
      phase: "統整",
      teacherTask: "整理重點、補充概念，回扣核心問題並連結下一次課程。",
      studentTask: ticketText,
      tools: input.useExitTicket ? "Exit Ticket、Google Classroom、便利貼" : "黑板整理、口頭回饋、學習單",
      reminder: "收尾要回扣核心問題與學習目標，不只公布答案。",
      differentiation: "Exit Ticket 可提供完整句、句型填空、圈選加短答三種作答方式。"
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

function buildTickets(input) {
  const topic = safeText(input.topic, "今天的課程");
  const goal = safeText(input.learningGoal, "今天的學習目標");
  const question = safeText(input.essentialQuestion, "今天的核心問題");
  const language = input.ticketLanguage;

  return [
    {
      label: "學習理解",
      question: makeQuestion(language, `今天關於「${topic}」，我學會了什麼？`, `What did I learn about "${topic}" today?`)
    },
    {
      label: "核心問題",
      question: makeQuestion(language, `我會怎麼回答核心問題：「${question}」？`, `How would I answer the essential question: "${question}"?`)
    },
    {
      label: "重點句型",
      question: makeQuestion(language, `請用一句話寫出今天的重點，對應學習目標：「${goal}」。`, `Write one sentence to show today's learning goal: "${goal}".`)
    },
    {
      label: "困難回報",
      question: makeQuestion(language, "我還不太懂的是什麼？我需要哪一種幫助？", "What do I still not understand? What kind of help do I need?")
    },
    {
      label: "自我評分",
      question: makeQuestion(language, "我給自己今天的學習表現幾分？為什麼？", "What score would I give my learning performance today? Why?")
    }
  ];
}

function generateAll(input) {
  const tasks = buildTasks(input);

  return {
    input,
    tasks,
    flowRows: buildFlowRows(input, tasks),
    tickets: buildTickets(input)
  };
}

function switchStep(step) {
  state.currentStep = step;
  stepTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.step === String(step)));
  panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.stepPanel === String(step)));
  saveState();
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskOutput.innerHTML = '<p class="empty-state">請先在 Step 1 填寫課程基本資料，產生完整課程設計。</p>';
    copyTasksButton.disabled = true;
    return;
  }

  copyTasksButton.disabled = false;
  taskOutput.innerHTML = tasks.map((task) => `
    <section class="task-card ${task.className}">
      <h3>${escapeHtml(task.level)}</h3>
      <strong>任務名稱</strong>
      <p class="task-name">${escapeHtml(task.taskName)}</p>
      <strong>任務說明</strong>
      <p>${escapeHtml(task.description)}</p>
      <strong>學生要完成的題目</strong>
      <ul>${task.questions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <strong>可使用的句型</strong>
      <ul>${task.sentenceFrames.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p><strong>教師提醒：</strong>${escapeHtml(task.teacherReminder)}</p>
      <p><strong>延伸任務：</strong>${escapeHtml(task.extension)}</p>
    </section>
  `).join("");
}

function renderFlow(rows) {
  if (!rows.length) {
    flowOutput.innerHTML = '<tr><td class="empty-table" colspan="8">請先在 Step 1 產生課堂流程。</td></tr>';
    return;
  }

  flowOutput.innerHTML = rows.map((row, index) => `
    <tr>
      <td contenteditable="true" data-index="${index}" data-field="time">${escapeHtml(row.time)}</td>
      <td contenteditable="true" data-index="${index}" data-field="phase">${escapeHtml(row.phase)}</td>
      <td contenteditable="true" data-index="${index}" data-field="teacherTask">${escapeHtml(row.teacherTask)}</td>
      <td contenteditable="true" data-index="${index}" data-field="studentTask">${escapeHtml(row.studentTask)}</td>
      <td contenteditable="true" data-index="${index}" data-field="tools">${escapeHtml(row.tools)}</td>
      <td contenteditable="true" data-index="${index}" data-field="reminder">${escapeHtml(row.reminder)}</td>
      <td contenteditable="true" data-index="${index}" data-field="differentiation">${escapeHtml(row.differentiation)}</td>
      <td><button class="delete-row-button" type="button" data-delete-index="${index}">刪除</button></td>
    </tr>
  `).join("");
}

function renderTickets(tickets) {
  if (!tickets.length) {
    ticketOutput.innerHTML = '<p class="empty-state">請先在 Step 1 產生 Exit Ticket。</p>';
    studentTicketOutput.innerHTML = '<p class="empty-state">尚未產生學生填寫版。</p>';
    copyTicketButton.disabled = true;
    return;
  }

  copyTicketButton.disabled = false;
  ticketOutput.innerHTML = tickets.map((ticket, index) => `
    <section class="ticket-item">
      <strong>第 ${index + 1} 題｜${escapeHtml(ticket.label)}</strong>
      <p>${escapeHtml(ticket.question).replaceAll("\n", "<br>")}</p>
    </section>
  `).join("");

  studentTicketOutput.innerHTML = `
    <div class="student-ticket-meta">
      <span>主題：${escapeHtml(safeText(state.input.topic, "今日課程"))}</span>
      <span>姓名：__________</span>
      <span>日期：__________</span>
    </div>
    <ol class="student-ticket-list">
      ${tickets.map((ticket) => `
        <li>
          <p>${escapeHtml(ticket.question).replaceAll("\n", "<br>")}</p>
          <div class="answer-line"></div>
        </li>
      `).join("")}
    </ol>
  `;
}

function tasksToText(tasks) {
  return tasks.map((task) => [
    task.level,
    `任務名稱：${task.taskName}`,
    `任務說明：${task.description}`,
    "學生要完成的題目：",
    ...task.questions.map((item, index) => `${index + 1}. ${item}`),
    "可使用的句型：",
    ...task.sentenceFrames.map((item) => `- ${item}`),
    `教師提醒：${task.teacherReminder}`,
    `延伸任務：${task.extension}`
  ].join("\n")).join("\n\n");
}

function flowToText(rows, teacherMode = true) {
  return rows.map((row, index) => {
    const base = teacherMode
      ? [
        `${index + 1}. ${row.time}｜${row.phase}`,
        `教師任務：${row.teacherTask}`,
        `學生任務：${row.studentTask}`,
        `可使用工具：${row.tools}`,
        `教師提醒語：${row.reminder}`,
        `差異化提醒：${row.differentiation}`
      ]
      : [
        `${index + 1}. ${row.time}｜${row.phase}`,
        `我要做的事：${row.studentTask}`
      ];

    return base.join("\n");
  }).join("\n\n");
}

function ticketsToText(tickets) {
  return tickets.map((ticket, index) => `${index + 1}. ${ticket.question}`).join("\n");
}

function buildTeacherVersion() {
  return [
    "教師備課版",
    `課程主題：${safeText(state.input.topic, "未填寫")}`,
    `年級：${safeText(state.input.grade, "未填寫")}`,
    `課程時間：${safeText(state.input.duration, "45")} 分鐘`,
    `核心問題：${safeText(state.input.essentialQuestion, "未填寫")}`,
    `學習目標：${safeText(state.input.learningGoal, "未填寫")}`,
    `教材內容：${safeText(state.input.materials, "未填寫")}`,
    "",
    "一、三軌任務",
    tasksToText(state.tasks),
    "",
    "二、學思達五環課堂流程",
    flowToText(state.flowRows, true),
    "",
    "三、Exit Ticket",
    ticketsToText(state.tickets)
  ].join("\n");
}

function buildStudentVersion() {
  return [
    "學生講義版",
    `主題：${safeText(state.input.topic, "今日課程")}`,
    `核心問題：${safeText(state.input.essentialQuestion, "今日核心問題")}`,
    "",
    "一、我的任務",
    state.tasks.map((task) => [
      task.level,
      task.questions.map((item, index) => `${index + 1}. ${item}`).join("\n")
    ].join("\n")).join("\n\n"),
    "",
    "二、課堂流程重點",
    flowToText(state.flowRows, false),
    "",
    "三、Exit Ticket",
    ticketsToText(state.tickets)
  ].join("\n");
}

function renderCopies() {
  teacherOutput.textContent = state.tasks.length ? buildTeacherVersion() : "請先完成 Step 1。";
  studentOutput.textContent = state.tasks.length ? buildStudentVersion() : "請先完成 Step 1。";
}

function renderAll() {
  fillForm(state.input);
  renderTasks(state.tasks);
  renderFlow(state.flowRows);
  renderTickets(state.tickets);
  renderCopies();
  switchStep(state.currentStep);
}

async function copyText(text, statusElement, successMessage) {
  if (!text || text.includes("請先完成 Step 1")) {
    statusElement.textContent = "尚未產生內容。";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  statusElement.textContent = successMessage;
}

let state = readState();
renderAll();

lessonForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = getFormInput();
  const generated = generateAll(input);
  state = {
    ...state,
    ...generated,
    currentStep: 2
  };

  saveState();
  renderAll();
});

lessonForm.addEventListener("input", () => {
  state.input = getFormInput();
  saveState();
});

resetButton.addEventListener("click", () => {
  state = { ...defaultState, input: { ...defaultInput } };
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
});

stepTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchStep(Number(tab.dataset.step));
  });
});

document.querySelectorAll(".next-button").forEach((button) => {
  button.addEventListener("click", () => {
    switchStep(Number(button.dataset.nextStep));
  });
});

flowOutput.addEventListener("input", (event) => {
  const cell = event.target.closest("[data-index][data-field]");

  if (!cell) {
    return;
  }

  const index = Number(cell.dataset.index);
  const field = cell.dataset.field;
  state.flowRows = state.flowRows.map((row, rowIndex) => (
    rowIndex === index ? { ...row, [field]: cell.textContent.trim() } : row
  ));

  saveState();
  renderCopies();
});

flowOutput.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-index]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.deleteIndex);
  state.flowRows = state.flowRows.filter((_, rowIndex) => rowIndex !== index);
  saveState();
  renderFlow(state.flowRows);
  renderCopies();
});

addFlowRowButton.addEventListener("click", () => {
  state.flowRows = [
    ...state.flowRows,
    {
      time: "5 分鐘",
      phase: "自訂",
      teacherTask: "請輸入教師任務",
      studentTask: "請輸入學生任務",
      tools: "請輸入可使用工具",
      reminder: "請輸入教師提醒語",
      differentiation: "請輸入差異化提醒"
    }
  ];

  saveState();
  renderFlow(state.flowRows);
  renderCopies();
});

copyTasksButton.addEventListener("click", () => {
  copyText(tasksToText(state.tasks), taskStatus, "已複製三軌任務。");
});

copyTicketButton.addEventListener("click", () => {
  copyText(ticketsToText(state.tickets), ticketStatus, "已複製 Exit Ticket。");
});

copyTeacherButton.addEventListener("click", () => {
  copyText(teacherOutput.textContent, allCopyStatus, "已複製教師備課版。");
});

copyStudentButton.addEventListener("click", () => {
  copyText(studentOutput.textContent, allCopyStatus, "已複製學生講義版。");
});
