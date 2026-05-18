# NextFlow — LLM Workflow Builder

> A production-grade visual workflow builder for creating and executing complex LLM pipelines.

Built by [Gaurav Thakur](https://thegauravthakur.in) · [GitHub](https://github.com/2405Gaurav)

---

## Overview

NextFlow is a full-stack AI workflow builder that lets you visually compose, connect, and execute multi-modal LLM pipelines — combining text, images, and video in a single canvas.

---

## Features

- **Visual Canvas** — Drag-and-drop workflow builder powered by React Flow
- **6 Node Types** — Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame
- **Type-Safe Edges** — Connection validation enforced at the handle level
- **DAG Execution Engine** — Topological sort with parallel branch execution
- **Execution History** — Full run history with per-node result inspection
- **Real-time Status** — Live node status updates during execution
- **Undo / Redo** — Full history management via Zustand
- **Import / Export** — Save and restore workflows as JSON
- **Authentication** — Clerk-powered auth with user-scoped data
- **Cloud Task Execution** — Trigger.dev handles heavy tasks (ffmpeg, sharp) serverlessly
- **Database** — PostgreSQL on Neon DB (serverless)

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, React Flow, Zustand |
| Backend | Next.js API Routes, PostgreSQL (Neon DB), Clerk |
| AI | Google Generative AI (Gemini 1.5 Flash / Pro / 2.0 Flash) |
| Tasks | Trigger.dev v3 (ffmpeg frame extraction, sharp image processing) |
| Uploads | Transloadit |
| Validation | Zod |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `DATABASE_URL` | [neon.tech](https://neon.tech) → Connection String |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [makersuite.google.com](https://makersuite.google.com/app/apikey) |
| `TRIGGER_SECRET_KEY` | [trigger.dev](https://trigger.dev) → API Keys |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | [transloadit.com](https://transloadit.com) |
| `TRANSLOADIT_SECRET` | [transloadit.com](https://transloadit.com) |

### 3. Apply Database Schema

Run `lib/schema.sql` in the [Neon SQL Editor](https://console.neon.tech).

### 4. Run Development

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Trigger.dev worker (required for frame extraction)
npx trigger.dev@latest dev
```

---

## Node Types

| Node | Input | Output | Description |
|---|---|---|---|
| **Text** | — | Text | Static text input |
| **Upload Image** | — | Image | Upload or use default image |
| **Upload Video** | — | Video | Upload or use default video |
| **LLM** | Text + Image(s) | Text | Gemini AI generation |
| **Crop Image** | Image | Image | Percentage-based crop |
| **Extract Frame** | Video | Image | FFmpeg frame at timestamp |

---

## Execution Modes

- **Run All** — Execute the full DAG
- **Partial** — Execute selected nodes and their dependencies
- **Single** — Execute one selected node in isolation

---

## Workflow Import / Export

Workflows can be exported as JSON and re-imported — preserving all node positions, configurations, and connections.

```json
{
  "version": "1.0",
  "exportedAt": "2026-03-25T10:00:00.000Z",
  "nodes": [...],
  "edges": [...]
}
```

---

## Trigger.dev Integration

Heavy processing tasks run serverlessly via Trigger.dev v3:

- `execute-llm` — Gemini multimodal generation
- `crop-image` — Sharp-based image cropping
- `extract-frame` — FFmpeg frame extraction from video

Tasks are deployed to Trigger.dev cloud and invoked from Next.js API routes using `tasks.trigger()` + `runs.poll()`.

```bash
npx trigger.dev@latest deploy
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── execute/          # crop-image, extract-frame, llm
│   │   ├── upload/           # image, video
│   │   ├── workflows/        # CRUD
│   │   └── executions/       # history
│   └── workflow/             # main page
├── components/
│   ├── nodes/                # 6 node components
│   ├── WorkflowCanvas.tsx
│   ├── WorkflowToolbar.tsx
│   ├── NodeSidebar.tsx
│   ├── HistorySidebar.tsx
│   └── ImportExportButtons.tsx
├── lib/
│   ├── store.ts              # Zustand store
│   ├── execution-engine.ts   # DAG runner
│   ├── types.ts
│   ├── validation.ts
│   ├── db.ts
│   └── schema.sql
└── trigger/
    └── tasks.ts              # Trigger.dev tasks
```

---

## Deployment

### Vercel

1. Import repository
2. Add all environment variables
3. Deploy

> Trigger.dev tasks must be deployed separately via `npx trigger.dev@latest deploy` and require `TRIGGER_SECRET_KEY` to be set in both Vercel and the Trigger.dev dashboard.

---

## Author

**Gaurav Thakur** — Full-Stack Developer

- ◈ Portfolio — [thegauravthakur.in](https://thegauravthakur.in)
- ◈ GitHub — [github.com/2405Gaurav](https://github.com/2405Gaurav)
- ◈ Email — gauravthakur83551@gmail.com

---

## License

MIT
