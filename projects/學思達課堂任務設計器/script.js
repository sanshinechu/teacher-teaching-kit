const STORAGE_KEY = "sharestartLessonDesigner";

const defaultData = {
  topic: "",
  grade: "",
  duration: "40",
  studentProfile: "",
  learningGoal: "",
  materials: "",
  generated: null
};

const form = document.querySelector("#lessonForm");
const resetButton = document.querySelector("#resetButton");
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

function getFormData() {
  const formData = new FormData(form);

  return {
    topic: formData.get("topic").trim(),
    grade: formData.get("grade").trim(),
    duration: formData.get("duration"),
    studentProfile: formData.get("studentProfile").trim(),
    learningGoal: formData.get("learningGoal").trim(),
    materials: formData.get("materials").trim()
  };
}

function fillForm(state) {
  Object.entries(state).forEach(([key, value]) => {
    const field = form.elements[key];

    if (field && typeof value === "string") {
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

function buildTasks(data) {
  const topic = safeText(data.topic, "本節課主題");
  const goal = safeText(data.learningGoal, "完成老師指定的學習目標");
  const materials = safeText(data.materials, "使用課堂提供的素材與工具");

  return [
    {
      level: "S1 基礎支持軌",
      className: "level-s1",
      focus: "讓需要鷹架的學生先完成核心步驟。",
      steps: [
        `依照教師示範或檢核表完成「${topic}」的基本任務。`,
        `說出或寫下自己完成了哪一個關鍵步驟：${goal}。`,
        `遇到卡關時，先看提示卡，再向同伴或老師提問。`
      ],
      evidence: "作品能正常執行，並能用一句話說明做法。"
    },
    {
      level: "S2 標準挑戰軌",
      className: "level-s2",
      focus: "讓多數學生能獨立完成目標並做出說明。",
      steps: [
        `依照任務需求完成「${topic}」的完整作品或解題流程。`,
        `在作品中加入一個自己的調整，並確認符合本節課目標。`,
        `和同學互測，記錄一個成功點與一個可改進處。`
      ],
      evidence: `作品符合「${goal}」，並能根據同學回饋修正。`
    },
    {
      level: "S3 進階創造軌",
      className: "level-s3",
      focus: "讓已經掌握概念的學生延伸應用與創造。",
      steps: [
        `在「${topic}」中加入加分條件、變化規則或新的應用情境。`,
        `設計一個能測試作品是否成功的挑戰題，給同學操作。`,
        `整理自己的設計理由，說明如何運用本節課概念。`
      ],
      evidence: `作品有清楚延伸，並能說明素材運用方式：${materials}。`
    }
  ];
}

function buildFlow(data) {
  const total = Number(data.duration) || 40;
  const topic = safeText(data.topic, "本節課主題");
  const grade = safeText(data.grade, "學生");
  const profile = safeText(data.studentProfile, "依照學生現場反應調整提示量");
  const goal = safeText(data.learningGoal, "完成本節課學習目標");
  const materials = safeText(data.materials, "課堂工具與學習素材");
  const times = total >= 80 ? [10, 15, 25, 20, 10] : [5, 8, 13, 9, 5];

  return [
    {
      title: "學：建立問題與自學方向",
      time: times[0],
      text: `${grade} 先看範例或短任務，圈出「${topic}」中自己看得懂與不確定的地方。教師提醒本節目標：${goal}。`
    },
    {
      title: "思：個人嘗試與策略整理",
      time: times[1],
      text: `學生獨立嘗試第一版任務，根據程度選擇 S1 / S2 / S3。教師觀察：${profile}。`
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
  const goal = safeText(data.learningGoal, "本節課目標");

  return [
    {
      label: "理解確認",
      question: `今天關於「${topic}」，我最確定自己學會的是什麼？`
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
  taskOutput.innerHTML = '<p class="empty-state">請先填寫課程資料，按下「產生三個設計」。</p>';
  flowOutput.innerHTML = '<li class="empty-state">尚未產生課堂流程。</li>';
  ticketOutput.innerHTML = '<p class="empty-state">尚未產生 Exit Ticket。</p>';
}

function renderGenerated(generated) {
  if (!generated) {
    renderEmpty();
    return;
  }

  taskOutput.innerHTML = generated.tasks
    .map((task) => `
      <section class="task-column ${task.className}">
        <h3>${escapeHtml(task.level)}</h3>
        <p>${escapeHtml(task.focus)}</p>
        <ul>
          ${task.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ul>
        <p><strong>完成證據：</strong>${escapeHtml(task.evidence)}</p>
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

function switchPanel(panelId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.panel === panelId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === panelId);
  });
}

let state = readState();
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
  renderEmpty();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchPanel(button.dataset.panel);
  });
});
