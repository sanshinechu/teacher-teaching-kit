// 批次匯入作品：把老師從 Excel 貼上的文字解析成一列一列的作品，並做檢查。
// 只有純運算，不碰畫面與 Firebase，所以可以單獨用 Node 測試。

export const DEFAULT_TITLE = "我的第一個程式";
export const MAX_TITLE_LENGTH = 100;

// 全形數字與空白轉半形。只用在「班級」「座號」欄，作品標題不動（不然全形標點會被改掉）
function toHalfWidth(value) {
  return value
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .trim();
}

function normalizeImportUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// 比對「同一件作品」用：忽略大小寫、結尾斜線與 # 後面的片段（例如 #editor）
export function urlKey(url) {
  return url.trim().toLowerCase().replace(/#.*$/, "").replace(/\/+$/, "");
}

function findClasses(classCell, classes) {
  const cell = toHalfWidth(classCell);
  if (!cell) {
    return [];
  }

  const exact = classes.filter((item) => item.name === cell);
  if (exact.length > 0) {
    return exact;
  }

  // 只填三碼班號（例如 501）：找名稱裡獨立出現這三碼的班級，避免 5011 之類誤中
  if (/^\d{3}$/.test(cell)) {
    return classes.filter((item) => new RegExp(`(^|\\D)${cell}(\\D|$)`).test(item.name));
  }

  return classes.filter((item) => item.name.includes(cell));
}

function splitLine(line) {
  const cells = (line.includes("\t") ? line.split("\t") : line.split(","))
    .map((cell) => cell.trim());
  while (cells.length > 0 && cells[cells.length - 1] === "") {
    cells.pop();
  }
  return cells;
}

function looksLikeHeader(cells) {
  return !cells.some((cell) => /^https?:\/\//i.test(cell))
    && cells.some((cell) => /班級|座號|網址|連結|標題/.test(cell));
}

/**
 * @param {string} text        貼上的原始文字，每行一件作品：班級、座號、作品網址、[作品標題]
 * @param {{classes: {id:string,name:string}[], defaultTitle?: string}} options
 *        classes 是「可匯入的班級」，呼叫端已經依所選資料夾篩過
 * @returns {Array} 每列：{ lineNumber, classCell, seat, url, title, classId, className,
 *                         authorName, errors: string[], warnings: string[] }
 */
export function parseImportText(text, { classes, defaultTitle = DEFAULT_TITLE }) {
  const rows = [];
  const lines = String(text || "").split(/\r?\n/);
  let sawFirstLine = false;

  lines.forEach((line, index) => {
    if (!line.trim()) {
      return;
    }

    const cells = splitLine(line);
    if (!sawFirstLine) {
      sawFirstLine = true;
      if (looksLikeHeader(cells)) {
        return; // 第一行是標題列就略過
      }
    }

    const row = {
      lineNumber: index + 1,
      classCell: cells[0] || "",
      seat: "",
      url: "",
      title: "",
      classId: "",
      className: "",
      authorName: "",
      errors: [],
      warnings: []
    };

    // 網址欄：優先找 http 開頭的那格，找不到就當第 3 格（可能忘了寫 https://）
    let urlIndex = cells.findIndex((cell, i) => i >= 2 && /^https?:\/\//i.test(cell));
    if (urlIndex === -1) {
      urlIndex = 2;
    }
    const titleIndex = cells.findIndex((cell, i) => i >= 2 && i !== urlIndex && cell !== "");

    // 班級
    const matched = findClasses(row.classCell, classes);
    if (matched.length === 0) {
      row.errors.push(row.classCell ? `找不到班級「${row.classCell}」` : "缺少班級");
    } else if (matched.length > 1) {
      row.errors.push(`「${row.classCell}」對到 ${matched.length} 個班級，請寫完整班級名稱`);
    } else {
      row.classId = matched[0].id;
      row.className = matched[0].name;
    }

    // 座號
    const seat = toHalfWidth(cells[1] || "");
    if (!/^\d{1,2}$/.test(seat) || Number(seat) === 0) {
      row.errors.push(seat ? `座號「${cells[1]}」要是 1～99 的數字` : "缺少座號");
    } else {
      row.seat = seat.padStart(2, "0");
    }

    // 網址
    const rawUrl = cells[urlIndex] || "";
    if (!rawUrl) {
      row.errors.push("缺少作品網址");
    } else {
      const candidate = normalizeImportUrl(rawUrl);
      let valid = !/\s/.test(candidate);
      if (valid) {
        try {
          const parsed = new URL(candidate);
          valid = (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
        } catch {
          valid = false;
        }
      }

      if (valid) {
        row.url = candidate;
      } else {
        row.errors.push(`作品網址看起來不對：${rawUrl}`);
      }
    }

    // 標題
    row.title = titleIndex === -1 ? defaultTitle : cells[titleIndex];
    if (!row.title) {
      row.title = defaultTitle;
    }
    if (row.title.length > MAX_TITLE_LENGTH) {
      row.errors.push(`作品標題超過 ${MAX_TITLE_LENGTH} 字`);
    }

    // 顯示名稱：去識別化，只用「班號 座號」。
    // 班級名稱通常長得像 115_501_我的第一個程式，第一組三碼是學年度不是班號，
    // 所以：老師填的就是三碼就直接用；否則取名稱裡「最後一組」三碼。
    if (row.classId && row.seat) {
      const cell = toHalfWidth(row.classCell);
      const tokens = row.className.match(/(?<!\d)\d{3}(?!\d)/g) || [];
      const code = /^\d{3}$/.test(cell) ? cell : tokens[tokens.length - 1] || cell;
      row.authorName = `${code} 座號 ${row.seat}`;
    }

    rows.push(row);
  });

  return rows;
}

/**
 * 標出重複與已存在的作品。
 * @param {Array} rows  parseImportText 的結果（會直接改寫 row.status）
 * @param {Record<string, Array<{url:string, authorName?:string}>>} existingByClass 每班牆上已有的作品
 * @returns {{total:number, ok:number, duplicate:number, error:number}}
 */
export function classifyRows(rows, existingByClass = {}) {
  const seen = new Set();
  const summary = { total: rows.length, ok: 0, duplicate: 0, error: 0 };

  rows.forEach((row) => {
    if (row.errors.length > 0) {
      row.status = "error";
      summary.error += 1;
      return;
    }

    const key = `${row.classId}|${urlKey(row.url)}`;
    const existing = existingByClass[row.classId] || [];

    if (existing.some((work) => urlKey(work.url || "") === urlKey(row.url))) {
      row.status = "duplicate";
      row.warnings.push("牆上已經有這個網址，會略過");
      summary.duplicate += 1;
      return;
    }

    if (seen.has(key)) {
      row.status = "duplicate";
      row.warnings.push("貼上的內容裡重複了，會略過");
      summary.duplicate += 1;
      return;
    }

    seen.add(key);
    row.status = "ok";

    // 同座號已經有別的作品：不擋，只提醒（可能是重交或改過連結）
    if (existing.some((work) => work.authorName === row.authorName)) {
      row.warnings.push("這個座號牆上已有作品，仍會新增");
    }
    summary.ok += 1;
  });

  return summary;
}
