const firebaseConfig = window.TeacherProjectWallFirebaseConfig || {};

const storageKey = "teacher-project-wall-v1";
// 收起哪些資料夾只是這台電腦的偏好，不存 Firestore
const collapsedStorageKey = "teacher-project-wall-collapsed-folders";
// 作品用「卡片」還是「清單」顯示，同樣只記在這台電腦
const viewStorageKey = "teacher-project-wall-view";
const screenshotBase = "https://image.thum.io/get/width/900/crop/640/noanimate/";
const teacherEmails = ["shine@tmail.ilc.edu.tw"];

const elements = {
  authStatus: document.querySelector("#authStatus"),
  loginButton: document.querySelector("#loginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  setupNotice: document.querySelector("#setupNotice"),
  teacherPanel: document.querySelector(".teacher-panel"),
  classForm: document.querySelector("#classForm"),
  classNameInput: document.querySelector("#classNameInput"),
  folderForm: document.querySelector("#folderForm"),
  folderNameInput: document.querySelector("#folderNameInput"),
  classList: document.querySelector("#classList"),
  classFolderField: document.querySelector("#classFolderField"),
  classFolderSelect: document.querySelector("#classFolderSelect"),
  activeClassPanel: document.querySelector("#activeClassPanel"),
  activeClassName: document.querySelector("#activeClassName"),
  activeClassHint: document.querySelector("#activeClassHint"),
  copyClassLinkButton: document.querySelector("#copyClassLinkButton"),
  copyShareLinkButton: document.querySelector("#copyShareLinkButton"),
  submissionLayout: document.querySelector(".submission-layout"),
  submissionForm: document.querySelector("#submissionForm"),
  titleInput: document.querySelector("#titleInput"),
  urlInput: document.querySelector("#urlInput"),
  noteInput: document.querySelector("#noteInput"),
  previewFrame: document.querySelector(".preview-frame"),
  previewImage: document.querySelector("#previewImage"),
  galleryGrid: document.querySelector("#galleryGrid"),
  viewToggle: document.querySelector("#viewToggle"),
  galleryTitle: document.querySelector("#gallery-title"),
  submissionCount: document.querySelector("#submissionCount"),
  classFilter: document.querySelector("#classFilter"),
  classButtonTemplate: document.querySelector("#classButtonTemplate"),
  cardTemplate: document.querySelector("#cardTemplate")
};

const initialParams = new URLSearchParams(window.location.search);

// 評審分享連結：?share=班級代碼,班級代碼,…&title=資料夾名稱。代碼要長得像班級 id，
// 不合格的直接丟掉，免得被塞進 Firestore 路徑（例如含斜線）
const sharedClassIds = (initialParams.get("share") || "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => /^[A-Za-z0-9_-]{6,80}$/.test(value));

const state = {
  mode: "local",
  user: null,
  classes: [],
  folders: [],
  submissions: [],
  activeClassId: initialParams.get("class") || "",
  // 資料夾與班級擇一：有班級連結就以班級為主
  activeFolderId: initialParams.get("class") ? "" : initialParams.get("folder") || "",
  // 資料夾模式下只看某一班；空字串代表全部
  folderClassFilter: "",
  collapsedFolders: loadCollapsedFolders(),
  galleryView: loadGalleryView(),
  sharedClassIds,
  sharedTitle: (initialParams.get("title") || "").slice(0, 80),
  // 訪客看到的資料夾封面
  showcaseFolders: [],
  // 老師端用來算封面的作品快取：classId -> 作品陣列
  summaryWorks: {},
  summaryListeners: {},
  summaryTimer: null,
  classesLoaded: false,
  firebase: null,
  unsubscribeClasses: null,
  unsubscribeFolders: null,
  unsubscribeShowcase: null,
  unsubscribeSubmissions: []
};

function loadCollapsedFolders() {
  try {
    const stored = JSON.parse(localStorage.getItem(collapsedStorageKey) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function loadGalleryView() {
  try {
    return localStorage.getItem(viewStorageKey) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}

function setGalleryView(view) {
  state.galleryView = view === "list" ? "list" : "cards";
  try {
    localStorage.setItem(viewStorageKey, state.galleryView);
  } catch {
    // 存不進去也沒關係，只是下次會回到卡片
  }
  renderGallery();
}

function toggleFolderCollapsed(folderId) {
  if (state.collapsedFolders.has(folderId)) {
    state.collapsedFolders.delete(folderId);
  } else {
    state.collapsedFolders.add(folderId);
  }

  try {
    localStorage.setItem(collapsedStorageKey, JSON.stringify([...state.collapsedFolders]));
  } catch {
    // 無痕視窗等情況存不進去也沒關係，只是下次會全部展開
  }
  renderClasses();
}

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

function loadLocalState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    state.classes = Array.isArray(stored.classes) ? stored.classes : [];
    state.folders = Array.isArray(stored.folders) ? stored.folders : [];
    state.submissions = Array.isArray(stored.submissions) ? stored.submissions : [];
  } catch {
    state.classes = [];
    state.folders = [];
    state.submissions = [];
  }
}

function saveLocalState() {
  localStorage.setItem(storageKey, JSON.stringify({
    classes: state.classes,
    folders: state.folders,
    submissions: state.submissions
  }));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getThumbnailUrl(url) {
  // 宜蘭縣 Scratch 平台
  const ilcMatch = url.match(/s3\.ilc\.edu\.tw\/projects\/(\d+)/);
  if (ilcMatch) {
    return `https://s3.ilc.edu.tw/internalapi/project/thumbnail/${ilcMatch[1]}/get/`;
  }

  // 官方 Scratch
  const scratchMatch = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
  if (scratchMatch) {
    return `https://cdn2.scratch.mit.edu/get_image/project/${scratchMatch[1]}/480x360.png`;
  }

  // 其他網站用截圖服務
  return `${screenshotBase}${encodeURIComponent(url)}`;
}

function formatDate(value) {
  if (!value) {
    return "剛剛";
  }

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "剛剛";
  }

  return new Intl.DateTimeFormat("zh-Hant", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getSortTime(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getActiveClass() {
  return state.classes.find((item) => item.id === state.activeClassId) || null;
}

function isTeacherUser() {
  if (state.mode !== "firebase") {
    return Boolean(state.user);
  }

  return Boolean(state.user?.email && teacherEmails.includes(state.user.email));
}

function getActiveFolder() {
  return state.folders.find((item) => item.id === state.activeFolderId) || null;
}

function getFolderClasses(folderId) {
  return state.classes.filter((item) => item.folderId === folderId);
}

// 目前畫面要顯示哪些班級的作品：資料夾模式是資料夾內全部班級，否則是單一班級
// 評審分享連結開出來的唯讀畫面（老師本人不套用，老師看的還是完整的管理畫面）
function isSharedView() {
  return state.sharedClassIds.length > 0 && !isTeacherUser();
}

function getViewClassIds() {
  if (isSharedView()) {
    return state.sharedClassIds.filter((id) => state.classes.some((item) => item.id === id));
  }

  const folder = getActiveFolder();
  if (folder) {
    return getFolderClasses(folder.id).map((item) => item.id);
  }

  const classroom = getActiveClass();
  return classroom ? [classroom.id] : [];
}

function isClassOwner(classId) {
  const classroom = state.classes.find((item) => item.id === classId);
  return Boolean(classroom && state.user && classroom.ownerUid === state.user.uid);
}

function updateViewUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("class");
  url.searchParams.delete("folder");
  if (state.activeClassId) {
    url.searchParams.set("class", state.activeClassId);
  } else if (state.activeFolderId) {
    url.searchParams.set("folder", state.activeFolderId);
  }
  window.history.replaceState({}, "", url);
}

function setActiveClass(classId) {
  state.activeClassId = classId;
  state.activeFolderId = "";
  updateViewUrl();
  subscribeSubmissions();
  render();
}

function setActiveFolder(folderId) {
  state.activeFolderId = folderId;
  state.activeClassId = "";
  state.folderClassFilter = "";
  updateViewUrl();
  subscribeSubmissions();
  render();
}

function createClassChip(classroom) {
  const button = elements.classButtonTemplate.content.firstElementChild.cloneNode(true);
  button.textContent = classroom.name;
  button.classList.toggle("is-active", classroom.id === state.activeClassId);
  button.addEventListener("click", () => setActiveClass(classroom.id));
  return button;
}

function createSmallButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "folder-tool-button";
  button.textContent = text;
  button.addEventListener("click", () => {
    onClick().catch((error) => window.alert(error.message));
  });
  return button;
}

function renderClasses() {
  elements.teacherPanel.classList.toggle("is-hidden", !isTeacherUser());
  elements.classList.innerHTML = "";

  if (!isTeacherUser()) {
    return;
  }

  if (state.classes.length === 0 && state.folders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚未建立班級。先建立一個班級，再把班級連結給學生。";
    elements.classList.append(empty);
    return;
  }

  // 沒有資料夾時維持原本一排班級按鈕
  if (state.folders.length === 0) {
    state.classes.forEach((classroom) => elements.classList.append(createClassChip(classroom)));
    return;
  }

  const folderIds = new Set(state.folders.map((folder) => folder.id));

  state.folders.forEach((folder) => {
    const group = document.createElement("div");
    group.className = "folder-group";

    const header = document.createElement("div");
    header.className = "folder-header";

    const classesInFolder = getFolderClasses(folder.id);
    const isCollapsed = state.collapsedFolders.has(folder.id);
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "folder-toggle";
    toggleButton.textContent = isCollapsed ? "▸" : "▾";
    toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
    toggleButton.setAttribute("aria-label", `${isCollapsed ? "展開" : "收起"}「${folder.name}」`);
    toggleButton.addEventListener("click", () => toggleFolderCollapsed(folder.id));

    const folderButton = document.createElement("button");
    folderButton.type = "button";
    folderButton.className = "folder-chip";
    folderButton.classList.toggle("is-active", folder.id === state.activeFolderId);
    folderButton.textContent = `📁 ${folder.name}（${classesInFolder.length} 班）`;
    folderButton.addEventListener("click", () => setActiveFolder(folder.id));

    header.append(
      toggleButton,
      folderButton,
      createSmallButton("重新命名", () => renameFolder(folder)),
      createSmallButton("刪除資料夾", () => deleteFolder(folder))
    );

    const classRow = document.createElement("div");
    classRow.className = "folder-classes";
    classRow.classList.toggle("is-hidden", isCollapsed);
    if (classesInFolder.length === 0) {
      const hint = document.createElement("span");
      hint.className = "folder-empty";
      hint.textContent = "還沒有班級。點班級後，在上方「放進資料夾」選這個資料夾。";
      classRow.append(hint);
    } else {
      classesInFolder.forEach((classroom) => classRow.append(createClassChip(classroom)));
    }

    group.append(header, classRow);
    elements.classList.append(group);
  });

  const looseClasses = state.classes.filter((item) => !item.folderId || !folderIds.has(item.folderId));
  if (looseClasses.length > 0) {
    const group = document.createElement("div");
    group.className = "folder-group is-loose";
    const label = document.createElement("p");
    label.className = "folder-label";
    label.textContent = "未分類";
    const classRow = document.createElement("div");
    classRow.className = "folder-classes";
    looseClasses.forEach((classroom) => classRow.append(createClassChip(classroom)));
    group.append(label, classRow);
    elements.classList.append(group);
  }
}

function renderFolderSelect(classroom) {
  const canMove = Boolean(classroom) && isTeacherUser() && isClassOwner(classroom.id);
  elements.classFolderField.classList.toggle("is-hidden", !canMove);
  if (!canMove) {
    return;
  }

  const select = elements.classFolderSelect;
  select.innerHTML = "";
  select.append(new Option("未分類", ""));
  state.folders.forEach((folder) => select.append(new Option(folder.name, folder.id)));
  const currentFolderExists = state.folders.some((folder) => folder.id === classroom.folderId);
  select.value = currentFolderExists ? classroom.folderId : "";
}

function renderActiveClass() {
  // 評審分享畫面：唯讀，不顯示送作品的表單與任何管理按鈕
  const shared = isSharedView();
  elements.submissionLayout.classList.toggle("is-hidden", shared);
  if (shared) {
    elements.activeClassPanel.classList.remove("is-empty");
    elements.copyClassLinkButton.classList.add("is-hidden");
    elements.copyShareLinkButton.classList.add("is-hidden");
    elements.classFolderField.classList.add("is-hidden");
    elements.activeClassName.textContent = `📁 ${state.sharedTitle || "學生作品成果"}`;
    const classCount = getViewClassIds().length;
    elements.activeClassHint.textContent = classCount > 0
      ? `共 ${classCount} 班・唯讀分享，作者以編號顯示，不含學生姓名`
      : "載入中…";
    return;
  }

  const classroom = getActiveClass();
  const folder = getActiveFolder();
  const hasClass = Boolean(classroom);
  // 只有老師在資料夾畫面才有「評審分享連結」
  elements.copyShareLinkButton.classList.toggle("is-hidden", !(folder && isTeacherUser()));

  elements.activeClassPanel.classList.toggle("is-empty", !hasClass && !folder);
  const needsLogin = state.mode === "firebase" && !state.user;
  const submitButton = elements.submissionForm.querySelector("button");
  elements.copyClassLinkButton.disabled = !hasClass;
  elements.copyClassLinkButton.classList.toggle("is-hidden", Boolean(folder));
  submitButton.disabled = !hasClass || needsLogin;
  if (folder) {
    submitButton.textContent = "資料夾只能瀏覽，送作品請先點一個班級";
  } else {
    submitButton.textContent = needsLogin ? "學生請先用 Google 登入再送出" : "送出作品";
  }
  renderFolderSelect(classroom);

  if (folder) {
    const classNames = getFolderClasses(folder.id).map((item) => item.name);
    elements.activeClassName.textContent = `📁 ${folder.name}`;
    elements.activeClassHint.textContent = classNames.length > 0
      ? `共 ${classNames.length} 班：${classNames.join("、")}（資料夾只有老師看得到）`
      : "這個資料夾還沒有班級。";
    return;
  }

  if (!classroom) {
    elements.activeClassName.textContent = "尚未選擇班級";
    elements.activeClassHint.textContent = "請先建立班級，或使用老師提供的班級連結進入。";
    return;
  }

  elements.activeClassName.textContent = classroom.name;
  elements.activeClassHint.textContent = `班級代碼：${classroom.id}`;
}

function renderClassFilter(classIds, allSubmissions) {
  const bar = elements.classFilter;
  bar.innerHTML = "";
  bar.classList.toggle("is-hidden", classIds.length < 2);
  if (classIds.length < 2) {
    return;
  }

  const options = [{ id: "", name: "全部" }, ...classIds.map((id) => ({
    id,
    name: state.classes.find((item) => item.id === id)?.name || id
  }))];

  options.forEach((option) => {
    const count = option.id
      ? allSubmissions.filter((work) => work.classId === option.id).length
      : allSubmissions.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.classList.toggle("is-active", option.id === state.folderClassFilter);
    button.setAttribute("aria-pressed", String(option.id === state.folderClassFilter));
    button.textContent = `${option.name}（${count}）`;
    button.addEventListener("click", () => {
      state.folderClassFilter = option.id;
      renderGallery();
    });
    bar.append(button);
  });
}

function getShowcaseFolders() {
  // 示範模式沒有 Firestore，封面直接從本機資料現算
  if (state.mode !== "firebase") {
    return state.folders.map((folder) => ({
      ...folder,
      summary: computeFolderSummary(folder.id, (classId) =>
        state.submissions.filter((work) => work.classId === classId))
    }));
  }
  return state.showcaseFolders;
}

// 回傳 true 代表已經畫出資料夾封面
function renderShowcase() {
  if (isTeacherUser() || state.activeClassId) {
    return false;
  }

  const folders = getShowcaseFolders().filter((folder) => folder.summary?.workCount > 0);
  if (folders.length === 0) {
    return false;
  }

  elements.galleryTitle.textContent = "作品資料夾";
  elements.submissionCount.textContent = `${folders.length} 個資料夾`;
  elements.galleryGrid.classList.add("is-showcase");

  folders.forEach((folder) => {
    const { classCount, workCount, coverThumbs = [] } = folder.summary;
    const card = document.createElement("article");
    card.className = "showcase-card";

    const collage = document.createElement("div");
    // 照縮圖張數排版（1 張滿版、2 張左右、3 張左大右二、4 張四格），不留空格
    const thumbs = coverThumbs.slice(0, 4);
    collage.className = `showcase-collage count-${Math.max(thumbs.length, 1)}`;
    (thumbs.length > 0 ? thumbs : [""]).forEach((thumbUrl) => {
      const cell = document.createElement("div");
      cell.className = "showcase-cell";
      if (thumbUrl) {
        const image = document.createElement("img");
        image.src = thumbUrl;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        cell.append(image);
      }
      collage.append(cell);
    });

    const copy = document.createElement("div");
    copy.className = "work-copy";
    const title = document.createElement("h3");
    title.textContent = `📁 ${folder.name}`;
    const meta = document.createElement("p");
    meta.className = "work-meta";
    meta.textContent = `${classCount} 班 · ${workCount} 件作品`;
    copy.append(title, meta);

    card.append(collage, copy);
    elements.galleryGrid.append(card);
  });

  const hint = document.createElement("p");
  hint.className = "showcase-hint";
  hint.textContent = "想看完整作品，請向老師索取班級連結。";
  elements.galleryGrid.append(hint);
  return true;
}

// 班級名稱通常是「115_506_我的第一個程式」，取最後一組三碼（前面那組是學年度）當班號
function getClassCode(classroom) {
  const name = classroom?.name || "";
  const codes = name.match(/(?<!\d)\d{3}(?!\d)/g);
  return codes ? codes[codes.length - 1] : name;
}

// 老師自己提交的作品（測試、示範）不算學生成果：作者就是班級的建立者。
// 示範模式所有人共用同一個 uid，這個判斷不適用。
function isTeacherWork(work) {
  if (state.mode !== "firebase") {
    return false;
  }
  const ownerUid = state.classes.find((item) => item.id === work.classId)?.ownerUid;
  return Boolean(ownerUid) && work.authorUid === ownerUid;
}

// 去識別化的作者標籤：同一班內依「第一次提交的時間」替每位學生編號（例如「501 學生 03」），
// 同一位學生永遠是同一個編號；姓名與帳號不顯示。資料庫裡的 authorName 沒動，只是不畫出來。
function buildAuthorLabels() {
  const firstSeen = new Map();
  state.submissions.filter((work) => !isTeacherWork(work)).forEach((work) => {
    const key = `${work.classId}|${work.authorUid || work.id}`;
    const time = getSortTime(work.createdAt);
    if (!firstSeen.has(key) || time < firstSeen.get(key)) {
      firstSeen.set(key, time);
    }
  });

  const labels = new Map();
  const classIds = [...new Set([...firstSeen.keys()].map((key) => key.split("|")[0]))];
  classIds.forEach((classId) => {
    const code = getClassCode(state.classes.find((item) => item.id === classId));
    [...firstSeen.entries()]
      .filter(([key]) => key.startsWith(`${classId}|`))
      .sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1))
      .forEach(([key], index) => {
        labels.set(key, `${code} 學生 ${String(index + 1).padStart(2, "0")}`);
      });
  });

  return (work) => labels.get(`${work.classId}|${work.authorUid || work.id}`) || "學生";
}

function createWorkLink(work) {
  const link = document.createElement("a");
  link.href = work.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = work.title;
  return link;
}

// 清單檢視：一列一件，標題直接是連結。依「班級 → 作者」排，方便對著名單點
function renderWorkList(submissions, isFolderView, getAuthorLabel) {
  const className = (work) => state.classes.find((item) => item.id === work.classId)?.name || "";
  const collator = new Intl.Collator("zh-Hant", { numeric: true });
  const sorted = [...submissions].sort((a, b) =>
    collator.compare(className(a), className(b))
    || collator.compare(getAuthorLabel(a), getAuthorLabel(b))
    || getSortTime(a.createdAt) - getSortTime(b.createdAt));

  const showClass = isFolderView;
  const table = document.createElement("table");
  table.className = "work-list";

  const headRow = table.createTHead().insertRow();
  ["#", ...(showClass ? ["班級"] : []), "作者", "作品", "說明", "時間", ""].forEach((text) => {
    const cell = document.createElement("th");
    cell.textContent = text;
    headRow.append(cell);
  });

  const body = table.createTBody();
  sorted.forEach((work, index) => {
    const row = body.insertRow();
    row.insertCell().textContent = String(index + 1);
    if (showClass) {
      // 清單裡只留班號 506，欄位才不會被擠成一字一行
      const classCell = row.insertCell();
      classCell.className = "nowrap";
      classCell.textContent = getClassCode(state.classes.find((item) => item.id === work.classId));
      classCell.title = className(work);
    }
    const authorCell = row.insertCell();
    authorCell.className = "nowrap";
    authorCell.textContent = getAuthorLabel(work);
    row.insertCell().append(createWorkLink(work));
    const noteCell = row.insertCell();
    noteCell.className = "work-list-note";
    noteCell.textContent = work.note || "";
    const timeCell = row.insertCell();
    timeCell.className = "nowrap work-list-time";
    timeCell.textContent = formatDate(work.createdAt);

    const actionCell = row.insertCell();
    if (isClassOwner(work.classId)) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-work-button";
      deleteButton.textContent = "刪除";
      deleteButton.addEventListener("click", () => {
        deleteSubmission(work).catch((error) => window.alert(error.message));
      });
      actionCell.append(deleteButton);
    }
  });

  elements.galleryGrid.classList.add("is-list");
  elements.galleryGrid.append(table);
}

function renderGallery() {
  const isFolderView = Boolean(getActiveFolder()) || isSharedView();
  const classIds = getViewClassIds();
  const viewSubmissions = state.submissions.filter((item) => classIds.includes(item.classId));
  // 老師自己提交的作品不列入學生成果（卡片、清單、計數都一樣）
  const teacherWorks = viewSubmissions.filter(isTeacherWork);
  const allSubmissions = viewSubmissions
    .filter((item) => !isTeacherWork(item))
    .sort((a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt));
  const getAuthorLabel = buildAuthorLabels();

  // 班級被移出資料夾後，篩選條件就不成立了
  if (!isFolderView || !classIds.includes(state.folderClassFilter)) {
    state.folderClassFilter = "";
  }
  if (isFolderView) {
    renderClassFilter(classIds, allSubmissions);
  } else {
    elements.classFilter.classList.add("is-hidden");
  }

  const showClassName = isFolderView && !state.folderClassFilter;
  const submissions = state.folderClassFilter
    ? allSubmissions.filter((work) => work.classId === state.folderClassFilter)
    : allSubmissions;

  // 只有老師看得到被藏起來的件數，免得以為作品不見了
  const hiddenCount = (state.folderClassFilter
    ? teacherWorks.filter((work) => work.classId === state.folderClassFilter)
    : teacherWorks).length;
  elements.submissionCount.textContent = `${submissions.length} 件作品`
    + (isTeacherUser() && hiddenCount > 0 ? `（另有 ${hiddenCount} 件老師提交的已隱藏）` : "");
  elements.galleryGrid.innerHTML = "";
  elements.galleryGrid.classList.remove("is-showcase", "is-list");
  elements.galleryTitle.textContent = "班級作品";

  // 卡片／清單切換：沒選班級（空白或訪客封面）時不需要
  elements.viewToggle.classList.toggle("is-hidden", classIds.length === 0);
  elements.viewToggle.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.view === state.galleryView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (classIds.length === 0 && renderShowcase()) {
    return;
  }

  if (classIds.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = isSharedView()
      ? "載入中…如果一直沒有內容，代表這個分享連結已失效，請向老師索取新的連結。"
      : "選擇班級後，這裡會顯示學生提交的作品。";
    elements.galleryGrid.append(empty);
    return;
  }

  if (submissions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "目前還沒有作品。學生送出連結後會出現在這裡。";
    elements.galleryGrid.append(empty);
    return;
  }

  if (state.galleryView === "list") {
    renderWorkList(submissions, isFolderView, getAuthorLabel);
    return;
  }

  submissions.forEach((work) => {
    const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
    const link = card.querySelector(".thumb-link");
    const image = card.querySelector(".work-thumb");
    const title = card.querySelector("h3");
    const note = card.querySelector(".work-note");
    const meta = card.querySelector(".work-meta");
    const deleteButton = card.querySelector(".delete-work-button");

    link.href = work.url;
    image.src = getThumbnailUrl(work.url);
    image.alt = `${work.title} 的網站縮圖`;
    image.addEventListener("error", () => {
      image.src = "";
      image.alt = "";
    }, { once: true });
    // 標題也是連結：縮圖載不出來時，不必再去找那個小小的縮圖
    title.replaceChildren(createWorkLink(work));
    note.textContent = work.note || "學生尚未填寫作品說明。";
    const className = showClassName
      ? state.classes.find((item) => item.id === work.classId)?.name
      : "";
    meta.textContent = [getAuthorLabel(work), className, formatDate(work.createdAt)]
      .filter(Boolean)
      .join(" · ");

    if (isClassOwner(work.classId)) {
      deleteButton.classList.remove("is-hidden");
      deleteButton.addEventListener("click", () => {
        deleteSubmission(work).catch((error) => window.alert(error.message));
      });
    }

    elements.galleryGrid.append(card);
  });
}

function renderAuth() {
  const displayName = state.user?.displayName || state.user?.email || "示範使用者";
  elements.authStatus.textContent = state.user ? displayName : "尚未登入";
  elements.logoutButton.classList.toggle("is-hidden", !state.user);
  elements.loginButton.textContent = state.mode === "firebase" ? "使用 Google 登入" : "示範登入";
  elements.setupNotice.classList.toggle("is-hidden", state.mode === "firebase");
}

function render() {
  renderAuth();
  renderClasses();
  renderActiveClass();
  renderGallery();
}

async function initFirebase() {
  if (!hasFirebaseConfig()) {
    loadLocalState();
    render();
    return;
  }

  state.mode = "firebase";
  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);

  state.firebase = {
    auth,
    db,
    provider: new authModule.GoogleAuthProvider(),
    signInWithPopup: authModule.signInWithPopup,
    signOut: authModule.signOut,
    onAuthStateChanged: authModule.onAuthStateChanged,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    setDoc: firestoreModule.setDoc,
    addDoc: firestoreModule.addDoc,
    updateDoc: firestoreModule.updateDoc,
    deleteDoc: firestoreModule.deleteDoc,
    writeBatch: firestoreModule.writeBatch,
    onSnapshot: firestoreModule.onSnapshot,
    query: firestoreModule.query,
    where: firestoreModule.where,
    orderBy: firestoreModule.orderBy,
    serverTimestamp: firestoreModule.serverTimestamp
  };

  state.firebase.onAuthStateChanged(auth, (user) => {
    state.user = user;
    subscribeClasses();
    subscribeFolders();
    subscribeShowcase();
    render();
  });
}

// 沒有班級連結的訪客：列出所有資料夾的公開封面（只有名稱、件數、縮圖，點不進去）
function subscribeShowcase() {
  state.unsubscribeShowcase?.();
  state.unsubscribeShowcase = null;
  state.showcaseFolders = [];

  if (state.mode !== "firebase" || isTeacherUser() || state.activeClassId || isSharedView()) {
    return;
  }

  const { db, collection, onSnapshot } = state.firebase;
  state.unsubscribeShowcase = onSnapshot(collection(db, "projectWallFolders"), (snapshot) => {
    state.showcaseFolders = snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
      .sort((a, b) => getSortTime(a.createdAt) - getSortTime(b.createdAt));
    renderGallery();
  }, (error) => {
    console.error(error);
    state.showcaseFolders = [];
    renderGallery();
  });
}

function computeFolderSummary(folderId, getClassWorks) {
  const classesInFolder = getFolderClasses(folderId);
  // 每班各自的作品（新到舊），不含老師自己提交的；沒交作品的班級不參與封面，最近有人交的班級排前面
  const perClass = classesInFolder
    .map((classroom) => getClassWorks(classroom.id)
      .filter((work) => !isTeacherWork(work))
      .sort((a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt)))
    .filter((list) => list.length > 0)
    .sort((a, b) => getSortTime(b[0].createdAt) - getSortTime(a[0].createdAt));
  const workCount = perClass.reduce((sum, list) => sum + list.length, 0);

  // 封面盡量湊不同班級：先每班取最新一件，班級不足 4 個再輪流補各班次新的作品
  const picked = [];
  for (let round = 0; picked.length < 4; round += 1) {
    const before = picked.length;
    perClass.forEach((list) => {
      if (picked.length < 4 && list[round]) {
        picked.push(list[round]);
      }
    });
    if (picked.length === before) {
      break;
    }
  }

  // 跟作品卡片一樣從網址現算；舊作品存的 thumbnailUrl 可能是已失效的截圖連結
  const coverThumbs = picked.map((work) => getThumbnailUrl(work.url));
  return { classCount: classesInFolder.length, workCount, coverThumbs };
}

function isSameSummary(a, b) {
  return Boolean(a && b)
    && a.classCount === b.classCount
    && a.workCount === b.workCount
    && (a.coverThumbs || []).join("\n") === (b.coverThumbs || []).join("\n");
}

// 老師開著頁面時，監聽所有「在資料夾裡」的班級作品，封面有變才寫回資料夾文件。
// 訪客沒有權限自己算，所以老師沒開頁面時封面會停在上次的樣子。
function syncSummaryListeners() {
  const shouldSync = state.mode === "firebase" && isTeacherUser();
  const folderIds = new Set(state.folders.map((folder) => folder.id));
  const wanted = new Set(shouldSync
    ? state.classes.filter((item) => folderIds.has(item.folderId)).map((item) => item.id)
    : []);

  Object.keys(state.summaryListeners).forEach((classId) => {
    if (!wanted.has(classId)) {
      state.summaryListeners[classId]();
      delete state.summaryListeners[classId];
      delete state.summaryWorks[classId];
    }
  });

  if (!shouldSync) {
    return;
  }

  const { db, collection, onSnapshot } = state.firebase;
  wanted.forEach((classId) => {
    if (state.summaryListeners[classId]) {
      return;
    }
    state.summaryListeners[classId] = onSnapshot(
      collection(db, "projectWallClasses", classId, "submissions"),
      (snapshot) => {
        state.summaryWorks[classId] = snapshot.docs.map((docSnapshot) => docSnapshot.data());
        scheduleSummaryWrite();
      }
    );
  });
  scheduleSummaryWrite();
}

function scheduleSummaryWrite() {
  clearTimeout(state.summaryTimer);
  state.summaryTimer = setTimeout(() => {
    writeFolderSummaries().catch((error) => console.error(error));
  }, 1500);
}

async function writeFolderSummaries() {
  if (state.mode !== "firebase" || !isTeacherUser()) {
    return;
  }

  // 班級清單或某班作品還沒載入完就先不寫，免得把件數寫少
  const isLoading = !state.classesLoaded || Object.keys(state.summaryListeners).some((classId) => !state.summaryWorks[classId]);
  if (isLoading) {
    return;
  }

  const { db, doc, updateDoc } = state.firebase;
  for (const folder of state.folders) {
    const summary = computeFolderSummary(folder.id, (classId) => state.summaryWorks[classId] || []);
    if (!isSameSummary(summary, folder.summary)) {
      await updateDoc(doc(db, "projectWallFolders", folder.id), { summary });
    }
  }
}

function subscribeFolders() {
  if (state.mode !== "firebase") {
    return;
  }

  state.unsubscribeFolders?.();
  state.unsubscribeFolders = null;

  if (!isTeacherUser()) {
    state.folders = [];
    state.activeFolderId = "";
    syncSummaryListeners();
    return;
  }

  const { db, collection, onSnapshot, query, where } = state.firebase;
  // 規則只放行自己的資料夾，所以查詢一定要帶 ownerUid 條件；排序在前端做，免建複合索引
  const folderQuery = query(collection(db, "projectWallFolders"), where("ownerUid", "==", state.user.uid));

  state.unsubscribeFolders = onSnapshot(folderQuery, (snapshot) => {
    state.folders = snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
      .sort((a, b) => getSortTime(a.createdAt) - getSortTime(b.createdAt));

    if (state.activeFolderId && !getActiveFolder()) {
      state.activeFolderId = "";
      updateViewUrl();
    }

    render();
    subscribeSubmissions();
    syncSummaryListeners();
  });
}

function subscribeClasses() {
  if (state.mode !== "firebase") {
    return;
  }

  state.unsubscribeClasses?.();
  state.classesLoaded = false;
  const { db, collection, doc, onSnapshot, query, orderBy } = state.firebase;

  // 評審分享連結：只讀連結裡指定的那幾班（班級文件與作品都是公開可讀，不必登入），不列出其他班級
  if (isSharedView()) {
    const found = new Map();
    let lastKey = "";
    state.classes = [];
    const unsubscribers = state.sharedClassIds.map((classId) => onSnapshot(
      doc(db, "projectWallClasses", classId),
      (snapshot) => {
        if (snapshot.exists()) {
          found.set(classId, { id: snapshot.id, ...snapshot.data() });
        } else {
          found.delete(classId);
        }

        state.classes = state.sharedClassIds.filter((id) => found.has(id)).map((id) => found.get(id));
        state.classesLoaded = true;
        render();

        // 班級名單沒變就不必重接作品監聽
        const key = state.classes.map((item) => item.id).join(",");
        if (key !== lastKey) {
          lastKey = key;
          subscribeSubmissions();
        }
      },
      (error) => console.error(error)
    ));
    state.unsubscribeClasses = () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    return;
  }

  // 未登入（例如家長）：只讀網址指定的那一班，不列出其他班級
  if (!state.user) {
    state.classes = [];
    if (!state.activeClassId) {
      render();
      subscribeSubmissions();
      return;
    }

    state.unsubscribeClasses = onSnapshot(doc(db, "projectWallClasses", state.activeClassId), (snapshot) => {
      state.classes = snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
      render();
      subscribeSubmissions();
    });
    return;
  }

  const classQuery = query(collection(db, "projectWallClasses"), orderBy("createdAt", "desc"));

  state.unsubscribeClasses = onSnapshot(classQuery, (snapshot) => {
    state.classes = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    state.classesLoaded = true;

    if (state.activeClassId && !state.classes.some((item) => item.id === state.activeClassId)) {
      state.activeClassId = "";
    }

    render();
    subscribeSubmissions();
    syncSummaryListeners();
  });
}

function subscribeSubmissions() {
  state.unsubscribeSubmissions.forEach((unsubscribe) => unsubscribe());
  state.unsubscribeSubmissions = [];

  if (state.mode !== "firebase") {
    renderGallery();
    return;
  }

  // 資料夾模式時每個班級各開一個監聽，結果合併在 state.submissions
  const classIds = getViewClassIds();
  state.submissions = state.submissions.filter((work) => classIds.includes(work.classId));

  if (classIds.length === 0) {
    renderGallery();
    return;
  }

  const { db, collection, onSnapshot, query, orderBy } = state.firebase;
  classIds.forEach((classId) => {
    const submissionQuery = query(
      collection(db, "projectWallClasses", classId, "submissions"),
      orderBy("createdAt", "desc")
    );

    state.unsubscribeSubmissions.push(onSnapshot(submissionQuery, (snapshot) => {
      state.submissions = [
        ...state.submissions.filter((work) => work.classId !== classId),
        ...snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
          classId
        }))
      ];
      renderGallery();
    }));
  });
}

async function createClass(name) {
  if (!isTeacherUser()) {
    window.alert("只有教師帳號可以建立班級。");
    return;
  }

  const classroom = {
    id: createId("class"),
    name,
    createdAt: new Date().toISOString(),
    ownerUid: state.user?.uid || "local-demo",
    // 開著資料夾時建立的班級，直接放進那個資料夾
    folderId: getActiveFolder()?.id || null
  };

  if (state.mode === "firebase" && !state.user) {
    window.alert("請先使用 Google 登入，再建立班級。");
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, setDoc, serverTimestamp } = state.firebase;
    await setDoc(doc(db, "projectWallClasses", classroom.id), {
      name,
      ownerUid: state.user.uid,
      folderId: classroom.folderId,
      createdAt: serverTimestamp()
    });
  } else {
    state.classes.unshift(classroom);
    saveLocalState();
  }

  setActiveClass(classroom.id);
}

async function addSubmission(payload) {
  const classroom = getActiveClass();
  if (!classroom) {
    window.alert("請先選擇班級。");
    return;
  }

  const work = {
    ...payload,
    classId: classroom.id,
    authorUid: state.user?.uid || "local-demo",
    authorName: state.user?.displayName || state.user?.email || "示範使用者",
    createdAt: new Date().toISOString()
  };

  if (state.mode === "firebase") {
    const { db, collection, addDoc, serverTimestamp } = state.firebase;
    await addDoc(collection(db, "projectWallClasses", classroom.id, "submissions"), {
      ...work,
      createdAt: serverTimestamp()
    });
  } else {
    state.submissions.unshift({ id: createId("work"), ...work });
    saveLocalState();
    renderGallery();
  }
}

async function deleteSubmission(work) {
  if (!work?.id || !work.classId) {
    return;
  }

  // 資料夾模式下作品來自不同班級，要看作品本身屬於哪一班
  if (!isClassOwner(work.classId)) {
    window.alert("只有建立這個班級的教師可以刪除作品。");
    return;
  }

  const shouldDelete = window.confirm(`確定要刪除「${work.title || "這件作品"}」嗎？`);
  if (!shouldDelete) {
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, deleteDoc } = state.firebase;
    await deleteDoc(doc(db, "projectWallClasses", work.classId, "submissions", work.id));
  } else {
    state.submissions = state.submissions.filter((item) => item.id !== work.id);
    saveLocalState();
    renderGallery();
  }
}

async function createFolder(name) {
  if (!isTeacherUser()) {
    window.alert("只有教師帳號可以建立資料夾。");
    return;
  }

  if (state.mode === "firebase") {
    const { db, collection, addDoc, serverTimestamp } = state.firebase;
    await addDoc(collection(db, "projectWallFolders"), {
      name,
      ownerUid: state.user.uid,
      createdAt: serverTimestamp()
    });
  } else {
    state.folders.push({
      id: createId("folder"),
      name,
      ownerUid: state.user?.uid || "local-demo",
      createdAt: new Date().toISOString()
    });
    saveLocalState();
    render();
  }
}

async function renameFolder(folder) {
  const name = window.prompt("資料夾新名稱", folder.name)?.trim();
  if (!name || name === folder.name) {
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, updateDoc } = state.firebase;
    await updateDoc(doc(db, "projectWallFolders", folder.id), { name: name.slice(0, 80) });
  } else {
    folder.name = name.slice(0, 80);
    saveLocalState();
    render();
  }
}

async function deleteFolder(folder) {
  const classesInFolder = getFolderClasses(folder.id);
  const shouldDelete = window.confirm(
    `確定要刪除資料夾「${folder.name}」嗎？\n裡面的 ${classesInFolder.length} 個班級和作品都不會被刪除，會回到「未分類」。`
  );
  if (!shouldDelete) {
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, writeBatch } = state.firebase;
    const batch = writeBatch(db);
    classesInFolder.forEach((classroom) => {
      batch.update(doc(db, "projectWallClasses", classroom.id), { folderId: null });
    });
    batch.delete(doc(db, "projectWallFolders", folder.id));
    await batch.commit();
  } else {
    classesInFolder.forEach((classroom) => {
      classroom.folderId = null;
    });
    state.folders = state.folders.filter((item) => item.id !== folder.id);
    saveLocalState();
  }

  if (state.activeFolderId === folder.id) {
    setActiveFolder("");
  } else {
    render();
  }
}

async function moveClassToFolder(classId, folderId) {
  if (!isClassOwner(classId)) {
    window.alert("只有建立這個班級的教師可以移動班級。");
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, updateDoc } = state.firebase;
    await updateDoc(doc(db, "projectWallClasses", classId), { folderId: folderId || null });
  } else {
    const classroom = state.classes.find((item) => item.id === classId);
    if (classroom) {
      classroom.folderId = folderId || null;
      saveLocalState();
      render();
    }
  }
}

async function signIn() {
  if (state.mode !== "firebase") {
    const name = window.prompt("示範模式：請輸入顯示名稱", state.user?.displayName || "示範學生");
    if (name) {
      state.user = { uid: "local-demo", displayName: name.trim(), email: "" };
      render();
    }
    return;
  }

  const { auth, provider, signInWithPopup } = state.firebase;
  await signInWithPopup(auth, provider);
}

async function signOutCurrentUser() {
  if (state.mode !== "firebase") {
    state.user = null;
    render();
    return;
  }

  await state.firebase.signOut(state.firebase.auth);
}

let previewTimer = null;

function updatePreview() {
  const url = normalizeUrl(elements.urlInput.value);

  clearTimeout(previewTimer);

  if (!url) {
    elements.previewFrame.classList.remove("has-image", "is-loading");
    elements.previewImage.src = "";
    return;
  }

  elements.previewFrame.classList.add("is-loading");
  elements.previewFrame.classList.remove("has-image");

  previewTimer = setTimeout(() => {
    const img = elements.previewImage;
    const thumbnailUrl = getThumbnailUrl(url);

    img.onerror = () => {
      elements.previewFrame.classList.remove("has-image", "is-loading");
      img.src = "";
    };
    img.onload = null;
    img.src = thumbnailUrl;

    elements.previewFrame.classList.remove("is-loading");
    elements.previewFrame.classList.add("has-image");
  }, 700);
}

elements.loginButton.addEventListener("click", () => {
  signIn().catch((error) => window.alert(error.message));
});

elements.logoutButton.addEventListener("click", () => {
  signOutCurrentUser().catch((error) => window.alert(error.message));
});

elements.classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.classNameInput.value.trim();
  if (!name) {
    return;
  }

  createClass(name)
    .then(() => {
      elements.classNameInput.value = "";
    })
    .catch((error) => window.alert(error.message));
});

elements.folderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.folderNameInput.value.trim();
  if (!name) {
    return;
  }

  createFolder(name)
    .then(() => {
      elements.folderNameInput.value = "";
    })
    .catch((error) => window.alert(error.message));
});

elements.classFolderSelect.addEventListener("change", () => {
  moveClassToFolder(state.activeClassId, elements.classFolderSelect.value)
    .catch((error) => window.alert(error.message));
});

elements.copyClassLinkButton.addEventListener("click", async () => {
  const classroom = getActiveClass();
  if (!classroom) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("class", classroom.id);
  await navigator.clipboard.writeText(url.toString());
  elements.copyClassLinkButton.textContent = "已複製";
  window.setTimeout(() => {
    elements.copyClassLinkButton.textContent = "複製班級連結";
  }, 1400);
});

elements.copyShareLinkButton.addEventListener("click", async () => {
  const folder = getActiveFolder();
  if (!folder) {
    return;
  }

  // 連結裡直接帶班級代碼：不需要改 Firestore 規則，也不會把全部班級代碼公開出去。
  // 之後資料夾新增班級，舊連結不會自動多出來，要重新複製一次。
  const collator = new Intl.Collator("zh-Hant", { numeric: true });
  const classIds = getFolderClasses(folder.id)
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((item) => item.id);
  if (classIds.length === 0) {
    window.alert("這個資料夾還沒有班級，沒有東西可以分享。");
    return;
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("share", classIds.join(","));
  url.searchParams.set("title", folder.name);
  await navigator.clipboard.writeText(url.toString());
  elements.copyShareLinkButton.textContent = "已複製";
  window.setTimeout(() => {
    elements.copyShareLinkButton.textContent = "複製評審分享連結";
  }, 1400);
});

elements.viewToggle.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (button) {
    setGalleryView(button.dataset.view);
  }
});

elements.urlInput.addEventListener("input", updatePreview);

elements.submissionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = normalizeUrl(elements.urlInput.value);

  if (!state.user) {
    window.alert("請先登入。");
    return;
  }

  addSubmission({
    title: elements.titleInput.value.trim(),
    url,
    note: elements.noteInput.value.trim(),
    thumbnailUrl: getThumbnailUrl(url)
  }).then(() => {
    elements.submissionForm.reset();
    updatePreview();
  }).catch((error) => window.alert(error.message));
});

initFirebase().catch((error) => {
  console.error(error);
  loadLocalState();
  render();
});
