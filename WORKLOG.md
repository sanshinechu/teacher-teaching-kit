# 教師用教學套件工作日誌

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
