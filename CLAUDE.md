# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**WNA** is a GTD (Getting Things Done) productivity platform implementing David Allen's methodology. This repo is the Vue.js frontend; the backend is a separate C++20 microservices repo (`../wna_backend/`).

**Version roadmap**: see wna_orchestration/roadmap.md (canonical).

**Shared cross-project facts** (tier quotas, rate limits, token lifetimes, roadmap, decisions, API
surface, GTD domain model) live in `wna_orchestration` — see its FACT INDEX in
`wna_orchestration/CLAUDE.md`. Keep only frontend-local conventions in this file.

## GTD Domain Model

GTD domain model (entities, rules, clarify workflow) is a shared fact — see
`wna_orchestration/specs/domain/wna-specification.md` (canonical).

## Build & Development Commands

```bash
npm ci                    # Install dependencies
npm run dev:main          # Start main-app dev server (http://localhost:6111)
npm run dev:admin         # Start admin-app dev server (http://localhost:7111)
npm run build:main        # Build main-app → dist/main-app/
npm run build:admin       # Build admin-app → dist/admin-app/
npm run clean             # Remove dist folder
```

## Architecture

This is a **multi-app Vue 3 + Vite 7** frontend project with two fully implemented applications:
- `main-app` — Primary user-facing GTD application
- `admin-app` — Internal admin panel (auth with OTP, user management, audit log, analytics, GDPR, feature flags)

Both apps are independent — no shared components or models. They share only build tooling (Vite config, package.json), font assets, and `src/shared/` (currently just `invoicePdf.js`, the PDF document generator — both apps must export identical document PDFs).

### Key Configuration

- **App selection**: `APP=main-app` or `APP=admin-app` (set in scripts or `.env.*` files)
- **Path aliases**: `@/` → `src/`, `@main/` → `src/main-app/`, `@admin/` → `src/admin-app/`
- **Runtime config**: API domain comes from `window.RUNTIME_CONFIG.API_DOMAIN`. Dev fallback is empty string (uses Vite proxy to `http://localhost:8000`)
- **Vite proxy**: main-app proxies `/v1/*` → `localhost:8000` (router_service). admin-app proxies `/auth/*`, `/admin/*` → `localhost:8004` (admin_service)

### Main App Structure (`src/main-app/`)

```
src/main-app/
├── main.js                         # App entry, mounts Vue with router
├── router/router.js                # Vue Router with auth guards
├── layouts/
│   ├── LandingLayout.vue           # Public pages (landing, pricing, help, legal)
│   └── DashboardLayout.vue         # Authenticated pages (sidebar + topnav + content)
├── scripts/
│   ├── core/                       # Infrastructure
│   │   ├── httpApi.js              # Axios instance with JWT auto-refresh interceptor
│   │   ├── apiClient.js            # API wrapper functions with error normalization
│   │   ├── authModel.js            # Auth state management (reactive refs, not Vuex/Pinia)
│   │   ├── errorModel.js           # Toast notifications singleton
│   │   ├── confirmModel.js         # Confirm dialog singleton
│   │   ├── domains.js              # Runtime config (API_DOMAIN, GOOGLE_CLIENT_ID)
│   │   ├── upgradeModel.js         # Tier limit / upgrade modal
│   │   ├── flagsModel.js           # Feature flags
│   │   └── ...                     # dateUtils, rruleUtils, calendarLayout, haptics, etc.
│   └── models/                     # Domain state (25 singleton models)
│       ├── stuffModel.js           # Inbox items
│       ├── nextActionModel.js      # Next actions list
│       ├── projectModel.js         # Projects
│       ├── todayModel.js           # Today's actions
│       ├── calendarModel.js        # Calendar data
│       ├── waitingModel.js         # Waiting for items
│       ├── somedayModel.js         # Someday/maybe items
│       ├── completedModel.js       # Completed items
│       ├── trashModel.js           # Trash
│       ├── overdueModel.js         # Overdue actions
│       ├── recurringModel.js       # Recurring action templates
│       ├── tagModel.js             # Tags
│       ├── referenceModel.js       # Reference file manager
│       ├── referenceTrashModel.js  # Reference trash
│       ├── attachmentListModel.js  # Attachments
│       ├── clarifyModel.js         # Clarify workflow state machine
│       ├── moveModel.js            # Move/reorder items
│       ├── dragModel.js            # Drag & drop state
│       ├── contextModel.js         # Active context tag filter
│       ├── engageModel.js          # Engage dashboard data
│       ├── reviewModel.js          # Weekly review state
│       ├── settingsModel.js        # User settings
│       ├── notificationModel.js    # Notification preferences
│       ├── themeModel.js           # Light/dark theme
│       └── statsModel.js           # Dashboard statistics
├── views/
│   ├── dashboard/                  # 18 authenticated pages
│   │   ├── InboxPage.vue, StuffDetailPage.vue
│   │   ├── NextPage.vue, ActionDetailPage.vue
│   │   ├── TodayPage.vue, CalendarPage.vue
│   │   ├── ProjectsPage.vue, ProjectDetailPage.vue
│   │   ├── WaitingForPage.vue, SomedayPage.vue
│   │   ├── ReferencePage.vue, CompletedPage.vue, TrashPage.vue
│   │   ├── EngagePage.vue, ReviewPage.vue, OverduePage.vue
│   │   ├── RecurringDetailPage.vue, SettingsPage.vue
│   └── public/                     # 9 public pages
│       ├── LandingPage.vue, PricingPage.vue
│       ├── HelpPage.vue, HelpFaqPage.vue, HelpGettingStartedPage.vue, HelpBestPracticesPage.vue
│       ├── LegalPage.vue, VerifyEmailPage.vue, GoogleSsoPage.vue
└── components/
    ├── 40 top-level components     # Btn, Inpt, Item, ItemList, Modal, Sidebar, TopNav, etc.
    ├── calendar/                   # 11 calendar components
    ├── clarify/                    # 9 clarify workflow components
    └── reference/                  # 11 reference file manager components
```

### Key Components

- **Item** — Reusable list item with checkbox, inline title editing, drag support, and actions slot. Click title to edit inline (Enter/blur saves, Escape cancels). Actions visible on hover (always visible on touch).
- **ItemList** — Wrapper for Item lists with loading states, empty states, infinite scroll, and drag-to-reorder.
- **ClarifyPanel** — Multi-step wizard for clarifying inbox items into actions/projects/reference/someday. Uses `clarifyModel` singleton. Modes: `inline`, `modal`, `fullscreen`.
- **Btn** — Button with variants: `primary`, `ghost`, `danger`, `ghost-danger`, `icon`. Sizes: `sm`, `md`, `lg`.
- **Inpt** — Input field with label and error display.
- **DateTimeInput** — Date/time/duration input. Props: `date`, `time`, `duration`, `withDate`, `withDuration`, `clearable`, `disabled`.
- **QuickAddBtn** — Floating quick-add button for mobile, inline input for desktop. Always captures to inbox.
- **ConfirmDialog** — Modal for critical actions. Uses `confirmModel` singleton.
- **ErrorToaster** — Toast notifications. Error (red) and success (green) via `errorModel`.

### Singleton Model Pattern

Global state uses singleton factory pattern (not Vuex/Pinia):

```js
// Toasts
import { errorModel } from '../scripts/core/errorModel.js'
const toaster = errorModel()
toaster.push('Something went wrong')     // Error toast (red)
toaster.success('Item completed')        // Success toast (green)

// Confirmation dialogs
import { confirmModel } from '../scripts/core/confirmModel.js'
const confirm = confirmModel()
const confirmed = await confirm.show({
  title: 'Delete',
  message: 'Are you sure?',
  confirmText: 'Delete',
  cancelText: 'Cancel'
})

// Clarify workflow
import { clarifyModel } from '../scripts/models/clarifyModel.js'
const clarify = clarifyModel()
clarify.start(stuffItem, 'modal')  // Start clarify flow
```

### API Pattern

```
View → Model → apiClient → httpApi (Axios)
```

- **httpApi.js** — Axios instance with auto-refresh interceptor (refreshes JWT 60s before expiry)
- **apiClient.js** — Named async functions with error normalization, returns data
- **Models** — Call apiClient, manage reactive state, handle loading/error

### Backend API

Backend runs on `http://localhost:8000` (router_service gateway). Key endpoints:

The public API surface and naming convention are the code-synced spec — see
`wna_orchestration/specs/api/api.md` (canonical).

JWT tokens in localStorage: `auth_token`, `refresh_token`, `current_user`.

### Production Build

Terser minification (console/debugger stripped). Code obfuscation via `javascript-obfuscator` runs as a post-build step on every production build (`config/vite.core.js`). Runtime-heavy options (`controlFlowFlattening`, `deadCodeInjection`, string encoding) must stay off — they multiply runtime cost 5-10x.

## Mandatory Rules

### Reuse First, Ask Before Creating
- **Follow existing code patterns, UX/UI patterns, and architecture** — study how similar features are already built before implementing anything new
- **Use existing components, CSS text classes, and color styles** — do not create new ones without asking first
- **Never copy-paste code** — if logic is shared, extract a reusable component or function. Ask before creating it
- **Before creating any new `.vue` component, model, CSS variable, or utility function** — ask the user for approval. Explain what you need and why an existing one can't be used

### Keep Documentation in Sync
When adding features, fixing bugs, or changing behavior, update the relevant specs **in `wna_orchestration`**
(this repo's `.claude/*.md` are pointers):
- `wna_orchestration/specs/features/wna-features.md` — if a user-facing feature is added, changed, or removed
- `wna_orchestration/specs/tests/wna-test-cases.md` — add/update test cases for new or changed functionality
- `wna_orchestration/specs/ci/frontend-ci.md` — if build config, Docker, K8s manifests, or deployment changes
- `README.md` — update if dev setup, build commands, project structure, or tooling changes (stays local)

## Behavioral Guidelines

Guidelines to reduce common LLM coding mistakes. They bias toward caution over speed; for trivial tasks, use judgment — but the Mandatory Rules above always apply.

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask — and wait for the answer; never proceed on defaults or best judgment.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request. Spec updates required by "Keep Documentation in Sync" count as part of the request.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals. This project has no automated tests and Claude does not run apps or dev servers, so verify with what exists — production builds, code inspection, and the manual test cases spec:

- "Add validation" → "List the invalid inputs to handle, implement, confirm `npm run build:main`/`build:admin` passes, add the cases to `wna-test-cases.md`"
- "Fix the bug" → "State the reproduction steps, trace the cause in code, fix it, confirm the build passes, ask the user to verify at runtime"
- "Refactor X" → "Confirm the build passes before and after; behavior must be unchanged"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Code Conventions

### Vue 3 Composition API
- **Always use `<script setup>`** — no Options API, no `defineComponent()`
- **Props:** `defineProps({ ... })` with defaults. **Emits:** `defineEmits([...])`
- **Refs/Reactive:** `ref()` for primitives, `reactive()` for objects, `computed()` for derived
- Inside `<script setup>`, order: imports → props/emits → reactive state → methods → watchers → lifecycle hooks

### File Naming
- **Components:** PascalCase `.vue` (e.g., `DataTable.vue`). Pages get `Page` suffix (e.g., `DashboardPage.vue`)
- **Models/Scripts:** camelCase `.js` (e.g., `authModel.js`, `apiClient.js`)
- **Icons:** PascalCase `.vue` with `Icon` suffix. **CSS:** kebab-case

### Template Conventions
- `v-if`/`v-else` for conditionals, `v-for` always with `:key`
- Short-hand: `@click`, `:prop`, self-closing `<Btn />`

### Styling Rules
- **Never hardcode colors, font sizes, or spacing** — always use CSS variables from tokens
- All component styles `<style scoped>`. Global styles only in `globals.css` and token files
- All colors must work in both light and dark themes — use semantic names (`--color-text-primary`)
- Mobile breakpoint: `max-width: 768px`. Tablet: `max-width: 1024px`
- Transitions: 150ms micro-interactions, 200ms modals, 250ms page transitions

### Dependency Policy
- **Minimize dependencies** — prefer vanilla JS/CSS
- No state management libraries (Pinia/Vuex), no CSS frameworks (Tailwind/Bootstrap), no heavy UI component libraries
- Current deps: vue 3.5, vue-router 4.6, axios 1.13, date-fns 4.1, chart.js 4.5, vue-chartjs 5.3, vue-draggable-plus 0.6, marked 17.0, qrcode 1.5

## Tech Constraints

- **Node**: ^20.19.0 || >=22.12.0
- **No .env files** — runtime config via `window.RUNTIME_CONFIG` injected by `/config.js`
- **No SSR** — pure client-side SPAs served by Nginx
- **Code splitting**: Route-level lazy loading via dynamic `import()`
- **Fonts**: Libre Bodoni (serif headings), Montserrat (body/UI)
- **No utility classes** beyond a small set of text/color helpers
- **JWT in localStorage** (not httpOnly cookies) — consistent across both apps
- **No shared runtime code** between main-app and admin-app — same-named components are separate implementations. Sole exception: `src/shared/invoicePdf.js` (both apps must export identical document PDFs)

## Known Pain Points

- **Bundle size**: Main-app main chunk exceeds 500 KB. Needs `manualChunks` or more aggressive code splitting
- **No automated tests**: Zero unit/component/E2E tests. Manual testing only
- **apiClient.js size**: Main-app is ~1,700 lines in a single file. Could split by domain
- **Code duplication**: Both apps implement identical base components (Btn, Inpt, Modal, etc.) independently
- **No offline/optimistic updates**: All mutations wait for server response
- **No WebSocket/real-time**: Dashboard uses setInterval polling (30s)

## Related Docs

All specs are centralized in `wna_orchestration` (this repo's `.claude/*.md` are pointers):
- `README.md` — Dev setup, build commands, Docker, deployment (stays local)
- `wna_orchestration/specs/domain/wna-specification.md` — Full GTD domain specification
- `wna_orchestration/specs/ci/frontend-ci.md` — CI/CD, Docker, Kubernetes manifests
- `wna_orchestration/roadmap.md` — Roadmap
- `wna_orchestration/specs/features/wna-features.md` — Complete user-facing feature documentation
- `wna_orchestration/specs/tests/wna-test-cases.md` — QA manual test cases
