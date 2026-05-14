# AI 音樂 MV 成果集

## 目的

集中整理使用 AI 工具製作的音樂 MV 作品，方便在課堂、成果發表、家長日或研習中展示創作歷程與成果。

## 使用對象

- 年級：國小中高年級以上皆可延伸
- 科目：資訊、藝術、彈性課程、專題發表
- 使用者：教師

## 專案類型

- 靜態網頁成果集

## 結構

```text
AI音樂MV成果集/
├─ README.md
├─ index.html
├─ styles.css
└─ script.js
```

## 使用方式

1. 開啟 `index.html` 查看成果集頁面。
2. 部署到 GitHub Pages 後，使用教師 Google 帳號登入。
3. 登入帳號為 `shine@tmail.ilc.edu.tw` 時，頁面會出現管理表單，可新增、編輯或刪除 MV 作品。
4. 若作品是 YouTube 影片，將網址填入 `videoUrl`，頁面會自動轉成嵌入播放器，並自動產生 YouTube 縮圖。
5. 若想使用自訂縮圖，將圖片網址填入 `thumbnailUrl`。
6. 若作品放在其他平台，可將網址填入 `workUrl`，按鈕會開啟外部作品頁。

## Firebase 資料

- 集合：`aiMusicMvWorks`
- 讀取：公開讀取，讓成果集頁面可直接展示作品。
- 寫入：僅允許 `shine@tmail.ilc.edu.tw` 登入後新增、修改與刪除。

## 待辦

- [ ] 部署 Firestore rules
- [ ] 用教師帳號登入測試新增作品
- [ ] 放入正式 MV 作品標題與連結
