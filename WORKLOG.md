# 教師用教學套件工作日誌

## 2026-05-14 收工 | 儀表板統計改用 Firestore 即時累加

**操作類型：** 功能調整 / Firestore 統計 / GitHub 推送 / Firebase 部署 / 資料校正

**處理專案：**
- `projects/儀表板入口/`
- Firebase 專案：`study-b2e59`
- Firestore 集合：`dashboardModuleCounters`
- Firebase Hosting：`https://study-b2e59.web.app`

**完成內容：**
- 將儀表板卡片統計從每台裝置各自的 `localStorage` 改為 Firestore 共用統計。
- 不同裝置開啟儀表板時，會看到同一份最新使用次數。
- 每次點擊工具卡片會透過 Firestore transaction 將該模組 `count + 1`。
- 頁面載入後使用 `onSnapshot` 即時讀取最新統計。
- 若本機沒有 `firebase-config.js`，才退回本機預覽用的 `localStorage` 計數。
- `index.html` 已加入 `firebase-config.js`，並將 `script.js` 改為 `type="module"`。
- Firestore rules 新增 `dashboardModuleCounters` 規則：
  - 公開讀取。
  - 只允許指定 10 個儀表板模組。
  - 建立時只能從 `count = 1` 開始。
  - 更新時只能每次 `count + 1`。
  - 不允許刪除。
- 已將兩筆統計值校正：
  - `教師數位名片`：20
  - `AI 音樂 MV 成果集`：12

**驗證：**
- `node --check projects/儀表板入口/script.js` 通過。
- Firestore rules 編譯並部署成功。
- 實際寫入測試成功。
- Firebase Hosting 已部署完成。
- 線上頁面已載入 `script.js?v=20260514-5`。
- 使用官方 Firebase SDK 讀回確認：
  - `profile` = 20，標題為 `教師數位名片`
  - `music` = 12，標題為 `AI 音樂 MV 成果集`
- 最新 commit：`4d6365e 儀表板統計改用 Firestore 即時累加`。
- GitHub `main` 已同步 `origin/main`。

**備註：**
- 工作區尚有未追蹤工具資料夾：`.claude/`、`.firebase/`，未納入提交。
- `WORKLOG.md` 本身尚未提交。

## 2026-05-14 收工 | 回復儀表板統計功能第一版並部署

**操作類型：** 版本回復 / GitHub 推送 / Firebase Hosting 部署

**處理專案：**
- `projects/儀表板入口/`
- Firebase 專案：`study-b2e59`
- GitHub repo：`sanshinechu/teacher-teaching-kit`
- Firebase Hosting：`https://study-b2e59.web.app`

**完成內容：**
- 依使用者確認，將入口儀表板回復到 `ce7b346 新增儀表板模組使用計數器`。
- 移除後續版本的上方 `Usage Counter` 免登入統計橫幅。
- 保留 `ce7b346` 的卡片本機使用次數統計。
- 移除後續新增的管理後台檔案：`admin.html`、`admin.js`。
- 將 `firestore.rules` 回復到 `ce7b346` 當時版本，移除後來 Firestore 計數規則。
- 建立回復提交並推送到 GitHub `main`。
- 部署 Firebase Hosting 與 Firestore rules 到 `study-b2e59`。

**驗證：**
- 本機預覽確認入口頁沒有 `Usage Counter` / 「正在啟用免登入統計」。
- 線上頁面確認沒有 `Usage Counter` / 「正在啟用免登入統計」。
- 線上 `script.js` 確認為 `ce7b346` 的本機卡片統計版本，包含 `teacher-dashboard-module-counters-v1`。
- Firestore rules 編譯並部署成功。
- 最新 commit：`08d2aa7 回復儀表板統計功能第一版`。
- GitHub `main` 已同步 `origin/main`。

**備註：**
- 工作區尚有未追蹤工具資料夾：`.claude/`、`.firebase/`，未納入提交。

## 2026-05-14 收工 | 儀表板模組使用計數器

**操作類型：** 功能調整 / Firestore 計數 / GitHub Pages 部署

**處理專案：**
- `projects/儀表板入口/`
- Firebase 專案：`study-b2e59`
- GitHub repo：`sanshinechu/teacher-teaching-kit`
- GitHub Pages：`https://sanshinechu.github.io/teacher-teaching-kit/projects/%E5%84%80%E8%A1%A8%E6%9D%BF%E5%85%A5%E5%8F%A3/`

**完成內容：**
- 儀表板每個模組保留使用計數器。
- 一般使用者不需要按 Google 登入，進入頁面後由 Firebase Anonymous Auth 在背景建立匿名身分。
- 每個模組每日每個匿名 `uid` 只建立一筆 `dashboardModuleDailyUses` 紀錄，達成每日唯一累加。
- Firestore rules 維持 `request.auth != null`，避免直接開放未登入公開寫入。
- 教師後台管理的 Google 登入需求不受影響。

**驗證：**
- `node --check projects/儀表板入口/script.js` 通過。
- `firebase.cmd deploy --only firestore:rules` 編譯並部署成功。
- GitHub Pages workflow `Deploy GitHub Pages` 成功。
- 線上 HTML 已指向 `script.js?v=20260514-3`。
- 最新 commit：`db1c5a7 改為免登入儀表板計數`。

**待處理：**
- Firebase Console 尚需啟用 Authentication 的 `Anonymous` sign-in provider；目前低層 API 測試回傳 `ADMIN_ONLY_OPERATION`。
- 啟用後再用線上頁面實測點擊任一模組，確認 Firestore 累計數字更新。

## 2026-05-14 補充 | Firebase / Firestore 資料庫名稱

**操作類型：** 專案資訊確認

**確認內容：**
- Firebase 專案名稱：`study-b2e59`
- Firestore 資料庫：`(default)`
- 儀表板計數集合：`dashboardModuleDailyUses`
- AI 音樂 MV 成果集集合：`aiMusicMvWorks`
- 班級作品牆集合：`projectWallClasses`，作品子集合為 `submissions`

**備註：**
- 這裡使用的是 Firebase Firestore 文件資料庫，不是傳統 SQL 資料庫。
