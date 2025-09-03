# Nakhon Sawan 船麵叫號系統 (QueueMe for Boat Noodles)

> 一套專為餐飲門市設計的極簡無登入叫號系統  
> 店名：**那空沙旺船麵จังหวัดนครสวรรค์**  
> MVP 版本：支援取號、叫號、資料自動清除，未來可擴充點餐功能。

## 🚀 專案簡介

這是一個用於餐飲業的**網頁版叫號系統**，可供用戶透過手機掃描 QR Code 取號。系統具有**無需登入、自動清除資料、簡易管理後台**等功能，部署在 **Cloudflare Pages / Workers** 上，支援高效、低延遲的店內使用場景。

## 🧩 技術棧

- **前端**：HTML + CSS + JavaScript (Vanilla)
- **後端**：Cloudflare Workers (使用 KV 儲存暫存資料)
- **部署**：Cloudflare Pages + Workers
- **資料儲存**：Cloudflare Workers KV (提供短期記憶體)

---

## 📱 使用流程（顧客端）

1. 顧客掃描店家提供的 QR Code（導向主要網頁 `/`）
2. 點選首頁醒目的「📥 取號排隊」按鈕
3. 輸入下列資料：
   - 顯示名稱（無長度限制）
   - 性別選項：「先生 / 小姐」
   - 手機號碼（用於防重複與紀錄）
4. 成功送出後，顯示個人叫號資訊：
   - 「您的號碼：**XX 號**」
   - 「顯示名稱：**XXX先生/小姐**」
5. 顧客不需登入，資料將**保留 2 小時後自動消失**

---

## 🧑‍🍳 使用流程（老闆端）

1. 在主頁最下方點選「老闆叫號系統」按鈕
2. 輸入後台密碼（預設為 `sawanpass`）
3. 進入後台功能介面，功能如下：
   - ✅ **目前號碼顯示**
   - ▶️ **下一號** 按鈕（醒目顯示，點擊依序叫號）
   - 🔁 **重置排隊** 按鈕（打烊時點選，清除所有號碼）

---

## 🧠 資料處理邏輯

- 客戶端資料（號碼、名稱、時間）以 **KV 儲存**，設定 **TTL（Time-to-Live）為 2 小時**
- 不使用 Cookie 或登入機制，完全依據 IP / 手機簡單識別
- 每日手動點擊「重置」將清除所有資料並從 1 號重新開始

---

## 🔐 安全設計

- 後台密碼：預設為 `sawanpass`，建議部署後修改至環境變數中（Cloudflare Secret）
- 客戶端無法進入後台介面，僅能排隊
- 不儲存敏感資料（例如完整手機號碼加密處理）

---

## 🌱 可擴充規劃（Future Plan）

此系統架構保留以下擴充性：

- 📋 **線上點餐功能**
- 🧾 顯示叫號歷史、點餐歷史
- 🔔 推播通知功能（LINE Notify / SMS）
- 🌐 多語系支援（泰文 / 中文 / 英文）

---

## 🛠 專案架構

/src
├── index.html # 首頁（取號入口）
├── style.css # 頁面樣式
├── script.js # 顧客端 JS
├── admin.html # 老闆後台介面
├── admin.js # 後台邏輯
└── worker.js # Cloudflare Workers API

---

## 🧪 開發與測試方式

1. 使用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 進行本地測試：
   ```bash
   wrangler dev
部署至 Cloudflare Pages：

wrangler publish
⚠ 注意事項

建議部署時將 sawanpass 改為環境變數設定

系統僅支援同時一線排隊，不支援分桌與多重佇列

適合「現場現做、現場叫號」的簡易流程餐廳

📄 License

MIT License © 那空沙旺船麵 จังหวัดนครสวรรค์