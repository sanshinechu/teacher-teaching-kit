/**
 * cloud.js — 成績同步（學生端）
 *
 * ⚠️ 這裡刻意不載 Firebase SDK，只用 fetch 打 Firestore 的 REST API。
 *
 * 理由是這個工具的底線：零 CDN，拷到隨身碟雙擊就要能開。
 * 2026-08-25 教網中心對外斷線那次，掛 CDN 的東西全部變成一整堂空白。
 * 載 SDK 就等於把這條底線交出去。REST 只是一個 fetch，沒有任何依賴。
 *
 * 所以雲端在這裡是「加值」而不是「前提」：
 *   沒有 firebase-config.js（本機開、隨身碟開）→ 整個模組靜默停用
 *   有設定但連不上（斷網、教網中心又掛了）→ 寫入排進佇列，下次連得上再補
 *
 * 兩種情況孩子都照常練、成績照樣進 localStorage。雲端斷了，課不會斷。
 */
(function (global) {
  'use strict';

  var CFG = global.TypingPracticeFirebaseConfig || null;
  var PENDING_KEY = 'typing.pending.v1';
  var COLLECTION = 'typingScores';

  var projectId = CFG && CFG.projectId;
  var apiKey = CFG && CFG.apiKey;

  function available() {
    return !!(projectId && apiKey);
  }

  function docPath(id) {
    return 'projects/' + projectId + '/databases/(default)/documents/' +
           COLLECTION + '/' + id;
  }

  function docId(student, levelId) {
    return student.klass + '-' + student.seat + '-' + levelId;
  }

  // ---- Firestore REST 的欄位格式轉換 --------------------------------------

  function toFields(rec) {
    return {
      klass:    { stringValue: rec.klass },
      seat:     { stringValue: rec.seat },
      levelId:  { stringValue: rec.levelId },
      stars:    { integerValue: String(rec.stars) },
      accuracy: { integerValue: String(rec.accuracy) },
      wpm:      { doubleValue: Number(rec.wpm) || 0 }
    };
  }

  function fromFields(fields) {
    if (!fields) return null;
    return {
      klass: fields.klass && fields.klass.stringValue,
      seat: fields.seat && fields.seat.stringValue,
      levelId: fields.levelId && fields.levelId.stringValue,
      stars: Number(fields.stars && fields.stars.integerValue) || 0,
      accuracy: Number(fields.accuracy && fields.accuracy.integerValue) || 0,
      wpm: Number(fields.wpm && (fields.wpm.doubleValue || fields.wpm.integerValue)) || 0,
      at: fields.updatedAt && fields.updatedAt.timestampValue
    };
  }

  // ---- 離線佇列 -----------------------------------------------------------
  //
  // 電腦教室的網路本來就不穩。寫失敗不該讓孩子看到錯誤，
  // 排進佇列、下次開啟時默默補送就好。

  function loadPending() {
    try {
      var arr = JSON.parse(global.localStorage.getItem(PENDING_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function savePending(list) {
    try {
      // 只留最近 60 筆，避免長期離線把 localStorage 塞爆
      global.localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-60)));
    } catch (e) { /* 存不進去就算了，成績本體在進度那份裡 */ }
  }

  function queue(rec) {
    var list = loadPending().filter(function (p) {
      // 同一個學生同一關只留最新的一筆
      return !(p.klass === rec.klass && p.seat === rec.seat && p.levelId === rec.levelId);
    });
    list.push(rec);
    savePending(list);
  }

  // ---- 寫入 ---------------------------------------------------------------

  /**
   * 把失敗分成「重試會好」和「重試也不會好」兩種。
   *
   * 🕳️ 這裡不能只看 HTTP 狀態碼。2026-09-02 實測：Firestore API 沒啟用時
   * 回的是 403 + `"status": "PERMISSION_DENIED"`，跟「安全規則拒絕」
   * **一模一樣**。只有 `details[].reason` 分得出來（前者是 SERVICE_DISABLED）。
   *
   * 分錯的後果是安靜的：把「設定還沒開」當成永久失敗就不會排進佇列，
   * 之後設定好了也永遠補不回來——而畫面還會顯示「已經存到雲端了」。
   */
  function classify(status, text) {
    if (status === 400) return 'permanent';       // 欄位不合法，重試不會變好
    if (status === 403) {
      // 設定問題，之後會好 → 值得留著重試
      if (text.indexOf('SERVICE_DISABLED') >= 0) return 'retry';
      // 安全規則擋下來的（多半是這次成績沒有比較好）→ 重試永遠不會過
      return 'permanent';
    }
    return 'retry';                               // 5xx、斷網、DNS 掛掉…
  }

  /**
   * 用 :commit 而不是 PATCH，因為要讓 updatedAt 走伺服器時間
   * （規則裡要求 `updatedAt == request.time`，前端送什麼都不算數）。
   * PATCH 沒辦法帶 transform，commit 才可以。
   *
   * 回傳 'ok' / 'permanent' / 'retry'。
   */
  function push(rec) {
    var body = {
      writes: [{
        update: {
          name: docPath(docId(rec, rec.levelId)),
          fields: toFields(rec)
        },
        updateTransforms: [{
          fieldPath: 'updatedAt',
          setToServerValue: 'REQUEST_TIME'
        }]
      }]
    };
    return global.fetch(
      'https://firestore.googleapis.com/v1/projects/' + projectId +
      '/databases/(default)/documents:commit?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    ).then(function (res) {
      if (res.ok) return 'ok';
      return res.text().then(function (t) {
        var kind = classify(res.status, t);
        console.warn('[cloud] 寫入失敗（' + res.status + '／' + kind + '）：' +
                     t.replace(/\s+/g, ' ').slice(0, 180));
        return kind;
      });
    }).catch(function (e) {
      console.warn('[cloud] 連不上：', e.message);
      return 'retry';
    });
  }

  /**
   * 存一筆成績。永遠回傳 Promise，而且永遠不 reject——
   * 上傳失敗不該讓畫面出現任何錯誤，孩子只是在打字。
   *
   * 回傳 'saved' / 'queued' / 'rejected' / 'disabled' / 'anonymous'。
   */
  function save(student, levelId, record) {
    if (!available()) return global.Promise.resolve('disabled');
    if (!student || !student.klass || !student.seat) return global.Promise.resolve('anonymous');

    var rec = {
      klass: student.klass,
      seat: student.seat,
      levelId: levelId,
      stars: record.stars,
      accuracy: record.accuracy,
      wpm: record.wpm
    };

    return push(rec).then(function (kind) {
      if (kind === 'ok') return 'saved';
      if (kind === 'retry') { queue(rec); return 'queued'; }
      return 'rejected';
    });
  }

  /** 補送佇列裡積欠的成績。開啟頁面時跑一次。 */
  function flushPending() {
    if (!available()) return global.Promise.resolve(0);
    var list = loadPending();
    if (!list.length) return global.Promise.resolve(0);

    var remain = [];
    var sent = 0;
    return list.reduce(function (chain, rec) {
      return chain.then(function () {
        return push(rec).then(function (kind) {
          if (kind === 'ok') { sent++; return; }
          if (kind === 'permanent') return;      // 留著也不會成功，丟掉
          // 重試上限：長期連不上的話不要無限累積
          rec.tries = (rec.tries || 0) + 1;
          if (rec.tries < 8) remain.push(rec);
        });
      });
    }, global.Promise.resolve()).then(function () {
      savePending(remain);
      return sent;
    });
  }

  // ---- 讀回 ---------------------------------------------------------------

  /**
   * 把這個學生的成績從雲端抓回來。
   * 用途是「換一台電腦坐，星星還在」——也是雲端存在的主要理由。
   *
   * 用 :batchGet 一次要六關，不要一關發一個 GET。
   * 🕳️ 一關一個 GET 的話，沒打過的關卡各回一個 404，開一次頁面就在
   * console 留下五六筆紅色錯誤——功能是好的，但看起來像壞掉，
   * 而且六個來回也比一趟慢。batchGet 對不存在的文件回 `missing`，
   * 那是正常回應不是錯誤。
   *
   * 附帶好處：文件 ID 在 JSON body 裡，不必像 GET 那樣煩惱中文班級的 URL 編碼。
   */
  function fetchMine(student, levelIds) {
    if (!available()) return global.Promise.resolve(null);
    if (!student || !student.klass || !student.seat) return global.Promise.resolve(null);

    var names = levelIds.map(function (levelId) {
      return docPath(docId(student, levelId));
    });

    return global.fetch(
      'https://firestore.googleapis.com/v1/projects/' + projectId +
      '/databases/(default)/documents:batchGet?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: names })
      }
    ).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (items) {
      var out = {};
      (items || []).forEach(function (item) {
        if (!item || !item.found || !item.found.fields) return;   // missing＝還沒打過
        var rec = fromFields(item.found.fields);
        if (rec && rec.levelId) out[rec.levelId] = rec;
      });
      return out;
    }).catch(function (e) {
      console.warn('[cloud] 拿不回雲端進度（這次就用本機的）：', e.message);
      return null;
    });
  }

  global.TypingCloud = {
    available: available,
    save: save,
    fetchMine: fetchMine,
    flushPending: flushPending,
    pendingCount: function () { return loadPending().length; }
  };
})(window);
