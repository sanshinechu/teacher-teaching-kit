const firebaseConfig = window.TeacherProjectWallFirebaseConfig || {};

const storageKey = "teacher-project-wall-v1";
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
  classList: document.querySelector("#classList"),
  activeClassPanel: document.querySelector("#activeClassPanel"),
  activeClassName: document.querySelector("#activeClassName"),
  activeClassHint: document.querySelector("#activeClassHint"),
  copyClassLinkButton: document.querySelector("#copyClassLinkButton"),
  submissionForm: document.querySelector("#submissionForm"),
  titleInput: document.querySelector("#titleInput"),
  urlInput: document.querySelector("#urlInput"),
  noteInput: document.querySelector("#noteInput"),
  previewFrame: document.querySelector(".preview-frame"),
  previewImage: document.querySelector("#previewImage"),
  galleryGrid: document.querySelector("#galleryGrid"),
  submissionCount: document.querySelector("#submissionCount"),
  classButtonTemplate: document.querySelector("#classButtonTemplate"),
  cardTemplate: document.querySelector("#cardTemplate")
};

const state = {
  mode: "local",
  user: null,
  classes: [],
  submissions: [],
  activeClassId: new URLSearchParams(window.location.search).get("class") || "",
  firebase: null,
  unsubscribeClasses: null,
  unsubscribeSubmissions: null
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

function loadLocalState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    state.classes = Array.isArray(stored.classes) ? stored.classes : [];
    state.submissions = Array.isArray(stored.submissions) ? stored.submissions : [];
  } catch {
    state.classes = [];
    state.submissions = [];
  }
}

function saveLocalState() {
  localStorage.setItem(storageKey, JSON.stringify({
    classes: state.classes,
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

function isTeacherForActiveClass() {
  const classroom = getActiveClass();
  return Boolean(classroom && state.user && classroom.ownerUid === state.user.uid);
}

function setActiveClass(classId) {
  state.activeClassId = classId;
  const url = new URL(window.location.href);
  if (classId) {
    url.searchParams.set("class", classId);
  } else {
    url.searchParams.delete("class");
  }
  window.history.replaceState({}, "", url);
  subscribeSubmissions();
  render();
}

function renderClasses() {
  elements.teacherPanel.classList.toggle("is-hidden", !isTeacherUser());
  elements.classList.innerHTML = "";

  if (!isTeacherUser()) {
    return;
  }

  if (state.classes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "尚未建立班級。先建立一個班級，再把班級連結給學生。";
    elements.classList.append(empty);
    return;
  }

  state.classes.forEach((classroom) => {
    const button = elements.classButtonTemplate.content.firstElementChild.cloneNode(true);
    button.textContent = classroom.name;
    button.classList.toggle("is-active", classroom.id === state.activeClassId);
    button.addEventListener("click", () => setActiveClass(classroom.id));
    elements.classList.append(button);
  });
}

function renderActiveClass() {
  const classroom = getActiveClass();
  const hasClass = Boolean(classroom);

  elements.activeClassPanel.classList.toggle("is-empty", !hasClass);
  elements.copyClassLinkButton.disabled = !hasClass;
  elements.submissionForm.querySelector("button").disabled = !hasClass;

  if (!classroom) {
    elements.activeClassName.textContent = "尚未選擇班級";
    elements.activeClassHint.textContent = "請先建立班級，或使用老師提供的班級連結進入。";
    return;
  }

  elements.activeClassName.textContent = classroom.name;
  elements.activeClassHint.textContent = `班級代碼：${classroom.id}`;
}

function renderGallery() {
  const classroom = getActiveClass();
  const submissions = classroom
    ? state.submissions
        .filter((item) => item.classId === classroom.id)
        .sort((a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt))
    : [];

  elements.submissionCount.textContent = `${submissions.length} 件作品`;
  elements.galleryGrid.innerHTML = "";

  if (!classroom) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "選擇班級後，這裡會顯示學生提交的作品。";
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

  submissions.forEach((work) => {
    const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
    const link = card.querySelector(".thumb-link");
    const image = card.querySelector(".work-thumb");
    const title = card.querySelector("h3");
    const note = card.querySelector(".work-note");
    const meta = card.querySelector(".work-meta");
    const deleteButton = card.querySelector(".delete-work-button");

    link.href = work.url;
    image.src = work.thumbnailUrl || getThumbnailUrl(work.url);
    image.alt = `${work.title} 的網站縮圖`;
    image.addEventListener("error", () => {
      image.src = "";
      image.alt = "";
    }, { once: true });
    title.textContent = work.title;
    note.textContent = work.note || "學生尚未填寫作品說明。";
    meta.textContent = `${work.authorName || "匿名學生"} · ${formatDate(work.createdAt)}`;

    if (isTeacherForActiveClass()) {
      deleteButton.classList.remove("is-hidden");
      deleteButton.addEventListener("click", () => {
        deleteSubmission(work.id, work.title).catch((error) => window.alert(error.message));
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
    state.user = { uid: "local-demo", displayName: "示範使用者", email: "" };
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
    deleteDoc: firestoreModule.deleteDoc,
    onSnapshot: firestoreModule.onSnapshot,
    query: firestoreModule.query,
    orderBy: firestoreModule.orderBy,
    serverTimestamp: firestoreModule.serverTimestamp
  };

  state.firebase.onAuthStateChanged(auth, (user) => {
    state.user = user;
    subscribeClasses();
    render();
  });
}

function subscribeClasses() {
  if (state.mode !== "firebase" || !state.user) {
    return;
  }

  state.unsubscribeClasses?.();
  const { db, collection, onSnapshot, query, orderBy } = state.firebase;
  const classQuery = query(collection(db, "projectWallClasses"), orderBy("createdAt", "desc"));

  state.unsubscribeClasses = onSnapshot(classQuery, (snapshot) => {
    state.classes = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));

    if (state.activeClassId && !state.classes.some((item) => item.id === state.activeClassId)) {
      state.activeClassId = "";
    }

    render();
    subscribeSubmissions();
  });
}

function subscribeSubmissions() {
  state.unsubscribeSubmissions?.();

  if (state.mode !== "firebase" || !state.user || !state.activeClassId) {
    renderGallery();
    return;
  }

  const { db, collection, onSnapshot, query, orderBy } = state.firebase;
  const submissionQuery = query(
    collection(db, "projectWallClasses", state.activeClassId, "submissions"),
    orderBy("createdAt", "desc")
  );

  state.unsubscribeSubmissions = onSnapshot(submissionQuery, (snapshot) => {
    state.submissions = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      classId: state.activeClassId,
      ...docSnapshot.data()
    }));
    renderGallery();
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
    ownerUid: state.user?.uid || "local-demo"
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

async function deleteSubmission(submissionId, title) {
  const classroom = getActiveClass();
  if (!classroom || !submissionId) {
    return;
  }

  if (!isTeacherForActiveClass()) {
    window.alert("只有建立這個班級的教師可以刪除作品。");
    return;
  }

  const shouldDelete = window.confirm(`確定要刪除「${title || "這件作品"}」嗎？`);
  if (!shouldDelete) {
    return;
  }

  if (state.mode === "firebase") {
    const { db, doc, deleteDoc } = state.firebase;
    await deleteDoc(doc(db, "projectWallClasses", classroom.id, "submissions", submissionId));
  } else {
    state.submissions = state.submissions.filter((work) => work.id !== submissionId);
    saveLocalState();
    renderGallery();
  }
}

async function signIn() {
  if (state.mode !== "firebase") {
    const name = window.prompt("示範模式：請輸入顯示名稱", state.user?.displayName || "示範學生");
    if (name) {
      state.user = { uid: "local-demo", displayName: name.trim(), email: "" };
      renderAuth();
    }
    return;
  }

  const { auth, provider, signInWithPopup } = state.firebase;
  await signInWithPopup(auth, provider);
}

async function signOutCurrentUser() {
  if (state.mode !== "firebase") {
    state.user = null;
    renderAuth();
    return;
  }

  await state.firebase.signOut(state.firebase.auth);
}

function updatePreview() {
  const url = normalizeUrl(elements.urlInput.value);

  if (!url) {
    elements.previewFrame.classList.remove("has-image");
    elements.previewImage.removeAttribute("src");
    return;
  }

  elements.previewFrame.classList.add("has-image");
  elements.previewImage.src = getThumbnailUrl(url);
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
  state.user = { uid: "local-demo", displayName: "示範使用者", email: "" };
  render();
});
