const firebaseConfig = window.TeacherMusicMvFirebaseConfig || {};
const teacherEmails = ["shine@tmail.ilc.edu.tw"];
const collectionName = "aiMusicMvWorks";

const seedWorks = [
  {
    id: "seed-campus-morning",
    title: "校園晨光練習曲",
    category: "校園活動",
    description: "以校園日常、學生笑容與晨間光影為主題，示範如何把活動照片延伸成溫暖的音樂 MV。",
    tools: ["AI 作曲", "AI 影像", "剪輯"],
    classroom: "適合校慶、成果發表或班級回顧影片開場。",
    videoUrl: "",
    workUrl: "",
    color: "#e85d75"
  },
  {
    id: "seed-scratch-adventure",
    title: "Scratch 冒險主題曲",
    category: "課程創作",
    description: "把學生遊戲專題的角色、場景與關卡概念轉成主題歌，讓程式作品有完整發表氛圍。",
    tools: ["Suno", "影像生成", "Canva"],
    classroom: "適合 Scratch 專題發表、遊戲設計課與作品展。",
    videoUrl: "",
    workUrl: "",
    color: "#384c9f"
  },
  {
    id: "seed-festival-greeting",
    title: "節慶祝福 MV",
    category: "節慶主題",
    description: "以節慶問候、班級合照與 AI 生成畫面組成祝福短片，方便在班級或社群分享。",
    tools: ["AI 歌詞", "AI 編曲", "短影音剪輯"],
    classroom: "適合畢業、母親節、教師節與期末成果分享。",
    videoUrl: "",
    workUrl: "",
    color: "#1c9a93"
  }
];

const gallery = document.querySelector("#gallery");
const workCount = document.querySelector("#work-count");
const authStatus = document.querySelector("#auth-status");
const loginButton = document.querySelector("#login-button");
const logoutButton = document.querySelector("#logout-button");
const setupNotice = document.querySelector("#setup-notice");
const adminPanel = document.querySelector("#admin-panel");
const workForm = document.querySelector("#work-form");
const workIdInput = document.querySelector("#work-id-input");
const titleInput = document.querySelector("#title-input");
const categoryInput = document.querySelector("#category-input");
const descriptionInput = document.querySelector("#description-input");
const toolsInput = document.querySelector("#tools-input");
const classroomInput = document.querySelector("#classroom-input");
const videoUrlInput = document.querySelector("#video-url-input");
const workUrlInput = document.querySelector("#work-url-input");
const colorInput = document.querySelector("#color-input");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const featuredScreen = document.querySelector("#featured-screen");
const featuredTitle = document.querySelector("#featured-title");
const featuredDescription = document.querySelector("#featured-description");
const featuredTools = document.querySelector("#featured-tools");
const featuredClassroom = document.querySelector("#featured-classroom");
const featuredLink = document.querySelector("#featured-link");
const filterButtons = document.querySelectorAll(".filter-button");

const state = {
  mode: "local",
  user: null,
  works: [...seedWorks],
  activeFilter: "all",
  firebase: null,
  unsubscribeWorks: null
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

function isTeacherUser() {
  return Boolean(state.user?.email && teacherEmails.includes(state.user.email));
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getEmbedUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsedUrl.pathname.replace("/", "")}`;
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return url;
  } catch {
    return "";
  }
}

function renderAuth() {
  const displayName = state.user?.displayName || state.user?.email || "尚未登入";
  authStatus.textContent = state.user ? displayName : "尚未登入";
  loginButton.classList.toggle("is-hidden", Boolean(state.user));
  logoutButton.classList.toggle("is-hidden", !state.user);
  adminPanel.classList.toggle("is-hidden", !isTeacherUser());
  setupNotice.classList.toggle("is-hidden", hasFirebaseConfig());
}

function renderGallery(filter = state.activeFilter) {
  const works = filter === "all" ? state.works : state.works.filter((work) => work.category === filter);
  gallery.innerHTML = works
    .map((work) => {
      const tags = [work.category, ...work.tools].map((tag) => `<span>${tag}</span>`).join("");
      const adminActions = isTeacherUser()
        ? `<button class="edit-button" type="button" data-id="${work.id}">編輯</button>
          <button class="delete-button" type="button" data-id="${work.id}">刪除</button>`
        : "";
      return `
        <article class="work-card" style="--card-color: ${work.color}">
          <div class="cover" aria-hidden="true"><span>♪</span></div>
          <div>
            <h3>${work.title}</h3>
            <p>${work.description}</p>
            <div class="tag-row">${tags}</div>
          </div>
          <div class="card-actions">
            <button class="select-button" type="button" data-id="${work.id}">查看作品</button>
            ${adminActions}
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".select-button").forEach((button) => {
    button.addEventListener("click", () => selectWork(button.dataset.id));
  });
  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", () => editWork(button.dataset.id));
  });
  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteWork(button.dataset.id).catch((error) => window.alert(error.message)));
  });
}

function selectWork(workId) {
  const work = state.works.find((item) => item.id === workId) || state.works[0];
  if (!work) {
    return;
  }

  const embedUrl = getEmbedUrl(work.videoUrl);
  featuredTitle.textContent = work.title;
  featuredDescription.textContent = work.description;
  featuredTools.textContent = work.tools.join("、");
  featuredClassroom.textContent = work.classroom;

  featuredScreen.innerHTML = embedUrl
    ? `<iframe title="${work.title}" src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
    : `<div class="empty-screen"><span aria-hidden="true">♪</span><p>${work.title} 尚未放入影片連結，可先保留作品說明與製作流程。</p></div>`;

  const targetUrl = work.workUrl || work.videoUrl;
  if (targetUrl) {
    featuredLink.href = targetUrl;
    featuredLink.classList.remove("is-disabled");
    featuredLink.setAttribute("aria-disabled", "false");
  } else {
    featuredLink.href = "#";
    featuredLink.classList.add("is-disabled");
    featuredLink.setAttribute("aria-disabled", "true");
  }
}

function resetForm() {
  workForm.reset();
  workIdInput.value = "";
  colorInput.value = "#e85d75";
}

function editWork(workId) {
  const work = state.works.find((item) => item.id === workId);
  if (!work) {
    return;
  }

  workIdInput.value = work.id;
  titleInput.value = work.title || "";
  categoryInput.value = work.category || "校園活動";
  descriptionInput.value = work.description || "";
  toolsInput.value = Array.isArray(work.tools) ? work.tools.join(", ") : "";
  classroomInput.value = work.classroom || "";
  videoUrlInput.value = work.videoUrl || "";
  workUrlInput.value = work.workUrl || "";
  colorInput.value = work.color || "#e85d75";
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getFormPayload() {
  return {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    tools: toolsInput.value.split(",").map((tool) => tool.trim()).filter(Boolean),
    classroom: classroomInput.value.trim(),
    videoUrl: normalizeUrl(videoUrlInput.value),
    workUrl: normalizeUrl(workUrlInput.value),
    color: colorInput.value
  };
}

async function saveWork(payload) {
  if (!isTeacherUser()) {
    window.alert("只有教師帳號可以修改成果集。");
    return;
  }

  if (state.mode !== "firebase") {
    window.alert("尚未載入 Firebase 設定，無法儲存到雲端。");
    return;
  }

  const {
    db,
    collection,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp
  } = state.firebase;
  const workId = workIdInput.value;

  if (workId) {
    await updateDoc(doc(db, collectionName, workId), {
      ...payload,
      updatedAt: serverTimestamp()
    });
  } else {
    await addDoc(collection(db, collectionName), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  resetForm();
}

async function deleteWork(workId) {
  if (!isTeacherUser()) {
    window.alert("只有教師帳號可以刪除成果。");
    return;
  }

  const work = state.works.find((item) => item.id === workId);
  const shouldDelete = window.confirm(`確定要刪除「${work?.title || "這支 MV"}」嗎？`);
  if (!shouldDelete) {
    return;
  }

  const { db, doc, deleteDoc } = state.firebase;
  await deleteDoc(doc(db, collectionName, workId));
}

async function signIn() {
  if (state.mode !== "firebase") {
    window.alert("尚未載入 Firebase 設定，請部署後再使用 Google 登入。");
    return;
  }

  const { auth, provider, signInWithPopup } = state.firebase;
  await signInWithPopup(auth, provider);
}

async function signOutCurrentUser() {
  if (state.mode !== "firebase") {
    return;
  }

  await state.firebase.signOut(state.firebase.auth);
}

async function initFirebase() {
  setupNotice.classList.toggle("is-hidden", hasFirebaseConfig());
  if (!hasFirebaseConfig()) {
    renderAuth();
    renderGallery();
    selectWork(state.works[0]?.id);
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
    addDoc: firestoreModule.addDoc,
    updateDoc: firestoreModule.updateDoc,
    deleteDoc: firestoreModule.deleteDoc,
    onSnapshot: firestoreModule.onSnapshot,
    query: firestoreModule.query,
    orderBy: firestoreModule.orderBy,
    serverTimestamp: firestoreModule.serverTimestamp
  };

  state.firebase.onAuthStateChanged(auth, (user) => {
    state.user = user;
    renderAuth();
    renderGallery();
  });

  const worksQuery = state.firebase.query(
    state.firebase.collection(db, collectionName),
    state.firebase.orderBy("createdAt", "desc")
  );

  state.unsubscribeWorks = state.firebase.onSnapshot(worksQuery, (snapshot) => {
    const firebaseWorks = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    state.works = firebaseWorks.length > 0 ? firebaseWorks : [...seedWorks];
    workCount.textContent = String(state.works.length);
    renderGallery();
    selectWork(state.works[0]?.id);
  }, (error) => {
    console.error(error);
    state.works = [...seedWorks];
    renderGallery();
    selectWork(state.works[0]?.id);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.activeFilter = button.dataset.filter;
    renderGallery();
  });
});

loginButton.addEventListener("click", () => {
  signIn().catch((error) => window.alert(error.message));
});

logoutButton.addEventListener("click", () => {
  signOutCurrentUser().catch((error) => window.alert(error.message));
});

workForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveWork(getFormPayload()).catch((error) => window.alert(error.message));
});

cancelEditButton.addEventListener("click", resetForm);

workCount.textContent = String(state.works.length);
initFirebase().catch((error) => {
  console.error(error);
  renderAuth();
  renderGallery();
  selectWork(state.works[0]?.id);
});
