/**
 * 羅東國小｜115 電腦課神隊友 — Google 試算表自動同步後端 (Google Apps Script)
 *
 * 【部署步驟】
 * 1. 新增一份空白 Google 試算表，在上方選單點選「擴充功能 > Apps Script」。
 * 2. 將本檔案全部內容貼上並取代原本的程式碼，按 Ctrl+S 儲存。
 * 3. 點選右上角「部署 > 新增部署作業」，類型選擇「網頁應用程式 (Web App)」：
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：所有人 (Anyone)
 * 4. 複製部署後產生的「網頁應用程式網址 (https://script.google.com/macros/s/.../exec)」，
 *    貼回「電腦課神隊友」網頁右上角「☁️ 同步/備份」設定中即可！
 */

const STATE_SHEET_NAME = "系統狀態庫_請勿手動改";
const PROGRESS_SHEET_NAME = "各班進度總覽";
const REPAIR_SHEET_NAME = "機台報修紀錄";

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureSheet(ss, STATE_SHEET_NAME);
  const jsonStr = sheet.getRange("A2").getValue();

  let payload = null;
  if (jsonStr) {
    try {
      payload = JSON.parse(jsonStr);
    } catch (err) {
      payload = null;
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      updatedAt: sheet.getRange("B2").getValue() || null,
      payload: payload
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const body = JSON.parse(e.postData.contents || "{}");
  const payload = body.payload;

  if (payload) {
    // 1. 儲存完整 JSON 狀態供跨機還原
    const stateSheet = ensureSheet(ss, STATE_SHEET_NAME);
    stateSheet.getRange("A1:B1").setValues([["完整狀態 JSON", "最後更新時間"]]);
    stateSheet.getRange("A2:B2").setValues([[JSON.stringify(payload), new Date()]]);

    // 2. 同步輸出人類易讀的「各班進度總覽」工作表
    syncReadableProgressSheet(ss, payload);

    // 3. 同步輸出「機台報修紀錄」工作表
    syncReadableRepairSheet(ss, payload);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, savedAt: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
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

function ensureSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
