/**
 * 羅東國小｜115 電腦課神隊友 — Google 試算表自動同步後端 (Google Apps Script)
 *
 * 【部署步驟】
 * 1. 到 script.google.com 新增專案（或從試算表「擴充功能 > Apps Script」開都可以）。
 * 2. 將本檔案全部內容貼上並取代原本的程式碼，填好下方 SYNC_KEY，按 Ctrl+S 儲存。
 *    存資料的試算表會在第一次開網址時自動建立（見 SPREADSHEET_ID 說明）。
 * 3. 點選右上角「部署 > 新增部署作業」，類型選擇「網頁應用程式 (Web App)」：
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：所有人 (Anyone)
 * 4. 複製部署後產生的「網頁應用程式網址 (https://script.google.com/macros/s/.../exec)」，
 *    連同下方 SYNC_KEY 通關密碼，一起貼回「電腦課神隊友」網頁的「☁️ 同步/備份」設定。
 *
 * 【安全】資料裡有學生姓名。「所有人」可存取只代表不用登入 Google，
 *  沒有正確的 SYNC_KEY 一律讀不到也寫不進。
 *  ⚠️ 部署前一定要把 SYNC_KEY 改成你自己的密碼（至少 8 碼，英文數字混用），沒改的話後端會拒絕所有請求。
 *
 * 【版本號】每次寫入版本 +1。網頁上傳時會附上「我是根據第幾版改的」，
 *  雲端已經被別台改得更新時會回 conflict，不會直接覆蓋，由網頁請老師決定留哪一份。
 *
 * 【修改程式後】要「部署 > 管理部署作業 > 編輯 > 版本選新版本」才會生效，網址不變。
 */

const SYNC_KEY = "請改成你自己的通關密碼";

// 存資料的試算表 ID（選填）。
// 留空：第一次被呼叫時自動在你的雲端硬碟建一份「電腦課神隊友_同步資料」，ID 記在
//       「專案設定 > 指令碼屬性」的 SPREADSHEET_ID，之後都開那一份。
// 想指定既有試算表：填網址 https://docs.google.com/spreadsheets/d/【這一段】/edit 的中間那段。
// 為什麼不用 getActiveSpreadsheet()：獨立建立的 Apps Script 專案（不是從試算表「擴充功能」開的）
// 沒有所屬試算表，回傳 null（2026-11-10 實際部署測出）。
const SPREADSHEET_ID = "";
const AUTO_SPREADSHEET_NAME = "電腦課神隊友_同步資料";

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("SPREADSHEET_ID");
  if (savedId) return SpreadsheetApp.openById(savedId);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty("SPREADSHEET_ID", active.getId());
    return active;
  }

  // 第一次：自動建立。建完再讀一次，萬一兩個請求同時進來各建了一份，只留先記下的那份
  const created = SpreadsheetApp.create(AUTO_SPREADSHEET_NAME);
  const raced = props.getProperty("SPREADSHEET_ID");
  if (raced) {
    DriveApp.getFileById(created.getId()).setTrashed(true);
    return SpreadsheetApp.openById(raced);
  }
  props.setProperty("SPREADSHEET_ID", created.getId());
  return created;
}

// 「📚 Classroom」按鈕要讀的課程（一個年級學期一個課程）。
// 來源：12_備課工作流/Classroom/五六年級上架/Code.gs 的 COURSE_ID_MAP，換學年要一起改。
// 用到這個功能前，要在 Apps Script 左側「服務」加入 Google Classroom API。
const CLASSROOM_COURSES = {
  "五上": "871806405545",
  "五下": "871805678921",
  "六上": "871804598785",
  "六下": "871801871757"
};
const LESSONS_CACHE_SECONDS = 300;

const STATE_SHEET_NAME = "系統狀態庫_請勿手動改";
const PROGRESS_SHEET_NAME = "各班進度總覽";
const REPAIR_SHEET_NAME = "機台報修紀錄";

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function keyIsValid(key) {
  if (!SYNC_KEY || SYNC_KEY === "請改成你自己的通關密碼" || SYNC_KEY.length < 8) return false;
  return String(key || "") === SYNC_KEY;
}

// 試算表單一儲存格上限 50,000 字，全年級名單＋歷程會超過，所以 JSON 拆段存在 A 欄往下
// 狀態欄位：B2 最後更新時間、C2 版本號、D2 分段數
const CHUNK_SIZE = 40000;

function readState(ss) {
  const sheet = ensureSheet(ss, STATE_SHEET_NAME);
  const meta = sheet.getRange("B2:D2").getValues()[0];
  // 段數不可超過實際有資料的列數（D2 被手動改成大數字時，避免讀上百萬格卡到逾時）
  const chunkCount = Math.max(1, Math.min(Number(meta[2]) || 1, sheet.getLastRow() - 1));
  const parts = sheet.getRange(2, 1, chunkCount, 1).getValues().map(function (r) {
    return String(r[0] || "").replace(/^~/, "");
  });
  const jsonStr = parts.join("");
  let payload = null;
  let corrupt = false;
  if (jsonStr) {
    try {
      payload = JSON.parse(jsonStr);
    } catch (err) {
      corrupt = true; // 一定要跟「空的」分開：當成空的，網頁會把本機資料傳上來蓋掉
    }
  }
  return {
    corrupt: corrupt,
    payload: payload,
    updatedAt: meta[0] ? new Date(meta[0]).toISOString() : null,
    version: Number(meta[1]) || 0
  };
}

function writeState(ss, payload, now, version) {
  const sheet = ensureSheet(ss, STATE_SHEET_NAME);
  const jsonStr = JSON.stringify(payload);
  const chunks = [];
  // 每段前面加「~」：切在任意位置的片段可能以 = + - 開頭被當成公式，
  // 或像 "1.50" 被轉成數字吃掉字元，加前綴後一律當文字存
  for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
    chunks.push(["~" + jsonStr.slice(i, i + CHUNK_SIZE)]);
  }
  if (chunks.length === 0) chunks.push(["~"]);

  // 先清掉舊的分段（舊資料可能比較長）
  const lastRow = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(2, 1, lastRow - 1, 1).clearContent();

  sheet.getRange("A1:D1").setValues([["完整狀態 JSON（分段）", "最後更新時間", "版本號", "分段數"]]);
  sheet.getRange(2, 1, chunks.length, 1).setValues(chunks);
  sheet.getRange("B2:D2").setValues([[now, version, chunks.length]]);
}

// 直接用瀏覽器打開網址確認部署用：真的讀一次試算表，讀不到就報錯，不會出現假的「部署成功」
// 只回版本號，不回資料；資料一律走 doPost
function doGet() {
  try {
    const ss = getSpreadsheet_();
    const state = readState(ss);
    return jsonOut({
      ok: true,
      service: "電腦課神隊友同步後端",
      note: "部署成功，試算表可讀寫。資料請由網頁以 POST 讀寫。",
      spreadsheet: ss.getName(), // 只回名稱（到雲端硬碟搜尋得到），不回 ID

      version: state.version,
      keyConfigured: keyIsValid(SYNC_KEY)
    });
  } catch (err) {
    return jsonOut({ ok: false, error: "spreadsheet_unavailable", detail: String(err) });
  }
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return jsonOut({ ok: false, error: "bad_json" });
  }
  if (!keyIsValid(body.key)) {
    return jsonOut({ ok: false, error: "unauthorized" });
  }

  // 課程清單只讀 Classroom、不碰試算表，不需要拿鎖
  if (body.action === "lessons") {
    return jsonOut(listClassroomLessons_(!!body.refresh));
  }

  const isLoad = body.action === "load";
  const payload = body.payload;
  if (!isLoad && (!payload || !Array.isArray(payload.classes))) {
    return jsonOut({ ok: false, error: "bad_payload" });
  }

  // 讀和寫都要拿同一把鎖：寫到一半（舊段清掉、新段還沒寫完）去讀，會讀到拼錯的資料
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return jsonOut({ ok: false, error: "busy" });
  }
  try {
    const ss = getSpreadsheet_();
    const current = readState(ss);
    // 資料毀損時只接受「強制覆蓋」（由網頁衝突對話框選「用這台覆蓋」），其餘一律報錯
    if (current.corrupt && (isLoad || !body.force)) {
      return jsonOut({ ok: false, error: "corrupt", version: current.version });
    }

    // 讀取也走 POST：通關密碼放在內文，不會出現在網址上
    if (isLoad) {
      return jsonOut({ ok: true, version: current.version, updatedAt: current.updatedAt, payload: current.payload });
    }

    const baseVersion = Number(body.baseVersion) || 0;
    if (!body.force && baseVersion !== current.version) {
      return jsonOut({ ok: false, error: "conflict", version: current.version, updatedAt: current.updatedAt });
    }

    const newVersion = current.version + 1;
    const now = new Date();
    writeState(ss, payload, now, newVersion);

    syncReadableProgressSheet(ss, payload);
    syncReadableRepairSheet(ss, payload);
    SpreadsheetApp.flush();

    return jsonOut({ ok: true, version: newVersion, updatedAt: now.toISOString() });
  } finally {
    lock.releaseLock();
  }
}

function syncReadableProgressSheet(ss, payload) {
  const sheet = ensureSheet(ss, PROGRESS_SHEET_NAME);
  sheet.clearContents();
  const rows = [
    ["班級", "星期", "節次", "今日 / 上次進度", "下次預定進度", "課堂備忘錄", "已具備科技能力數", "最近一筆歷程日期"]
  ];

  (payload.classes || []).forEach(function (cls) {
    const latestDate = (cls.history && cls.history[0] && cls.history[0].date) || "";
    rows.push([
      cls.code,
      cls.day,
      cls.period,
      cls.todayProgress || "",
      cls.nextProgress || "",
      cls.memo || "",
      (cls.competencies || []).length,
      latestDate
    ]);
  });

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function syncReadableRepairSheet(ss, payload) {
  const sheet = ensureSheet(ss, REPAIR_SHEET_NAME);
  sheet.clearContents();
  const rows = [["機台編號", "故障標籤", "故障原因描述", "登記日期"]];

  const repairs = payload.pcRepairs || {};
  Object.keys(repairs)
    .sort(function (a, b) {
      return Number(a) - Number(b);
    })
    .forEach(function (pcKey) {
      const info = repairs[pcKey];
      rows.push([
        "PC-" + ("0" + pcKey).slice(-2),
        (info.tags || []).join("、"),
        info.reason || "",
        info.updatedAt || ""
      ]);
    });

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

// 列出各課程的作業（已發佈＋草稿），只回標題、狀態、時間，不含學生資料
function listClassroomLessons_(refresh) {
  if (typeof Classroom === "undefined") {
    return { ok: false, error: "classroom_service_missing" };
  }
  const cache = CacheService.getScriptCache();
  if (!refresh) {
    const hit = cache.get("lessons_v1");
    if (hit) return JSON.parse(hit);
  }

  const courses = {};
  const errors = [];
  Object.keys(CLASSROOM_COURSES).forEach(function (key) {
    const courseId = CLASSROOM_COURSES[key];
    if (!courseId) return;
    const items = [];
    try {
      let pageToken;
      do {
        const r = Classroom.Courses.CourseWork.list(courseId, {
          courseWorkStates: ["PUBLISHED", "DRAFT"],
          pageSize: 100,
          pageToken: pageToken
        });
        (r.courseWork || []).forEach(function (w) {
          items.push({
            title: w.title || "",
            state: w.state,
            updateTime: w.updateTime || null,
            scheduledTime: w.scheduledTime || null
          });
        });
        pageToken = r.nextPageToken;
      } while (pageToken);
      courses[key] = items;
    } catch (err) {
      errors.push(key + "：" + String(err).slice(0, 120));
    }
  });

  const result = { ok: true, fetchedAt: new Date().toISOString(), courses: courses, errors: errors };
  try {
    cache.put("lessons_v1", JSON.stringify(result), LESSONS_CACHE_SECONDS);
  } catch (err) {
    // 超過快取上限（100KB）就不快取，照樣回傳
  }
  return result;
}

function ensureSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
