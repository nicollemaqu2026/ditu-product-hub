# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start server (dev and prod are the same command)
npm start
# → http://localhost:3000
```

No build step, linter, or test runner is configured.

## Architecture

Single-server Node.js app (Express) serving a vanilla JS SPA. No framework, no bundler, no TypeScript.

### Server (`server.js`)

- Serves static files from `public/` and the single HTML shell from `views/index.html` for all `*` routes.
- Persists all state to two JSON files in `data/`: `backlog.json` and `prds.json`. These are created with seed data on first run if missing.
- Every write does a full JSON file overwrite — there is no database.
- **Side-effect on PRD approval**: when a PRD's `status` changes to `aprobado`, the server automatically sets `prdReady: true` on the linked backlog item.

### Frontend (`public/js/`)

Three script files loaded in order: `app.js` → `backlog.js` → `prd.js`.

- **`app.js`** — bootstraps shared globals: toast notifications, slide panel open/close, sidebar page navigation, and four `fetch` wrappers. Exposes everything as `window.App`.
- **`backlog.js`** — owns the Backlog Master module. Maintains `allItems` / `filteredItems` arrays in module scope. Status pills render inline dropdowns that call `PUT /api/backlog/:id` without opening the slide panel.
- **`prd.js`** — owns the PRD Generator module. Two internal views (list and editor) swap via `display:none`. PRD items are linked to backlog items by `backlogId`.

### Data models

**Backlog item** (`data/backlog.json`):
```
id, epic, feature,
platforms: { web, ios, android, atv },  // status enum per platform
priority, sprint, figmaStatus, prdReady,
blocker, blockerReason, notes,
createdAt, updatedAt
```

**PRD** (`data/prds.json`):
```
id, backlogId, feature, epic, version, status, author,
objective, userStories[], requirements[], outOfScope,
acceptanceCriteria: { web, ios, android, atv },
technicalNotes, designNotes, openQuestions[],
createdAt, updatedAt
```

Platform status values: `sin-especificar | en-especificacion | listo-para-dev | en-desarrollo | en-qa | entregado`

PRD status values: `borrador | en-revision | aprobado`

### API routes

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/backlog` | All items |
| GET | `/api/backlog/stats` | Aggregate counts + per-epic progress |
| GET/PUT | `/api/backlog/:id` | Single item |
| GET | `/api/prds` | All PRDs |
| GET | `/api/prds/stats` | Aggregate counts by status |
| GET/PUT/DELETE | `/api/prds/:id` | Single PRD |
| POST | `/api/prds` | Create PRD from a backlog item (`{ backlogId, author }`) |

`/api/backlog/stats` must be declared before `/:id` in `server.js` to avoid Express route collision.

## Adding a new module

1. Add a nav item in `views/index.html` (remove `disabled` class when ready).
2. Add a `<section id="page-<name>" class="page">` block in `index.html`.
3. Create `public/js/<name>.js` and load it at the bottom of `index.html`.
4. Add API routes to `server.js` and a new JSON file in `data/` if needed.
