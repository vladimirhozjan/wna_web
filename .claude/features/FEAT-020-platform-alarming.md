# FEAT-020 — Platform alarming (Slack + admin panel) · wna_web (admin-app) slice

**Parent (orchestration):** `wna_orchestration/features/FEAT-020-platform-alarming.md` — the problem,
full design, all locked decisions (D1–D12), the admin API surface, and per-role user flows live THERE.
This slice is **LOCAL** — the admin-app's checklist only; it does **not** restate the parent's design
or any shared fact, it **links** them. The endpoints this UI consumes (`/admin/alarms*`,
`/admin/dashboard/alarms`, the `alarm_*` audit actions) are owned by the backend slice and their spec
home is `wna_orchestration/specs/api/admin-api.md` — read the exact shapes there, do not re-derive them.

Scope in one line: build the admin-app **Alarms** surface against the backend endpoints — apiClient
functions + a `viewer`-gated `alarms` route + `NAV_ITEMS` entry; an Alarms page (DataTable + severity/
status/source filters + offset/limit Pagination + expandable context JSON + role-gated ack/resolve +
Resolve-all behind ConfirmDialog); a Dashboard Alarms widget (counts by severity, `gdpr-requests`
widget pattern); a **new sidebar red-dot** mechanism on `NAV_ITEMS` fed by a lightweight `alarmModel`
singleton (**no interval polling** — parent D9); and the three `alarm_*` actions added to `AuditLogPage`.
Out of scope here: every backend/notification/Slack behaviour and the `alarm_*` endpoint contracts
(backend slice); RabbitMQ/config/CronJob (deploy slice); the **main-app** (this feature is admin-app only).

> **Worktree rule:** this admin-app slice lives ONLY in the `develop-a` worktree
> (`../wna_web/develop-a/.claude/features/`). Do not copy it into `main` or `develop-b`.

## User flows (this project's part) — per role
- **Free / Pro / Team owner / Team member** — n/a — this feature has **no main-app surface**; the alarms
  UI is admin-app only. Product-tier users never see it.
- **Admin (viewer)** — renders the **Alarms page read-only** (ack / resolve / Resolve-all buttons hidden
  via `hasMinRole`), the **Dashboard Alarms widget**, and the **sidebar red dot** on the Alarms nav entry
  when `active_count > 0`. Row-click expands the context JSON.
- **Admin (support+)** — additionally shows the ack / resolve buttons and **Resolve all** (behind
  `ConfirmDialog`); after any mutation, refetch via `alarmModel` so the list, counts, and dot update
  (still no polling — refresh on mount / route change / after action only).
- **Operator (Slack)** — n/a — Slack delivery is entirely backend; the admin-app has no Slack surface.
- **Unauthenticated / not-entitled** — n/a — the `alarms` route carries `meta.minRole: 'viewer'` behind
  the existing admin auth guard; no anonymous access.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a GKE redeploy I
  cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

> **ui-tests scope:** this web slice contains **no ui-tests TC boxes** (parent: ui-tests n/a — admin-app
> has no automated E2E suite). The legend's ui-tests reference is inherited boilerplate.

## Hard rules for the implementer
These are non-negotiable:
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered Alarms page with real rows, the Dashboard widget
   counts, the sidebar dot appearing/clearing, a viewer with ack/resolve hidden) and confirm it in-app.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches.
4. **Honor the parent's User flows for every role** — viewer read-only (buttons hidden AND backend 403),
   support+ mutations, dot only when `active_count > 0`, **no interval polling anywhere** (D9); don't
   silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT, `specs/api/admin-api.md` for the exact endpoint
   shapes). Reading is unrestricted; only *writing* is scoped. For **this** slice: the admin API contract
   and audit-action set are owned/synced by the **backend** slice (`specs/api/admin-api.md`) — do not edit
   that from here; but the admin-app **feature catalog** `specs/features/wna-features.md` **is** a home this
   slice changes (it already catalogues admin-app features — FEAT-006/022/001), so add the FEAT-020 Alarms
   entry there on ship and cite the orchestration `file:line`. Find every home in the Fact Index.

### Reuse-first reminder (this repo's mandatory rule)
Use the **existing** admin-app components and patterns — `DataTable.vue`, `Pagination.vue`,
`ConfirmDialog.vue`, `Badge` cells, `SidebarNav.vue` (`NAV_ITEMS`), `hasMinRole` in `authModel.js`,
the Dashboard widget pattern from `GdprRequestsPage`/`DashboardPage`, and the `apiClient.js` +
singleton-model conventions. The **only** owner-approved new primitive is the sidebar nav-dot mechanism
(parent D9). Before creating any other new `.vue` component, model, CSS var, or util — **ask** (repo rule).

## Checklist
### plumbing — apiClient + route + nav
- [ ] `apiClient.js` — `getAlarms(params)`, `ackAlarm(id)`, `resolveAlarm(id)`, `resolveAllAlarms()`,
      `getAlarmCounts()` against the parent's `/admin/alarms*` + `/admin/dashboard/alarms` (shapes from
      `specs/api/admin-api.md`), with the file's standard error normalization
- [ ] `router/router.js` — new `alarms` route, lazy-loaded, `meta.minRole: 'viewer'`, under the admin guard
- [ ] `SidebarNav.vue` — new Alarms `NAV_ITEMS` entry (viewer+ visible)
### Alarms page
- [ ] Alarms page — `DataTable` (severity + status as `Badge` cells) + severity/status/source filter
      selects + offset/limit `Pagination`; row-click expands the `context` JSON
- [ ] ack / resolve buttons **role-gated via `hasMinRole`** (support+; hidden for viewer) + **Resolve all**
      behind `ConfirmDialog`; on success, refetch through `alarmModel` (list + counts + dot)
### Dashboard widget + sidebar dot
- [ ] Dashboard Alarms widget — counts card by severity (`GdprRequests` widget pattern) from `getAlarmCounts`
- [ ] **New sidebar red-dot** mechanism on the `NAV_ITEMS` Alarms entry when `active_count > 0`
      (owner-approved, D9) + `alarmModel` singleton fetched on layout mount / route change / after actions —
      **no `setInterval` / no 30 s auto-refresh** (D9 rejected it)
### audit log
- [ ] `AuditLogPage.vue` — extend `ACTION_OPTIONS` / `ACTION_LABELS` with `alarm_acknowledged`,
      `alarm_resolved`, `alarm_resolved_all`
### spec sync (orchestration home this work changes — rule 6)
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — add an **"Admin (admin-app, FEAT-020):
      Alarms"** subsection (Alarms page + Dashboard widget + sidebar dot) on ship, following the existing
      admin-app precedent there (FEAT-006 line ~1162, FEAT-022 line ~1204). The admin-app IS catalogued in
      this file, and this repo's CLAUDE.md ("Keep Documentation in Sync") requires the entry for a new
      user-facing admin surface.
- [NA] `/admin/alarms*` contract + `alarm_*` audit actions → **not** synced from this slice; their home
      `specs/api/admin-api.md` is owned/synced by the **backend** slice (this UI only consumes them).

## Acceptance / gates (this repo's portion)
- [ ] Viewer sees the Alarms page + Dashboard widget + dot but ack/resolve/Resolve-all are hidden
      (and 403 if forced) — verified in-app
- [ ] Support+ can ack / resolve / Resolve-all (Resolve-all confirmed via dialog); list + counts + dot
      update after each action with no polling
- [ ] Sidebar dot appears when active alarms exist and **clears** when all are resolved
- [ ] `AuditLogPage` filters/labels the three `alarm_*` actions
- [ ] admin-app build green
