# 班級作品牆

Padlet 風格的班級作品展示工具。老師可以建立多個班級，學生進入指定班級後提交程式作品連結，頁面會自動顯示縮圖與作品卡片。

## 目前功能

- 建立多個班級入口
- 複製班級專屬連結給學生
- 學生登入後提交作品標題、網址與說明
- 作品牆自動產生網站縮圖
- 未設定 Firebase 時可用本機示範模式
- 填入 Firebase 設定後可使用 Google 登入與 Firestore 同步

## Firebase 連線

目前已接到 Firebase 專案 `study-b2e59`：

- Firebase Web App：`study-web`
- Firestore database：`(default)`
- 班級資料路徑：`projectWallClasses/{classId}`
- 作品資料路徑：`projectWallClasses/{classId}/submissions/{submissionId}`
- 教師帳號：`shine@tmail.ilc.edu.tw`

Firestore 不適合由前端在每次新增班級時建立一個全新的 database instance；這個工具採用「每個班級一個獨立文件 + 子集合」的結構。對老師與學生來說，每個班級會有自己的班級連結與作品資料區。

## 啟用或調整 Google 登入與跨裝置同步

1. 到 Firebase 建立專案。
2. 在 Authentication 啟用 Google provider。
3. 建立 Firestore Database。
4. 將 Firebase Web App 設定填入 `script.js` 最上方的 `firebaseConfig`。
5. 建議 Firestore Rules 先使用登入後才能讀寫：

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isClassOwner(classId) {
      return request.auth != null
        && exists(/databases/$(database)/documents/projectWallClasses/$(classId))
        && get(/databases/$(database)/documents/projectWallClasses/$(classId)).data.ownerUid == request.auth.uid;
    }

    function isTeacher() {
      return request.auth != null
        && request.auth.token.email == 'shine@tmail.ilc.edu.tw';
    }

    match /projectWallClasses/{classId} {
      allow read: if request.auth != null;
      allow create: if isTeacher()
        && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.ownerUid == request.auth.uid;

      match /submissions/{submissionId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
          && exists(/databases/$(database)/documents/projectWallClasses/$(classId))
          && request.resource.data.classId == classId
          && request.resource.data.authorUid == request.auth.uid;
        allow update: if false;
        allow delete: if isClassOwner(classId);
      }
    }
  }
}
```

## 縮圖說明

目前使用 `image.thum.io` 產生公開網站縮圖。若學生提交的網站禁止外部截圖或需要登入，縮圖可能無法顯示，但作品連結仍可開啟。
