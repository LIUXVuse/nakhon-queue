# 那空沙旺船麵 叫號系統（Cloudflare Pages + Functions）

> 行動裝置優先、無需登入、二小時自動清除資料的叫號系統  
> 店名：**那空沙旺船麵จังหวัดนครสวรรค์**  
> 狀態：**已採用 Cloudflare Pages 檔案式 Functions + KV**

## ✨ 功能概覽
- 顧客掃 QR 進站 → 填姓名/稱謂/手機 → 一鍵取號
- 首頁顯示「目前號碼」，自動輪詢更新
- 顧客的**取號結果會保存在本機（localStorage）2 小時**，換頁或刷新仍可顯示
- 老闆後台：輸入密碼 →  
  - 顯示**目前號碼 + 顧客姓名/稱謂 + 手機**  
  - **下一號**（語音自動播報「請 X 號到櫃檯」）  
  - **重置全部**（清空並從 1 號開始）  
  - **下一隊列清單**（預設顯示接下來 5 位，會隨叫號自動遞補）
- 伺服端資料以 **KV** 儲存，**TTL=7200 秒（2 小時）** 自動過期

## 🧱 架構與技術
- **前端**：純 HTML / CSS / JavaScript（行動優先）
- **後端**：Cloudflare Pages 檔案式 Functions（`/functions/api/*.js`）
- **儲存**：Cloudflare Workers KV（keys：`lastNumber`、`currentNumber`、`ticket:{n}`）
- **部署**：Cloudflare Pages（**不需要 build 指令**）

/functions/api
├── current.js # GET /api/current
├── health.js # GET /api/health
├── next.js # GET /api/next?password=...
├── ping.js # GET /api/ping
├── queue.js # POST /api/queue
└── lineup.js # GET /api/lineup?limit=5 ← 顯示後面排隊清單
/public
├── index.html # 顧客端（含 localStorage 保存號碼）
├── admin.html # 老闆後台（含語音播報、下一隊列清單）
└── style.css

markdown
複製程式碼

## ⚙ Cloudflare Pages 設定
- **Framework**：None  
- **Build command**：留空  
- **Output directory**：`public`  
- **Variables**：  
  - `ADMIN_PASSWORD`（例如 `sawanpass`）
- **Functions → Bindings**：  
  - KV Namespace → **Name：`QUEUE`**，Namespace：選你的 KV

> 不使用 `wrangler.toml`；若仍在 repo 中，建議移除。

## 🔌 API 介面
- `POST /api/queue` → 取號  
  body: `{ name, gender, phone }`  
  res: `{ success: true, number }`
- `GET /api/current` → 目前叫號  
  res: `{ current: { number, name, gender, phone } }` 或 `{ current: null, last }`
- `GET /api/next?password=***` → 下一號  
  res: `{ success: true, number }`
- `GET /api/reset?password=***` → 重置  
  res: `{ success: true }`
- `GET /api/lineup?limit=5` → 後面排隊清單  
  res: `{ totalWaiting, next: [{ number, name, gender, phone }, ...] }`
- `GET /api/health` / `GET /api/ping` → 診斷

## 🔐 安全
- 後台密碼改以 **環境變數 `ADMIN_PASSWORD`** 管理（程式不硬碼）
- 不儲存長期個資；手機號與取號資訊**2 小時後自動過期**
- 管理端不公開入口（僅從首頁底部連結進入）

## 🧪 開發
- 推到 GitHub → Pages 自動部署  
- 需要本地模擬可用：  
  `npx wrangler pages dev public --kv=QUEUE --binding ADMIN_PASSWORD=yourpass`

## 🗺️ Roadmap
- LINE Notify / SMS 到號通知
- 多語系（中/英/泰）
- 點餐模組（保留擴充位）
- 後台顯示叫號歷史與統計

---
本 README 係在你原始版本基礎上全面更新，以符合目前 Pages 檔案式 Functions 的實作。:contentReference[oaicite:0]{index=0}