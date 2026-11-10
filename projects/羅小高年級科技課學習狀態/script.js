/**
 * 羅東國小｜羅小高年級科技課學習狀態
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

// ==================== 跨機同步（版本號＋通關密碼） ====================
// 同步中繼資料：{ key, version, dirty }
//   version：這台最後一次跟雲端對齊時的雲端版本號
//   dirty：這台有還沒上傳成功的修改
// 規則：雲端比較新、這台沒改 → 直接用雲端；這台改了、雲端沒變 → 上傳；
//       兩邊都改了 → 問老師要留哪一份（後端也會用版本號擋，不會互蓋）
const SYNC_META_KEY = "lotes_computer_class_sync_meta_v1";
const SYNC_PUSH_DELAY_MS = 1500;
const SYNC_FOCUS_THROTTLE_MS = 30000;

let cloudSyncDebounceTimer = null;
let syncPushing = false;
let syncPushAgain = false;
let syncForceNext = false;
let syncAdoptEpoch = 0;
let localChangeSeq = 0;
let lastFocusSyncAt = 0;
let syncConflictOpen = false;

function loadSyncMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}");
    return { key: m.key || "", version: Number(m.version) || 0, dirty: !!m.dirty };
  } catch (err) {
    return { key: "", version: 0, dirty: false };
  }
}

function saveSyncMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

function getGasUrl() {
  try {
    return (localStorage.getItem(GAS_URL_KEY) || "").trim();
  } catch (err) {
    return ""; // 瀏覽器停用儲存空間（無痕模式等）時當作沒啟用同步
  }
}

function cloudSyncEnabled() {
  return !!(getGasUrl() && loadSyncMeta().key);
}

function setSyncStatus(text) {
  const el = document.getElementById("syncStatusText");
  if (el) el.textContent = `${text} (${formatTimeHMS(new Date())})`;
}

function saveAppState(triggerCloud = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    if (triggerCloud && cloudSyncEnabled()) {
      localChangeSeq += 1;
      const meta = loadSyncMeta();
      meta.dirty = true;
      saveSyncMeta(meta);
      setSyncStatus("已存本機，等待上傳試算表…");
      clearTimeout(cloudSyncDebounceTimer);
      cloudSyncDebounceTimer = setTimeout(pushStateToGas, SYNC_PUSH_DELAY_MS);
    } else if (!cloudSyncEnabled()) {
      setSyncStatus("已自動寫入本機（未啟用試算表同步）");
    }
  } catch (err) {
    console.error("儲存失敗：", err);
    setSyncStatus("⚠️ 本機儲存失敗");
  }
}

// 用 POST 送通關密碼（不放在網址上，避免留在瀏覽紀錄與伺服器記錄裡）
// Content-Type 用 text/plain 才不會觸發 CORS 預檢，Apps Script 的回應可以正常讀取
// 每次連線／中斷都換一個編號；舊連線的回應晚到時直接丟掉，不會被套進新連線
let syncConnEpoch = 0;

async function gasRequest(body) {
  const epoch = syncConnEpoch;
  const meta = loadSyncMeta();
  const resp = await fetch(getGasUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...body, key: meta.key })
  });
  const data = await resp.json();
  if (epoch !== syncConnEpoch) throw new Error("stale_connection");
  return data || {};
}

function describeSyncError(data) {
  if (data.error === "unauthorized") return "通關密碼不對（或 Code.gs 的 SYNC_KEY 還沒改）";
  if (data.error === "busy") return "試算表忙碌中，稍後自動再試";
  if (data.error === "corrupt") return "試算表裡的資料讀不出來（可能被手動改過）";
  return `試算表回應錯誤：${data.error || "未知"}`;
}

// 換成雲端資料時，保留這台自己的畫面偏好（目前選的班、排序、投影模式）
function adoptCloudPayload(payload, version) {
  const keepActive = appState.activeClassId;
  const keepSort = appState.sortBy;
  const keepProjection = appState.projectionMode;
  appState = payload;
  if (appState.classes.some((c) => c.id === keepActive)) appState.activeClassId = keepActive;
  if (keepSort) appState.sortBy = keepSort;
  appState.projectionMode = !!keepProjection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  const meta = loadSyncMeta();
  meta.version = version;
  meta.dirty = false;
  saveSyncMeta(meta);
  localChangeSeq += 1; // 讓正在進行中的上傳不要誤把 dirty 清掉
  syncAdoptEpoch += 1; // 讓正在進行中的上傳不要把版本號蓋在這份（不同內容的）資料上
  renderAll();
  setSyncStatus(`已與試算表同步（第 ${version} 版）`);
}

async function pushStateToGas(force = false) {
  if (!cloudSyncEnabled()) return;
  if (syncPushing) {
    // 上傳中又有新修改（或要求強制覆蓋）：等這次結束再送一次，強制旗標要帶過去
    syncPushAgain = true;
    if (force) syncForceNext = true;
    return;
  }
  syncPushing = true;
  const useForce = force || syncForceNext;
  syncForceNext = false;
  const seqAtSend = localChangeSeq;
  const adoptAtSend = syncAdoptEpoch;
  let recheckAfter = false;
  try {
    const meta = loadSyncMeta();
    setSyncStatus("正在上傳試算表…");
    const data = await gasRequest({ action: "save", baseVersion: meta.version, force: useForce, payload: appState });
    if (data.ok && syncAdoptEpoch !== adoptAtSend) {
      // 上傳途中這台已經改用別份雲端資料：手上的內容不是剛上傳的那份，不能標成這個版本號，重新對一次
      recheckAfter = true;
    } else if (data.ok) {
      const m = loadSyncMeta();
      m.version = data.version;
      if (localChangeSeq === seqAtSend) m.dirty = false;
      saveSyncMeta(m);
      setSyncStatus(`✅ 已寫入試算表（第 ${data.version} 版）`);
    } else if (data.error === "conflict") {
      const decision = await resolveSyncConflict(data.version);
      if (decision === "overwrite") {
        syncForceNext = true;
        syncPushAgain = true;
      }
    } else if (data.error === "corrupt") {
      if (confirm("⚠️ 試算表裡的資料讀不出來（可能被手動改過）。\n\n要用這台的資料修復雲端嗎？")) {
        syncForceNext = true;
        syncPushAgain = true;
      } else {
        setSyncStatus(`⚠️ ${describeSyncError(data)}；本機已存`);
      }
    } else {
      setSyncStatus(`⚠️ ${describeSyncError(data)}；本機已存`);
    }
  } catch (err) {
    setSyncStatus("⚠️ 連不上試算表，本機已存，下次存檔或回到此頁時再試");
  } finally {
    syncPushing = false;
    if (syncPushAgain) {
      syncPushAgain = false;
      if (loadSyncMeta().dirty) pushStateToGas();
    } else if (recheckAfter) {
      reconcileWithCloud();
    }
  }
}

// 只負責問老師、回傳決定（"cloud"／"overwrite"／"pause"），真正的強制上傳交給 pushStateToGas，
// 不然在上傳流程裡呼叫會被「上傳中」擋下改排一般上傳，又撞衝突（2026-11-10 測出來的）
async function resolveSyncConflict(cloudVersion) {
  if (syncConflictOpen) return "pause";
  syncConflictOpen = true;
  try {
    const useCloud = confirm(
      `⚠️ 雲端資料已被另一台電腦更新（第 ${cloudVersion} 版），這台也有還沒上傳的修改。\n\n` +
        "按「確定」：改用雲端版本（這台還沒上傳的修改會放棄）\n" +
        "按「取消」：再選一次要不要用這台蓋過雲端"
    );
    if (useCloud) {
      const data = await gasRequest({ action: "load" });
      if (data.ok && data.payload) adoptCloudPayload(data.payload, data.version);
      else setSyncStatus(`⚠️ ${describeSyncError(data)}`);
      return "cloud";
    }
    const overwrite = confirm(
      "要用這台的資料覆蓋雲端嗎？\n\n另一台電腦剛剛的修改會被蓋掉。\n按「取消」則兩邊都不動，同步先暫停，可以先到「☁️ 同步/備份」匯出備份再決定。"
    );
    if (overwrite) return "overwrite";
    setSyncStatus("⚠️ 跟雲端有衝突，同步暫停中（到「☁️ 同步/備份」處理）");
    return "pause";
  } finally {
    syncConflictOpen = false;
  }
}

// 開頁、切回這個分頁時跟雲端對一次
async function reconcileWithCloud() {
  if (!cloudSyncEnabled() || syncPushing) return; // 上傳中不對帳，上傳結束自己會處理
  const startVersion = loadSyncMeta().version;
  const startSeq = localChangeSeq;
  const startAdopt = syncAdoptEpoch;
  let data;
  try {
    data = await gasRequest({ action: "load" });
  } catch (err) {
    if (err.message !== "stale_connection") setSyncStatus("⚠️ 連不上試算表，先用本機資料");
    return;
  }
  // 等回應的期間這台有上傳成功、改用別份資料或又改了東西：這份回應已經過期，丟掉
  if (
    syncPushing ||
    loadSyncMeta().version !== startVersion ||
    localChangeSeq !== startSeq ||
    syncAdoptEpoch !== startAdopt
  ) {
    return;
  }
  if (!data.ok) {
    setSyncStatus(`⚠️ ${describeSyncError(data)}`);
    return;
  }
  const meta = loadSyncMeta();
  if (!data.payload) {
    if (meta.dirty) pushStateToGas();
    else setSyncStatus("試算表還是空的");
    return;
  }
  if (data.version === meta.version) {
    if (meta.dirty) pushStateToGas();
    else setSyncStatus(`已是最新（第 ${data.version} 版）`);
    return;
  }
  if (!meta.dirty) {
    adoptCloudPayload(data.payload, data.version);
    return;
  }
  const decision = await resolveSyncConflict(data.version);
  if (decision === "overwrite") await pushStateToGas(true);
}

// 第一次連線（或換網址／密碼）：一律先看雲端，不先上傳
async function connectCloudSync(url, key) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) {
    alert("網址格式不對，應該長得像 https://script.google.com/macros/s/……/exec");
    return;
  }
  if (key.length < 8) {
    alert("通關密碼至少 8 碼，要跟 Code.gs 裡的 SYNC_KEY 一模一樣。");
    return;
  }
  syncConnEpoch += 1;
  clearTimeout(cloudSyncDebounceTimer);
  localStorage.setItem(GAS_URL_KEY, url);
  saveSyncMeta({ key, version: 0, dirty: false });

  let data;
  try {
    setSyncStatus("正在連線試算表…");
    data = await gasRequest({ action: "load" });
  } catch (err) {
    if (err.message === "stale_connection") return; // 連線途中又換了網址，交給新的那次
    disconnectCloudSync(false);
    alert("連不上這個網址。請確認部署時「誰可以存取」選的是「所有人」，而且網址是 /exec 結尾。");
    return;
  }
  if (!data.ok) {
    disconnectCloudSync(false);
    alert(`連線失敗：${describeSyncError(data)}`);
    return;
  }

  if (data.payload && Array.isArray(data.payload.classes)) {
    const ok = confirm(
      `雲端已經有 ${data.payload.classes.length} 個班級的資料（第 ${data.version} 版）。\n\n` +
        "這台會改用雲端資料，這台目前的資料會被取代。\n要繼續嗎？（不確定的話先按取消，匯出這台的備份）"
    );
    if (!ok) {
      disconnectCloudSync(false);
      return;
    }
    adoptCloudPayload(data.payload, data.version);
    alert("✅ 已連線，並載入雲端資料。之後這台的修改會自動上傳。");
  } else {
    const ok = confirm(
      `雲端目前是空的。要把這台的 ${appState.classes.length} 個班級上傳，當作第一份資料嗎？\n\n` +
        "（如果這台還是範例假名單，請先匯入真正的名單再連線）"
    );
    if (!ok) {
      disconnectCloudSync(false);
      return;
    }
    const meta = loadSyncMeta();
    meta.dirty = true;
    saveSyncMeta(meta);
    await pushStateToGas();
    alert("✅ 已連線並上傳。其他電腦連線時會下載這份資料。");
  }
}

function disconnectCloudSync(showMsg = true) {
  syncConnEpoch += 1;
  clearTimeout(cloudSyncDebounceTimer);
  localStorage.removeItem(GAS_URL_KEY);
  localStorage.removeItem(SYNC_META_KEY);
  setSyncStatus("已自動寫入本機（未啟用試算表同步）");
  if (showMsg) alert("已中斷同步。這台的資料留在本機，試算表裡的資料不受影響。");
}

async function pullStateFromGas() {
  if (!cloudSyncEnabled()) {
    alert("請先填網址與通關密碼，按「連線並同步」。");
    return;
  }
  if (syncPushing) {
    alert("正在上傳中，等狀態列顯示完成再按一次。");
    return;
  }
  if (!confirm("用雲端資料覆蓋這台？這台還沒上傳的修改會放棄。")) return;
  clearTimeout(cloudSyncDebounceTimer);
  try {
    const data = await gasRequest({ action: "load" });
    if (data.ok && data.payload && Array.isArray(data.payload.classes)) {
      adoptCloudPayload(data.payload, data.version);
      alert("✅ 已從試算表載入最新資料！");
    } else if (data.ok) {
      alert("⚠️ 試算表目前沒有資料。");
    } else {
      alert(`讀取失敗：${describeSyncError(data)}`);
    }
  } catch (err) {
    alert("連不上試算表。");
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

// ==================== 名單解析與排座（單班、全年級共用） ====================
const ROSTER_HEADER_PATTERN = /座號|座次|姓名|名字|班級|班別|年級|學號/;

function pad2(n) {
  return String(n).padStart(2, "0");
}

// 一行文字切成欄位：有 Tab／逗號就照它切，否則照空白切
// Tab／逗號切出來的空欄要保留（例如「501,,05,王小明」的備註欄沒填），刪掉會讓欄位跟標題對不上、漏掉學生
function splitRosterLine(line) {
  const cleaned = line.replace(/^﻿/, "").replace(/\s+$/, "");
  if (!cleaned.trim()) return [];
  if (/\t|,|，/.test(cleaned)) {
    return cleaned.split(/\t|,|，/).map((p) => p.trim().replace(/^"(.*)"$/, "$1").trim());
  }
  return cleaned.trim().split(/\s+/);
}

// 單班名單：回傳每位學生想坐的 PC。
// 只要有任何一行帶座號 → 照座號坐（空行忽略）；全部都沒座號 → 照行的順序坐（空行／「空席」保留為空位，相容舊用法）
function parseSingleClassLines(rawLines) {
  const parsed = rawLines.map((raw) => {
    const line = raw.trim();
    if (!line || line === "空席" || line === "空") return { type: "blank" };
    const parts = splitRosterLine(line).filter(Boolean); // 單班只有座號、姓名兩欄，空欄直接略過
    if (parts.length >= 2 && /^\d{1,3}$/.test(parts[0])) {
      return { type: "student", seatNo: Number(parts[0]), name: parts.slice(1).join(" ") };
    }
    if (ROSTER_HEADER_PATTERN.test(line) && !/\d/.test(line)) return { type: "skip", text: line };
    if (/^\d+$/.test(line)) return { type: "skip", text: line };
    return { type: "student", seatNo: null, name: line };
  });

  const hasSeatNumbers = parsed.some((p) => p.type === "student" && p.seatNo);
  const entries = [];
  const skipped = parsed.filter((p) => p.type === "skip").map((p) => p.text);
  let lineSlot = 0;
  parsed.forEach((p) => {
    if (p.type === "skip") return;
    if (!hasSeatNumbers) lineSlot += 1;
    if (p.type !== "student") return;
    entries.push({
      preferredPc: hasSeatNumbers ? p.seatNo : lineSlot,
      seatNo: p.seatNo,
      name: p.name
    });
  });
  return { entries, skipped };
}

// 照 preferredPc 排入 PC-01～29；座號重複或超過 29 的，從 PC-29 往回補進空著的機台
// （缺號留下的空位在前排中間，補進去座號跟機台會對不上；後排本來就是空位多的地方），再排不下的回傳 overflow
// 同名學生沿用原本的頭像與星星
function placeStudentsInSeats(entries, existingClass) {
  const oldByName = {};
  Object.values(existingClass?.seats || {}).forEach((s) => {
    if (s && s.name) oldByName[s.name] = s;
  });
  const makeStudent = (entry, pc) => {
    const old = oldByName[entry.name];
    return {
      seatNo: pad2(entry.seatNo || pc),
      name: entry.name,
      avatar: old?.avatar || AVATAR_POOL[(pc + String(existingClass?.code || "").length) % AVATAR_POOL.length],
      done: false,
      stars: old?.stars || 0,
      help: false,
      absent: false
    };
  };

  const seats = {};
  ALL_PC_NUMBERS.forEach((pc) => (seats[String(pc)] = null));
  const queue = [];
  entries.forEach((entry) => {
    const pc = Number(entry.preferredPc);
    if (pc >= 1 && pc <= 29 && !seats[String(pc)]) {
      seats[String(pc)] = makeStudent(entry, pc);
    } else {
      queue.push(entry);
    }
  });
  [...ALL_PC_NUMBERS].reverse().forEach((pc) => {
    if (!seats[String(pc)] && queue.length) seats[String(pc)] = makeStudent(queue.shift(), pc);
  });
  return { seats, overflow: queue };
}

// ==================== 全年級名單大量匯入 ====================
const SHEETJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
let bulkImportSourceRows = null; // 從檔案讀進來的 [{ sheetName, rows }]；null 表示用文字框
let bulkImportParsed = null;

const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function chineseNumeralsToDigits(str) {
  return String(str).replace(/[一二三四五六七八九十]+/g, (m) => {
    if (m === "十") return "10";
    if (m.startsWith("十")) return String(10 + (CN_DIGITS[m[1]] || 0));
    if (m.length === 1) return String(CN_DIGITS[m]);
    if (m.length === 2 && m[1] === "十") return String(CN_DIGITS[m[0]] * 10);
    return m;
  });
}

// 501／5年1班／五年一班／5-1／（年級 5、班級 1）→ "501"
function normalizeClassCode(gradeVal, classVal) {
  const c = chineseNumeralsToDigits(String(classVal || "").trim()).replace(/\s+/g, "");
  const g = chineseNumeralsToDigits(String(gradeVal || "").trim()).replace(/年級?|\s+/g, "");
  if (/^\d{3}$/.test(c)) return c;
  let m = c.match(/^(\d)年(\d{1,2})班?$/);
  if (m) return m[1] + pad2(m[2]);
  m = c.match(/^(\d)[-_.](\d{1,2})$/);
  if (m) return m[1] + pad2(m[2]);
  const cNum = c.replace(/班$/, "");
  if (/^\d{1,2}$/.test(cNum) && /^\d$/.test(g)) return g + pad2(cNum);
  return null;
}

function textToRows(text) {
  return text.split(/\r?\n/).map(splitRosterLine);
}

function parseBulkTables(tables) {
  const byClass = new Map();
  const errors = [];
  let total = 0;

  const addStudent = (code, seat, name, where) => {
    if (!code) {
      errors.push(`${where}：看不出是哪一班`);
      return;
    }
    if (!/^\d{1,3}$/.test(String(seat))) {
      errors.push(`${where}：座號「${seat || "（空）"}」不是數字`);
      return;
    }
    if (!name) {
      errors.push(`${where}：沒有姓名`);
      return;
    }
    if (!byClass.has(code)) byClass.set(code, []);
    byClass.get(code).push({ preferredPc: Number(seat), seatNo: Number(seat), name: String(name).trim() });
    total += 1;
  };

  tables.forEach(({ sheetName, rows }) => {
    const sheetLabel = sheetName ? `「${sheetName}」` : "";
    const sheetClass = sheetName ? normalizeClassCode("", sheetName) : null;
    const headerIdx = rows.slice(0, 5).findIndex((r) => r.some((cell) => ROSTER_HEADER_PATTERN.test(cell)));

    if (headerIdx >= 0) {
      const header = rows[headerIdx];
      const findCol = (re) => header.findIndex((h) => re.test(h));
      const gradeCol = findCol(/年級/);
      const classCol = header.findIndex((h) => /班級|班別|^班$/.test(h) && !/^年級$/.test(h));
      const seatCol = findCol(/座號|座次/);
      const nameCol = findCol(/姓名|名字/);
      if (seatCol < 0 || nameCol < 0) {
        errors.push(`${sheetLabel}標題列找不到「座號」或「姓名」欄`);
        return;
      }
      rows.slice(headerIdx + 1).forEach((r, i) => {
        if (!r.some(Boolean)) return;
        const code =
          classCol >= 0 || gradeCol >= 0
            ? normalizeClassCode(gradeCol >= 0 ? r[gradeCol] : "", classCol >= 0 ? r[classCol] : "")
            : sheetClass;
        addStudent(code, r[seatCol], r[nameCol], `${sheetLabel}第 ${headerIdx + i + 2} 列`);
      });
      return;
    }

    rows.forEach((raw, i) => {
      const r = raw.filter(Boolean);
      if (!r.length) return;
      const where = `${sheetLabel}第 ${i + 1} 列`;
      if (r.length >= 4 && /^\d$/.test(r[0]) && /^\d{1,2}$/.test(r[1]) && /^\d{1,3}$/.test(r[2])) {
        addStudent(normalizeClassCode(r[0], r[1]), r[2], r[3], where);
      } else if (r.length >= 3) {
        // 班級、座號、姓名；也接受 班級、姓名、座號
        if (!/^\d{1,3}$/.test(r[1]) && /^\d{1,3}$/.test(r[2])) addStudent(normalizeClassCode("", r[0]), r[2], r[1], where);
        else addStudent(normalizeClassCode("", r[0]), r[1], r.slice(2).join(" "), where);
      } else if (r.length === 2 && sheetClass) {
        addStudent(sheetClass, r[0], r[1], where);
      } else {
        errors.push(`${where}：欄位不夠（要有班級、座號、姓名）`);
      }
    });
  });

  return { byClass, errors, total };
}

function resetBulkImportPreview() {
  bulkImportParsed = null;
  document.getElementById("bulkImportPreview").innerHTML = "";
  document.getElementById("bulkImportApplyBtn").disabled = true;
}

function previewBulkImport() {
  const tables = bulkImportSourceRows || [
    { sheetName: "", rows: textToRows(document.getElementById("bulkImportTextarea").value) }
  ];
  const result = parseBulkTables(tables);
  const box = document.getElementById("bulkImportPreview");

  if (result.byClass.size === 0) {
    bulkImportParsed = null;
    document.getElementById("bulkImportApplyBtn").disabled = true;
    box.innerHTML = `<p class="bulk-preview-error">沒有讀到任何學生。${
      result.errors.length ? "<br>" + result.errors.slice(0, 8).map(escapeHtml).join("<br>") : ""
    }</p>`;
    return;
  }

  const codes = [...result.byClass.keys()].sort();
  const rowsHtml = codes
    .map((code) => {
      const list = result.byClass.get(code);
      const exists = appState.classes.some((c) => String(c.code) === code);
      const seatCount = {};
      list.forEach((s) => (seatCount[s.seatNo] = (seatCount[s.seatNo] || 0) + 1));
      const dupSeats = Object.keys(seatCount).filter((k) => seatCount[k] > 1);
      const warns = [];
      if (dupSeats.length) warns.push(`座號重複：${dupSeats.map(pad2).join("、")}（重複的改坐空位）`);
      if (list.length > 29) warns.push(`${list.length} 人超過 29 台，最後 ${list.length - 29} 位排不下`);
      if (list.some((s) => s.seatNo > 29) && list.length <= 29) warns.push("有座號大於 29，會補進空著的機台");
      return `<tr>
        <td>${escapeHtml(code)}</td>
        <td>${list.length}</td>
        <td>${exists ? "整班更新名單" : "<strong>新建班級</strong>"}</td>
        <td>${warns.map(escapeHtml).join("<br>") || "—"}</td>
      </tr>`;
    })
    .join("");

  const newCount = codes.filter((code) => !appState.classes.some((c) => String(c.code) === code)).length;
  bulkImportParsed = result;
  document.getElementById("bulkImportApplyBtn").disabled = false;
  box.innerHTML = `
    <p class="bulk-preview-summary">共 ${result.total} 位學生、${codes.length} 個班級（新建 ${newCount} 班、更新 ${codes.length - newCount} 班）</p>
    ${
      result.errors.length
        ? `<p class="bulk-preview-error">⚠️ 有 ${result.errors.length} 列沒讀進來：<br>${result.errors
            .slice(0, 8)
            .map(escapeHtml)
            .join("<br>")}${result.errors.length > 8 ? "<br>…" : ""}</p>`
        : ""
    }
    <table class="overview-table">
      <thead><tr><th>班級</th><th>人數</th><th>動作</th><th>注意</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

function applyBulkImport() {
  if (!bulkImportParsed) return;
  const codes = [...bulkImportParsed.byClass.keys()].sort();
  const updating = codes.filter((code) => appState.classes.some((c) => String(c.code) === code));
  if (
    !confirm(
      `確定匯入 ${codes.length} 個班級、${bulkImportParsed.total} 位學生？` +
        (updating.length ? `\n\n這 ${updating.length} 班的名單會整班換掉：${updating.join("、")}` : "")
    )
  ) {
    return;
  }

  const overflowNotes = [];
  codes.forEach((code, idx) => {
    const entries = bulkImportParsed.byClass.get(code);
    let cls = appState.classes.find((c) => String(c.code) === code);
    if (!cls) {
      cls = {
        id: `cls_${Date.now()}_${idx}`,
        code,
        grade: Math.floor(Number(code) / 100) || 7,
        day: 1,
        period: 1,
        todayProgress: "",
        nextProgress: "",
        memo: "",
        competencies: [],
        history: [],
        seats: {}
      };
      appState.classes.push(cls);
    }
    const { seats, overflow } = placeStudentsInSeats(entries, cls);
    cls.seats = seats;
    if (overflow.length) overflowNotes.push(`${code}：${overflow.map((s) => s.name).join("、")}`);
  });

  saveAppState();
  renderAll();
  document.getElementById("bulkImportModal").classList.add("hidden");
  alert(
    `✅ 已匯入 ${codes.length} 個班級。新建的班級請到「👥 班級名單」設定上課星期與節次。` +
      (overflowNotes.length ? `\n\n⚠️ 超過 29 台排不下、沒有匯入的學生：\n${overflowNotes.join("\n")}` : "")
  );
}

async function readTextWithEncodingGuess(file) {
  const buf = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch (err) {
    text = new TextDecoder("big5").decode(buf); // 校務系統匯出的 CSV 常是 Big5
  }
  return text.replace(/^﻿/, "");
}

function loadSheetJs() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SHEETJS_URL;
    s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error("Excel 讀取元件載入失敗")));
    s.onerror = () => reject(new Error("Excel 讀取元件下載失敗（網路被擋？可改存成 CSV 再選）"));
    document.head.appendChild(s);
  });
}

async function handleBulkImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  try {
    if (ext === "csv" || ext === "txt") {
      const text = await readTextWithEncodingGuess(file);
      bulkImportSourceRows = [{ sheetName: "", rows: textToRows(text) }];
      document.getElementById("bulkImportTextarea").value = text;
    } else {
      const XLSX = await loadSheetJs();
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      bulkImportSourceRows = wb.SheetNames.map((name) => ({
        sheetName: name,
        rows: XLSX.utils
          .sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" })
          .map((r) => r.map((cell) => String(cell).trim()))
      }));
      document.getElementById("bulkImportTextarea").value = bulkImportSourceRows
        .map((t) => t.rows.map((r) => r.join("\t")).join("\n"))
        .join("\n");
    }
    previewBulkImport();
  } catch (err) {
    bulkImportSourceRows = null;
    alert(`讀檔失敗：${err.message}`);
  } finally {
    e.target.value = "";
  }
}

// ==================== 從 Classroom 點選進度 ====================
// 資料來自同步後端的 lessons 動作（後端快取 5 分鐘）；這裡再存一份在記憶體，5 分鐘內開關彈窗不重抓
// 換連線（網址／密碼）時作廢，不然會把前一個後端的課程帶進來
const CLASSROOM_CLIENT_CACHE_MS = 5 * 60 * 1000;
let classroomLessonsData = null;
let classroomLessonsFetchedAt = 0;
let classroomLessonsEpoch = -1;

// 依年級與今天日期猜課程：8 月～隔年 1 月是上學期，2～7 月是下學期
function guessCourseKey(cls) {
  const month = getTaipeiNow().getMonth() + 1;
  const term = month >= 2 && month <= 7 ? "下" : "上";
  const grade = Number(cls?.grade) === 6 ? "六" : "五";
  return grade + term;
}

function lessonNumber(title) {
  const m = String(title).match(/^第\s*(\d+)\s*節/);
  return m ? Number(m[1]) : null;
}

function getCourseLessons(courseKey) {
  const items = (classroomLessonsData?.courses?.[courseKey] || []).filter((w) => lessonNumber(w.title) !== null);
  items.sort((a, b) => lessonNumber(a.title) - lessonNumber(b.title) || a.title.localeCompare(b.title, "zh-Hant"));
  return items;
}

function latestPublishedIndex(lessons) {
  for (let i = lessons.length - 1; i >= 0; i--) {
    if (lessons[i].state === "PUBLISHED") return i;
  }
  return -1;
}

async function fetchClassroomLessons(refresh = false) {
  const info = document.getElementById("classroomLessonsInfo");
  info.textContent = "正在讀取 Classroom…";
  try {
    const data = await gasRequest({ action: "lessons", refresh });
    if (!data.ok) {
      info.textContent =
        data.error === "classroom_service_missing"
          ? "⚠️ 後端還沒加 Classroom 服務：到 Apps Script 左側「服務」加入 Google Classroom API，再「管理部署作業」換新版本。"
          : `⚠️ ${describeSyncError(data)}`;
      return false;
    }
    classroomLessonsData = data;
    classroomLessonsFetchedAt = Date.now();
    classroomLessonsEpoch = syncConnEpoch;
    return true;
  } catch (err) {
    info.textContent = "⚠️ 連不上同步後端，請確認「☁️ 同步/備份」已連線。";
    return false;
  }
}

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function renderClassroomLessons() {
  const cls = getActiveClass();
  const courseKey = document.getElementById("classroomCourseSelect").value;
  const list = document.getElementById("classroomLessonsList");
  const info = document.getElementById("classroomLessonsInfo");
  if (!classroomLessonsData) {
    list.innerHTML = "";
    return;
  }
  const lessons = getCourseLessons(courseKey);
  const latestIdx = latestPublishedIndex(lessons);
  const recorded = new Set((cls?.history || []).map((h) => h.text));
  const publishedCount = lessons.filter((w) => w.state === "PUBLISHED").length;
  const errs = classroomLessonsData.errors?.length ? `｜⚠️ ${classroomLessonsData.errors.join("；")}` : "";
  info.textContent = `${courseKey}：已發佈 ${publishedCount} 節、草稿 ${lessons.length - publishedCount} 節（${formatShortDate(
    classroomLessonsData.fetchedAt
  )} ${formatTimeHMS(new Date(classroomLessonsData.fetchedAt))} 抓取）${errs}`;

  if (!lessons.length) {
    list.innerHTML = `<p class="form-help">這個課程沒有「第 N 節」開頭的作業。</p>`;
    return;
  }
  list.innerHTML = lessons
    .map((w, idx) => {
      const isDraft = w.state !== "PUBLISHED";
      const stateTag = !isDraft
        ? `<span class="lesson-tag published">已發佈 ${formatShortDate(w.updateTime)}</span>`
        : w.scheduledTime
        ? `<span class="lesson-tag scheduled">排程 ${formatShortDate(w.scheduledTime)}</span>`
        : `<span class="lesson-tag draft">草稿</span>`;
      return `<div class="lesson-row${isDraft ? " is-draft" : ""}${idx === latestIdx ? " is-latest" : ""}" data-idx="${idx}">
        <span class="lesson-title">${escapeHtml(w.title)}</span>
        ${recorded.has(w.title) ? '<span class="lesson-tag recorded">已記錄</span>' : ""}
        ${stateTag}
        <span class="lesson-actions">
          <button type="button" class="record" data-act="record">📌 記入歷程</button>
          <button type="button" data-act="today">📖 今日</button>
          <button type="button" data-act="next">🎯 下次</button>
        </span>
      </div>`;
    })
    .join("");

  list.querySelectorAll(".lesson-row button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".lesson-row");
      applyLessonAction(lessons[Number(row.dataset.idx)].title, btn.dataset.act);
    });
  });
  const latestRow = list.querySelector(".is-latest");
  if (latestRow) latestRow.scrollIntoView({ block: "center" });
}

// 依日期由新到舊插入歷程（回補舊日期時不會跑到最上面）
function addHistoryEntry(cls, date, text) {
  cls.history = cls.history || [];
  if (cls.history.some((h) => h.date === date && h.text === text)) return false;
  const idx = cls.history.findIndex((h) => String(h.date) < date);
  if (idx === -1) cls.history.push({ date, text });
  else cls.history.splice(idx, 0, { date, text });
  return true;
}

function applyLessonAction(title, act) {
  const cls = getActiveClass();
  if (!cls) return;
  if (act === "record") {
    const date = document.getElementById("classroomRecordDate").value || formatDateISO(getTaipeiNow());
    if (!addHistoryEntry(cls, date, title)) {
      alert("這一天已經記過這一節了。");
      return;
    }
  } else if (act === "today") {
    cls.todayProgress = title;
  } else if (act === "next") {
    cls.nextProgress = title;
  }
  saveAppState();
  renderProgressSidebar();
  renderClassroomLessons();
}

function classroomOneClick() {
  const cls = getActiveClass();
  const courseKey = document.getElementById("classroomCourseSelect").value;
  const lessons = getCourseLessons(courseKey);
  const idx = latestPublishedIndex(lessons);
  if (idx === -1) {
    alert(`${courseKey} 還沒有已發佈的節次。`);
    return;
  }
  const today = lessons[idx].title;
  const next = lessons[idx + 1]?.title || "";
  if (!confirm(`「${cls.code}」\n今日進度 → ${today}\n下次進度 → ${next || "（沒有下一節）"}\n\n確定帶入？`)) return;
  cls.todayProgress = today;
  cls.nextProgress = next; // 最後一節時清空，不要留著舊的「下次」跟今日對不上
  saveAppState();
  renderProgressSidebar();
}

// 已發佈節次的上課日：從發佈日（含當天）往後找第一個本班上課星期。
// Classroom 只給得出 updateTime（發佈後若再編輯貼文會往後移），沒有真正的發佈時間，所以是推算值。
function inferClassDate(publishIso, weekday) {
  const d = new Date(publishIso);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7 && d.getDay() !== Number(weekday); i++) d.setDate(d.getDate() + 1);
  return d;
}

function classroomBackfill() {
  const cls = getActiveClass();
  if (!cls) return;
  const courseKey = document.getElementById("classroomCourseSelect").value;
  const published = getCourseLessons(courseKey).filter((w) => w.state === "PUBLISHED" && w.updateTime);
  if (!published.length) {
    alert(`${courseKey} 還沒有已發佈的節次。`);
    return;
  }
  const today = getTaipeiNow();
  today.setHours(0, 0, 0, 0);
  const recorded = new Set((cls.history || []).map((h) => h.text));

  const toAdd = [];
  let skippedRecorded = 0;
  let notYet = 0;
  published.forEach((w) => {
    if (recorded.has(w.title)) {
      skippedRecorded += 1;
      return;
    }
    const date = inferClassDate(w.updateTime, cls.day);
    if (date > today) {
      notYet += 1; // 推算的上課日還沒到＝這班還沒上到
      return;
    }
    toAdd.push({ date: formatDateISO(date), text: w.title });
  });

  if (!toAdd.length) {
    alert(`沒有要補的節次。（已記過 ${skippedRecorded} 節${notYet ? `、還沒上到 ${notYet} 節` : ""}）`);
    return;
  }
  const preview = toAdd
    .slice(0, 8)
    .map((e) => `${e.date}  ${e.text}`)
    .join("\n");
  const ok = confirm(
    `「${cls.code}」要補進 ${toAdd.length} 節（${courseKey}）：\n\n${preview}${toAdd.length > 8 ? "\n…" : ""}\n\n` +
      `日期是用發佈日推算的「本班上課日」（星期${WEEKDAY_NAMES[cls.day]}），不一定是實際上課那天。\n` +
      `跳過：已記過 ${skippedRecorded} 節、還沒上到 ${notYet} 節。\n\n確定補入？`
  );
  if (!ok) return;
  toAdd.forEach((e) => addHistoryEntry(cls, e.date, e.text));
  saveAppState();
  renderProgressSidebar();
  renderClassroomLessons();
}

async function openClassroomLessonsModal() {
  if (!cloudSyncEnabled()) {
    alert("這個功能透過同步後端讀 Classroom，請先到「☁️ 同步/備份」完成連線。");
    return;
  }
  const cls = getActiveClass();
  document.getElementById("classroomLessonsClassTitle").textContent = cls.code;
  document.getElementById("classroomCourseSelect").value = guessCourseKey(cls);
  document.getElementById("classroomRecordDate").value = formatDateISO(getTaipeiNow());
  document.getElementById("classroomLessonsModal").classList.remove("hidden");
  const stale =
    !classroomLessonsData ||
    classroomLessonsEpoch !== syncConnEpoch ||
    Date.now() - classroomLessonsFetchedAt > CLASSROOM_CLIENT_CACHE_MS;
  if (stale) {
    classroomLessonsData = null;
    document.getElementById("classroomLessonsList").innerHTML = "";
    if (!(await fetchClassroomLessons(false))) return;
  }
  renderClassroomLessons();
}

// ==================== 勾選批次刪除班級 ====================
function openBatchDeleteModal() {
  const list = document.getElementById("batchDeleteList");
  const sorted = [...appState.classes].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), "zh-Hant", { numeric: true })
  );
  list.innerHTML = sorted
    .map((cls) => {
      const count = Object.values(cls.seats || {}).filter(Boolean).length;
      return `<label class="batch-delete-item">
        <input type="checkbox" value="${escapeHtml(cls.id)}">
        <span class="batch-delete-code">${escapeHtml(cls.code)}</span>
        <span class="batch-delete-meta">${WEEKDAY_NAMES[cls.day] || "?"}-${cls.period}｜${count} 人</span>
      </label>`;
    })
    .join("");
  document.getElementById("batchDeleteSelectAll").checked = false;
  document.getElementById("batchDeleteModal").classList.remove("hidden");
}

function confirmBatchDelete() {
  const ids = [...document.querySelectorAll("#batchDeleteList input[type=checkbox]:checked")].map((cb) => cb.value);
  if (!ids.length) {
    alert("還沒勾選任何班級。");
    return;
  }
  if (ids.length >= appState.classes.length) {
    alert("至少要留一個班級。想全部重來的話，先匯入新名單再刪舊班。");
    return;
  }
  const codes = appState.classes.filter((c) => ids.includes(c.id)).map((c) => c.code);
  if (!confirm(`確定刪除這 ${codes.length} 個班級？無法復原。\n\n${codes.join("、")}`)) return;
  appState.classes = appState.classes.filter((c) => !ids.includes(c.id));
  if (!appState.classes.some((c) => c.id === appState.activeClassId)) {
    appState.activeClassId = appState.classes[0].id;
  }
  saveAppState();
  renderAll();
  document.getElementById("batchDeleteModal").classList.add("hidden");
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

  // 📚 從 Classroom 點選
  document.getElementById("openClassroomLessonsBtn")?.addEventListener("click", openClassroomLessonsModal);
  document.getElementById("classroomCourseSelect")?.addEventListener("change", renderClassroomLessons);
  document.getElementById("classroomOneClickBtn")?.addEventListener("click", classroomOneClick);
  document.getElementById("classroomBackfillBtn")?.addEventListener("click", classroomBackfill);
  document.getElementById("classroomRefreshBtn")?.addEventListener("click", async () => {
    if (await fetchClassroomLessons(true)) renderClassroomLessons();
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
    document.getElementById("gasWebAppUrlInput").value = getGasUrl();
    document.getElementById("gasSyncKeyInput").value = loadSyncMeta().key;
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
    const { entries, skipped } = parseSingleClassLines(rawLines);
    const { seats, overflow } = placeStudentsInSeats(entries, activeClass);

    const studentCount = Object.values(seats).filter(Boolean).length;
    const notes = [];
    if (skipped.length) notes.push(`略過 ${skipped.length} 行標題或看不懂的內容：${skipped.slice(0, 3).join("、")}`);
    if (overflow.length) notes.push(`⚠️ 超過 29 台排不下的 ${overflow.length} 位沒有匯入：${overflow.map((s) => s.name).join("、")}`);
    if (!confirm(`「${activeClass.code}」將換成 ${studentCount} 位學生（原本的座位會被取代）。${notes.length ? "\n\n" + notes.join("\n") : ""}\n\n確定套用？`)) {
      return;
    }
    activeClass.seats = seats;
    saveAppState();
    renderAll();
    document.getElementById("rosterModal").classList.add("hidden");
  });

  document.getElementById("clearRosterBtn")?.addEventListener("click", () => {
    const activeClass = getActiveClass();
    if (!activeClass) return;
    if (!confirm(`確定要清空「${activeClass.code}」的學生名單嗎？\n（班級、上課節次、進度歷程都會保留，只清掉座位上的學生）`)) return;
    const emptySeats = {};
    ALL_PC_NUMBERS.forEach((pc) => (emptySeats[String(pc)] = null));
    activeClass.seats = emptySeats;
    saveAppState();
    renderAll();
    openRosterModal();
  });

  // 全年級大量匯入
  document.getElementById("openBulkImportBtn")?.addEventListener("click", () => {
    document.getElementById("rosterModal").classList.add("hidden");
    document.getElementById("bulkImportTextarea").value = "";
    document.getElementById("bulkImportFileInput").value = "";
    bulkImportSourceRows = null; // 不清掉的話，上次選的檔案會被當成這次的名單
    resetBulkImportPreview();
    document.getElementById("bulkImportModal").classList.remove("hidden");
  });
  document.getElementById("bulkImportTextarea")?.addEventListener("input", () => {
    bulkImportSourceRows = null; // 改了文字就以文字框為準
    resetBulkImportPreview();
  });
  document.getElementById("bulkImportFileInput")?.addEventListener("change", handleBulkImportFile);
  document.getElementById("bulkImportPreviewBtn")?.addEventListener("click", previewBulkImport);
  document.getElementById("bulkImportApplyBtn")?.addEventListener("click", applyBulkImport);

  // 勾選批次刪除班級
  document.getElementById("openBatchDeleteBtn")?.addEventListener("click", () => {
    document.getElementById("rosterModal").classList.add("hidden");
    openBatchDeleteModal();
  });
  document.getElementById("batchDeleteSelectAll")?.addEventListener("change", (e) => {
    document.querySelectorAll("#batchDeleteList input[type=checkbox]").forEach((cb) => (cb.checked = e.target.checked));
  });
  document.getElementById("batchDeleteConfirmBtn")?.addEventListener("click", confirmBatchDelete);

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
  document.getElementById("saveGasUrlBtn")?.addEventListener("click", async () => {
    const url = document.getElementById("gasWebAppUrlInput").value.trim();
    const key = document.getElementById("gasSyncKeyInput").value.trim();
    if (!url) {
      alert("請貼上網頁應用程式網址。");
      return;
    }
    await connectCloudSync(url, key);
  });

  document.getElementById("pullFromGasBtn")?.addEventListener("click", pullStateFromGas);

  document.getElementById("disconnectGasBtn")?.addEventListener("click", () => {
    if (!confirm("中斷這台的試算表同步？（試算表裡的資料不會被刪除）")) return;
    disconnectCloudSync(true);
    document.getElementById("gasWebAppUrlInput").value = "";
    document.getElementById("gasSyncKeyInput").value = "";
  });

  // 切回這個分頁時，抓別台的更新（30 秒內不重複）
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastFocusSyncAt < SYNC_FOCUS_THROTTLE_MS) return;
    lastFocusSyncAt = Date.now();
    reconcileWithCloud();
  });

  document.getElementById("exportJsonBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `羅東國小_羅小高年級科技課學習狀態_備份_${formatDateISO(getTaipeiNow())}.json`;
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
  if (cloudSyncEnabled()) {
    lastFocusSyncAt = Date.now();
    reconcileWithCloud();
  }
});
