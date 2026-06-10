# local-transcript-workbench — 新人上手指南 (Onboarding Guide)

> 本指南由 `/understand-anything` 知識圖譜自動生成（分析時間：2026-06-06）。
> 圖譜統計：**127 節點 · 10 分層 · 14 步導覽**。
> 權威的架構與工作流程文件請以專案根目錄的 **`AGENTS.md`** 為準；本指南是它的「圖譜視角」入門版。

---

## 1. 專案總覽 (Project Overview)

**`local-transcript-workbench`** 是一個**純前端、本地優先（local-first）的單頁應用（SPA）**，用於將自架的敏感會議錄音轉成正式會議紀錄，工作流程為：

```
Meetings → Transcripts → Records → Export
```

整個應用**完全在瀏覽器中執行**，對接一個 in-browser mock API。透過 **ports-and-adapters**（六角架構）接縫 `WorkbenchApi`，保留 port/adapter，方便日後接上自架後端（LiveKit、ASR、本地 LLM、持久化、匯出）而**不需改動 UI**。

| 項目 | 內容 |
|---|---|
| **語言** | TypeScript（主導）· CSS · HTML · JSON · Markdown |
| **框架／工具** | React 19 · TanStack（Router / Query / Store / Virtual / Form）· Vite · Vitest · Tailwind CSS v4 · Radix UI · Zod · Biome · GitHub Actions |
| **進入點** | `src/main.tsx` |
| **架構模式** | Ports & Adapters + Feature Slices；單向相依 `features → lib` |

---

## 2. 架構分層 (Architecture Layers)

10 個分層，依真實資料夾邊界切分，相依圖無循環（acyclic）。

| # | 分層 | 節點數 | 說明 |
|---|---|---|---|
| 1 | **路由與應用外殼** `shell-routing` | 12 | TanStack Router 進入點、router 工廠與 route tree，搭配 WorkbenchLayout、AppHeader、GlobalNavigationRail、ContextSidebar 等外殼元件，負責 Meetings→Transcripts→Records→Export 區段導覽。 |
| 2 | **UI 元件層** `ui-components` | 41 | meetings／records／settings／transcripts 等領域展示元件，以及 audio-player、ai-output、export、project-sidebar 與 shadcn/ui 基礎元件，純粹負責畫面呈現與互動。 |
| 3 | **功能 Use-case 層** `features` | 22 | 各領域 features/*（meetings、records、settings、navigation、transcripts、segments、projects、ai、export 等）的 types 與 TanStack query／mutation hook，封裝業務用例並單向依賴 lib。 |
| 4 | **API Port 與 Adapters** `api-port-adapters` | 5 | ports-and-adapters 核心：單一 WorkbenchApi port 定義，搭配 mockApi 與 httpApi adapter，由環境變數選用，含 latency 模擬與型別契約。 |
| 5 | **狀態 Store 層** `state-stores` | 2 | 以 store 管理跨元件的客戶端狀態：playback-store（播放狀態）與 segment-status-store（段落儲存狀態）。 |
| 6 | **Mock 資料層** `mock-data` | 7 | 本地優先的假資料來源：corpus、fixtures、generators、prng、templates 與 workbench-fixtures，供 mock adapter 產生確定性的會議與逐字稿資料。 |
| 7 | **共用 Lib 與 Utils** `shared-lib` | 8 | 跨層共用的工具與基礎設施：time／clipboard／download utils、docx 匯出、env 設定、cn 樣式工具與 query-client 工廠。 |
| 8 | **測試層** `tests` | 13 | Vitest 單元與煙霧測試，涵蓋 mock-api、mock-data、store、navigation shell、segment autosave、docx 轉換等，依賴方向為 tests → src。 |
| 9 | **設定與建置** `config-build` | 9 | 專案設定與建置檔：package.json、tsconfig.json、vite.config.ts、biome.json、components.json、.cta.json、.env.example，以及 public 靜態資產。 |
| 10 | **文件與 DevOps** `docs-devops` | 8 | 專案文件（README、AGENTS、docs/ONBOARDING、agent-github-flow）與 DevOps 設定：GitHub Actions CI pipeline 及 .githooks（pre-commit／pre-push）。 |

---

## 3. 核心概念與設計決策 (Key Concepts)

理解這 6 個概念，就掌握了整個程式碼庫的「為什麼」：

### 3.1 一個接縫，兩個 Adapter（可抽換後端）
- **唯一的接縫**是 `WorkbenchApi` port（`src/lib/api/types.ts`）。所有 feature/元件只 `import { api } from "@/lib/api"`，**永遠不知道**背後是 mock 還是真實後端。
- `src/lib/api/index.ts` 依環境變數選擇：`VITE_API_BASE_URL` 為空 ⇒ **mock 模式**；有值 ⇒ HTTP 模式。
- 要接真後端：設好 `VITE_API_BASE_URL` + 調整 `http-api.ts` 端點，**其餘程式碼零改動**。
- 相依方向永遠指向抽象（port）而非具體（adapter）。

### 3.2 URL 即狀態（URL as State）
- 目前選定的 section／meeting／record 以 **URL search params** 表達（`routes/index.tsx`），讓狀態可分享、可重整、可上一頁/下一頁，且免去額外的全域 store。

### 3.3 依狀態性質選對工具
| 狀態性質 | 工具 |
|---|---|
| 伺服器快取 | **TanStack Query**（`features/*/queries.ts`） |
| 共享 UI/session 狀態 | **TanStack Store**（playback clock、segment save status） |
| 短暫輸入 | 本地 state / TanStack Form（草稿、表單） |
| 選取狀態 | **URL search params** |

### 3.4 永不每次按鍵都儲存（Debounced Autosave）
- 編輯只動**本地 draft**，autosave 在 **debounce（800ms）/ blur / unmount（捲離虛擬視窗）** 時觸發；狀態機 `idle → dirty → saving → saved/error` 走 Store，unmount 後轉換仍安全。失敗可重試，並以 `baseRevision` 做樂觀並行檢查。

### 3.5 確定性 Mock（Deterministic Seeded PRNG）
- mock 資料以**可植入 seed 的 PRNG**（`prng.ts`）取代 `Math.random`，每次重整得到相同 corpus，測試可重現，snapshot 穩定。

### 3.6 效能：虛擬化 + 衍生 active index
- 逐字稿用 **TanStack Virtualizer** 虛擬化（支援變高列）；列表訂閱**衍生的 active index** 而非原始播放時鐘，播放時不會整列重渲染；以二分搜尋 O(log n) 定位 active segment。

> 其他須知（摘自 AGENTS.md）：音訊是**模擬的**（`AudioSource.simulated`，用 rAF 時鐘）；LiveKit 是**純佔位**（只回 metadata，永不連線）；DOCX 匯出**在瀏覽器內真實可用**；前端**不放任何密鑰**（所有 `VITE_*` 都會送到瀏覽器）；`routeTree.gen.ts` 是**生成檔**，勿手改，新 clone 需先 `npm run build` 一次才能通過 `typecheck`。

---

## 4. 導覽路線 (Guided Tour)

建議照此順序閱讀，從進入點到匯出，完整走過一次架構故事（14 步）：

### Step 1 — 架構總覽：AGENTS.md
從 `AGENTS.md` 開始認識專案。這是真正具權威性的架構指南，說明 local-first 純前端 SPA 的設計哲學，以及 Meetings → Transcripts → Records → Export 的重構動線與 ports-and-adapters 架構。先讀它能在進入程式碼前建立整體心智地圖。

**關鍵檔案：** `AGENTS.md`、`docs/ONBOARDING.md`

### Step 2 — 應用啟動點：main.tsx
`main.tsx` 是整個 SPA 的 boot 進入點。它組裝三個關鍵 provider：QueryClient（TanStack Query 快取核心）、TooltipProvider，以及驅動整個導覽的 RouterProvider。

> 💡 React 的 Provider 模式透過 Context 由外而內注入跨元件的共享依賴。把 provider 疊在 RouterProvider 外層，確保所有 route 元件都能取用同一份 query cache。

**關鍵檔案：** `src/main.tsx`、`src/lib/query-client.ts`

### Step 3 — Router 與 Route Tree
承接 Step 2 注入的 RouterProvider，`router.tsx` 以 `createRouter` 建立 router 實例，並引用編譯產生的 `routeTree.gen.ts`。`__root.tsx` 定義所有頁面共用的根 layout。

> 💡 TanStack Router 採 file-based routing，`routeTree.gen.ts` 由 CLI 自動產生（**請勿手改**）。型別安全的 route tree 讓導覽參數在編譯期就被檢查。

**關鍵檔案：** `src/router.tsx`、`src/routeTree.gen.ts`、`src/routes/__root.tsx`

### Step 4 — URL 狀態與導覽 Shell
`routes/index.tsx` 把 URL 當成單一狀態來源，解析出當前要顯示的 section（Meetings／Transcripts／Records／Settings）。它組裝 WorkbenchLayout 三欄式 shell：左側 GlobalNavigationRail 切換領域、中間 ContextSidebar 呈現該領域清單、右側為詳情區。

> 💡 以 URL 作為唯一狀態來源讓畫面可被書籤化、可前進後退，且免去額外的全域 store。

**關鍵檔案：** `src/routes/index.tsx`、`src/components/layout/WorkbenchLayout.tsx`、`src/components/layout/GlobalNavigationRail.tsx`、`src/components/layout/ContextSidebar.tsx`、`src/features/navigation/types.ts`

### Step 5 — 中央接縫：WorkbenchApi Port ⭐
`lib/api/types.ts` 定義了 `WorkbenchApi` port —— 整個 ports-and-adapters 架構的核心契約。所有 UI 與 feature hook 都只依賴這個介面，而非任何具體實作。這是讓 mock 與真實後端可無痛替換的設計關鍵。

> 💡 Port（介面）定義「做什麼」、Adapter（實作）定義「怎麼做」——hexagonal architecture 的精髓。

**關鍵檔案：** `src/lib/api/types.ts`

### Step 6 — Adapter 選擇：mock 與 http
承接 Step 5 的 port，`lib/api/index.ts` 依環境變數在兩個 adapter 間切換並匯出統一的 `api` 物件。`mock-api.ts` 以記憶體 fixtures 模擬完整後端（含串流生成與 docx 匯出），`http-api.ts` 以 fetch 對接真實 REST 端點。兩者實作同一份契約，呼叫端完全無感。

> 💡 mock adapter 以 `structuredClone` 回傳資料副本，避免呼叫端意外修改記憶體 fixtures；`latency.ts` 用可被 AbortSignal 取消的 delay 模擬真實網路延遲。

**關鍵檔案：** `src/lib/api/index.ts`、`src/lib/config/env.ts`、`src/lib/api/mock-api.ts`、`src/lib/api/http-api.ts`、`src/lib/api/latency.ts`

### Step 7 — Mock 後端的種子資料
mock adapter 的資料從何而來？`lib/mock-data` 提供 local-first 的確定性假資料。`prng.ts` 以可重現的偽隨機數種子保證每次啟動資料一致；`fixtures.ts` 與 `workbench-fixtures.ts` 建構會議、逐字稿清單、記錄與整合／儲存狀態；`generators.ts` 依範本動態產出 Markdown。

> 💡 以 seeded PRNG 取代 `Math.random()`，讓「假資料」變成確定性資料——每次啟動、每次測試都得到相同結果，對可重現的 demo 與 snapshot 測試至關重要。

**關鍵檔案：** `src/lib/mock-data/index.ts`、`src/lib/mock-data/fixtures.ts`、`src/lib/mock-data/workbench-fixtures.ts`、`src/lib/mock-data/prng.ts`、`src/lib/mock-data/generators.ts`

### Step 8 — Feature Use-case 層：query 與 mutation hook
`features/*` 是業務用例層，將 api port 包成 TanStack Query 的 query／mutation hook，並各自定義 shared-kernel 型別。meetings／transcripts／records 提供清單與詳情查詢，records 另含產生與匯出的 mutation（成功後失效相關 cache）。UI 元件只與這些 hook 對話，不直接碰 api，形成乾淨的單向依賴。

> 💡 TanStack Query 以 `queryOptions` 工廠 + query key 管理快取；mutation 成功後呼叫 `invalidateQueries` 觸發相關查詢重新抓取，畫面自動反映最新資料。

**關鍵檔案：** `src/features/meetings/queries.ts`、`src/features/transcripts/queries.ts`、`src/features/records/queries.ts`、`src/features/meetings/types.ts`、`src/features/records/types.ts`

### Step 9 — 領域畫面：Meetings 與 Records
把前面的 hook 接到畫面。`MeetingDetail` 查詢單一會議並彙整其 transcripts 與 records 狀態，提供導覽入口；`MeetingSidebar`／`RecordSidebar` 以 `useMemo` 建立跨領域的標題與狀態對照表並渲染清單。這一步示範了 Meetings → Records 領域如何在 shell 中串成完整的瀏覽動線。

**關鍵檔案：** `src/components/meetings/MeetingDetail.tsx`、`src/components/meetings/MeetingSidebar.tsx`、`src/components/records/MeetingRecordDetail.tsx`、`src/components/records/RecordSidebar.tsx`

### Step 10 — 跨元件狀態：playback 與 segment 儲存 store
逐字稿編輯需要兩種不歸屬於任何單一元件、卻要被多處共享的狀態。`playback-store` 管理音訊播放時鐘（目前秒數、播放狀態），讓逐字稿能跟著音訊高亮；`segment-status-store` 追蹤每個段落的儲存狀態（編輯中／儲存中／已儲存／失敗）。

> 💡 把播放時鐘與儲存狀態放進輕量 store（而非 React state），可避免高頻更新（每秒多次）造成整棵元件樹重渲染。

**關鍵檔案：** `src/lib/stores/playback-store.ts`、`src/lib/stores/segment-status-store.ts`

### Step 11 — 編輯核心：虛擬化、active-segment 與 autosave ⭐
整個應用的編輯中樞。`TranscriptWorkbench` 整合 audio player 與虛擬化逐字稿清單，並在載入時初始化兩個 store。`TranscriptVirtualList` 只渲染可視範圍內的段落以支撐長逐字稿；`active-segment` 依播放時鐘算出當前段落；`use-segment-autosave` 在使用者停止輸入後自動觸發儲存 mutation 並更新 segment 狀態。

> 💡 List virtualization 只掛載視窗內可見的列，讓上千段逐字稿仍維持流暢捲動。autosave 以 debounce 包住儲存呼叫：輸入暫停後才送出，避免每個按鍵都打一次 API。

**關鍵檔案：** `src/components/transcript/TranscriptWorkbench.tsx`、`src/components/transcript/TranscriptVirtualList.tsx`、`src/features/segments/active-segment.ts`、`src/features/segments/use-segment-autosave.ts`、`src/features/segments/queries.ts`

### Step 12 — Records 與 client-side DOCX 匯出
終點站：把 AI 產生的記錄匯出成檔案，且完全在瀏覽器端完成。`RecordExportControls` 提供複製與多格式匯出按鈕，透過 export mutation 取得 blob；mock adapter 在匯出 docx 時呼叫 `lib/docx` 的 `buildDocxBlob`，後者用自製的 markdown-to-docx 解析器（無外部 markdown 依賴）將 Markdown 轉為 docx 區塊；最後 `download.ts` 以暫時性 object URL 觸發瀏覽器下載。

> 💡 純前端匯出靠 `Blob + URL.createObjectURL` 產生暫時性下載連結，點擊後即 revoke 釋放記憶體；整份 docx 在 client 端組裝，無需任何後端參與，貫徹 local-first 精神。

**關鍵檔案：** `src/components/records/RecordExportControls.tsx`、`src/lib/docx/index.ts`、`src/lib/docx/markdown-to-docx.ts`、`src/lib/utils/download.ts`

### Step 13 — Settings 領域與整合狀態
第四個 section。`SettingsOverview` 與 `SettingsSidebar` 呈現各整合服務（如 LiveKit）與本機儲存的狀態，資料源自 workbench-fixtures 建構的 integration／storage status。這讓你看到 shell 如何以一致的 ContextSidebar + 詳情模式容納非核心編輯流程的領域。

**關鍵檔案：** `src/components/settings/SettingsOverview.tsx`、`src/components/settings/SettingsSidebar.tsx`、`src/features/settings/queries.ts`

### Step 14 — 設定、測試與 CI 收尾
最後綜觀工程支撐面。`package.json` 與 `.env.example` 定義依賴、腳本與 adapter 切換用的環境變數；`tests/` 的 workbench-api 整合測試驗證會議→記錄端到端流程，搭配 store、autosave、docx 等單元測試；CI pipeline 在每次推送時跑 verify step（lint／type-check／test）。這層保證前面所有架構在演進中持續正確。

> 💡 GitHub Actions 以 `on` 觸發、`jobs` 平行、`steps` 循序執行；單一 verify step 串起 lint、型別檢查與 Vitest，讓 PR 在合併前自動把關。

**關鍵檔案：** `package.json`、`.env.example`、`tests/workbench-api.test.ts`、`.github/workflows/ci.yml`

---

## 5. 檔案地圖 (File Map)

圖例：🔴 高複雜度 · 🟡 中等 · ⚪ 簡單

### 路由與應用外殼
- ⚪ `src/main.tsx` — 應用入口，掛載 React root 並以 Query/Tooltip/Router provider 包裝 SPA。
- ⚪ `src/router.tsx` — `getRouter` 工廠，以 routeTree 建立 Router 實例。
- ⚪ `src/routes/__root.tsx` — 根路由元件，定義根版面與 Outlet，引入全域樣式。
- 🟡 `src/routes/index.tsx` — workbench 根路由，讀 search params 選定 section，渲染 WorkbenchLayout。
- ⚪ `src/routeTree.gen.ts` — **自動產生**的路由樹（勿手改）。
- 🟡 `src/components/layout/WorkbenchLayout.tsx` — 三欄式版面 shell，依 section 切換 sidebar 與主面板。
- 🟡 `src/components/layout/GlobalNavigationRail.tsx` — 全域 navigation rail，渲染區段按鈕並標示當前 section。
- ⚪ `src/components/layout/ContextSidebar.tsx` — 可重用的 context sidebar 容器，供 meetings/records/transcripts 各側欄共用。
- 🟡 `src/components/layout/AppHeader.tsx` — 工作台頂部標頭，依當前 section 顯示標題，並提供深色模式切換。

### API Port 與 Adapters（架構核心）
- 🟡 `src/lib/api/types.ts` — `WorkbenchApi` 介面：所有 adapter 必須實作的方法簽章。
- ⚪ `src/lib/api/index.ts` — 依環境在 mockApi/httpApi 間選擇，匯出統一 `api`。
- 🔴 `src/lib/api/mock-api.ts` — 瀏覽器內 mock adapter，以 mockDataset 實作所有端點，模擬延遲與失敗。
- 🟡 `src/lib/api/http-api.ts` — HTTP adapter，fetch 真後端，支援串流與 blob 匯出。
- ⚪ `src/lib/api/latency.ts` — 延遲模擬與錯誤注入（`MockApiError`、儲存失敗判斷）。

### 功能模組 / 使用案例
- 🔴 `src/features/segments/use-segment-autosave.ts` — 單一片段編輯生命週期 hook（draft / debounce / 狀態機 / 重試）。
- 🟡 `src/features/segments/queries.ts` — query keys + `segmentsQueryOptions` + 帶樂觀更新的 `useUpdateSegmentMutation`。
- ⚪ `src/features/segments/active-segment.ts` — `findActiveSegmentIndex` 純函式（二分搜尋）。
- ⚪ `src/features/navigation/types.ts` — NavigationSection 型別、NAVIGATION_SECTIONS 目錄與 resolveSection 純函式。
- 🟡 `src/features/records/queries.ts` — 清單／詳情查詢 hooks 以及產生與匯出記錄的 mutation hooks，含快取失效處理。
- ⚪ `src/features/{meetings,transcripts,ai,export,settings,livekit-placeholder}/{queries,types}.ts` — 各領域 query 與型別。

### Mock 資料層
- 🔴 `src/lib/mock-data/fixtures.ts` — 核心 seed 建構器，以固定 seed + prng 產生完整 mockDataset。
- 🔴 `src/lib/mock-data/workbench-fixtures.ts` — Workbench 殼層的記憶體 fixtures，建構會議、逐字稿清單、記錄與整合/儲存狀態。
- 🟡 `src/lib/mock-data/generators.ts` — 依 template 從轉錄動態產生 mock AI markdown。
- 🟡 `src/lib/mock-data/corpus.ts` — 講者/句子語料 + `buildSegmentText`。
- ⚪ `src/lib/mock-data/prng.ts` — `createPrng` 確定性偽隨機（int/float/pick/chance）。
- ⚪ `src/lib/mock-data/{templates,index}.ts` — template 清單常數 + barrel。

### 狀態 Store 層
- 🟡 `src/lib/stores/playback-store.ts` — `playbackStore` + `playbackActions`（load/play/pause/seek/tick），解耦播放器與列表。
- 🟡 `src/lib/stores/segment-status-store.ts` — 各片段儲存狀態 map（set/markDirty/markSaving/markSaved/markError）。

### 共用 Lib 與 Utils
- 🔴 `src/lib/docx/markdown-to-docx.ts` — 自訂 markdown→docx 解析器（標題/清單/待辦/表格/行內格式）。
- ⚪ `src/lib/docx/index.ts` — barrel + `buildDocxBlob`。
- 🟡 `src/lib/utils/time.ts` — `formatClock`/`formatDuration`/`formatRelativeTime`。
- ⚪ `src/lib/config/env.ts` — 集中式環境設定（API 模式、base URL、AI provider）。
- ⚪ `src/lib/query-client.ts` — `createQueryClient`（重試、staleTime）。
- ⚪ `src/lib/utils.ts` — `cn`（clsx + tailwind-merge）。
- ⚪ `src/lib/utils/{clipboard,download}.ts` — 剪貼簿 / Blob 下載工具。

### UI 元件（重點）
- 🔴 `src/components/transcript/TranscriptVirtualList.tsx` — 虛擬化逐字稿清單，依播放時間定位並自動捲動。
- 🟡 `src/components/transcript/TranscriptWorkbench.tsx` — 中央容器，協調 query、AudioPlayer 與 loading/empty 狀態。
- 🟡 `src/components/transcript/SegmentEditor.tsx` — 串接 autosave hook 的 textarea（⌘/Ctrl+Enter 儲存）。
- 🟡 `src/components/transcript/{TranscriptSegmentRow,SaveStatusBadge}.tsx` — 單列（講者/時間戳/信心度）/ 儲存狀態徽章。
- 🔴 `src/components/meetings/MeetingDetail.tsx` — 會議詳情主視圖，彙整 transcripts 與 records 狀態。
- 🔴 `src/components/meetings/MeetingSidebar.tsx` — 會議清單側欄，以 useMemo 建立 transcript／record 狀態對照表。
- 🔴 `src/components/records/MeetingRecordDetail.tsx` — 記錄詳情視圖，顯示 AI markdown、觸發產生與匯出。
- 🔴 `src/components/records/RecordSidebar.tsx` — 記錄清單側欄，建立 meeting／transcript 標題對照。
- 🟡 `src/components/audio-player/{AudioPlayer.tsx,use-audio-transport.ts}` — 播放器 UI / rAF 模擬時鐘 transport。
- 🟡 `src/components/ai-output/AIOutputPanel.tsx` — template 選擇 + 串流產生 / markdown 渲染。
- 🟡 `src/components/export/ExportControls.tsx` — 檔名/格式/下載/複製。
- `src/components/ui/*` — shadcn/ui 基礎元件（🔴 `select.tsx` 最複雜；其餘為**自有可編輯碼**）。

### 設定與建置
- 🟡 `package.json` — 相依、npm scripts、`#/*` → `./src/*` import alias。
- ⚪ `tsconfig.json` — strict、bundler resolution、react-jsx、`#/*` 與 `@/*` → `./src/*`。
- ⚪ `vite.config.ts` — TanStack Router/React/Tailwind/devtools 外掛 + jsdom 測試環境。
- ⚪ `biome.json` — lint + format 設定。
- ⚪ `.env.example` — 可切換 mock／http adapter 的環境變數樣板。
- 🟡 `src/styles.css` — Tailwind v4 CSS-config、oklch light/dark token。

### 文件與 DevOps
- 🔴 `AGENTS.md` — **權威架構指南**（24 章：鷹架、SPA-only、local-first、資料夾、流程、陷阱）。
- 🟡 `README.md` — 專案總覽，技術棧、入門步驟、npm scripts、高階架構。
- 🟡 `docs/agent-github-flow.md` — agent 的 GitHub 工作流程：issue/PR 標籤狀態機、本地檢查與 git hooks。
- 🟡 `.github/workflows/ci.yml` — GitHub Actions CI pipeline（lint／type-check／test）。

### 測試
- 🟡 `tests/workbench-api.test.ts` — Workbench API 整合測試，驗證會議→記錄端到端流程。
- 🟡 `tests/use-segment-autosave.test.tsx` — autosave debounce 與狀態轉換整合測試。
- 🟡 `tests/mock-api.test.ts` — 讀取/更新/儲存失敗模擬。
- 🟡 `tests/markdown-to-docx.test.ts` — 轉換正確性。
- ⚪ `tests/{active-segment,playback-store,mock-data,time}.test.ts` — 工具函式單元測試。
- 🟡 `tests/navigation-shell.test.tsx` — 導覽外殼整合測試，驗證 section 切換行為。

---

## 6. 複雜度熱點 (Complexity Hotspots)

新人請**謹慎修改**這些高複雜度檔案，動它們前務必先讀懂、並用測試保護：

| 檔案 | 為何複雜 / 注意事項 |
|---|---|
| 🔴 `src/features/segments/use-segment-autosave.ts` | autosave **狀態機**（draft / debounce / blur / unmount flush / 重試 / 樂觀並行）。改動易造成編輯遺失或競態，務必跑 `use-segment-autosave.test.tsx`。 |
| 🔴 `src/lib/api/mock-api.ts` | 整個 mock 後端的端點實作，含延遲與失敗模擬。是 `httpApi` 的行為契約參照，改介面要兩個 adapter 一起改。 |
| 🔴 `src/components/transcript/TranscriptVirtualList.tsx` | 虛擬化 + 播放時間同步 + 自動捲動。效能敏感，避免引入整列重渲染。 |
| 🔴 `src/lib/docx/markdown-to-docx.ts` | 手寫 markdown 解析器（標題/清單/待辦/表格/行內格式）。邊界情況多，改動配合 `markdown-to-docx.test.ts`。 |
| 🔴 `src/lib/mock-data/fixtures.ts` | seed 資料建構核心。改動會影響所有 mock 畫面與測試的確定性。 |
| 🔴 `src/lib/mock-data/workbench-fixtures.ts` | Workbench 殼層整合 fixtures，含 meetings、transcripts、records 的複雜交叉依賴。 |
| 🔴 `src/components/meetings/MeetingDetail.tsx` | 多查詢協調 + transcripts/records 狀態彙整，是 Meetings 領域的核心容器。 |
| 🔴 `src/components/meetings/MeetingSidebar.tsx` | 跨領域狀態對照表 + status badge 邏輯，以 useMemo 重度衍生計算。 |
| 🔴 `src/components/records/MeetingRecordDetail.tsx` | AI 記錄詳情 + 產生 / 匯出 mutation 串接，含多種載入/錯誤狀態。 |
| 🔴 `src/components/records/RecordSidebar.tsx` | 跨 meeting/transcript 標題對照，useMemo 重度衍生計算。 |
| 🔴 `src/components/ui/select.tsx` | Radix Select 的多組合元件，shadcn 自有碼，改動影響全站下拉選單。 |
| 🔴 `AGENTS.md` | 不是程式但資訊密度最高——**改架構/指令/env/資料夾時必須同步更新**。 |

---

## 7. 開發指令速查 (Quick Reference)

```bash
npm run dev         # Vite dev server @ http://localhost:3000（會生成 routeTree.gen.ts）
npm run build       # 靜態 dist/
npm run typecheck   # tsc --noEmit（strict）— 新 clone 須先 build 一次
npm run test        # vitest run
npm run check       # biome check（lint + format，read-only）
npm run verify      # check + typecheck + test + build —— 每次 commit 前必跑
```

**常見 gotchas：**
- **測試失敗觸發器**：任何 segment 文字含 `[[fail]]` 會讓該段儲存失敗（`lib/api/latency.ts` 的 `FAILURE_MARKER`），用來示範 error+retry 路徑。
- **shadcn 元件**在 `components/ui/` 是**自有碼**，可自由編輯；新增用 `npx shadcn@latest add <name>`。
- **切換 adapter**：設 `.env.local` 的 `VITE_API_BASE_URL=http://localhost:8000` 即切換為 HTTP 模式，其餘程式碼零改動。
- **git hooks**：`.githooks/` 內有 pre-commit / pre-push hooks；首次 clone 後執行 `git config core.hooksPath .githooks` 啟用。
- 提交前務必 `npm run verify` 全綠，**勿提交壞掉的 build 或紅燈測試**。

---

*本指南可隨程式碼演進更新：重跑 `/understand-anything:understand` 重建知識圖譜後，再執行 `/understand-anything:understand-onboard` 即可重新生成。*
