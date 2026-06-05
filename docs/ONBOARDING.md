# local-transcript-workbench — 新人上手指南 (Onboarding Guide)

> 本指南由 `/understand-anything` 知識圖譜自動生成（分析時間：2026-06-04）。
> 圖譜統計：**147 節點 · 321 邊 · 9 分層 · 12 步導覽**。
> 權威的架構與工作流程文件請以專案根目錄的 **`AGENTS.md`** 為準；本指南是它的「圖譜視角」入門版。

---

## 1. 專案總覽 (Project Overview)

**`local-transcript-workbench`** 是一個**純前端、本地優先（local-first）的單頁應用（SPA）**，用於審閱語音轉錄稿，採三欄式工作台：

```
專案列表  ·  音訊 + 逐字稿編輯器  ·  AI 輸出與匯出
```

整個應用**完全在瀏覽器中執行**，對接一個 in-browser mock API；透過 **ports-and-adapters**（六角架構）接縫 `WorkbenchApi`，保留 port/adapter，方便日後接上自架後端（LiveKit、ASR、本地 LLM、持久化、匯出）而**不需改動 UI**。

| 項目 | 內容 |
|---|---|
| **語言** | TypeScript（主導）· CSS · HTML · JSON · Markdown |
| **框架／工具** | React 19 · TanStack（Router / Query / Store / Virtual / Form）· Vite · Vitest · Tailwind CSS v4 · Radix UI · Zod · Biome · Testing Library |
| **進入點** | `src/main.tsx` |
| **架構模式** | Ports & Adapters + Feature Slices；單向相依 `features → lib` |

---

## 2. 架構分層 (Architecture Layers)

9 個分層，依真實資料夾邊界切分。`src/` 內聚度高（intra-group import density 0.89），唯一跨群相依是 `tests → src`，相依圖無循環（acyclic）。

| # | 分層 | 檔案數 | 說明 |
|---|---|---|---|
| 1 | **路由與進入點** `routing-entry` | 5 | 應用啟動點與 TanStack Router 路由樹：`main.tsx` 掛載 React root，`router.tsx`／`routeTree.gen.ts` 組裝路由，`routes/` 為三欄式 workbench 的頁面進入點。 |
| 2 | **UI 元件** `ui-components` | 28 | 純展示與互動的 React 元件，涵蓋 layout、project-sidebar、audio-player、transcript、ai-output、export，以及 shadcn 風格的 `ui/` 基礎元件。 |
| 3 | **功能模組／使用案例** `features` | 15 | 依領域切分的 use-case 層：每個 feature 提供 TanStack Query 的 query/mutation hook 與該領域的 domain types（shared kernel）。 |
| 4 | **API Port 與 Adapters** `api-port-adapters` | 5 | 架構核心：`lib/api` 定義單一 `WorkbenchApi` port，由 `mockApi`／`httpApi` 兩個 adapter 實作，依環境變數於 `index.ts` 選用。 |
| 5 | **Mock 後端資料** `mock-backend` | 6 | 本地優先的 mock 後端種子資料：以 prng 產生可重現的逐字稿 corpus、fixtures 與 templates。 |
| 6 | **共享狀態 Stores** `state-stores` | 2 | 跨元件共享的用戶端狀態：`playback-store`（音訊播放）、`segment-status-store`（片段儲存狀態）。 |
| 7 | **工具與基礎設施** `utils-infra` | 8 | 底層共用工具：`lib/utils`（cn、time、clipboard、download）、`docx` 匯出、`config/env`、`query-client`。 |
| 8 | **測試** `tests` | 10 | Vitest 單元／整合／元件測試，含共用 `setup.ts`。 |
| 9 | **專案設定與文件** `config-docs` | 14 | 建置與專案設定（vite、tsconfig、biome、package…）、HTML 進入點、全域樣式，以及 README、AGENTS 文件。 |

---

## 3. 核心概念與設計決策 (Key Concepts)

理解這 6 個概念，就掌握了整個程式碼庫的「為什麼」：

### 3.1 一個接縫，兩個 Adapter（可抽換後端）
- **唯一的接縫**是 `WorkbenchApi` port（`src/lib/api/types.ts`）。所有 feature/元件只 `import { api } from "@/lib/api"`，**永遠不知道**背後是 mock 還是真實後端。
- `src/lib/api/index.ts` 依環境變數選擇：`VITE_API_BASE_URL` 為空 ⇒ **mock 模式**；有值 ⇒ HTTP 模式。
- 要接真後端：設好 `VITE_API_BASE_URL` + 調整 `http-api.ts` 端點，**其餘程式碼零改動**。
- 相依方向永遠指向抽象（port）而非具體（adapter）。

### 3.2 URL 即狀態（URL as State）
- 目前選定的專案／逐字稿以 **URL search params** 表達（`routes/index.tsx`，用 Zod 驗證），讓狀態可分享、可重整、可上一頁/下一頁。

### 3.3 依狀態性質選對工具
| 狀態性質 | 工具 |
|---|---|
| 伺服器快取 | **TanStack Query**（`features/*/queries.ts`） |
| 共享 UI/session 狀態 | **TanStack Store**（playback clock、segment save status） |
| 短暫輸入 | 本地 state / TanStack Form（草稿、表單） |
| 選取狀態 | **URL search params** |

### 3.4 永不每次按鍵都儲存（Debounced Autosave）
- 編輯只動**本地 draft**，autosave 在 **debounce（800ms）/ blur / unmount（捲離）** 時觸發；狀態機 `idle → dirty → saving → saved/error` 走 Store，unmount 後轉換仍安全。失敗可重試，並以 `baseRevision` 做樂觀並行檢查。

### 3.5 確定性 Mock（Deterministic）
- mock 資料以**可植入 seed 的 PRNG**（`prng.ts`）取代 `Math.random`，每次重整得到相同 corpus，測試可重現。

### 3.6 效能：虛擬化 + 衍生 active index
- 逐字稿用 **TanStack Virtualizer** 虛擬化（變高列）；列表訂閱**衍生的 active index** 而非原始播放時鐘，播放時不會整列重渲染；以二分搜尋 O(log n) 定位 active segment。

> 其他須知（摘自 AGENTS.md）：音訊是**模擬的**（`AudioSource.simulated`，用 rAF 時鐘）；LiveKit 是**純佔位**（只回 metadata，永不連線）；DOCX 匯出**在瀏覽器內真實可用**；前端**不放任何密鑰**（所有 `VITE_*` 都會送到瀏覽器）；`routeTree.gen.ts` 是**生成檔**，勿手改，新 clone 需先 `npm run build` 一次才能 `typecheck`。

---

## 4. 導覽路線 (Guided Tour)

建議照此順序閱讀，從進入點到匯出，完整走過一次架構故事：

1. **專案總覽與架構指南** — `AGENTS.md`（權威）+ `README.md`。先讀 AGENTS.md 建立 ports-and-adapters 的全貌地圖。
2. **應用程式進入點** — `main.tsx`（QueryClientProvider → TooltipProvider → RouterProvider 由外而內）+ `index.html` + `query-client.ts`。
   - 💡 `createQueryClient` 是工廠函式而非單例，方便測試建立乾淨的 QueryClient。
3. **路由與 URL 狀態** — `routes/index.tsx`（URL state）+ `__root.tsx` + `routeTree.gen.ts`（codegen，勿手改）。
4. **三欄式 Workbench 版面** — `WorkbenchLayout.tsx` + `AppHeader.tsx` + `ProjectSidebar.tsx`。
5. **核心接縫：WorkbenchApi Port** ⭐ — `api/types.ts`（port）+ `api/index.ts`（依 env 選 adapter）+ `config/env.ts`。整個架構的心臟。
   - 💡 Port 是 interface，adapter 是實作；在進入點以 env 選 adapter。
6. **兩個 Adapter：Mock 與 HTTP** — `mock-api.ts`（記憶體後端）+ `http-api.ts`（fetch 真後端）+ `latency.ts`（延遲/失敗模擬）。
7. **Mock 後端的種子資料** — `fixtures.ts` + `prng.ts` + `corpus.ts` + `index.ts`。
   - 💡 可植入 seed 的 PRNG → mock 資料與測試的確定性。
8. **Feature 層：Query 與型別（Shared Kernel）** — `segments/projects/transcripts` 的 `queries.ts` + `types.ts`。`types.ts` 是 fan-in 最高的共享核心。
   - 💡 queryKey 作快取索引；optimistic update 先更新快取再送請求，失敗回滾。
9. **共享狀態 Stores 與音訊播放** — `playback-store.ts` + `segment-status-store.ts` + `AudioPlayer.tsx` + `use-audio-transport.ts`。
10. **逐字稿虛擬清單與作用中片段** — `TranscriptWorkbench.tsx` + `TranscriptVirtualList.tsx` + `active-segment.ts`。「播放時鐘驅動 UI」的核心連結。
    - 💡 虛擬化只渲染可視列；二分搜尋定位 active segment。
11. **編輯核心：Segment Autosave** ⭐ — `use-segment-autosave.ts` + `SegmentEditor.tsx` + `SaveStatusBadge.tsx`。把 mutation 與 status store 編織在一起。
    - 💡 Debounce 合併連續輸入；unmount/blur 時 flush draft 避免遺失編輯。
12. **AI 輸出與瀏覽器端 DOCX 匯出** — `AIOutputPanel.tsx` + `ExportControls.tsx` + `docx/index.ts` + `markdown-to-docx.ts` + `download.ts`。
    - 💡 串流輸出以 `onToken` 回呼逐步累積；DOCX 純在 client 以 Blob + object URL 觸發下載。

---

## 5. 檔案地圖 (File Map)

圖例：🔴 高複雜度 · 🟡 中等 · ⚪ 簡單

### 路由與進入點
- ⚪ `src/main.tsx` — 應用入口，掛載 React root 並以 Query/Tooltip/Router provider 包裝 SPA。
- ⚪ `src/router.tsx` — `getRouter` 工廠，以 routeTree 建立 Router 實例。
- ⚪ `src/routes/__root.tsx` — 根路由元件，定義根版面與 Outlet，引入全域樣式。
- 🟡 `src/routes/index.tsx` — workbench 根路由，讀 search params 選定專案、預設挑最新專案、渲染 WorkbenchLayout。
- ⚪ `src/routeTree.gen.ts` — **自動產生**的路由樹（勿手改）。

### API Port 與 Adapters（架構核心）
- ⚪ `src/lib/api/types.ts` — `WorkbenchApi` 介面：所有 adapter 必須實作的方法簽章。
- ⚪ `src/lib/api/index.ts` — 依環境在 mockApi/httpApi 間選擇，匯出統一 `api`。
- 🔴 `src/lib/api/mock-api.ts` — 瀏覽器內 mock adapter，以 mockDataset 實作所有端點，模擬延遲與失敗。
- 🟡 `src/lib/api/http-api.ts` — HTTP adapter，fetch 真後端，支援串流與 blob 匯出。
- ⚪ `src/lib/api/latency.ts` — 延遲模擬與錯誤注入（`MockApiError`、儲存失敗判斷）。

### 功能模組 / 使用案例
- 🔴 `src/features/segments/use-segment-autosave.ts` — 單一片段編輯生命週期 hook（draft / debounce / 狀態機 / 重試）。
- 🟡 `src/features/segments/queries.ts` — query keys + `segmentsQueryOptions` + 帶樂觀更新的 `useUpdateSegmentMutation`。
- ⚪ `src/features/segments/active-segment.ts` — `findActiveSegmentIndex` 純函式（二分搜尋）。
- ⚪ `src/features/segments/types.ts` — `TranscriptSegment`、`SegmentSaveStatus` 等共享型別。
- ⚪ `src/features/{projects,transcripts}/{queries,types}.ts` — 專案/逐字稿的 query 與型別。
- ⚪ `src/features/ai/{queries,types,templates}.ts` — AI template 清單 query + 串流輸出 mutation。
- ⚪ `src/features/export/{queries,types}.ts` — 匯出 mutation（取 blob 後觸發下載）。
- ⚪ `src/features/livekit-placeholder/{queries,types}.ts` — LiveKit 佔位（只回連線 metadata）。

### Mock 後端資料
- 🔴 `src/lib/mock-data/fixtures.ts` — 核心 seed 建構器，`buildDataset` 以固定 seed + prng 產生完整 mockDataset。
- 🔴 `src/lib/mock-data/generators.ts` — 依 template 從轉錄產生 mock AI markdown（會議摘要/行動項目/銷售/訪談）。
- 🟡 `src/lib/mock-data/corpus.ts` — 講者/句子語料 + `buildSegmentText`。
- ⚪ `src/lib/mock-data/prng.ts` — `createPrng` 確定性偽隨機（int/float/pick/chance）。
- ⚪ `src/lib/mock-data/{templates,index}.ts` — template 清單常數 + barrel。

### 共享狀態 Stores
- 🟡 `src/lib/stores/playback-store.ts` — `playbackStore` + `playbackActions`（load/play/pause/seek/tick…），解耦播放器與列表。
- 🟡 `src/lib/stores/segment-status-store.ts` — 各片段儲存狀態 map（set/markDirty/markSaving/markSaved/markError）。

### 工具與基礎設施
- 🔴 `src/lib/docx/markdown-to-docx.ts` — 自訂 markdown→docx 解析器（標題/清單/待辦/表格/行內格式）。
- ⚪ `src/lib/docx/index.ts` — barrel + `buildDocxBlob`。
- 🟡 `src/lib/utils/time.ts` — `formatClock`/`formatDuration`/`formatRelativeTime`。
- ⚪ `src/lib/config/env.ts` — 集中式環境設定（API 模式、base URL、AI provider）。
- ⚪ `src/lib/query-client.ts` — `createQueryClient`（重試、staleTime）。
- ⚪ `src/lib/utils.ts` — `cn`（clsx + tailwind-merge）。
- ⚪ `src/lib/utils/{clipboard,download}.ts` — 剪貼簿 / Blob 下載工具。

### UI 元件（重點）
- 🔴 `src/components/transcript/TranscriptVirtualList.tsx` — 虛擬化逐字稿清單，依播放時間定位並自動捲動。
- 🔴 `src/components/transcript/TranscriptWorkbench.tsx` — 中央容器，協調 query、AudioPlayer 與 loading/empty 狀態。
- 🟡 `src/components/transcript/SegmentEditor.tsx` — 串接 autosave hook 的 textarea（⌘/Ctrl+Enter 儲存）。
- 🟡 `src/components/transcript/{TranscriptSegmentRow,SaveStatusBadge}.tsx` — 單列（講者/時間戳/信心度）/ 儲存狀態徽章。
- ⚪ `src/components/layout/WorkbenchLayout.tsx` — 三欄式版面 shell。
- 🟡 `src/components/audio-player/{AudioPlayer.tsx,use-audio-transport.ts}` — 播放器 UI / rAF 模擬時鐘 transport。
- 🟡 `src/components/ai-output/AIOutputPanel.tsx` + ⚪ `MarkdownView.tsx` — template 選擇 + 串流產生 / markdown 渲染。
- 🟡 `src/components/export/ExportControls.tsx` — 檔名/格式/下載/複製。
- `src/components/ui/*` — shadcn/ui 基礎元件（🔴 `select.tsx` 最複雜；button/card/input/tabs… 為**自有可編輯碼**）。

### 專案設定與文件
- 🔴 `AGENTS.md` — **權威架構指南**（19 章：鷹架、SPA-only、local-first、資料夾、流程、陷阱）。
- 🟡 `package.json` — 相依、npm scripts、`#/*` → `./src/*` alias。
- ⚪ `tsconfig.json` — strict、bundler resolution、react-jsx、`#/*` 與 `@/*` → `./src/*`。
- ⚪ `vite.config.ts` — TanStack Router/React/Tailwind/devtools 外掛 + jsdom 測試環境。
- ⚪ `biome.json` / `components.json` / `index.html` / 🟡 `src/styles.css`（Tailwind v4 CSS-config、oklch light/dark token）/ `.env.example`。

### 測試
- 🟡 `tests/use-segment-autosave.test.tsx` — autosave debounce 與狀態轉換整合測試。
- 🟡 `tests/mock-api.test.ts` — 讀取/更新/儲存失敗模擬。
- 🟡 `tests/markdown-to-docx.test.ts` — 轉換正確性。
- ⚪ `tests/{active-segment,playback-store,mock-data,time}.test.ts` + `{SaveStatusBadge,workbench-smoke}.test.tsx` + 🟡 `setup.ts`（jsdom polyfills）。

---

## 6. 複雜度熱點 (Complexity Hotspots)

新人請**謹慎修改**這 9 個高複雜度檔案，動它們前務必先讀懂、並用測試保護：

| 檔案 | 為何複雜 / 注意事項 |
|---|---|
| 🔴 `src/features/segments/use-segment-autosave.ts` | autosave **狀態機**（draft / debounce / blur / unmount flush / 重試 / 樂觀並行）。改動易造成編輯遺失或競態，務必跑 `use-segment-autosave.test.tsx`。 |
| 🔴 `src/lib/api/mock-api.ts` | 整個 mock 後端的端點實作，含延遲與失敗模擬。是 `httpApi` 的行為契約參照，改介面要兩個 adapter 一起改。 |
| 🔴 `src/components/transcript/TranscriptVirtualList.tsx` | 虛擬化 + 播放時間同步 + 自動捲動。效能敏感，避免引入整列重渲染。 |
| 🔴 `src/components/transcript/TranscriptWorkbench.tsx` | 多 query 協調 + AudioPlayer 載入 + loading/empty 狀態的容器。 |
| 🔴 `src/lib/docx/markdown-to-docx.ts` | 手寫 markdown 解析器（標題/清單/待辦/表格/行內格式）。邊界情況多，改動配合 `markdown-to-docx.test.ts`。 |
| 🔴 `src/lib/mock-data/fixtures.ts` | seed 資料建構核心。改動會影響所有 mock 畫面與測試的確定性。 |
| 🔴 `src/lib/mock-data/generators.ts` | 多種 template 的 AI 輸出產生器。 |
| 🔴 `src/components/ui/select.tsx` | Radix Select 的多組合元件，shadcn 自有碼。 |
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

- **測試失敗觸發器**：任何 segment 文字含 `[[fail]]` 會讓該段儲存失敗（`lib/api/latency.ts` 的 `FAILURE_MARKER`），用來示範 error+retry 路徑。
- **shadcn 元件**在 `components/ui/` 是**自有碼**，可自由編輯；新增用 `npx shadcn@latest add <name>`。
- 提交前務必 `npm run verify` 全綠，**勿提交壞掉的 build 或紅燈測試**。

---

*本指南可隨程式碼演進更新：重跑 `/understand-anything:understand` 重建知識圖譜後，再執行 `/understand-anything:understand-onboard` 即可重新生成。*
