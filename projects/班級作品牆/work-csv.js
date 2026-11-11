const columns = ["班級", "班級代碼", "作品標題", "作品網址", "說明"];

// 網址由瀏覽器正規化。保留路徑、查詢參數與片段，因為它們可能指向不同作品。
export function workUrl(value) {
  const text = value.trim();
  try {
    if (!/^https?:\/\//i.test(text)) return "";
    const url = new URL(text);
    return url.username || url.password ? "" : url.href;
  } catch {
    return "";
  }
}

export function validateWork({ title, url, note }) {
  if (!title || [...title].length > 100) return "作品標題須為 1～100 字";
  if (!url) return "請填寫有效的 http 或 https 作品網址";
  if ([...note].length > 1000) return "說明最多 1,000 字";
  return "";
}

// Excel 會把這些文字當成公式。匯入本工具匯出的 CSV 時取回原始文字。
const formulaStart = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/;

function encodeCell(value) {
  const text = formulaStart.test(value) || value.startsWith("'") ? "'" + value : value;
  return `"${text.replaceAll('"', '""')}"`;
}

function decodeCell(value) {
  const rest = value.slice(1);
  return value.startsWith("'") && (formulaStart.test(rest) || rest.startsWith("'")) ? rest : value;
}

export function writeWorkCsv(rows) {
  return "\uFEFF" + [
    columns,
    ...rows.map(({ classroom, title, url, note }) => [classroom.name, classroom.id, title, url, note || ""])
  ].map((row) => row.map(encodeCell).join(",")).join("\r\n") + "\r\n";
}

export function readWorkCsv(text) {
  const source = text.replace(/^\uFEFF/, "");
  // 逐欄讀取，讓引號內的逗號、換行及雙引號都能原樣保留。
  const token = /(?:"((?:[^"]|"")*)"|([^",\r\n]*))(,|\r\n|\r|\n|$)/y;
  const records = [];
  let fields = [];
  let position = 0;
  while (position < source.length) {
    token.lastIndex = position;
    const match = token.exec(source);
    if (!match || token.lastIndex === position) {
      throw new Error(`第 ${records.length + 1} 筆 CSV 紀錄的引號格式有誤。`);
    }
    fields.push(decodeCell(match[1] === undefined ? match[2] : match[1].replaceAll('""', '"')));
    position = token.lastIndex;
    if (match[3] !== ",") {
      records.push(fields);
      fields = [];
    }
  }
  if (fields.length) records.push([...fields, ""]);

  const header = (records.shift() || []).map((value) => value.trim());
  const [className, classId, title, url, note] = columns.map((column) => header.indexOf(column));
  const namedColumns = header.filter(Boolean);
  if (className < 0 || title < 0 || url < 0 || new Set(namedColumns).size !== namedColumns.length) {
    throw new Error("CSV 首列必須包含「班級」、「作品標題」、「作品網址」，且欄名不能重複。");
  }
  return records.flatMap((row, index) => row.every((value) => !value.trim()) ? [] : [{
    number: index + 2,
    invalidColumns: row.length <= Math.max(className, title, url)
      || row.slice(header.length).some((value) => value.trim()),
    className: (row[className] || "").trim(),
    classId: (row[classId] || "").trim(),
    title: (row[title] || "").trim(),
    url: workUrl(row[url] || ""),
    note: (row[note] || "").trim()
  }]);
}

export function resolveWorkRows(rows, classrooms, getClassCode) {
  return rows.map((row) => {
    if (row.invalidColumns) return { ...row, error: "欄數與首列不符" };
    const matches = row.classId
      ? classrooms.filter((classroom) => classroom.id === row.classId)
      : classrooms.filter((classroom) => classroom.name.trim() === row.className
        || (/^\d{3}$/.test(row.className) && getClassCode(classroom) === row.className));
    if (matches.length !== 1) {
      return { ...row, error: matches.length ? "有多個同名班級，請填班級代碼" : "找不到可管理的班級" };
    }
    const [classroom] = matches;
    if (row.classId && row.className
        && row.className !== classroom.name.trim() && row.className !== getClassCode(classroom)) {
      return { ...row, error: "班級名稱和代碼不符。換班時請更新或清空班級代碼" };
    }
    return { ...row, classroom, error: validateWork(row) };
  });
}
