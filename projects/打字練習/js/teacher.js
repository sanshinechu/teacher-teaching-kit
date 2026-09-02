/**
 * teacher.js — 老師端：看全班進度、匯出 CSV
 *
 * ⚠️ 這裡「可以」載 Firebase SDK，跟學生端不一樣，理由要講清楚：
 *
 * 學生端的底線是「零 CDN、拷到隨身碟雙擊就能開」，因為 2026-08-25 教網中心
 * 斷線那次，掛 CDN 的東西全成了一整堂空白。老師端沒有這個問題——它的功能
 * 就是「看雲端資料」，連不上網的時候本來就沒有東西可看。而列出全班需要
 * Google 登入，用 REST 自己實作 OAuth 並不划算。
 *
 * 所以分野是：**學生端零依賴、老師端可以有依賴**。改這支的時候
 * 別把 SDK 順手搬去 cloud.js。
 */
const V = 'https://www.gstatic.com/firebasejs/10.12.5/';   // 版本跟隔壁兩個專案一致

const CFG = window.TypingPracticeFirebaseConfig || null;
const LEVELS = ['en-1', 'en-2', 'en-3', 'en-4', 'en-5', 'en-6'];
const LEVEL_NAME = ['第1關', '第2關', '第3關', '第4關', '第5關', '第6關'];

const $ = (id) => document.getElementById(id);
const say = (t) => { $('msg').innerHTML = t; };

let db = null;
let auth = null;
let fs = null;
let rows = [];
let currentClass = '';

function starText(n) {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

/** 座號排序：能當數字就照數字比，否則照字串。不然 10 號會排在 2 號前面。 */
function seatOrder(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b), 'zh-Hant');
}

async function boot() {
  if (!CFG || !CFG.projectId) {
    say('找不到 <code>firebase-config.js</code>。那個檔是 GitHub Actions 部署時才生成的，' +
        '所以老師端<b>要從網站上開</b>，不能用本機檔案直接開。');
    return;
  }

  const [appMod, authMod, fsMod] = await Promise.all([
    import(V + 'firebase-app.js'),
    import(V + 'firebase-auth.js'),
    import(V + 'firebase-firestore.js')
  ]);
  fs = fsMod;
  const app = appMod.initializeApp(CFG);
  auth = authMod.getAuth(app);
  db = fsMod.getFirestore(app);

  $('btnLogin').addEventListener('click', async () => {
    try {
      await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
    } catch (e) {
      say('登入沒有成功：' + e.message);
    }
  });
  $('btnLogout').addEventListener('click', () => authMod.signOut(auth));

  authMod.onAuthStateChanged(auth, (user) => {
    $('btnLogin').hidden = !!user;
    $('btnLogout').hidden = !user;
    if (user) {
      say('已登入：<b>' + user.email + '</b>');
      load();
    } else {
      say('請先登入。只有老師的帳號讀得到全班成績。');
      $('controls').hidden = true;
      $('tableCard').hidden = true;
    }
  });

  $('btnReload').addEventListener('click', load);
  $('btnCsv').addEventListener('click', exportCsv);
  $('btnClear').addEventListener('click', clearClass);
  $('selClass').addEventListener('change', (e) => {
    currentClass = e.target.value;
    render();
  });
}

async function load() {
  say('讀取中…');
  try {
    const snap = await fs.getDocs(fs.collection(db, 'typingScores'));
    rows = snap.docs.map((d) => d.data());
    if (!rows.length) {
      say('目前還沒有任何成績。學生在網站上練完一關、而且破了自己的紀錄，這裡就會出現。');
      $('controls').hidden = true;
      $('tableCard').hidden = true;
      return;
    }
    const classes = [...new Set(rows.map((r) => r.klass))]
      .sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant'));
    $('selClass').innerHTML = classes
      .map((c) => '<option value="' + c + '">' + c + '</option>').join('');
    currentClass = classes.indexOf(currentClass) >= 0 ? currentClass : classes[0];
    $('selClass').value = currentClass;
    $('controls').hidden = false;
    say('已登入：<b>' + (auth.currentUser ? auth.currentUser.email : '') + '</b>');
    render();
  } catch (e) {
    // 規則只讓老師那個 email 列出全班，其他帳號會走到這裡
    say('讀不到資料：' + e.message +
        '<br>訊息如果是 <code>permission-denied</code>，代表登入的帳號' +
        '不是安全規則裡設定的老師帳號。');
    $('controls').hidden = true;
    $('tableCard').hidden = true;
  }
}

function classRows() {
  return rows.filter((r) => r.klass === currentClass);
}

function render() {
  const mine = classRows();
  const seats = [...new Set(mine.map((r) => r.seat))].sort(seatOrder);

  const byKey = {};
  mine.forEach((r) => { byKey[r.seat + '|' + r.levelId] = r; });

  let html = '<thead><tr><th>座號</th>' +
    LEVEL_NAME.map((n) => '<th>' + n + '</th>').join('') +
    '<th>總星數</th></tr></thead><tbody>';

  seats.forEach((seat) => {
    let total = 0;
    const cells = LEVELS.map((lv) => {
      const r = byKey[seat + '|' + lv];
      if (!r) return '<td class="t-none">—</td>';
      total += r.stars;
      const tip = '正確率 ' + r.accuracy + '%，每分鐘 ' + r.wpm + ' 字';
      return '<td class="t-stars" title="' + tip + '">' + starText(r.stars) + '</td>';
    }).join('');
    html += '<tr><td>' + seat + '</td>' + cells +
            '<td class="t-sum">' + total + '</td></tr>';
  });

  html += '</tbody>';
  $('table').innerHTML = html;
  $('tableCard').hidden = false;

  const done = mine.length;
  const full = seats.length * LEVELS.length;
  $('summary').textContent = currentClass + ' 班：' + seats.length + ' 人、已完成 ' +
    done + ' / ' + full + ' 關（滑鼠移到星星上可以看正確率和速度）';
}

function exportCsv() {
  const mine = classRows().slice().sort((a, b) =>
    seatOrder(a.seat, b.seat) || a.levelId.localeCompare(b.levelId));

  const head = ['班級', '座號', '關卡', '星等', '正確率(%)', '每分鐘字數', '更新時間'];
  const lines = [head].concat(mine.map((r) => [
    r.klass,
    r.seat,
    LEVEL_NAME[LEVELS.indexOf(r.levelId)] || r.levelId,
    r.stars,
    r.accuracy,
    r.wpm,
    r.updatedAt && r.updatedAt.toDate ? r.updatedAt.toDate().toLocaleString('zh-TW') : ''
  ]));

  const csv = lines.map((row) => row.map((cell) => {
    const s = String(cell == null ? '' : cell);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');

  // BOM 不能省：不加的話 Excel 開中文會是亂碼，而老師多半就是用 Excel 開
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '打字練習成績_' + currentClass + '_' +
    new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function clearClass() {
  const mine = classRows();
  if (!mine.length) return;
  const yes = window.confirm(
    '要清掉 ' + currentClass + ' 班的 ' + mine.length + ' 筆成績嗎？\n\n' +
    '這個動作沒辦法復原。學生電腦上的星星不會被清掉，只會清掉雲端這一份。');
  if (!yes) return;

  say('清除中…（' + mine.length + ' 筆）');
  let done = 0;
  for (const r of mine) {
    const id = r.klass + '-' + r.seat + '-' + r.levelId;
    try {
      await fs.deleteDoc(fs.doc(db, 'typingScores', id));
      done++;
    } catch (e) {
      console.warn('刪不掉', id, e.message);
    }
  }
  say('已清掉 ' + done + ' 筆。');
  load();
}

boot();
