# FEAT-013 (web slice): Overscheduled — per-row red styling for timed scheduled items

Parent / spec / design / decisions: `wna_orchestration/features/FEAT-013-overscheduled-calendar.md`.
Do not restate the parent — this is the local checklist only. The 3-way overdue rule and its
load-bearing semantics (duration-drives-granularity, strict `>`/`<`, no `Z`/offset suffix on the local
parse) live in the parent's **Design** section — mirror it, don't re-derive it. (All work on `main` — no branches.)

**Scope: Tier-2 styling only.** tz-plumbing already shipped with FEAT-016 — `apiClient.js:109 liveTz()`
is already sent on overdue/stats/today/engage. FEAT-013 web work is **only** the per-row "overdue" red
styling for timed scheduled slots; **no** tz-plumbing, **no** new component / CSS var / model.

## Checklist (web)

### Overdue predicate (mirror the backend 3-way rule)
- [x] `dateUtils.js` — add the predicate mirroring the backend: a scheduled item is time-granular overdue
      **only when `scheduled_duration > 0`** → end = `new Date(scheduled_date + 'T' + scheduled_time)` +
      `scheduled_duration` min, **no `Z` / offset suffix** (browser-local parse == the `tz` sent — keep this
      as a load-bearing comment), compared strict `>`. A no-time **or** 0/absent-duration scheduled item is
      day-granular (`scheduled_date < today`, overdue the next day) — same daily-task split as the backend.
      → `dateUtils.js:197 isScheduledOverdue()`; daily branch reuses `isOverdue()` (`now > date+'T23:59:59'` ≡ `date < today`); negative/0/null durations route to daily via `Number(...)||0` + `> 0`.
- [x] `calendarModel.isItemOverdue` (`:163-164`, currently `due_date`-only) → OR-in the timed and the
      all-day/daily scheduled predicates from `dateUtils`.
      → `calendarModel.js:163` now display-reason-aware: `due`→due_date, `scheduled`→`isScheduledOverdue(scheduled_date, scheduled_time, item.duration)`, `start`→false (no start-row regression).

### Per-row rendering (the visible result)
- [x] `CalendarItem.displayClass` (`:54-57`) → check `if (isOverdueItem.value) return 'overdue'` **first**,
      before the `displayType` branch. (`displayType` is `'scheduled'`, never `'due'`, for these rows, so
      the current guard can never fire → scheduled slots never go red today. This is the core visible bug.)
      → `CalendarItem.vue:54` — `if (isOverdueItem.value) return 'overdue'` now first; `.calendar-item--overdue` (dark red) confirmed in `<style>`.
- [x] Extend `ItemList.itemIsOverdue` + `MetadataRow` to the new predicate so list rows get the red border /
      "Overdue" chip for overscheduled items, matching the existing overdue (dark-red) treatment.
      → `ItemList.vue:148` OR-s in `isScheduledOverdue(...scheduled_duration)` (red `item-wrapper--overdue` border); `MetadataRow.vue:121 isScheduledOverdueItem` flips the scheduled chip to existing `chip--overdue`/`chip__icon--overdue`/`chip__text--overdue` + "Overdue" text (no new CSS). See backend-dependency note below.

> **Backend dependency (out of web scope) — same-day timed reddening in list/Overdue views.** The list
> predicate reads the canonical `scheduled_duration` field; `apiClient` passes the response through
> untouched, and `GET /v1/action` / `GET /v1/nextActions` carry `scheduled_duration` (api.md:1853, "same
> shape as Get Action"). But the **List Today** example (api.md:2968) and the **`/v1/overdue`** example
> (api.md:~4725) show scheduled items *without* `scheduled_duration`. If those serializers actually omit it,
> a timed slot in those lists degrades to the **day-granular** branch (reddens next day, not same-day after
> end) — safe, no crash/false-positive, exactly the parent's "duration drives granularity" rule for a
> duration-less item. Full same-day timed reddening in Today/Overdue lists therefore depends on the backend
> serializer including `scheduled_duration` (+ `scheduled_time`). Calendar views are unaffected — `/v1/calendar`
> includes it (api.md:3256). No web change can fix this without diverging from the backend rule.

### No-change (assert, don't edit)
- [x] Engage banner / sidebar dots: **no change** — they read server `stats.*.overdue` and auto-correct once
      the backend slice ships. Verify they reflect the new count (don't re-implement client-side).
      → Verified untouched: `EngagePage.vue:243-247` sums `stats.*.overdue`; `Sidebar.vue:24,34,44,77` read `stats?.*.overdue`. Both server-sourced; will reflect the new count once backend ships.

### Spec sync (required, not deferred — Hard rule #6). Web owns the frontend feature catalog:
- [x] `wna_orchestration/specs/features/wna-features.md:532` and `:1197` — fix the missing-operator typo
      `scheduled_date scheduled_time` → `(scheduled_date + scheduled_time)` in the embedded rule text.
      → Already in sync (corrected in a prior commit): `wna-features.md:532` and `:1203-1204` both read `(scheduled_date + scheduled_time) + scheduled_duration`; grep for the no-operator typo = **0 matches**. No edit needed.
- [x] Confirm `wna-features.md`'s visual-states description says a **timed scheduled slot renders dark-red
      (overdue) once its end time passes, same day** — add it if missing (this is the user-facing FEAT-013
      behavior this slice ships). (`specs/api/api.md` + `specs/domain/*` typos are the **backend** slice's
      spec-sync, not web's.)
      → Present & correct: §8.8b `wna-features.md:531-533` ("Overscheduled (dark red) … flagged as soon as `now` is past the slot's end, even while still today") and §23.4 `:1199-1207`. No edit needed.

## User flows (this project's part)
Web renders the **per-row red styling** for items the server (or the mirrored client predicate) marks
overdue. FEAT-013 is role-agnostic — universal styling, no entitlement gating:
- **Free / Pro:** identical. A timed scheduled action (`scheduled_duration > 0`) whose wall-clock end has
  passed renders dark-red (overdue) on the Calendar and in lists the same day; an all-day/daily scheduled
  item only reddens the next day. Strict boundary: not red **at** the end instant.
- **Team owner / member:** identical — each viewer's browser-local parse matches the `tz` already sent;
  shared item, same fields, each viewer reddens on their own local clock.
- **Admin:** n/a — admin-app has no calendar/overdue surface.
- **Unauthenticated / not-entitled / blocked:** n/a — authenticated, entitled main-app views only.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Concrete
   artifact: put a timed scheduled action (duration > 0) on today's Calendar whose end is in the past →
   the rendered tile and its list row must show the dark-red overdue treatment; a 0-duration scheduled
   item must NOT be red at its time. Inspect the rendered screen, not just the model value.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches for
   any helper you replace/rename.
4. **Honor the parent's User flows for every role** (universal styling; strict boundary; daily vs timed
   split). Don't silently style only the timed case and skip the daily next-day case (or vice versa).
5. **No false "complete".** If a box is partial or blocked, mark `[ ]` and write exactly what's left.
   Overstating completion is the worst failure — it ships broken work as done.
6. **Sync the shared spec you change — in orchestration, directly; never defer it.** Frontend features →
   `wna_orchestration/specs/features/wna-features.md`. Editing the spec's orchestration home is the
   documented sibling sync requirement — REQUIRED, never forbidden, never deferred. Cite the `file:line` you updated.