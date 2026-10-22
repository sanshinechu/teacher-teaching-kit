const firebaseConfig = window.TeacherDashboardFirebaseConfig;
const collectionName = "dashboardModuleCounters";
const localStorageKey = "teacher-dashboard-module-counters-v1";

const moduleIds = new Map([
  ["profile", "profile"],
  ["picker", "picker"],
  ["links", "links"],
  ["prompt", "prompt"],
  ["flowchart", "flowchart"],
  ["gallery", "gallery"],
  ["music", "music"],
  ["typing", "typing"],
  ["timer", "timer"],
  ["quotes", "quotes"],
  ["mood", "mood"]
]);

const state = {
  mode: "local",
  counters: {},
  firebase: null,
  unsubscribeCounters: null
};

const inFlight = new Set();

function hasFirebaseConfig() {
  return firebaseConfig
    && firebaseConfig.apiKey
    && firebaseConfig.projectId
    && !firebaseConfig.apiKey.startsWith("${");
}

function getModuleId(card) {
  for (const [className, moduleId] of moduleIds) {
    if (card.classList.contains(className)) {
      return moduleId;
    }
  }

  return "";
}

function getModuleMeta(card) {
  return {
    moduleId: getModuleId(card),
    title: card.querySelector("strong")?.textContent?.trim() || "未命名工具",
    href: card.getAttribute("href") || ""
  };
}

function getCounterBadge(card) {
  let badge = card.querySelector(".usage-counter");
  if (badge) {
    return badge;
  }

  badge = document.createElement("span");
  badge.className = "usage-counter";
  badge.innerHTML = "<strong>0</strong><span>使用次數</span>";
  card.append(badge);
  return badge;
}

function setBadgeStatus(card, text) {
  const badge = getCounterBadge(card);
  badge.querySelector("span").textContent = text;
}

function animateBadge(card) {
  const badge = getCounterBadge(card);
  badge.classList.remove("is-counted");
  window.requestAnimationFrame(() => badge.classList.add("is-counted"));
}

function renderCounters() {
  document.querySelectorAll(".tool-card").forEach((card) => {
    const { moduleId } = getModuleMeta(card);
    const badge = getCounterBadge(card);
    badge.querySelector("strong").textContent = String(state.counters[moduleId] || 0);
    badge.classList.toggle("is-cloud", state.mode === "firebase");
    if (!inFlight.has(moduleId)) {
      badge.querySelector("span").textContent = "使用次數";
    }
  });
}

function loadLocalCounters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(localStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalCounters() {
  localStorage.setItem(localStorageKey, JSON.stringify(state.counters));
}

function countLocalModule(card) {
  const { moduleId } = getModuleMeta(card);
  state.counters[moduleId] = Number(state.counters[moduleId] || 0) + 1;
  saveLocalCounters();
  renderCounters();
  animateBadge(card);
}

async function countCloudModule(card) {
  const { moduleId, title, href } = getModuleMeta(card);
  if (!moduleId || !state.firebase) {
    countLocalModule(card);
    return;
  }

  if (inFlight.has(moduleId)) {
    return;
  }
  inFlight.add(moduleId);

  const { db, doc, runTransaction, serverTimestamp } = state.firebase;
  const counterRef = doc(db, collectionName, moduleId);
  setBadgeStatus(card, "寫入中");

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(counterRef);
      const nextCount = snapshot.exists() ? Number(snapshot.data().count || 0) + 1 : 1;
      transaction.set(counterRef, {
        moduleId,
        title,
        href,
        count: nextCount,
        updatedAt: serverTimestamp()
      });
    });
    animateBadge(card);
    setBadgeStatus(card, "已計入");
    setTimeout(() => {
      setBadgeStatus(card, "使用次數");
    }, 1200);
  } catch (error) {
    console.error(error);
    setBadgeStatus(card, "寫入失敗");
    setTimeout(() => {
      setBadgeStatus(card, "使用次數");
    }, 3000);
  } finally {
    setTimeout(() => {
      inFlight.delete(moduleId);
    }, 1000);
  }
}

function countModuleUse(card, event) {
  if (event && event.isTrusted === false) {
    return;
  }

  if (state.mode === "firebase") {
    countCloudModule(card);
    return;
  }

  countLocalModule(card);
}

function bindCounterEvents() {
  document.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", (event) => countModuleUse(card, event));
    card.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });
}

async function initFirebase() {
  if (!hasFirebaseConfig()) {
    state.counters = loadLocalCounters();
    renderCounters();
    return;
  }

  try {
    const [{ initializeApp }, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]);

    const app = initializeApp(firebaseConfig);
    const db = firestoreModule.getFirestore(app);
    state.mode = "firebase";
    state.firebase = {
      db,
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      onSnapshot: firestoreModule.onSnapshot,
      query: firestoreModule.query,
      runTransaction: firestoreModule.runTransaction,
      serverTimestamp: firestoreModule.serverTimestamp
    };

    subscribeCloudCounters();
  } catch (error) {
    console.error(error);
    state.mode = "local";
    state.counters = loadLocalCounters();
    renderCounters();
  }
}

function subscribeCloudCounters() {
  const { db, collection, onSnapshot, query } = state.firebase;
  const countersQuery = query(collection(db, collectionName));
  state.unsubscribeCounters?.();

  state.unsubscribeCounters = onSnapshot(countersQuery, (snapshot) => {
    state.counters = {};
    snapshot.docs.forEach((docSnapshot) => {
      state.counters[docSnapshot.id] = Number(docSnapshot.data().count || 0);
    });
    renderCounters();
  }, (error) => {
    console.error(error);
    document.querySelectorAll(".tool-card").forEach((card) => setBadgeStatus(card, "讀取失敗"));
  });
}

function initDashboardCounters() {
  bindCounterEvents();
  renderCounters();
  initFirebase();
}

initDashboardCounters();
