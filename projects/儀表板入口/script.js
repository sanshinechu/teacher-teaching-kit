const firebaseConfig = window.TeacherDashboardFirebaseConfig || {};
const usageCollection = "dashboardModuleDailyUses";

const elements = {
  status: document.querySelector("#counterStatus"),
  cards: [...document.querySelectorAll(".tool-card")]
};

const state = {
  mode: "local",
  user: null,
  firebase: null,
  countedToday: new Set(),
  totals: {}
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getModuleData(card) {
  return {
    id: card.dataset.moduleId,
    title: card.querySelector("strong")?.textContent?.trim() || "未命名模組",
    href: card.getAttribute("href") || ""
  };
}

function getUsageDocId(moduleId) {
  return `${state.user.uid}_${getTodayKey()}_${moduleId}`;
}

function getCounterBadge(card) {
  let badge = card.querySelector(".usage-counter");
  if (badge) {
    return badge;
  }

  badge = document.createElement("span");
  badge.className = "usage-counter";
  badge.innerHTML = "<strong>--</strong><span>雲端累計</span>";
  card.append(badge);
  return badge;
}

function setBadge(card, options = {}) {
  const moduleId = card.dataset.moduleId;
  const badge = getCounterBadge(card);
  const total = state.totals[moduleId];
  const isCountedToday = state.countedToday.has(moduleId);
  const label = options.label || (isCountedToday ? "今日已計" : state.user ? "雲端累計" : "準備中");

  badge.querySelector("strong").textContent = Number.isFinite(total) ? String(total) : "--";
  badge.querySelector("span").textContent = label;
  badge.classList.toggle("is-locked", isCountedToday);
  badge.classList.toggle("is-offline", !state.user);
}

function renderCounters(label) {
  elements.cards.forEach((card) => setBadge(card, { label }));
}

function renderStatus() {
  if (!elements.status) {
    return;
  }

  if (!hasFirebaseConfig()) {
    elements.status.textContent = "本機預覽，部署後啟用免登入雲端統計";
    renderCounters("本機預覽");
    return;
  }

  elements.status.textContent = state.user ? "免登入統計：每日每裝置每模組計一次" : "正在啟用免登入統計";
  renderCounters();
}

async function refreshModuleTotal(card) {
  if (!state.firebase || !state.user) {
    setBadge(card);
    return;
  }

  const { db, collection, getCountFromServer, query, where } = state.firebase;
  const { id } = getModuleData(card);
  const countQuery = query(collection(db, usageCollection), where("moduleId", "==", id));
  const snapshot = await getCountFromServer(countQuery);
  state.totals[id] = snapshot.data().count;
  setBadge(card);
}

async function refreshAllCounters() {
  if (!state.firebase || !state.user) {
    renderCounters();
    return;
  }

  await Promise.all(elements.cards.map((card) => refreshModuleTotal(card).catch(() => setBadge(card, { label: "讀取失敗" }))));
}

async function recordModuleUse(card, event) {
  if (event && event.isTrusted === false) {
    return;
  }

  if (!state.firebase || !state.user) {
    setBadge(card, { label: hasFirebaseConfig() ? "準備中" : "本機預覽" });
    return;
  }

  const moduleData = getModuleData(card);
  if (state.countedToday.has(moduleData.id)) {
    setBadge(card, { label: "今日已計" });
    return;
  }

  const {
    db,
    doc,
    setDoc,
    serverTimestamp
  } = state.firebase;
  const usageRef = doc(db, usageCollection, getUsageDocId(moduleData.id));

  try {
    await setDoc(usageRef, {
      moduleId: moduleData.id,
      moduleTitle: moduleData.title,
      moduleHref: moduleData.href,
      uid: state.user.uid,
      usedDate: getTodayKey(),
      createdAt: serverTimestamp()
    });
    state.countedToday.add(moduleData.id);
    state.totals[moduleData.id] = Number(state.totals[moduleData.id] || 0) + 1;
    setBadge(card, { label: "已計入" });
    getCounterBadge(card).classList.add("is-counted");
  } catch {
    state.countedToday.add(moduleData.id);
    setBadge(card, { label: "今日已計" });
    refreshModuleTotal(card).catch(() => setBadge(card, { label: "讀取失敗" }));
  }
}

async function initFirebase() {
  if (!hasFirebaseConfig()) {
    renderStatus();
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
    onAuthStateChanged: authModule.onAuthStateChanged,
    signInAnonymously: authModule.signInAnonymously,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    setDoc: firestoreModule.setDoc,
    getCountFromServer: firestoreModule.getCountFromServer,
    query: firestoreModule.query,
    where: firestoreModule.where,
    serverTimestamp: firestoreModule.serverTimestamp
  };

  renderStatus();
  state.firebase.onAuthStateChanged(auth, async (user) => {
    state.user = user;
    state.countedToday = new Set();
    state.totals = {};
    renderStatus();
    await refreshAllCounters();
  });

  if (!auth.currentUser) {
    await state.firebase.signInAnonymously(auth);
  }
}

function initDashboardCounters() {
  elements.cards.forEach((card) => {
    getCounterBadge(card);
    card.addEventListener("click", (event) => {
      recordModuleUse(card, event).catch(() => setBadge(card, { label: "計數失敗" }));
    });
  });
}

initDashboardCounters();
initFirebase().catch((error) => {
  console.error(error);
  renderStatus();
});
