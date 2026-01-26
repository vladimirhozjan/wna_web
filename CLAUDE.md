# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**WNA** is a GTD (Getting Things Done) productivity platform implementing David Allen's methodology. This repo is the Vue.js frontend; the backend is a separate C++20 microservices repo.

**Version roadmap**: V1 (basics: login, tasks, projects, calendar) → V2 (full functionality, monetization, integrations) → V3 (user-requested features, mobile apps)

## GTD Domain Model

### Core Entities

- **Stuff**: Raw inbox items with no metadata (no tags, dates, delegation). Must be clarified into Action/Project/Reference/Someday or deleted.
- **Action**: Concrete physical step. May belong to a Project or be standalone. Can have tags, due_date, waiting_for, defer_until.
- **Project**: Outcome requiring multiple actions. Must always have exactly one Next Action. Backlog auto-promotes (FIFO) when Next Action completes.

### GTD Buckets → Frontend Views

| Bucket | View | Contents |
|--------|------|----------|
| Inbox | `InboxPage` | Stuff only - raw unclarified items |
| Next | `NextPage` | Actions ready to do (no date, not delegated, not deferred) |
| Today/Calendar | `TodayPage`, `CalendarPage` | Actions with due_date |
| Waiting For | (TBD) | Actions with waiting_for set |
| Someday | `SomedayPage` | Paused items, not currently actionable |
| Reference | `ReferencePage` | Non-actionable files/notes |
| Projects | `ProjectsPage` | Multi-action outcomes |

### Key Business Rules

- **Stuff has no metadata** - tags, dates, delegation only allowed after clarifying into Action
- **Projects must have Next Action** - completing it auto-promotes from backlog
- **Two-minute rule** - actions <2 min should be done immediately during clarify, not tracked
- **Tickler** - actions with `defer_until` hidden until that date, then appear in Next

## Build & Development Commands

```bash
npm ci                    # Install dependencies
npm run dev               # Start Vite dev server (http://localhost:5173)
npm run build             # Generic build
npm run build:main        # Build main-app only
npm run build:admin       # Build admin-app only
npm run preview           # Preview production build
npm run clean             # Remove dist folder
```

Build output goes to `dist/main-app/` or `dist/admin-app/`.

## Architecture

This is a **multi-app Vue 3 + Vite 7** frontend project supporting two applications:
- `main-app` (port 8080) - Primary user-facing application
- `admin-app` (port 8081) - Admin dashboard (scaffolded but not fully implemented)

### Key Configuration

- **App selection**: Set `APP=main-app` or `APP=admin-app` in `.env.*` files
- **Path aliases**: `@/` → `src/`, `@main/` → `src/main-app/`, `@admin/` → `src/admin-app/`
- **Runtime config**: API domain comes from `window.RUNTIME_CONFIG.API_DOMAIN` or falls back to `http://localhost:8000`

### Main App Structure (`src/main-app/`)

- `main.js` - App entry point, mounts Vue with router
- `router/router.js` - Vue Router with auth guards
- `scripts/httpApi.js` - Axios instance with JWT auto-refresh interceptor
- `scripts/apiClient.js` - API wrapper functions with error normalization
- `scripts/authModel.js` - Authentication state management (reactive refs, not Vuex/Pinia)
- `layouts/` - `LandingLayout.vue`, `DashboardLayout.vue`
- `views/` - Route-level components (InboxPage, TodayPage, NextPage, etc.)
- `components/` - Reusable UI components
- `scripts/errorModel.js`, `scripts/confirmModel.js` - Singleton state models for global UI

### Key Components

- **Item** - Reusable list item with checkbox, inline title editing, drag support, and actions slot. Click title to edit inline (Enter/blur saves, Escape cancels). Actions visible on hover (always visible on touch devices).
- **ConfirmDialog** - Modal for critical actions (delete confirmation). Uses singleton pattern via `confirmModel`.
- **ErrorToaster** - Toast notifications at bottom of screen. Uses singleton pattern via `errorModel`.
- **Btn** - Button with variants: `primary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`.
- **Inpt** - Input field with label and error display.

### Singleton Model Pattern

Global UI state uses singleton models (not Vuex/Pinia):

```js
// Error toasts
import { errorModel } from '../scripts/errorModel.js'
const toaster = errorModel()
toaster.push('Something went wrong')

// Confirmation dialogs
import { confirmModel } from '../scripts/confirmModel.js'
const confirm = confirmModel()
const confirmed = await confirm.show({
  title: 'Delete',
  message: 'Are you sure?',
  confirmText: 'Delete',
  cancelText: 'Cancel'
})
```

### API Pattern

API calls flow through: `authModel` → `apiClient` → `httpApi` (axios)

The httpApi interceptor automatically refreshes expired JWT tokens before requests.

### Backend API

Backend runs on `http://localhost:8000` (router_service gateway). Key endpoints:

- `/v1/user/*` - Auth: register, login, refresh, forgot, reset
- `/v1/stuff/*` - Inbox items: CRUD + list with cursor pagination

JWT tokens stored in localStorage (`auth_token`, `refresh_token`). User data cached in `current_user`.

### Production Build

Production builds use Terser minification. Code obfuscation via `rollup-plugin-obfuscator` is configured but currently disabled (see `config/vite.core.js:9`).