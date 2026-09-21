# 班級作品牆

Padlet 風格的班級作品展示工具。老師可以建立多個班級，學生進入指定班級後提交程式作品連結，頁面會自動顯示縮圖與作品卡片。

## 目前功能

- 建立多個班級入口
- 用資料夾把幾個班級收在一起（例如「五年級 Scratch 動畫」放 501～503），點資料夾可一次看全部班級的作品，上方可切換「全部／單一班級」；資料夾可收合（收合狀態只記在這台電腦）
- 作品卡片縮小，桌機一列約 5 件、手機一列 2 件
- 複製班級專屬連結給學生
- 學生登入後提交作品標題、網址與說明
- 家長拿到班級連結免登入即可瀏覽作品
- 作品牆自動產生網站縮圖
- 未設定 Firebase 時可用本機示範模式
- 填入 Firebase 設定後可使用 Google 登入與 Firestore 同步

## Firebase 連線

目前已接到 Firebase 專案 `study-b2e59`：

- Firebase Web App：`study-web`
- Firestore database：`(default)`
- 班級資料路徑：`projectWallClasses/{classId}`
- 作品資料路徑：`projectWallClasses/{classId}/submissions/{submissionId}`
- 資料夾資料路徑：`projectWallFolders/{folderId}`（`name`、`ownerUid`、`createdAt`）；班級文件用選填的 `folderId` 指向所屬資料夾，沒有就是「未分類」
- 教師帳號：`shine@tmail.ilc.edu.tw`

Firestore 不適合由前端在每次新增班級時建立一個全新的 database instance；這個工具採用「每個班級一個獨立文件 + 子集合」的結構。對老師與學生來說，每個班級會有自己的班級連結與作品資料區。

## 啟用或調整 Google 登入與跨裝置同步

1. 到 Firebase 建立專案。
2. 在 Authentication 啟用 Google provider。
3. 建立 Firestore Database。
4. 將 Firebase Web App 設定填入 `script.js` 最上方的 `firebaseConfig`。
5. Firestore Rules 正本在 repo 根目錄的 `firestore.rules`（整個 `study-b2e59` 專案共用，別在這裡另抄一份）。改完用 `firebase deploy --only firestore:rules` 上線。

## 誰能看、誰能貼

- **看作品**：拿到班級連結（`?class=...`）的人免登入就能看，方便家長瀏覽。
- **列出所有班級**：需要登入，所以沒有連結的人翻不到其他班。
- **貼作品**：學生要用 Google 登入，作品會掛上 Google 帳號名稱（家長看得到）。
- **刪作品**：只有建立該班的老師。
- **資料夾**：只有老師自己看得到，沒有對外連結；刪資料夾不會刪到裡面的班級與作品，班級會回到「未分類」。

## 縮圖說明

目前使用 `image.thum.io` 產生公開網站縮圖。若學生提交的網站禁止外部截圖或需要登入，縮圖可能無法顯示，但作品連結仍可開啟。
