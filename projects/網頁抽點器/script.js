const defaultStudents = [
  "學生 01",
  "學生 02",
  "學生 03",
  "學生 04",
  "學生 05",
  "學生 06",
  "學生 07",
  "學生 08",
  "學生 09",
  "學生 10"
];

const legacyStorageKey = "teacher-random-picker-students";
const storageKey = "teacher-random-picker-students-generic-v2";
const studentName = document.querySelector("#studentName");
const statusText = document.querySelector("#statusText");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const resetButton = document.querySelector("#resetButton");
const studentList = document.querySelector("#studentList");
const rosterFile = document.querySelector("#rosterFile");
const appTitle = document.querySelector("#app-title");
const listTitle = document.querySelector("#list-title");

let timerId = null;
let lastName = "";

function loadStudentsText() {
  return localStorage.getItem(storageKey) || defaultStudents.join("\n");
}

function getStudents() {
  return studentList.value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows
    .map((items) => items.map((item) => item.replace(/^\uFEFF/, "").trim()))
    .filter((items) => items.some(Boolean));
}

function normalizeHeader(header) {
  return header.replace(/^\uFEFF/, "").trim();
}

function buildRosterFromCsv(text) {
  const rows = parseCsv(text);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const classIndex = headers.indexOf("班級");
  const seatIndex = headers.indexOf("座號");
  const nameIndex = headers.indexOf("姓名");

  if (seatIndex === -1 || nameIndex === -1) {
    throw new Error("CSV 需要包含「座號」與「姓名」欄位。");
  }

  const students = rows
    .slice(1)
    .map((row) => {
      const className = classIndex === -1 ? "" : (row[classIndex] || "").trim();
      const seat = (row[seatIndex] || "").trim();
      const name = (row[nameIndex] || "").trim();
      return { className, seat, name };
    })
    .filter((student) => student.seat && student.name)
    .map((student) => ({
      className: student.className,
      label: `${student.seat} ${student.name}`
    }));

  const classNames = [...new Set(students.map((student) => student.className).filter(Boolean))];
  const classLabel = classNames.length === 1 ? `${classNames[0]} 班` : "";

  return {
    classLabel,
    roster: students.map((student) => student.label)
  };
}

function readRosterFile(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const result = buildRosterFromCsv(String(reader.result || ""));
      const roster = result.roster;

      if (roster.length === 0) {
        throw new Error("沒有讀到可用的座號與姓名。");
      }

      stopDraw();
      appTitle.textContent = result.classLabel ? `${result.classLabel}抽點器` : "網頁抽點器";
      listTitle.textContent = result.classLabel ? `${result.classLabel}學生名單` : "學生名單";
      studentList.value = roster.join("\n");
      localStorage.setItem(storageKey, studentList.value);
      studentName.textContent = "準備開始";
      statusText.textContent = result.classLabel
        ? `已產生 ${result.classLabel} ${roster.length} 位學生的抽點器。`
        : `已產生 ${roster.length} 位學生的抽點器。`;
    } catch (error) {
      studentName.textContent = "匯入失敗";
      statusText.textContent = error.message;
    }
  });

  reader.readAsText(file, "utf-8");
}

function pickStudent(students) {
  if (students.length === 1) {
    return students[0];
  }

  let nextName = students[Math.floor(Math.random() * students.length)];
  while (nextName === lastName) {
    nextName = students[Math.floor(Math.random() * students.length)];
  }
  lastName = nextName;
  return nextName;
}

function setRunning(isRunning) {
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
  studentName.classList.toggle("is-running", isRunning);
}

function startDraw() {
  const students = getStudents();

  if (students.length === 0) {
    studentName.textContent = "名單是空的";
    statusText.textContent = "請先在下方輸入學生姓名。";
    return;
  }

  setRunning(true);
  statusText.textContent = "抽點中...";

  timerId = window.setInterval(() => {
    studentName.textContent = pickStudent(students);
  }, 70);
}

function stopDraw() {
  if (timerId === null) {
    return;
  }

  window.clearInterval(timerId);
  timerId = null;
  setRunning(false);

  const pickedName = studentName.textContent.trim();
  statusText.textContent = pickedName ? `抽到：${pickedName}` : "已停止。";
}

localStorage.removeItem(legacyStorageKey);
studentList.value = loadStudentsText();

studentList.addEventListener("input", () => {
  localStorage.setItem(storageKey, studentList.value);
});

startButton.addEventListener("click", startDraw);
stopButton.addEventListener("click", stopDraw);

resetButton.addEventListener("click", () => {
  stopDraw();
  appTitle.textContent = "網頁抽點器";
  listTitle.textContent = "學生名單";
  studentList.value = defaultStudents.join("\n");
  localStorage.setItem(storageKey, studentList.value);
  studentName.textContent = "準備開始";
  statusText.textContent = "已還原範例名單。";
});

rosterFile.addEventListener("change", () => {
  const file = rosterFile.files[0];

  if (!file) {
    return;
  }

  readRosterFile(file);
  rosterFile.value = "";
});
