# FEAT-015 (web slice): Completed page redesign — productivity timeline + charts

Parent / spec / design / decisions: `wna_orchestration/features/FEAT-015-completed-productivity.md`.
Do not restate the parent — this is the local checklist only. The bucket table + half-open count formulas
(parent **Design §2**), the three-chart spec + responsive 1–3 rule (parent **Design §3**), the
`{daily, monthly, total}` contract (parent **Design §4**), and the loading/error + mutation/header-lifecycle
protocols all live in the parent — mirror them, never copy. (All work on `main` — no branches.)

**Scope: full `CompletedPage.vue` redesign + grouping/chart derivations.** The endpoint is week-start-agnostic;
**all** weekly bucketing, chart datasets, and per-section counts are derived **client-side** from `daily`/`monthly`
honoring `settings.weekStartsOn`. tz is already available via `apiClient.js:109 liveTz()`.

**⚠ Approval gate before coding (web "reuse first" rule):** two artifacts are net-new and **must be
approved by the user before they are written** — (a) the **main-app bar-chart component** (chart.js is a
dep but has **zero main-app usages**; model it on `admin-app/views/AnalyticsPage.vue`), and (b) the
**segmented-switcher CSS** (model the markup/behavior on `CalendarHeader.vue`'s `.calendar-header__views`
`--active` idiom). Do not create new CSS variables. Flag these and get approval first.

> ## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
> - `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
>   a box, resolve it to one of the three below — do not leave it bare.
> - `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
>   ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
>   proof — open the artifact.
> - `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
>   remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a GKE redeploy I
>   cannot run"). Does NOT count as done — it **blocks closure**.
> - `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
>   does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
>   so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Checklist (web)

### Model — `scripts/models/completedModel.js`
- [ ] Fetch the new stats endpoint with `tz: liveTz()`; **store the raw `{daily, monthly, total}`** (no
      pre-bucketed map). Expose chart datasets + per-section counts as `computed()` derivations (the
      `statsModel`/`EngagePage` idiom).
- [ ] Keep consuming `/v1/completed`'s `total_count` for `hasMore` (`completedModel.js:44`) — **drop only
      its display, not the value** (parent **Design §1**). Add `tz: liveTz()` to the `listCompleted` call.
- [ ] Mutation protocol on **uncomplete/restore**: optimistically decrement the affected section count and
      remove the row in the same tick, then reconcile with a **single coalesced, debounced** refetch of
      *both* stats and the list (awaited together, applied atomically) — reuse the
      `statsModel.refreshStats` 300 ms-debounce idiom. **Trash is NOT surfaced** (restore-only; the dead
      `completedModel.trashItem` stays unsurfaced).

### Grouping util (build on existing `dateUtils` date-fns re-exports)
- [ ] Map `completed_at` (UTC) → bucket **key/label in local tz** using **`settings.weekStartsOn`** (read
      from `settingsModel` — the same source the calendar uses; **not** hardcoded Monday, and pass
      `weekStartsOn` explicitly since date-fns defaults to Sunday). Sequential single-pass, **append-only**
      (load-more safe: extends the last open group or starts a new one — never duplicates a header).
- [ ] Per-section counts per the parent's half-open formulas (**fine buckets summed from `daily`; only the
      coarse "Older → month" sections from `monthly`**) — this is what guarantees Σ(sections) == total with
      no week/month-boundary double-count. Do **not** derive counts from loaded rows.

### `views/dashboard/CompletedPage.vue`
- [ ] Charts row above a recency-grouped list with **sticky section headers** + per-section counts;
      preserve the existing **load-more**, click-through to detail, and uncomplete/restore.
- [ ] **Loading / error states** (two independent fetches): list renders **independently** of stats; while
      stats load, show a chart skeleton / header spinner; **stats fail → hide the charts row** and degrade
      per-section counts (omit or fall back to loaded-row counts) — **never block the list on the stats call**.
- [ ] **Header lifecycle:** a header disappears once it has **0 loaded rows AND its aggregate count is 0**
      (no orphan header, no stale "0").
- [ ] **No global total** anywhere on the page (parent **Design §1**) — counts appear only per section.
- [ ] **Empty / low-activity:** zero completions → existing `EmptyState`, no charts; a few completions →
      charts render (mostly-zero bars) with encouraging copy, never a cold "0".

### Charts (the new component, post-approval)
- [ ] Three bar charts — **This week** (7 bars, ordered per `weekStartsOn`, today highlighted), **This
      month** (one bar per week of the month, weeks per `weekStartsOn` — *not* ISO weeks), **This year** (12
      bars Jan–Dec). Datasets derived client-side from `daily` (week+month) and `monthly` (year). Current
      period's bar highlighted via a per-bar `backgroundColor` array; **best-day marker** on the week chart
      (max of the 7 daily values; tie → most recent; suppressed when all 7 are 0 — nice-to-have, not a gate).
- [ ] **Responsive: 1–3 charts visible by width** (3 → 2 → 1 as it narrows), side-by-side (no swipe/carousel).
      When only one fits, a **segmented tap switcher** (Week/Month/Year) modelled on `CalendarHeader.vue`
      selects which is shown; **keyboard-operable** (tab + enter), active segment visually marked.
- [ ] **a11y:** chart text alternative (aria-label / off-screen table); switcher keyboard-operable.

### CI / deploy warning check (parent requires an explicit warn)
- [ ] **⚠ Build/deploy: expected NONE.** `chart.js` + `vue-chartjs` are already deps — no Vite/Docker/
      nginx/K8s/runtime-config change expected. Resolve `[NA]` with that reason unless build config actually
      changes, in which case flag it and edit `wna_orchestration/specs/ci/frontend-ci.md`.

### Spec sync (required, not deferred — Hard rule #6). Web owns the frontend feature catalog:
- [ ] **Update `wna_orchestration/specs/features/wna-features.md`** — the Completed feature description must
      reflect the redesign (recency-grouped timeline with per-section counts, productivity charts, no global
      total, restore-only). Parent marks this "done at design time" (§13.1) — **verify it matches what you
      ship** and reconcile any drift; cite the `file:line`. (Test cases → ui-tests slice; api.md → backend
      slice. The web `.claude/*.md` stays pointer-only — do not restate the spec there.)

## User flows (this project's part)
Web renders the redesigned page — charts + recency-grouped list — and drives the optimistic restore +
reconcile. FEAT-015 is **not gated** (parent **User flows**):
- **Free / Pro / Team owner / Team member:** identical. Opens Completed → up to three charts (week/month/
  year) then a timeline-grouped list (Today, Yesterday, weekday, Last week, Earlier this month, Last month,
  older-by-month). Scroll → load-more appends into the correct groups (no duplicate header). Unchecking
  restores the item and updates charts + counts; the list is per-user (a shared/delegated item the user
  completed shows in that user's own Completed exactly as today — no membership change).
- **Admin (any role):** n/a — admin-app has no Completed page; this is an end-user main-app view.
- **Unauthenticated / not-entitled / blocked:** n/a — the route is behind the auth guard; nothing new exposed.
- **Empty / low-activity:** zero completions → `EmptyState`, no charts rendered; a few → charts render with
  mostly-zero bars + encouraging copy, never a cold "0".

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Concrete
   artifact: load `/completed` in the running app with data spanning today→months-ago → inspect the
   **rendered** page: sticky headers in fine-to-coarse order, per-section counts, three charts (current
   period highlighted), no global total; uncheck an item → its row vanishes and the section count + charts
   update; force a stats 500 → the list still renders and the charts row is hidden.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches for
   any helper/display you replace (e.g. any global-total render), and that the new bar-chart component +
   switcher CSS were approved before being added.
4. **Honor the parent's User flows for every role** (not-gated; per-user list unchanged; empty/low-activity
   never shows a cold "0"; list renders independently of stats). Don't silently implement only the populated
   happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if intentionally not done or N/A, mark `[NA]` with the reason. Never leave a box you acted
   on as bare `[ ]`. Overstating completion is the worst failure — it ships broken work as done.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** Frontend
   features → `wna_orchestration/specs/features/wna-features.md`; build/deploy config →
   `specs/ci/frontend-ci.md` (only if it changes). Editing the spec's orchestration home is the documented
   sibling sync requirement (this repo's CLAUDE.md) — REQUIRED, never forbidden, never "deferred to the
   user." The local-slice rule forbids only *restating* shared facts here, not updating their home. Cite
   the orchestration `file:line` you updated.
