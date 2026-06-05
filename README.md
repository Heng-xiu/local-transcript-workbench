# Local Transcript Workbench

A **local-first, frontend-only SPA** for turning a sensitive, self-hosted meeting
into a formal meeting record. The primary user is a **meeting operator / record
owner**, and the workflow is:

> **Meetings → Transcripts → Records → Export**

- **Meeting** — a local/self-hosted LiveKit-backed session (conceptually like a
  Google Meet session). The *source* of a transcript and record.
- **Transcript** — the editable transcript artifact generated from a meeting
  recording / ASR. Corrected in a fast, virtualised editor.
- **Meeting record** — the formal, AI-assisted meeting minutes generated from a
  corrected transcript. The deliverable.
- **Export** — an action on a record (Markdown / DOCX), not a top-level section.

This repository is the **frontend prototype only**. It runs entirely in the
browser against an in-browser **mock API**, with clean seams so a self-hosted
backend (LiveKit, ASR, recording storage, local LLM / optional OpenRouter,
persistence, export endpoints) drops in later. There is **no real LiveKit, ASR,
or LLM** here, and **no secrets ever live in the frontend**.

> This is **not** a TanStack Start app. It is a pure client SPA built with Vite +
> TanStack Router (router-only). There are no server functions and no API routes
> in this repo.

## Tech stack

React 19 · TypeScript · Vite · TanStack Router / Query / Virtual / Store / Form ·
shadcn/ui (new-york, Tailwind v4) · `docx` (real client-side DOCX export) ·
Vitest + Testing Library · Biome · npm.

## Getting started

```bash
npm install
npm run dev        # Vite dev server at http://localhost:3000
```

With no environment configured the app runs in **mock mode** (all data served by
the in-browser mock API). Copy `.env.example` to `.env` and set
`VITE_API_BASE_URL` to point at a real backend.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build (regenerates src/routeTree.gen.ts)
npm run preview     # serve the production build
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run check       # biome check (lint + format, read-only)
npm run check:fix   # biome check --write (auto-fix)
npm run verify      # check + typecheck + test + build  (run before pushing)
```

`npm run verify` is the authoritative gate — CI and the `pre-push` git hook run
exactly this command.

## Architecture (high level)

Ports & adapters around a single seam, the **`WorkbenchApi` port**
(`src/lib/api/types.ts`):

- `mockApi` (`src/lib/api/mock-api.ts`) — in-browser deterministic data, fake
  latency, simulated generation, **real** client-side DOCX/Markdown export.
- `httpApi` (`src/lib/api/http-api.ts`) — `fetch` against the self-hosted backend.
- `src/lib/api/index.ts` selects the adapter from env: **mock when
  `VITE_API_BASE_URL` is empty, HTTP otherwise.** Components never know which is
  active.

App shell regions: **`GlobalNavigationRail | ContextSidebar | MainContent |
optional RightPanel`**. The rail selects one of four sections — Meetings,
Transcripts, Records, Settings. The Transcripts editor keeps the existing
audio + virtualised transcript + AI/export RightPanel. Selection lives entirely
in URL search params (`section`, `meetingId`, `transcriptId`, `recordId`), so the
app is deep-linkable.

See [`AGENTS.md`](./AGENTS.md) for the full architecture, status model, API
surface, and contribution workflow, and
[`docs/agent-github-flow.md`](./docs/agent-github-flow.md) for the label-based
issue/PR flow.

## Local / self-hosted backend assumptions

The future backend is **self-hosted** and owns everything sensitive: local
LiveKit, local ASR, local recording storage, a local LLM (optional OpenRouter
passthrough), persistence, and server-side export. The frontend only ever reads
`VITE_*` configuration (never secrets) and talks to the `WorkbenchApi` port. See
`.env.example` for the configurable endpoints.
