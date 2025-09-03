那空沙旺船麵 叫號系統 (Nakhon Sawan)

行動優先的門市叫號系統。客人掃 QR 取號；老闆用手機/平板在後台叫號（含語音播報）。資料 2 小時自動清除，不需登入。

店名：那空沙旺船麵จังหวัดนครสวรรค์

架構：Cloudflare Pages（靜態資產）+ Pages Functions（/functions 檔案式 API）+ Workers KV（資料）

手機友善：行動優先排版、到號語音（iOS/Android 需點擊「解鎖語音」或切換開關一次）

功能總覽

顧客端（/index.html）

填 姓名/稱謂/手機 → 一鍵取號

顯示「目前號碼」；本機保存取號結果（localStorage）2 小時

可選擇 到號語音（需點擊解鎖一次）

老闆端（/admin.html）

密碼登入（環境變數 ADMIN_PASSWORD）

顯示 目前號碼 + 姓名/稱謂 + 手機

下一號（語音播報「請 X 號到櫃檯」）

重置全部（號碼清零）；顧客端會偵測版本變更自動清除本機票

顯示 後面排隊清單（預設 5 位，自動遞補）

隱私與到期

取號資料存於 KV，TTL=7200 秒（2 小時） 自動過期

不需帳號，不做長期追蹤

目錄結構
/public
  ├─ index.html       # 顧客端（含本機保存與語音開關/解鎖）
  ├─ admin.html       # 老闆端（語音播報、後面清單）
  └─ style.css        # 行動優先樣式
/functions/api
  ├─ ping.js          # GET /api/ping
  ├─ health.js        # GET /api/health
  ├─ current.js       # GET /api/current      ← 回傳 version 供重置同步
  ├─ queue.js         # POST /api/queue
  ├─ next.js          # GET /api/next?password=...
  ├─ reset.js         # GET /api/reset?password=...  ← version 自增
  └─ lineup.js        # GET /api/lineup?limit=5


注意：本專案使用 檔案式 Functions。請勿在根目錄放 _worker.js 或 wrangler.toml（以免干擾 Pages 路由）。

API 介面

POST /api/queue
Body：{ name, gender, phone } → { success: true, number }

GET /api/current
回：{ current: { number, name, gender, phone }, version } 或 { current: null, last, version }

GET /api/next?password=...
回：{ success: true, number }

GET /api/reset?password=...
重置全部（last/current 歸 0，並將 resetVersion +1）
回：{ success: true, version }

GET /api/lineup?limit=5
回：{ totalWaiting, next: [{ number, name, gender, phone }, ...] }

GET /api/ping / GET /api/health
診斷用

Cloudflare Pages 設定

Build

Framework：None

Build command：空

Output directory：public

環境變數 (Variables)

ADMIN_PASSWORD：例如 sawanpass

Bindings → KV

新增 KV 綁定：Name = QUEUE（選擇你的 KV 命名空間）

Production branch：建議指向 stable（見下方「穩定版分支」）

本機開發（選用）
# 需要 Node 18+ 與 wrangler
npm i -g wrangler

# 啟動本地模擬（會偵測 /public 與 /functions）
wrangler pages dev public \
  --kv=QUEUE \
  --binding ADMIN_PASSWORD=sawanpass

部署

推到 GitHub 的 預覽分支（例如 main），Cloudflare Pages 會產生 Preview URL。

合併到 生產分支（建議 stable），Pages 觸發 Production 部署。

iOS/Android 語音注意事項

行動瀏覽器出於隱私設計，必須有使用者互動 才能播放語音。
顧客端/老闆端都提供了 「🔊 解鎖語音」 或語音開關，請點一下即可解鎖。
（iPhone 請確認「鈴聲鍵未靜音」、媒體音量不為 0。）

安全與資料保護

後台密碼使用 Pages 環境變數 管理，不硬編碼在前端。

取號資料 2 小時到期（KV TTL），不做不必要的長期保存。

可於 GitHub 啟用 受保護分支 與 僅允許 Pull Request 合併，降低誤發布風險。

發布流程建議（Stable 分支 + Tag）
一次設定（只需做一次）
# 建立穩定版分支（從目前可上線的 commit 建）
git checkout -b stable
git push -u origin stable


到 Cloudflare Pages → Settings → Branches：將 Production branch 改為 stable。
之後：

main（或 develop）合併後都會產生 Preview（不影響正式站）

將 main 的變更「確認穩定」時，再 合併/快轉 到 stable，即觸發正式部署

建議在 GitHub 設定 Branch protection：
對 stable 啟用「保護規則」（禁止直接 push、需 PR、需通過檢查）。

每次釋出穩定版
# 在 main 開發、測試完成後
git checkout main
git pull

# 產生版本號（語意化版號 x.y.z）
git tag -a v1.0.0 -m "Nakhon Queue v1.0.0 - first stable release"
git push origin v1.0.0

# 更新穩定分支（快轉或合併均可）
git checkout stable
git merge --ff-only main   # 或者 git merge main
git push


（選用）可在 GitHub → Releases 以 v1.0.0 tag 建立 Release，附上變更記錄。

日常開發建議

main：日常整合（自動觸發 Pages Preview）

stable：正式線上（Production）

需要多人協作時，可加上 feature/*、hotfix/* 工作流

疑難排解

/api 出現 405 或 style.css MIME 錯誤
通常是 _worker.js 干擾；請移除 _worker.js 與 wrangler.toml，改用 /functions 檔案式 Functions。

顧客端重置後還看到舊號碼
已採用 resetVersion；若仍遇到，清理瀏覽器快取或確認 /api/current 有回 version。

手機沒聲音
需點「🔊 解鎖語音」或切換語音開關一次；確認音量/鈴聲鍵。

版權與授權

僅限店內叫號用途。如要二次開發/商用，請先徵得LIU PIN HSIAO liupony2000@gmail.com同意。

快速版本資訊（維護用）

架構：Cloudflare Pages + Functions + KV

手機語音：Web Speech API（需互動解鎖）

重置同步：resetVersion（/api/current 會回傳 version）

變更紀錄（建議放在 CHANGELOG.md）

v1.0.0：行動優先排版、語音解鎖/播報、重置同步、本機保存 2 小時、後台後續清單。