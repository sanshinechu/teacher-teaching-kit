/**
 * 羅東國小｜115 電腦課神隊友
 * 4 排 × 8 格（共 29 台主機：第 1~3 排從右至左 1~24，第 4 排 空、空、28、27、26、25、29、空）
 */

const STORAGE_KEY = "lotes_computer_class_teammate_v1";
const GAS_URL_KEY = "lotes_computer_class_gas_url_v1";

// 教室 4 排座位配置（電腦老師站講台前視圖：由上而下為第 4 排 → 第 1 排）
const CLASSROOM_ROWS_TEACHER_VIEW = [
  {
    rowNumber: 4,
    label: "第 4 排",
    subLabel: "25~29號",
    slots: [null, null, 28, 27, 26, 25, 29, null]
  },
  {
    rowNumber: 3,
    label: "第 3 排",
    subLabel: "17~24號",
    slots: [24, 23, 22, 21, 20, 19, 18, 17]
  },
  {
    rowNumber: 2,
    label: "第 2 排",
    subLabel: "9~16號",
    slots: [16, 15, 14, 13, 12, 11, 10, 9]
  },
  {
    rowNumber: 1,
    label: "第 1 排",
    subLabel: "1~8號",
    slots: [8, 7, 6, 5, 4, 3, 2, 1]
  }
];

const ALL_PC_NUMBERS = Array.from({ length: 29 }, (_, idx) => idx + 1);

// 底部 20 項核心科技能力清單
const TECH_COMPETENCIES = [
  { id: "typing", icon: "⌨️", name: "中英輸入" },
  { id: "doc", icon: "📄", name: "文書排版" },
  { id: "files", icon: "📁", name: "檔案管理" },
  { id: "sheet", icon: "📊", name: "試算表" },
  { id: "login", icon: "🔑", name: "帳號登入" },
  { id: "submit", icon: "📤", name: "交作業" },
  { id: "cloud", icon: "☁️", name: "雲端共作" },
  { id: "scratch", icon: "🐱", name: "Scratch" },
  { id: "email", icon: "✉️", name: "電子郵件" },
  { id: "draw2d", icon: "🎨", name: "2D繪圖" },
  { id: "slides", icon: "🖥️", name: "簡報製作" },
  { id: "video", icon: "🎬", name: "影片剪輯" },
  { id: "laser", icon: "⚡", name: "雷射雕刻" },
  { id: "draw3d", icon: "🧊", name: "3D繪圖" },
  { id: "print3d", icon: "🖨️", name: "3D列印" },
  { id: "hardware", icon: "🤖", name: "開放硬體" },
  { id: "ai_app", icon: "✨", name: "AI應用" },
  { id: "search", icon: "🔍", name: "搜尋整理" },
  { id: "ai_lit", icon: "🧠", name: "AI素養" },
  { id: "mindmap", icon: "🗺️", name: "心智圖" }
];

const PERIOD_TIME_MAP = {
  1: { label: "第1節", time: "08:40~09:20", startMin: 8 * 60 + 40, endMin: 9 * 60 + 25 },
  2: { label: "第2節", time: "09:30~10:10", startMin: 9 * 60 + 26, endMin: 10 * 60 + 15 },
  3: { label: "第3節", time: "10:30~11:10", startMin: 10 * 60 + 20, endMin: 11 * 60 + 15 },
  4: { label: "第4節", time: "11:20~12:00", startMin: 11 * 60 + 16, endMin: 12 * 60 + 5 },
  5: { label: "第5節", time: "13:20~14:00", startMin: 13 * 60 + 15, endMin: 14 * 60 + 5 },
  6: { label: "第6節", time: "14:10~14:50", startMin: 14 * 60 + 6, endMin: 14 * 60 + 55 },
  7: { label: "第7節", time: "15:00~15:40", startMin: 14 * 60 + 56, endMin: 15 * 60 + 50 }
};

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const AVATAR_POOL = ["👦", "👧", "🧒", "🧑‍💻", "👩‍💻", "👨‍🎨", "👩‍🚀", "🦊", "🐼", "🐯"];

// 產生預設學生名單（方便開箱測試，老師可隨時用「班級名單」一鍵覆蓋）
const SURNAMES = ["林", "陳", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊", "許", "鄭", "謝", "郭", "洪", "邱", "曾", "廖", "賴", "徐", "周", "葉", "蘇", "莊", "呂", "江", "何", "蕭"];
const GIVEN_NAMES = ["宥廷", "品妍", "宇軒", "子晴", "柏翰", "詠晴", "宥希", "子軒", "語彤", "承恩", "采潔", "品睿", "羽彤", "少祺", "心瑜", "定謙", "芸希", "群翔", "晴安", "哲瑋", "思妤", "彥廷", "詩涵", "冠宇", "芷瑜", "家豪", "雅婷", "冠廷"];

function buildSampleSeats(classSeed, studentCount = 26) {
  const seats = {};
  for (let pc = 1; pc <= 29; pc++) {
    if (pc <= studentCount) {
      const sIdx = (pc + classSeed * 3) % SURNAMES.length;
      const gIdx = (pc * 2 + classSeed) % GIVEN_NAMES.length;
      const seatNo = String(pc).padStart(2, "0");
      seats[pc] = {
        seatNo,
        name: `${SURNAMES[sIdx]}${GIVEN_NAMES[gIdx]}`,
        avatar: AVATAR_POOL[(pc + classSeed) % AVATAR_POOL.length],
        done: false,
        stars: 0,
        help: false,
        absent: false
      };
    } else {
      seats[pc] = null; // 空席
    }
  }
  return seats;
}

function createDefaultState() {
  return {
    activeClassId: "502",
    sortBy: "grade", // 'grade' | 'schedule'
    projectionMode: false,
    pcRepairs: {}, // { "12": { tags: ["耳機"], reason: "耳機左耳無聲", updatedAt: "2026-11-09 14:20" } }
    classes: [
      {
        id: "501",
        code: "501",
        grade: 5,
        day: 1,
        period: 5,
        todayProgress: "Scratch 多幕故事切換與廣播訊息互動",
        nextProgress: "Scratch 動畫配音錄製與角色對嘴",
        memo: "提醒第 3 排同學下課前確認作品已儲存至雲端。",
        competencies: ["typing", "login", "submit", "cloud", "scratch", "ai_lit"],
        history: [
          { date: "2026-11-09", text: "Scratch 多幕故事切換與廣播訊息互動" },
          { date: "2026-11-02", text: "Scratch 角色移動、造型切換與對話氣泡" },
          { date: "2026-10-26", text: "放假（校慶補假）" },
          { date: "2026-10-19", text: "Scratch 舞台座標系統與角色定位" },
          { date: "2026-10-12", text: "Google Classroom 登入與交作業演練" }
        ],
        seats: buildSampleSeats(1, 26)
      },
      {
        id: "502",
        code: "502",
        grade: 5,
        day: 1,
        period: 7,
        todayProgress: "Scratch 廣播訊息互動與南門河繪本賞析",
        nextProgress: "Scratch 動畫專題分鏡腳本設計與配音",
        memo: "提醒學生整合架構與輸出格式，準備交作業。",
        competencies: ["typing", "doc", "login", "submit", "cloud", "scratch", "ai_app", "mindmap"],
        history: [
          { date: "2026-11-09", text: "Scratch 廣播訊息互動與南門河繪本賞析" },
          { date: "2026-11-02", text: "Scratch 多幕背景切換與事件觸發" },
          { date: "2026-10-26", text: "放假" },
          { date: "2026-10-19", text: "角色移動與座標定位練習" },
          { date: "2026-10-12", text: "Scratch 3 介面三大區塊認識" },
          { date: "2026-10-05", text: "數位素養：轉發分享行不行" },
          { date: "2026-09-28", text: "數位素養：創用 CC 創意無限" }
        ],
        seats: buildSampleSeats(2, 25)
      },
      {
        id: "503",
        code: "503",
        grade: 5,
        day: 2,
        period: 3,
        todayProgress: "Scratch 多幕故事切換與廣播訊息互動",
        nextProgress: "Scratch 動畫配音錄製與角色對嘴",
        memo: "本班實作速度快，可補充進階音效剪輯。",
        competencies: ["typing", "login", "submit", "cloud", "scratch", "mindmap"],
        history: [
          { date: "2026-11-03", text: "Scratch 多幕故事切換與廣播訊息互動" },
          { date: "2026-10-27", text: "Scratch 角色移動與對話氣泡" }
        ],
        seats: buildSampleSeats(3, 27)
      },
      {
        id: "504",
        code: "504",
        grade: 5,
        day: 3,
        period: 2,
        todayProgress: "Scratch 角色移動、造型切換與對話氣泡",
        nextProgress: "Scratch 多幕故事切換與廣播訊息互動",
        memo: "上次週三公假少一節，需留意進度追趕。",
        competencies: ["typing", "login", "submit", "scratch"],
        history: [
          { date: "2026-11-04", text: "Scratch 角色移動、造型切換與對話氣泡" },
          { date: "2026-10-28", text: "Scratch 舞台座標與方向控制" }
        ],
        seats: buildSampleSeats(4, 26)
      },
      {
        id: "601",
        code: "601",
        grade: 6,
        day: 2,
        period: 2,
        todayProgress: "Scratch 遊戲專題：變數計分器與分身碰撞偵測",
        nextProgress: "Scratch 遊戲專題：倒數計時器與過關畫面",
        memo: "提醒未交期中遊戲草稿的 3 位同學補交至 Classroom。",
        competencies: ["typing", "doc", "files", "login", "submit", "cloud", "scratch", "slides", "ai_app", "ai_lit", "mindmap"],
        history: [
          { date: "2026-11-03", text: "Scratch 遊戲專題：變數計分器與分身碰撞偵測" },
          { date: "2026-10-27", text: "Scratch 鍵盤方向鍵流暢控制角色技巧" },
          { date: "2026-10-20", text: "遊戲企劃與心智圖發散思考" }
        ],
        seats: buildSampleSeats(6, 27)
      },
      {
        id: "602",
        code: "602",
        grade: 6,
        day: 5,
        period: 3,
        todayProgress: "Scratch 遊戲專題：變數計分器與分身碰撞偵測",
        nextProgress: "Scratch 遊戲專題：BOSS 關卡血量條設計",
        memo: "小組互評表已開放在 Google Classroom。",
        competencies: ["typing", "doc", "files", "login", "submit", "cloud", "scratch", "slides", "ai_app", "ai_lit"],
        history: [
          { date: "2026-11-06", text: "Scratch 遊戲專題：變數計分器與分身碰撞偵測" },
          { date: "2026-10-30", text: "Scratch 碰撞偵測與反彈角度" }
        ],
        seats: buildSampleSeats(7, 26)
      },
      {
        id: "603",
        code: "603",
        grade: 6,
        day: 4,
        period: 6,
        todayProgress: "Scratch 遊戲專題：分身射擊與敵機生成邏輯",
        nextProgress: "Scratch 遊戲專題：音效回饋與過關條件",
        memo: "準備挑選期末資訊科技競賽代表作品。",
        competencies: ["typing", "doc", "files", "login", "submit", "cloud", "scratch", "ai_app", "ai_lit"],
        history: [
          { date: "2026-11-05", text: "Scratch 遊戲專題：分身射擊與敵機生成邏輯" }
        ],
        seats: buildSampleSeats(8, 28)
      },
      {
        id: "club_ai",
        code: "AI應用社",
        grade: 7,
        day: 2,
        period: 5,
        todayProgress: "Scratch 結合 AI 影像辨識與體感姿勢控制實作",
        nextProgress: "AI 語音辨識互動小遊戲整合展示",
        memo: "社團課需使用視訊鏡頭與耳機麥克風。",
        competencies: ["login", "submit", "cloud", "scratch", "video", "ai_app", "ai_lit", "mindmap"],
        history: [
          { date: "2026-11-03", text: "Scratch 結合 AI 影像辨識與體感姿勢控制實作" },
          { date: "2026-10-27", text: "Teachable Machine 機器學習模型訓練概念" }
        ],
        seats: buildSampleSeats(9, 24)
      }
    ]
  };
}

let appState = loadAppState();
let clickSwapMode = false;
let firstSelectedPcForSwap = null;
let dragSourcePc = null;
let currentLotteryPc = null;
let selectedFaultTags = new Set();

// 計時器狀態
let timerRemainingSec = 0;
let timerIntervalId = null;

// ==================== 資料存取與雲端同步 ====================
function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.classes) || parsed.classes.length === 0) {
      return createDefaultState();
    }
    return parsed;
  } catch (err) {
    console.warn("讀取本機快取失敗，使用預設資料：", err);
    return createDefaultState();
  }
}

let cloudSyncDebounceTimer = null;

function saveAppState(triggerCloud = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const timeStr = formatTimeHMS(new Date());
    const gasUrl = localStorage.getItem(GAS_URL_KEY) || "";

    const statusTextEl = document.getElementById("syncStatusText");
    if (statusTextEl) {
      if (gasUrl) {
        statusTextEl.textContent = `已儲存本機，正在同步至試算表... (${timeStr})`;
      } else {
        statusTextEl.textContent = `已自動寫入本機 (${timeStr})`;
      }
    }

    if (triggerCloud && gasUrl) {
      clearTimeout(cloudSyncDebounceTimer);
      cloudSyncDebounceTimer = setTimeout(() => {
        pushStateToGas(gasUrl);
      }, 900);
    }
  } catch (err) {
    console.error("儲存失敗：", err);
  }
}

async function pushStateToGas(gasUrl) {
  const statusTextEl = document.getElementById("syncStatusText");
  try {
    await fetch(gasUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAll",
        updatedAt: new Date().toISOString(),
        payload: appState
      })
    });
    const timeStr = formatTimeHMS(new Date());
    if (statusTextEl) {
      statusTextEl.textContent = `已自動寫入試算表 (${timeStr})`;
    }
  } catch (err) {
    if (statusTextEl) {
      statusTextEl.textContent = `本機已存，試算表連線失敗 (${formatTimeHMS(new Date())})`;
    }
  }
}

async function pullStateFromGas() {
  const gasUrl = (localStorage.getItem(GAS_URL_KEY) || "").trim();
  if (!gasUrl) {
    alert("請先輸入 Google Apps Script 網頁應用程式網址！");
    return;
  }
  try {
    const resp = await fetch(`${gasUrl}?action=loadAll`);
    const data = await resp.json();
    if (data && data.payload && Array.isArray(data.payload.classes)) {
      appState = data.payload;
      saveAppState(false);
      renderAll();
      alert("✅ 已成功從 Google 試算表載入最新資料！");
    } else {
      alert("⚠️ 試算表目前尚無存檔資料，將以本機資料為主。");
    }
  } catch (err) {
    alert("讀取試算表失敗，請確認網址權限設定為「所有人皆可存取」。");
  }
}

// ==================== 日期與輔助函式 ====================
function getTaipeiNow() {
  return new Date();
}

function formatTimeHMS(dateObj) {
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const mm = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatDateISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderTopDate() {
  const now = getTaipeiNow();
  const rocYear = now.getFullYear() - 1911;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const w = WEEKDAY_NAMES[now.getDay()];
  const datePill = document.getElementById("todayDatePill");
  if (datePill) {
    datePill.textContent = `民國${rocYear}年${m}月${d}日 星期${w}`;
  }
}

function getActiveClass() {
  let cls = appState.classes.find((c) => c.id === appState.activeClassId);
  if (!cls && appState.classes.length > 0) {
    cls = appState.classes[0];
    appState.activeClassId = cls.id;
  }
  return cls;
}

// ==================== 頂部班級切換列 ====================
function renderClassTabs() {
  const container = document.getElementById("classTabsContainer");
  const sortBtn = document.getElementById("sortModeBtn");
  if (!container) return;

  const todayWeekday = getTaipeiNow().getDay(); // 1~5
  sortBtn.textContent = appState.sortBy === "grade" ? "🏠 依年級" : "📅 依課表";

  const sortedClasses = [...appState.classes].sort((a, b) => {
    if (appState.sortBy === "schedule") {
      if (a.day !== b.day) return a.day - b.day;
      return a.period - b.period;
    }
    if (a.grade !== b.grade) return a.grade - b.grade;
    return String(a.code).localeCompare(String(b.code), "zh-Hant");
  });

  container.innerHTML = "";
  sortedClasses.forEach((cls) => {
    const isToday = cls.day === todayWeekday;
    const isActive = cls.id === appState.activeClassId;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `class-tab-btn${isToday ? " is-today" : ""}${isActive ? " active" : ""}`;

    const slotLabel = `${WEEKDAY_NAMES[cls.day]}-${cls.period}`;
    btn.innerHTML = `
      <span class="slot-prefix">${slotLabel}</span>
      <span>${cls.code}</span>
      ${isToday ? '<span class="today-pill">今日</span>' : ""}
    `;
    btn.addEventListener("click", () => {
      appState.activeClassId = cls.id;
      firstSelectedPcForSwap = null;
      saveAppState(false);
      renderAll();
    });
    container.appendChild(btn);
  });
}

// 依目前時間自動定位正在上課（或今天最近一節）的班級
function autoLocateCurrentClass() {
  const now = getTaipeiNow();
  const weekday = now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const todayClasses = appState.classes
    .filter((c) => c.day === weekday)
    .sort((a, b) => a.period - b.period);

  if (todayClasses.length === 0) {
    alert(`今天（星期${WEEKDAY_NAMES[weekday]}）課表中沒有設定班級喔！`);
    return;
  }

  let matched = todayClasses.find((c) => {
    const p = PERIOD_TIME_MAP[c.period];
    return p && currentMin >= p.startMin && currentMin <= p.endMin;
  });

  if (!matched) {
    matched = todayClasses[0];
  }

  appState.activeClassId = matched.id;
  saveAppState(false);
  renderAll();
}

// ==================== 座位網格渲染（4 排 × 8 格，共 29 台） ====================
function renderClassroomGrid() {
  const container = document.getElementById("classroomRowsContainer");
  const topPodium = document.getElementById("topPodiumBanner");
  const bottomPodium = document.getElementById("bottomPodiumBanner");
  const flipBtn = document.getElementById("projectionViewBtn");
  const appShell = document.getElementById("appShell");

  if (!container) return;
  const activeClass = getActiveClass();
  if (!activeClass) return;

  // 切換學生投影視角（180度翻轉）
  const isStudentView = Boolean(appState.projectionMode);
  appShell.classList.toggle("projection-mode", isStudentView);
  topPodium.classList.toggle("hidden", !isStudentView);
  bottomPodium.classList.toggle("hidden", isStudentView);
  flipBtn.classList.toggle("active", isStudentView);
  flipBtn.textContent = isStudentView ? "👁️ 學生投影視角（點擊切回老師視角）" : "👁️ 切換學生投影視角";

  const rowsToRender = isStudentView
    ? [...CLASSROOM_ROWS_TEACHER_VIEW].reverse().map((r) => ({
        ...r,
        slots: [...r.slots].reverse()
      }))
    : CLASSROOM_ROWS_TEACHER_VIEW;

  container.innerHTML = "";

  rowsToRender.forEach((rowDef) => {
    const rowWrapper = document.createElement("div");
    rowWrapper.className = "seat-row-wrapper";

    const sideBadge = document.createElement("div");
    sideBadge.className = "row-side-badge";
    sideBadge.innerHTML = `<span>${rowDef.label}</span><small>${rowDef.subLabel}</small>`;
    rowWrapper.appendChild(sideBadge);

    const rowGrid = document.createElement("div");
    rowGrid.className = "row-seats-grid";

    rowDef.slots.forEach((pcNum) => {
      if (pcNum === null) {
        // 第 4 排的空位格（無主機空間）
        const voidSlot = document.createElement("div");
        voidSlot.className = "seat-slot-void";
        voidSlot.innerHTML = `<span>🌿 空位</span><small>巡堂 / 走道空間</small>`;
        rowGrid.appendChild(voidSlot);
        return;
      }

      const pcKey = String(pcNum);
      const pcLabel = `PC-${String(pcNum).padStart(2, "0")}`;
      const student = activeClass.seats[pcKey] || null;
      const faultInfo = appState.pcRepairs[pcKey] || null;

      const card = document.createElement("div");
      card.className = "seat-card";
      card.dataset.pc = pcKey;
      card.draggable = true;

      if (!student) card.classList.add("empty-student");
      if (student?.done) card.classList.add("status-done");
      if (student?.help) card.classList.add("status-help");
      if (student?.absent) card.classList.add("status-absent");
      if (faultInfo) card.classList.add("pc-fault");
      if (firstSelectedPcForSwap === pcKey) card.classList.add("swap-selected");

      // 頂部：座號 + 機台編號
      const topHtml = `
        <div class="seat-card-top">
          <span class="student-no-tag">${student ? `${student.seatNo}號` : "空席"}</span>
          <span class="pc-id-badge">${pcLabel}</span>
        </div>
      `;

      // 若機台故障，顯示故障橫幅與「移空席」按鈕
      let faultBannerHtml = "";
      if (faultInfo) {
        const faultText = faultInfo.reason || (faultInfo.tags || []).join("、") || "設備報修中";
        faultBannerHtml = `
          <div class="pc-fault-banner" title="故障原因：${escapeHtml(faultText)}">
            <span>🛠️ ${escapeHtml(faultText.slice(0, 6))}</span>
            ${student ? `<button type="button" class="evacuate-seat-btn" data-evacuate="${pcKey}" title="將此學生臨時移至正常空席">移空席</button>` : ""}
          </div>
        `;
      }

      // 中段：學生頭像與姓名（或空席提示）
      const bodyHtml = student
        ? `
          <div class="seat-card-body">
            <div class="student-avatar">${student.avatar || "🧑‍💻"}</div>
            <div class="student-name" title="${escapeHtml(student.name)}">${escapeHtml(student.name)}</div>
          </div>
        `
        : `
          <div class="seat-card-body">
            <div class="empty-seat-label">🪑 空席（點擊新增）</div>
          </div>
        `;

      // 底部：微型課堂互動燈號（完成、加分、待協助、請假）
      const footerHtml = student
        ? `
          <div class="seat-card-footer">
            <button type="button" class="seat-mini-btn ${student.done ? "active-done" : ""}" data-act="done" data-pc="${pcKey}" title="標記今日作業完成">
              ✓${student.done ? "完成" : ""}
            </button>
            <button type="button" class="seat-mini-btn ${student.stars > 0 ? "active-star" : ""}" data-act="star" data-pc="${pcKey}" title="左鍵加分，Shift+左鍵扣分">
              ⭐${student.stars || 0}
            </button>
            <button type="button" class="seat-mini-btn ${student.help ? "active-help" : ""}" data-act="help" data-pc="${pcKey}" title="標記需要老師協助">
              🙋
            </button>
            <button type="button" class="seat-mini-btn ${student.absent ? "active-absent" : ""}" data-act="absent" data-pc="${pcKey}" title="標記今日請假（抽籤自動略過）">
              😷
            </button>
          </div>
        `
        : `
          <div class="seat-card-footer">
            <button type="button" class="seat-mini-btn" data-act="edit-seat" data-pc="${pcKey}">＋安排學生</button>
            <button type="button" class="seat-mini-btn" data-act="pick-repair" data-pc="${pcKey}">🛠️報修</button>
          </div>
        `;

      card.innerHTML = topHtml + faultBannerHtml + bodyHtml + footerHtml;

      // 綁定卡片拖曳換位與點擊事件
      bindSeatCardEvents(card, pcKey);

      rowGrid.appendChild(card);
    });

    rowWrapper.appendChild(rowGrid);
    container.appendChild(rowWrapper);
  });

  updateLiveClassStats();
}

function bindSeatCardEvents(card, pcKey) {
  // 1. 微型互動按鈕點擊
  card.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      handleSeatMiniAction(pcKey, act, e.shiftKey);
    });
  });

  // 2. 故障機台「一鍵移至空席」
  const evacuateBtn = card.querySelector("button[data-evacuate]");
  if (evacuateBtn) {
    evacuateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      evacuateStudentToEmptyPc(pcKey);
    });
  }

  // 3. 點擊卡片（點選換位模式 vs 連動右側報修選單與編輯姓名）
  card.addEventListener("click", () => {
    if (clickSwapMode) {
      if (!firstSelectedPcForSwap) {
        firstSelectedPcForSwap = pcKey;
        renderClassroomGrid();
      } else if (firstSelectedPcForSwap === pcKey) {
        firstSelectedPcForSwap = null;
        renderClassroomGrid();
      } else {
        swapTwoSeats(firstSelectedPcForSwap, pcKey);
        firstSelectedPcForSwap = null;
        renderAll();
      }
      return;
    }

    // 同步右側報修機台下拉選單
    const repairSelect = document.getElementById("repairPcSelect");
    if (repairSelect) {
      repairSelect.value = pcKey;
      updateSelectedPcRepairUI();
    }
  });

  // 雙擊卡片可快速修改該座位學生姓名與座號
  card.addEventListener("dblclick", () => {
    promptEditSingleSeat(pcKey);
  });

  // 4. HTML5 拖曳換位
  card.addEventListener("dragstart", (e) => {
    dragSourcePc = pcKey;
    e.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    card.classList.add("drag-over");
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("drag-over");
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    if (dragSourcePc && dragSourcePc !== pcKey) {
      swapTwoSeats(dragSourcePc, pcKey);
      dragSourcePc = null;
      renderAll();
    }
  });
}

function swapTwoSeats(pcA, pcB) {
  const activeClass = getActiveClass();
  if (!activeClass) return;
  const temp = activeClass.seats[pcA] || null;
  activeClass.seats[pcA] = activeClass.seats[pcB] || null;
  activeClass.seats[pcB] = temp;
  saveAppState();
}

function handleSeatMiniAction(pcKey, act, isShift) {
  const activeClass = getActiveClass();
  if (!activeClass) return;
  const student = activeClass.seats[pcKey];

  if (act === "edit-seat") {
    promptEditSingleSeat(pcKey);
    return;
  }
  if (act === "pick-repair") {
    const repairSelect = document.getElementById("repairPcSelect");
    if (repairSelect) {
      repairSelect.value = pcKey;
      updateSelectedPcRepairUI();
      document.getElementById("repairReasonInput")?.focus();
    }
    return;
  }

  if (!student) return;

  if (act === "done") {
    student.done = !student.done;
    if (student.done) student.help = false;
  } else if (act === "star") {
    if (isShift) {
      student.stars = Math.max(0, (student.stars || 0) - 1);
    } else {
      student.stars = (student.stars || 0) + 1;
    }
  } else if (act === "help") {
    student.help = !student.help;
  } else if (act === "absent") {
    student.absent = !student.absent;
  }

  saveAppState();
  renderClassroomGrid();
}

function promptEditSingleSeat(pcKey) {
  const activeClass = getActiveClass();
  if (!activeClass) return;
  const current = activeClass.seats[pcKey];
  const defaultVal = current ? `${current.seatNo},${current.name}` : `${String(pcKey).padStart(2, "0")},`;
  const input = prompt(
    `編輯 PC-${String(pcKey).padStart(2, "0")} 的學生（格式：座號,姓名；留空則設為空席）：`,
    defaultVal
  );
  if (input === null) return;
  const trimmed = input.trim();
  if (!trimmed) {
    activeClass.seats[pcKey] = null;
  } else {
    const parts = trimmed.split(/[,，\s]+/).filter(Boolean);
    let seatNo = String(pcKey).padStart(2, "0");
    let name = trimmed;
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
      seatNo = parts[0].padStart(2, "0");
      name = parts.slice(1).join(" ");
    }
    activeClass.seats[pcKey] = {
      seatNo,
      name,
      avatar: current?.avatar || AVATAR_POOL[Number(pcKey) % AVATAR_POOL.length],
      done: current?.done || false,
      stars: current?.stars || 0,
      help: current?.help || false,
      absent: current?.absent || false
    };
  }
  saveAppState();
  renderAll();
}

// 當機台故障時，一鍵把該座位學生移到正常的空席
function evacuateStudentToEmptyPc(faultyPcKey) {
  const activeClass = getActiveClass();
  if (!activeClass) return;
  const student = activeClass.seats[faultyPcKey];
  if (!student) return;

  // 優先找第 4 排或編號較後的正常空席
  const candidatePc = ALL_PC_NUMBERS.find((num) => {
    const key = String(num);
    return !activeClass.seats[key] && !appState.pcRepairs[key];
  });

  if (!candidatePc) {
    alert("⚠️ 目前教室內沒有其他運作正常的空席可供移位！");
    return;
  }

  activeClass.seats[String(candidatePc)] = student;
  activeClass.seats[faultyPcKey] = null;
  saveAppState();
  renderAll();
  alert(`✅ 已將 ${student.seatNo}號 ${student.name} 移至正常空席 PC-${String(candidatePc).padStart(2, "0")}！`);
}

function updateLiveClassStats() {
  const activeClass = getActiveClass();
  const statsEl = document.getElementById("classLiveStats");
  if (!activeClass || !statsEl) return;

  let totalSeated = 0;
  let doneCount = 0;
  let starSum = 0;
  let helpCount = 0;
  let absentCount = 0;

  ALL_PC_NUMBERS.forEach((num) => {
    const s = activeClass.seats[String(num)];
    if (s) {
      totalSeated++;
      if (s.done) doneCount++;
      starSum += s.stars || 0;
      if (s.help) helpCount++;
      if (s.absent) absentCount++;
    }
  });

  statsEl.textContent = `🟢 完成 ${doneCount}/${totalSeated - absentCount} ｜ ⭐ 加分 ${starSum} ｜ 🙋 待協助 ${helpCount} ｜ 😷 請假 ${absentCount}`;
}

// ==================== 底部 20 項科技能力樹 ====================
function renderCompetencyBar() {
  const activeClass = getActiveClass();
  const grid = document.getElementById("competencyGrid");
  const classLabel = document.getElementById("competencyClassLabel");
  const countPill = document.getElementById("competencyCountPill");
  if (!activeClass || !grid) return;

  const achievedSet = new Set(activeClass.competencies || []);
  classLabel.textContent = activeClass.code;
  countPill.textContent = `已具備 ${achievedSet.size} / ${TECH_COMPETENCIES.length} 項`;

  grid.innerHTML = "";
  TECH_COMPETENCIES.forEach((item) => {
    const isAchieved = achievedSet.has(item.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `comp-item-btn${isAchieved ? " achieved" : ""}`;
    btn.innerHTML = `<span>${ isAchieved ? "✓" : item.icon }</span><span>${item.name}</span>`;
    btn.addEventListener("click", () => {
      if (achievedSet.has(item.id)) {
        achievedSet.delete(item.id);
      } else {
        achievedSet.add(item.id);
      }
      activeClass.competencies = Array.from(achievedSet);
      saveAppState();
      renderCompetencyBar();
    });
    grid.appendChild(btn);
  });
}

// ==================== 右側欄：教學進度與歷程紀錄 ====================
function renderProgressSidebar() {
  const activeClass = getActiveClass();
  if (!activeClass) return;

  const codeBadge = document.getElementById("activeClassCodeBadge");
  const scheduleText = document.getElementById("activeClassScheduleText");
  const todayInput = document.getElementById("todayProgressInput");
  const nextInput = document.getElementById("nextProgressInput");
  const memoInput = document.getElementById("classMemoInput");
  const countPill = document.getElementById("historyCountPill");
  const listContainer = document.getElementById("historyListContainer");

  const periodMeta = PERIOD_TIME_MAP[activeClass.period] || { label: `第${activeClass.period}節`, time: "" };
  codeBadge.textContent = activeClass.code;
  scheduleText.textContent = `週${WEEKDAY_NAMES[activeClass.day]} ${periodMeta.label} (${periodMeta.time})`;

  todayInput.value = activeClass.todayProgress || "";
  nextInput.value = activeClass.nextProgress || "";
  memoInput.value = activeClass.memo || "";

  const historyArr = activeClass.history || [];
  countPill.textContent = `${historyArr.length} 筆歷程`;

  listContainer.innerHTML = "";
  historyArr.forEach((entry, idx) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <div class="history-item-main">
        <div class="history-date-row">
          <span>📅 ${escapeHtml(entry.date)}</span>
          ${idx === 0 ? '<span class="latest-tag">最新</span>' : ""}
        </div>
        <div class="history-text">${escapeHtml(entry.text)}</div>
      </div>
      <button type="button" class="history-del-btn" title="刪除此筆紀錄">🗑️</button>
    `;
    row.querySelector(".history-del-btn").addEventListener("click", () => {
      activeClass.history.splice(idx, 1);
      saveAppState();
      renderProgressSidebar();
    });
    listContainer.appendChild(row);
  });
}

// ==================== 右下角：機台設備報修專區 ====================
function renderRepairPanel() {
  const activeClass = getActiveClass();
  const selectEl = document.getElementById("repairPcSelect");
  const summaryPill = document.getElementById("repairSummaryPill");
  const faultListEl = document.getElementById("activeFaultList");
  if (!selectEl || !activeClass) return;

  const previousVal = selectEl.value || "1";
  selectEl.innerHTML = "";

  ALL_PC_NUMBERS.forEach((num) => {
    const key = String(num);
    const pcLabel = `PC-${String(num).padStart(2, "0")}`;
    const student = activeClass.seats[key];
    const fault = appState.pcRepairs[key];
    const opt = document.createElement("option");
    opt.value = key;
    const studentText = student ? `${student.seatNo}號 ${student.name}` : "空席";
    const faultPrefix = fault ? "🔴 [待修] " : "🟢 ";
    opt.textContent = `${faultPrefix}${pcLabel} (${studentText})`;
    selectEl.appendChild(opt);
  });

  selectEl.value = ALL_PC_NUMBERS.includes(Number(previousVal)) ? previousVal : "1";

  const faultyKeys = Object.keys(appState.pcRepairs);
  if (faultyKeys.length === 0) {
    summaryPill.className = "repair-summary-pill ok";
    summaryPill.textContent = "🟢 全機正常 (0/29)";
    faultListEl.innerHTML = `<div class="all-healthy-banner">🟢 全教室 29 台機台設備運作正常</div>`;
  } else {
    summaryPill.className = "repair-summary-pill fault";
    summaryPill.textContent = `🔴 待修 ${faultyKeys.length} 台 (${faultyKeys.length}/29)`;
    faultListEl.innerHTML = "";
    faultyKeys
      .sort((a, b) => Number(a) - Number(b))
      .forEach((k) => {
        const info = appState.pcRepairs[k];
        const chip = document.createElement("div");
        chip.className = "fault-chip-item";
        chip.innerHTML = `
          <span>🔴 PC-${String(k).padStart(2, "0")}：${escapeHtml(info.reason || "設備故障")}</span>
          <button type="button" class="quick-fix-mini-btn" data-fix="${k}">✅ 完修</button>
        `;
        chip.querySelector("button").addEventListener("click", () => {
          delete appState.pcRepairs[k];
          saveAppState();
          renderAll();
        });
        faultListEl.appendChild(chip);
      });
  }

  updateSelectedPcRepairUI();
}

function updateSelectedPcRepairUI() {
  const selectEl = document.getElementById("repairPcSelect");
  const statusBadge = document.getElementById("selectedPcStatusBadge");
  const reasonInput = document.getElementById("repairReasonInput");
  if (!selectEl) return;

  const pcKey = selectEl.value;
  const fault = appState.pcRepairs[pcKey];

  selectedFaultTags.clear();
  if (fault) {
    statusBadge.className = "pc-single-status fault";
    statusBadge.textContent = "🔴 報修待處理";
    reasonInput.value = fault.reason || "";
    (fault.tags || []).forEach((t) => selectedFaultTags.add(t));
  } else {
    statusBadge.className = "pc-single-status ok";
    statusBadge.textContent = "🟢 正常運作";
    reasonInput.value = "";
  }

  document.querySelectorAll(".fault-tag-btn").forEach((btn) => {
    btn.classList.toggle("selected", selectedFaultTags.has(btn.dataset.fault));
  });
}

// ==================== 隨機抽籤動畫 ====================
function runRandomLottery() {
  const activeClass = getActiveClass();
  if (!activeClass) return;

  const candidates = ALL_PC_NUMBERS.map((n) => String(n)).filter((key) => {
    const s = activeClass.seats[key];
    return s && !s.absent;
  });

  if (candidates.length === 0) {
    alert("本班目前沒有可抽籤的出席學生！");
    return;
  }

  let steps = 0;
  const totalSteps = 14;
  const interval = setInterval(() => {
    document.querySelectorAll(".seat-card.lottery-highlight").forEach((el) => {
      el.classList.remove("lottery-highlight");
    });
    const randKey = candidates[Math.floor(Math.random() * candidates.length)];
    const cardEl = document.querySelector(`.seat-card[data-pc="${randKey}"]`);
    if (cardEl) cardEl.classList.add("lottery-highlight");
    steps++;

    if (steps >= totalSteps) {
      clearInterval(interval);
      currentLotteryPc = randKey;
      showLotteryWinnerModal(randKey);
    }
  }, 65);
}

function showLotteryWinnerModal(pcKey) {
  const activeClass = getActiveClass();
  const student = activeClass?.seats[pcKey];
  if (!student) return;

  document.getElementById("lotteryPcTag").textContent = `PC-${String(pcKey).padStart(2, "0")}`;
  document.getElementById("lotteryAvatar").textContent = student.avatar || "🎉";
  document.getElementById("lotteryStudentName").textContent = `${student.seatNo}號 ${student.name}`;
  document.getElementById("lotterySeatInfo").textContent = `${activeClass.code} 班 ｜ 目前累積 ⭐ ${student.stars || 0} 顆星`;
  document.getElementById("lotteryModal").classList.remove("hidden");
}

// ==================== 跨班搜尋學生 / 座號 / 機台 ====================
function handleGlobalSearch(query) {
  const dropdown = document.getElementById("searchDropdown");
  const q = query.trim().toLowerCase();
  if (!q) {
    dropdown.classList.add("hidden");
    return;
  }

  const results = [];
  appState.classes.forEach((cls) => {
    ALL_PC_NUMBERS.forEach((num) => {
      const key = String(num);
      const pcCode = `pc-${String(num).padStart(2, "0")}`;
      const s = cls.seats[key];
      if (!s) return;
      if (
        s.name.toLowerCase().includes(q) ||
        s.seatNo.includes(q) ||
        pcCode.includes(q)
      ) {
        results.push({
          classId: cls.id,
          classCode: cls.code,
          pcKey: key,
          seatNo: s.seatNo,
          name: s.name
        });
      }
    });
  });

  dropdown.innerHTML = "";
  if (results.length === 0) {
    dropdown.innerHTML = `<div class="search-result-item">找不到符合「${escapeHtml(query)}」的學生</div>`;
  } else {
    results.slice(0, 15).forEach((item) => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <span><strong>${escapeHtml(item.name)}</strong> (${item.seatNo}號)</span>
        <span class="pc-id-badge">${item.classCode}班・PC-${String(item.pcKey).padStart(2, "0")}</span>
      `;
      div.addEventListener("click", () => {
        appState.activeClassId = item.classId;
        dropdown.classList.add("hidden");
        document.getElementById("studentSearchInput").value = "";
        renderAll();
        const targetCard = document.querySelector(`.seat-card[data-pc="${item.pcKey}"]`);
        if (targetCard) {
          targetCard.classList.add("search-highlight");
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => targetCard.classList.remove("search-highlight"), 3500);
        }
      });
      dropdown.appendChild(div);
    });
  }
  dropdown.classList.remove("hidden");
}

// ==================== 各班進度對照總覽彈窗 ====================
function openGradeOverviewModal() {
  const content = document.getElementById("gradeOverviewContent");
  const rowsHtml = appState.classes
    .map((cls) => {
      const pMeta = PERIOD_TIME_MAP[cls.period] || { label: `第${cls.period}節` };
      const lastDate = cls.history?.[0]?.date || "尚無紀錄";
      return `
        <tr>
          <td><strong>${escapeHtml(cls.code)}</strong></td>
          <td>週${WEEKDAY_NAMES[cls.day]} ${pMeta.label}</td>
          <td>${escapeHtml(cls.todayProgress || "—")}</td>
          <td>${escapeHtml(cls.nextProgress || "—")}</td>
          <td>${lastDate} (${(cls.history || []).length}筆)</td>
          <td>${(cls.competencies || []).length} / 20 項</td>
        </tr>
      `;
    })
    .join("");

  content.innerHTML = `
    <table class="overview-table">
      <thead>
        <tr>
          <th>班級</th>
          <th>上課節次</th>
          <th>今日 / 上次進度</th>
          <th>下次預定進度</th>
          <th>最近紀錄日期</th>
          <th>已具備科技能力</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
  document.getElementById("gradeOverviewModal").classList.remove("hidden");
}

// ==================== 班級與學生名單管理彈窗 ====================
function openRosterModal() {
  const activeClass = getActiveClass();
  if (!activeClass) return;

  document.getElementById("rosterModalClassTitle").textContent = activeClass.code;
  document.getElementById("editClassCodeInput").value = activeClass.code;
  document.getElementById("editClassDaySelect").value = String(activeClass.day);
  document.getElementById("editClassPeriodSelect").value = String(activeClass.period);

  const lines = [];
  ALL_PC_NUMBERS.forEach((num) => {
    const s = activeClass.seats[String(num)];
    if (s) {
      lines.push(`${s.seatNo},${s.name}`);
    } else {
      lines.push("");
    }
  });
  // 移除尾端空白行方便編輯
  while (lines.length > 0 && !lines[lines.length - 1]) {
    lines.pop();
  }
  document.getElementById("bulkRosterTextarea").value = lines.join("\n");
  document.getElementById("rosterModal").classList.remove("hidden");
}

// ==================== 課堂迷你倒數計時器 ====================
function updateTimerUI() {
  const display = document.getElementById("timerDisplay");
  const box = document.getElementById("miniTimerBox");
  const toggleBtn = document.getElementById("timerToggleBtn");
  const mm = String(Math.floor(timerRemainingSec / 60)).padStart(2, "0");
  const ss = String(timerRemainingSec % 60).padStart(2, "0");
  display.textContent = `${mm}:${ss}`;
  box.classList.toggle("urgent", timerRemainingSec > 0 && timerRemainingSec <= 180);
  toggleBtn.textContent = timerIntervalId ? "⏸️" : "▶️";
}

function startOrPauseTimer() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    updateTimerUI();
    return;
  }
  if (timerRemainingSec <= 0) {
    timerRemainingSec = 10 * 60; // 預設 10 分鐘
  }
  timerIntervalId = setInterval(() => {
    if (timerRemainingSec > 0) {
      timerRemainingSec--;
      updateTimerUI();
      if (timerRemainingSec === 0) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        updateTimerUI();
        alert("⏰ 課堂實作倒數時間到！請同學儲存作品並準備看投影幕。");
      }
    }
  }, 1000);
  updateTimerUI();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==================== 綁定全域介面事件 ====================
function initEvents() {
  // 排序模式切換
  document.getElementById("sortModeBtn")?.addEventListener("click", () => {
    appState.sortBy = appState.sortBy === "grade" ? "schedule" : "grade";
    saveAppState(false);
    renderClassTabs();
  });

  // 學生投影視角 180 度翻轉
  document.getElementById("projectionViewBtn")?.addEventListener("click", () => {
    appState.projectionMode = !appState.projectionMode;
    saveAppState(false);
    renderClassroomGrid();
  });

  // 點選換位模式開關
  document.getElementById("clickSwapToggleBtn")?.addEventListener("click", (e) => {
    clickSwapMode = !clickSwapMode;
    firstSelectedPcForSwap = null;
    e.currentTarget.classList.toggle("active", clickSwapMode);
    e.currentTarget.textContent = clickSwapMode ? "✋ 點選換位：開 (請點兩張座位)" : "✋ 點選換位：關";
    renderClassroomGrid();
  });

  // 重置今日狀態
  document.getElementById("resetTodayStatusBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    ALL_PC_NUMBERS.forEach((n) => {
      const s = activeClass.seats[String(n)];
      if (s) {
        s.done = false;
        s.help = false;
        s.absent = false;
      }
    });
    saveAppState();
    renderClassroomGrid();
  });

  // 隨機抽籤
  document.getElementById("randomPickBtn")?.addEventListener("click", runRandomLottery);
  document.getElementById("lotteryPickAgainBtn")?.addEventListener("click", () => {
    document.getElementById("lotteryModal").classList.add("hidden");
    runRandomLottery();
  });
  document.getElementById("lotteryAddStarBtn")?.addEventListener("click", () => {
    if (!currentLotteryPc) return;
    handleSeatMiniAction(currentLotteryPc, "star", false);
    showLotteryWinnerModal(currentLotteryPc);
  });
  document.getElementById("lotteryMarkDoneBtn")?.addEventListener("click", () => {
    if (!currentLotteryPc) return;
    const activeClass = getActiveClass();
    if (activeClass?.seats[currentLotteryPc]) {
      activeClass.seats[currentLotteryPc].done = true;
      saveAppState();
      renderClassroomGrid();
    }
    document.getElementById("lotteryModal").classList.add("hidden");
  });

  // 跨班搜尋
  const searchInput = document.getElementById("studentSearchInput");
  searchInput?.addEventListener("input", (e) => handleGlobalSearch(e.target.value));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      document.getElementById("searchDropdown")?.classList.add("hidden");
    }
  });

  // 科技能力全選與清空
  document.getElementById("compSelectAllBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    activeClass.competencies = TECH_COMPETENCIES.map((c) => c.id);
    saveAppState();
    renderCompetencyBar();
  });
  document.getElementById("compClearAllBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    activeClass.competencies = [];
    saveAppState();
    renderCompetencyBar();
  });

  // 右側進度欄位即時儲存與交接按鈕
  document.getElementById("todayProgressInput")?.addEventListener("input", (e) => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    activeClass.todayProgress = e.target.value;
    saveAppState();
  });
  document.getElementById("nextProgressInput")?.addEventListener("input", (e) => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    activeClass.nextProgress = e.target.value;
    saveAppState();
  });
  document.getElementById("classMemoInput")?.addEventListener("input", (e) => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    activeClass.memo = e.target.value;
    saveAppState();
  });

  // 快速帶入單元選單
  document.getElementById("quickUnitSelect")?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;
    const activeClass = getActiveClass();
    if (activeClass) {
      activeClass.todayProgress = val;
      document.getElementById("todayProgressInput").value = val;
      saveAppState();
    }
    e.target.value = "";
  });

  // 📌 記入歷程
  document.getElementById("recordToHistoryBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    const text = (activeClass.todayProgress || "").trim();
    if (!text) {
      alert("請先在「今日 / 上次進度」輸入內容再記入歷程！");
      return;
    }
    const todayStr = formatDateISO(getTaipeiNow());
    activeClass.history = activeClass.history || [];
    activeClass.history.unshift({ date: todayStr, text });
    saveAppState();
    renderProgressSidebar();
  });

  // ⬆️ 推為今日
  document.getElementById("promoteNextBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    if (!activeClass.nextProgress) return;
    activeClass.todayProgress = activeClass.nextProgress;
    saveAppState();
    renderProgressSidebar();
  });

  // ⚡ 今節自動定位
  document.getElementById("autoLocateClassBtn")?.addEventListener("click", autoLocateCurrentClass);

  // 機台報修事件
  document.getElementById("repairPcSelect")?.addEventListener("change", updateSelectedPcRepairUI);

  document.querySelectorAll(".fault-tag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.fault;
      if (selectedFaultTags.has(tag)) {
        selectedFaultTags.delete(tag);
      } else {
        selectedFaultTags.add(tag);
      }
      btn.classList.toggle("selected", selectedFaultTags.has(tag));
      const reasonInput = document.getElementById("repairReasonInput");
      if (selectedFaultTags.size > 0) {
        reasonInput.value = `${Array.from(selectedFaultTags).join("、")}故障`;
      }
    });
  });

  document.getElementById("reportFaultBtn")?.addEventListener("click", () => {
    const pcKey = document.getElementById("repairPcSelect").value;
    const reason = document.getElementById("repairReasonInput").value.trim() || "設備異常待修";
    appState.pcRepairs[pcKey] = {
      tags: Array.from(selectedFaultTags),
      reason,
      updatedAt: formatDateISO(getTaipeiNow())
    };
    saveAppState();
    renderAll();
  });

  document.getElementById("markFixedBtn")?.addEventListener("click", () => {
    const pcKey = document.getElementById("repairPcSelect").value;
    delete appState.pcRepairs[pcKey];
    selectedFaultTags.clear();
    saveAppState();
    renderAll();
  });

  // 迷你計時器
  document.querySelectorAll(".timer-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mins = Number(btn.dataset.min) || 5;
      timerRemainingSec = mins * 60;
      if (!timerIntervalId) startOrPauseTimer();
      updateTimerUI();
    });
  });
  document.getElementById("timerToggleBtn")?.addEventListener("click", startOrPauseTimer);
  document.getElementById("timerResetBtn")?.addEventListener("click", () => {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerRemainingSec = 0;
    updateTimerUI();
  });

  // 彈窗開啟與關閉
  document.getElementById("gradeOverviewBtn")?.addEventListener("click", openGradeOverviewModal);
  document.getElementById("rosterManageBtn")?.addEventListener("click", openRosterModal);
  document.getElementById("cloudSyncBtn")?.addEventListener("click", () => {
    document.getElementById("gasWebAppUrlInput").value = localStorage.getItem(GAS_URL_KEY) || "";
    document.getElementById("cloudSyncModal").classList.remove("hidden");
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close)?.classList.add("hidden");
    });
  });

  // 班級管理與批次名單匯入
  document.getElementById("saveClassMetaBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    const newCode = document.getElementById("editClassCodeInput").value.trim() || activeClass.code;
    activeClass.code = newCode;
    activeClass.grade = parseInt(newCode, 10) ? Math.floor(parseInt(newCode, 10) / 100) || 6 : 7;
    activeClass.day = Number(document.getElementById("editClassDaySelect").value) || 1;
    activeClass.period = Number(document.getElementById("editClassPeriodSelect").value) || 1;
    saveAppState();
    renderAll();
    alert("✅ 已儲存班級基本設定！");
  });

  document.getElementById("addNewClassBtn")?.addEventListener("click", () => {
    const code = prompt("請輸入新班級代號或名稱（例如 505、604 或 創客社）：", "505");
    if (!code) return;
    const id = `cls_${Date.now()}`;
    appState.classes.push({
      id,
      code: code.trim(),
      grade: parseInt(code, 10) ? Math.floor(parseInt(code, 10) / 100) || 5 : 7,
      day: 3,
      period: 5,
      todayProgress: "",
      nextProgress: "",
      memo: "",
      competencies: [],
      history: [],
      seats: buildSampleSeats(5, 25)
    });
    appState.activeClassId = id;
    saveAppState();
    renderAll();
    openRosterModal();
  });

  document.getElementById("deleteCurrentClassBtn")?.addEventListener("click", () => {
    if (appState.classes.length <= 1) {
      alert("至少需保留一個班級！");
      return;
    }
    const activeClass = getActiveClass();
    if (!confirm(`確定要刪除「${activeClass.code}」班嗎？`)) return;
    appState.classes = appState.classes.filter((c) => c.id !== activeClass.id);
    appState.activeClassId = appState.classes[0].id;
    saveAppState();
    document.getElementById("rosterModal").classList.add("hidden");
    renderAll();
  });

  document.getElementById("applyBulkRosterBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    const rawLines = document.getElementById("bulkRosterTextarea").value.split(/\r?\n/);
    const newSeats = {};
    for (let pc = 1; pc <= 29; pc++) {
      const line = (rawLines[pc - 1] || "").trim();
      if (!line || line === "空席" || line === "空") {
        newSeats[String(pc)] = null;
      } else {
        const parts = line.split(/[,，\t\s]+/).filter(Boolean);
        let seatNo = String(pc).padStart(2, "0");
        let name = line;
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          seatNo = parts[0].padStart(2, "0");
          name = parts.slice(1).join(" ");
        }
        newSeats[String(pc)] = {
          seatNo,
          name,
          avatar: AVATAR_POOL[(pc + activeClass.code.length) % AVATAR_POOL.length],
          done: false,
          stars: 0,
          help: false,
          absent: false
        };
      }
    }
    activeClass.seats = newSeats;
    saveAppState();
    renderAll();
    document.getElementById("rosterModal").classList.add("hidden");
  });

  document.getElementById("resetDefaultSeatOrderBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    const students = Object.values(activeClass.seats).filter(Boolean);
    students.sort((a, b) => Number(a.seatNo) - Number(b.seatNo));
    const reordered = {};
    for (let pc = 1; pc <= 29; pc++) {
      const match = students.find((s) => Number(s.seatNo) === pc) || null;
      reordered[String(pc)] = match;
    }
    activeClass.seats = reordered;
    saveAppState();
    renderAll();
    openRosterModal();
  });

  // 雲端同步與 JSON 備份匯出入
  document.getElementById("saveGasUrlBtn")?.addEventListener("click", () => {
    const url = document.getElementById("gasWebAppUrlInput").value.trim();
    localStorage.setItem(GAS_URL_KEY, url);
    saveAppState(true);
    alert(url ? "✅ 已儲存試算表同步網址並開始自動同步！" : "已切換為純本機儲存模式。");
  });

  document.getElementById("pullFromGasBtn")?.addEventListener("click", pullStateFromGas);

  document.getElementById("exportJsonBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `羅東國小_電腦課神隊友備份_${formatDateISO(getTaipeiNow())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importJsonFileInput")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (imported && Array.isArray(imported.classes)) {
          appState = imported;
          saveAppState();
          renderAll();
          document.getElementById("cloudSyncModal").classList.add("hidden");
          alert("✅ 備份檔匯入成功！");
        }
      } catch (err) {
        alert("❌ JSON 檔案格式不正確！");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("factoryResetBtn")?.addEventListener("click", () => {
    if (!confirm("確定要還原為預設範例資料嗎？這會覆蓋目前的本機紀錄。")) return;
    appState = createDefaultState();
    saveAppState();
    renderAll();
    document.getElementById("cloudSyncModal").classList.add("hidden");
  });
}

function renderAll() {
  renderTopDate();
  renderClassTabs();
  renderClassroomGrid();
  renderCompetencyBar();
  renderProgressSidebar();
  renderRepairPanel();
}

// 啟動初始化
document.addEventListener("DOMContentLoaded", () => {
  initEvents();
  renderAll();
  saveAppState(false);
});
