const TEACHER_EMAIL = "shine@tmail.ilc.edu.tw";
const COLLECTION = "dashboardModuleDailyUses";

const MODULES = [
  { id: "teacher-profile",   title: "教師數位名片" },
  { id: "random-picker",     title: "網頁抽點器" },
  { id: "mobile-links",      title: "連結牆" },
  { id: "ai-prompt-box",     title: "AI 詠唱提示詞百寶箱" },
  { id: "flowchart-canvas",  title: "運算思維流程畫布" },
  { id: "project-wall",      title: "班級作品牆" },
  { id: "ai-music-mv",       title: "AI 音樂 MV 成果集" },
  { id: "class-timer",       title: "班級倒數計時器" },
  { id: "quote-draw",        title: "隨機課堂鼓勵金句" },
  { id: "mood-checkin",      title: "心情簽到小工具" },
];

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}

function nowTime() {
  return new Date().toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function loadStats({ db, collection, query, where, getCountFromServer }) {
  const today = getTodayKey();
  const results = await Promise.all(MODULES.map(async (mod) => {
    const col = collection(db, COLLECTION);
    const [totalSnap, todaySnap] = await Promise.all([
      getCountFromServer(query(col, where("moduleId", "==", mod.id))),
      getCountFromServer(query(col, where("moduleId", "==", mod.id), where("usedDate", "==", today)))
    ]);
    return { ...mod, total: totalSnap.data().count, today: todaySnap.data().count };
  }));
  return results.sort((a, b) => b.total - a.total);
}

function renderTable(stats) {
  const tbody = document.getElementById("stats-body");
  if (!stats.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="padding:24px 16px;color:var(--muted);text-align:center">尚無資料</td></tr>`;
    return;
  }
  tbody.innerHTML = stats.map(m => `
    <tr>
      <td>${m.title}</td>
      <td class="num today-num">${m.today}</td>
      <td class="num total-num">${m.total}</td>
    </tr>
  `).join("");
}

async function init() {
  const config = window.TeacherDashboardFirebaseConfig;
  const statusEl = document.getElementById("status-text");

  if (!config?.apiKey) {
    statusEl.textContent = "找不到 Firebase 設定（本機預覽模式）";
    return;
  }

  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  const firebase = {
    db,
    collection: fsMod.collection,
    query: fsMod.query,
    where: fsMod.where,
    getCountFromServer: fsMod.getCountFromServer
  };

  const loginScreen  = document.getElementById("login-screen");
  const deniedScreen = document.getElementById("denied-screen");
  const adminScreen  = document.getElementById("admin-screen");

  document.getElementById("login-btn").addEventListener("click", async () => {
    const provider = new authMod.GoogleAuthProvider();
    try {
      await authMod.signInWithPopup(auth, provider);
    } catch (e) {
      statusEl.textContent = `登入失敗：${e.message}`;
    }
  });

  document.getElementById("denied-logout").addEventListener("click", () => authMod.signOut(auth));
  document.getElementById("logout-btn").addEventListener("click", () => authMod.signOut(auth));

  document.getElementById("refresh-btn").addEventListener("click", async () => {
    statusEl.textContent = "載入中…";
    document.getElementById("refresh-btn").disabled = true;
    try {
      const stats = await loadStats(firebase);
      renderTable(stats);
      statusEl.textContent = `更新於 ${nowTime()}`;
    } catch (e) {
      statusEl.textContent = `讀取失敗：${e.message}`;
    } finally {
      document.getElementById("refresh-btn").disabled = false;
    }
  });

  authMod.onAuthStateChanged(auth, async (user) => {
    loginScreen.hidden  = true;
    deniedScreen.hidden = true;
    adminScreen.hidden  = true;

    if (!user) {
      loginScreen.hidden = false;
      return;
    }

    if (user.email !== TEACHER_EMAIL) {
      deniedScreen.hidden = false;
      document.getElementById("denied-email").textContent = user.email;
      return;
    }

    adminScreen.hidden = false;
    document.getElementById("user-info").textContent = user.email;
    statusEl.textContent = "載入中…";

    try {
      const stats = await loadStats(firebase);
      renderTable(stats);
      statusEl.textContent = `更新於 ${nowTime()}`;
    } catch (e) {
      statusEl.textContent = `讀取失敗：${e.message}`;
    }
  });
}

init().catch((e) => {
  document.getElementById("status-text").textContent = `初始化失敗：${e.message}`;
});
