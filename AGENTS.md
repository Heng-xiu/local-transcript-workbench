<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# local-transcript-workbench — Agent Guide

A **local-first, frontend-only SPA** for reviewing audio transcripts: a three-panel
workbench (project list · audio + transcript editor · AI output & export). The
real backend (LiveKit, ASR, recording storage, local LLM / optional OpenRouter,
persistence, export endpoints) is **self-hosted and built separately**. This repo
is the frontend prototype only; it runs entirely in the browser against an
in-browser mock API, with clean seams so the real backend drops in later.

> If you change architecture, commands, env vars, the folder layout, or the
> dev/test workflow, **update this file in the same change.**

---

## 1. Scaffold & setup commands (exact)

Scaffolded with the TanStack CLI in **router-only** mode (pure SPA, no TanStack
Start backend):

```bash
npx @tanstack/cli@latest create local-transcript-workbench \
  --router-only --package-manager npm --toolchain biome --framework React
```

TanStack Intent (skill mappings for the AI agent) — run from the project root:

```bash
npx @tanstack/intent@latest install   # writes/refreshes the intent-skills block above
npx @tanstack/intent@latest list      # lists available skills to load on demand
```

Additional libraries were then installed manually (router-only mode disables
most add-ons):

```bash
# Runtime
npm install \
  @tanstack/react-query @tanstack/react-query-devtools \
  @tanstack/react-virtual \
  @tanstack/react-store @tanstack/store \
  @tanstack/react-form \
  docx react-markdown remark-gfm \
  class-variance-authority clsx tailwind-merge tw-animate-css zod radix-ui

# Dev / test tooling
npm install -D @testing-library/jest-dom @testing-library/user-event
# (vitest, @testing-library/react, jsdom came with the scaffold)

# shadcn/ui (config committed as components.json; new-york style, Tailwind v4)
npx shadcn@latest add button card input textarea badge tabs select \
  label scroll-area separator progress tooltip skeleton --yes
```

- **Package manager:** `npm` (a single `package-lock.json` is the lockfile).
- **Toolchain / linter / formatter:** **Biome** (`biome.json`, tab indent, double quotes).
- **Test runner:** Vitest + Testing Library + jsdom.

---

## 2. Architecture: SPA-only, no TanStack Start

- This is a **pure client SPA** built by Vite. There is **no TanStack Start
  server, no SSR, no server functions, no server routes.** `vite build` emits a
  static `dist/` you can serve from any static host or the self-hosted backend.
- **No real backend business logic lives in the frontend.** ASR, LiveKit,
  LLM inference, persistence, and server-side export are all backend concerns.
- The frontend talks to exactly one seam: the **`WorkbenchApi` port**
  (`src/lib/api/types.ts`). Two adapters implement it:
  - `mockApi` (`src/lib/api/mock-api.ts`) — in-browser, deterministic mock data,
    fake latency, simulated streaming, real client-side export.
  - `httpApi` (`src/lib/api/http-api.ts`) — `fetch` against the real backend.
- `src/lib/api/index.ts` selects the adapter from env: **mock when
  `VITE_API_BASE_URL` is empty, HTTP otherwise.** Features and components import
  `api` from `@/lib/api` and never know which adapter is active. **To wire the
  real backend, set `VITE_API_BASE_URL` and adjust `http-api.ts` endpoints —
  nothing else changes.**

This is ports-and-adapters: the domain types (`features/*/types.ts`) are the
shared kernel; `lib/api` is the port + adapters; `features/*` are use-cases
(query/mutation hooks); `components/*` and `routes/*` are the UI. The mock
backend's seed data (template catalogue + Markdown generators) lives in
`lib/mock-data`, so the `lib` layer imports only **types** from `features` —
runtime dependencies flow `features → lib` one-way (no import cycles).

### TanStack library usage
- **Router** — file routes in `src/routes`. Selection (`projectId`/`transcriptId`)
  is **URL search-param state**, validated with Zod (`routes/index.tsx`). Deep-linkable.
- **Query** — all data fetching/mutations (`features/*/queries.ts`). `queryOptions`
  factories + typed key factories. Segment saves patch the cache on success.
- **Virtual** — `TranscriptVirtualList` virtualizes hundreds/thousands of
  **variable-height** rows via `measureElement`.
- **Store** — shared, non-Query UI state: `playback-store` (the audio clock,
  read by player + transcript highlight) and `segment-status-store`
  (per-segment idle/dirty/saving/saved/error).
- **Form** — template selection (`AIOutputPanel`) and export options
  (`ExportControls`).

---

## 3. Local-first / self-hosted assumptions

- Everything runs offline in the browser today. No network calls leave the page
  in mock mode.
- The future backend is **self-hosted** (e.g. on the user's own machine/LAN):
  local LiveKit, local ASR, local recording storage, local LLM, optional
  OpenRouter passthrough, persistence, and export endpoints.
- **No secrets in the frontend.** Every `VITE_*` value is shipped to the browser,
  so it must never contain an LLM/provider API key. Keys live only in the backend.

### Environment variables (`.env.example` is committed; `.env` is gitignored)
| Variable | Purpose | MVP behaviour |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend base URL | empty ⇒ **mock mode** |
| `VITE_LIVEKIT_WS_URL` | LiveKit signalling WS | placeholder only |
| `VITE_LIVEKIT_TOKEN_ENDPOINT` | Backend LiveKit token minting | placeholder only |
| `VITE_AI_PROVIDER_MODE` | `local` \| `openrouter` (display only) | shown as a badge |
| `VITE_AI_GENERATION_ENDPOINT` | Backend LLM job endpoint | unused while mocking |
| `VITE_RECORDING_ASSET_ENDPOINT` | Backend recording asset stream | unused while mocking |

All env access is funnelled through `src/lib/config/env.ts` — never read
`import.meta.env` directly elsewhere.

### LiveKit placeholder strategy
- The MVP **never opens a LiveKit connection.** `features/livekit-placeholder`
  holds the types and a query (`getLiveKitConnection`) that returns metadata only.
- Live/recording sources are flagged `kind: "livekit"` and rendered with a
  "LiveKit (placeholder)" badge in the player.
- To go live later: implement token minting on the backend, return a real token
  from `getLiveKitConnection`, and add `livekit-client` wiring inside
  `features/livekit-placeholder`. No other code should need to change.

### Local LLM / OpenRouter strategy
- Generation is a **backend job**. The frontend only chooses a template and
  displays streamed Markdown. Provider selection (`local` vs `openrouter`) and
  all keys live in the backend; the frontend shows `VITE_AI_PROVIDER_MODE` as a
  badge for transparency.
- Mock: `mockApi.generateOutput` builds grounded Markdown from the real
  transcript (`features/ai/mock-generators.ts`) and **simulates token streaming**
  via the `onToken` callback.
- Real: `httpApi.generateOutput` POSTs to `VITE_AI_GENERATION_ENDPOINT`. Upgrade
  it to SSE / streamed `fetch` there without touching any UI.

### DOCX export implementation notes
- DOCX export **works for real in the browser today** using the `docx` library.
- `src/lib/docx/markdown-to-docx.ts` converts Markdown → docx blocks (headings,
  bullet/ordered/task lists, blockquotes, pipe tables, inline **bold**/_italic_/`code`).
  `buildDocxBlob` wraps it in a `Document` and `Packer.toBlob`.
- Markdown export is a plain `Blob`. Both run through `api.exportOutput`, so a
  future backend `/export` endpoint can take over transparently; the download
  helper (`lib/utils/download.ts`) stays the same.

---

## 4. Folder structure

```
src/
  routes/                     # TanStack Router file routes (__root, index)
  components/
    layout/                   # AppHeader, WorkbenchLayout (3-panel shell)
    project-sidebar/          # ProjectSidebar, ProjectListItem, ProjectStatusBadge
    audio-player/             # AudioPlayer, use-audio-transport
    transcript/               # TranscriptWorkbench, TranscriptVirtualList,
                              #   TranscriptSegmentRow, SegmentEditor, SaveStatusBadge
    ai-output/                # AIOutputPanel, MarkdownView
    export/                   # ExportControls
    ui/                       # shadcn/ui primitives (owned, editable)
  features/
    projects/                 # types + queries
    transcripts/              # types + queries
    segments/                 # types, queries, use-segment-autosave, active-segment
    ai/                       # types, templates (default id), queries
    export/                   # types, queries
    livekit-placeholder/      # types, queries (no real connection)
  lib/
    api/                      # WorkbenchApi port, mock + http adapters, selector, latency
    mock-data/                # mock backend: prng, corpus, fixtures, templates, generators
    stores/                   # playback-store, segment-status-store (TanStack Store)
    config/                   # env.ts (typed env access)
    docx/                     # markdown-to-docx + buildDocxBlob
    utils/                    # time, download, clipboard
    utils.ts                  # shadcn cn() helper
    query-client.ts           # QueryClient factory
tests/                        # Vitest unit/integration/component tests + setup.ts
```

### Required components (all present)
`ProjectSidebar`, `AudioPlayer`, `TranscriptWorkbench`, `TranscriptVirtualList`,
`TranscriptSegmentRow`, `SegmentEditor`, `SaveStatusBadge`, `AIOutputPanel`,
`ExportControls`.

### Mock models (in `features/*/types.ts`)
`Project`, `Transcript`, `AudioSource`, `TranscriptSegment`, `SegmentSaveStatus`,
`OutputTemplate`, `GeneratedOutput` (plus `Speaker`, `GenerationState`,
`ExportRequest/Result`, `LiveKitConnectionInfo`). Models include
revision/version fields for optimistic concurrency.

---

## 5. Development workflow

```bash
npm run dev         # Vite dev server at http://localhost:3000
npm run build       # type-light production build (regenerates src/routeTree.gen.ts)
npm run preview     # serve the production build
npm run typecheck   # tsc --noEmit (strict)
npm run test        # vitest run
npm run test:watch  # vitest watch
npm run check       # biome check (lint + format, read-only)
npm run check:fix   # biome check --write (auto-fix)
npm run format      # biome format --write
npm run verify      # check + typecheck + test + build  (run before every commit)
```

Notes:
- `src/routeTree.gen.ts` is **generated** by the router plugin on `dev`/`build`.
  It is excluded from Biome and should not be hand-edited. Run `npm run build`
  (or `dev`) once before `typecheck` on a fresh checkout so the file exists.
- shadcn/ui components in `components/ui` are **owned code** — edit them freely;
  add more with `npx shadcn@latest add <name>`.

---

## 6. Testing & commit workflow

- After each implementation step, run lint / typecheck / tests / build where
  applicable. Keep changes small and reviewable.
- **Before every commit run `npm run verify`** (Biome + typecheck + tests + build).
  **Do not commit a broken build or red tests.**
- Test layout (`tests/`): pure logic (time, active-segment, playback-store,
  mock-data), the mock API surface (reads, save success + failure + revision,
  generation, export incl. real DOCX blob), the Markdown→docx converter, the
  autosave hook lifecycle, and a presentational component (`SaveStatusBadge`).
- Use the deterministic save-failure trigger to test/demonstrate the error+retry
  path: any segment text containing `[[fail]]` makes its save fail (see
  `lib/api/latency.ts`, `FAILURE_MARKER`).

---

## 7. Git / GitHub collaboration rules

- This project was scaffolded with its own git repo. Commit only when asked.
- Branch off `main`; keep PRs small and focused; never commit a failing
  `npm run verify`.
- Don't commit secrets. `.env` is gitignored; only `.env.example` is tracked.
- Don't hand-edit generated files (`src/routeTree.gen.ts`).
- Update `AGENTS.md` whenever architecture, commands, env vars, or workflow change.
- Conventional, imperative commit messages (e.g. `feat: add export options form`).

---

## 8. Design principles

- **Backend-swap-ability first.** One port (`WorkbenchApi`), env-driven adapter
  selection, env access centralized. Replacing mocks with the real backend is a
  localized change.
- **The URL is state.** Selection lives in router search params; the app is
  deep-linkable and back/forward friendly.
- **Right tool per state:** server cache → TanStack Query; shared session/UI
  state (playback clock, per-segment save status) → TanStack Store; ephemeral
  input (segment draft, form fields) → local component state / TanStack Form.
- **Never save on every keystroke.** Editing uses a local draft; autosave fires
  on debounce, blur, and unmount/scroll-away, with explicit per-segment status
  and retry.
- **Performance:** virtualize long transcripts; memoize rows; subscribe to the
  *derived* active index (not the raw clock) so playback doesn't re-render the list.
- **Accessibility & polish:** semantic controls, keyboard support (⌘/Ctrl+Enter
  saves a segment), focus-visible rings, light/dark theme.

---

## 9. Known gotchas

- **`routeTree.gen.ts` must exist before `typecheck`.** Run `npm run build` once
  on a fresh clone (the dev server also generates it).
- **shadcn new-york uses the unified `radix-ui` package**, not individual
  `@radix-ui/react-*` packages. Keep using `radix-ui`.
- **Tailwind v4 is CSS-config** (`src/styles.css` with `@theme inline`,
  `@plugin "@tailwindcss/typography"`). There is no `tailwind.config.js`.
- **`Tooltip` needs a `TooltipProvider` ancestor** — provided once in `main.tsx`.
- **Audio is simulated** (`AudioSource.simulated = true`) — playback is driven by
  a `requestAnimationFrame` clock, so play/pause/seek/highlight work with no real
  file. When a real playable `url` arrives, set `simulated: false` and the same
  hook drives an `<audio>` element instead.
- **Devtools are stripped from production builds** by `@tanstack/devtools-vite`;
  the Router + Query devtools panels only appear in `dev`.
- The `routes` chunk is large (~730 kB) mostly because of `docx`. Fine for a
  prototype; code-split or move DOCX generation to the backend if it matters.

---

## 10. Next steps

- Implement the real backend and point `VITE_API_BASE_URL` at it; flesh out
  `http-api.ts` endpoints + auth; upgrade `generateOutput` to real streaming (SSE).
- Wire real LiveKit (`livekit-client`) inside `features/livekit-placeholder`,
  backed by the token endpoint.
- Replace the simulated audio clock with real recording playback
  (`VITE_RECORDING_ASSET_ENDPOINT`).
- Add persistence for edits/outputs; surface project create/delete (the sidebar
  is read-only today).
- Consider server-side DOCX/Markdown export endpoints to shrink the client bundle.
- Expand tests: virtualization behaviour, full generate→export flow, a11y checks;
  add CI running `npm run verify`.
- Optional: optimistic concurrency UI using `revision` (conflict detection on save).
```
