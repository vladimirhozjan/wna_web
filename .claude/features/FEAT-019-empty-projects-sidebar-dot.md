# FEAT-019 — Projects sidebar red dot (active projects with no Next Action) · wna_web slice (the dot)

**Parent (orchestration):** `wna_orchestration/features/FEAT-019-empty-projects-sidebar-dot.md`
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's design, the
predicate definition, or any shared fact; it **links** them. Canonical homes: feature UX →
`wna_orchestration/specs/features/wna-features.md`; `/v1/stats/count` response shape →
`wna_orchestration/specs/api/api.md` (read-only here — the **backend** slice owns that change).

> **Web worktree:** this slice lives ONLY in the `develop-a` worktree (`../wna_web/develop-a/.claude/features/`).
> Do not copy it into `main` or `develop-b`. (Code itself is implemented on `main`, never a branch.)

> **Parent-completeness note:** the parent's `## User flows` is filled for every role (Free / Pro / Team
> owner / Team member / Admin / Unauthenticated). The flows below restate only what **this repo** (the
> front-end) must implement to satisfy them, per role.

---

## User flows (this project's part)

- **Free** — render the danger dot on the Projects sidebar item when `stats.projects.empty > 0`; no tier
  branch (the value arrives from the API). **Dot only — never a number** (parent Decision #1).
- **Pro** — same.
- **Team owner** — same; render whatever the server returns (the server scopes the count to owned projects).
- **Team member (non-owner)** — same rendering; the server already scopes `projects.empty` to the member's
  own projects, so the dot reflects only their own stalled projects — **no client-side scoping logic**.
- **Admin** — n/a — the admin-app is not touched; this is a main-app sidebar change only.
- **Unauthenticated / not-entitled** — n/a — the sidebar renders only for authenticated users.

---

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
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — …"; "n/a — no admin surface").
  Does NOT block closure.

> **ui-tests scope (resolves the legend's "ui-tests TC box" clause):** this web slice contains **no
> ui-tests TC boxes**. TC-566 lives in the `wna-ui-tests` repo (parent `### ui-tests`). Do **not** add or
> tick a ui-tests box here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the
   concrete artifact to inspect — the **rendered sidebar**: the Projects icon shows the red dot iff
   `stats.projects.empty > 0`, in **both light and dark themes**, with no number — and confirm it in the
   running app (`npm run dev:main`).
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** — the dot is tier-agnostic and renders the server's
   already-scoped value; do not add tier/role branches or client-side scoping.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never leave
   a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating completion
   is the worst failure — it ships broken work as done.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT-019, `specs/features/wna-features.md`, `specs/api/api.md`).
   This adds a **user-facing feature** (the Projects sidebar dot), whose home is
   `wna_orchestration/specs/features/wna-features.md` — you MUST update that spec as part of this work and
   cite the orchestration `file:line`. The `/v1/stats/count` shape change is the **backend** slice's spec
   sync — do not edit `specs/api/api.md` here. This slice never *restates* a shared fact; it points to the
   home. **Reuse-first rule (this repo's CLAUDE.md): use the existing icon-dot pattern and `statsModel`;
   do NOT create a new component / CSS variable / util / token without asking first.**

---

## Work breakdown (this repo)

- [x] **ProjectsIcon dot** — `src/main-app/assets/ProjectsIcon.vue:4` adds
  `<circle v-if="stalled" cx="21" cy="3" r="3" fill="var(--color-danger)" stroke="none"/>` (same geometry /
  fill / stroke as `src/main-app/assets/CalendarIcon.vue:7`; only the `v-if` prop differs — `stalled` vs
  `overdue`, as the slice prescribes) and `:9-11` adds `defineProps({ stalled: { type: Boolean, default:
  false } })`. Reuse-first respected: no new component / token / CSS.
- [x] **Bind in Sidebar** — `src/main-app/components/Sidebar.vue:67`:
  `<ProjectsIcon :stalled="stats?.projects?.empty > 0"/>`. Existing `:count="stats?.projects?.count"`
  (`:63`) left untouched. `statsModel.js` / `apiClient.js` unchanged (`git diff` on both = empty;
  pass-through — `stats.projects.empty` arrives automatically once the backend ships).
- [x] **Unification across the three surfaces — DRIFT FOUND, raised, and (per user decision) unified in
  code.** The Engage nudge was already parity-correct (`src/main-app/scripts/models/engageModel.js:34`
  `allProjects.filter(p => !p.next_action_id)`). The **Project Detail warning had drifted**: it fired on
  `orderedActions.length === 0` (all loaded actions of any state), not on `next_action_id IS NULL`, so it
  disagreed with the sidebar dot + nudge when an active project keeps only scheduled/waiting actions after
  its NEXT action is completed. **User chose "unify the detail page in code"** — implemented:
  `src/main-app/views/dashboard/ProjectDetailPage.vue:779` adds
  `const hasNextAction = computed(() => orderedActions.value.some(a => a.state === 'NEXT'))` (the NEXT-state
  action is exactly what `next_action_id` points to for an active project), and the warning at `:228` now
  fires on `!hasNextAction && !isSomeday && !addInputVisible`. `orderedActions` is kept fresh by every
  action handler (`onAddAction` `:1756`, `onCompleteAction` `:1672`, `onTrashAction` `:1704/1706`,
  `onBacklogReorder` `:1724`), so the warning re-computes live. Strict superset of the old visibility (no
  regression). All three surfaces now use the same predicate. **Note for PM:** the parent FEAT-019's web
  breakdown (`:173` "confirm-only, no code") and Decision #2's "no refactor" note are now stale — the detail
  page needed (and got) a one-computed edit. Flagged in the summary; parent doc is the PM's to reconcile.
- [NA] **Testability hook (coordinate with ui-tests).** No sidebar icon carries a `data-testid`
  (`grep data-testid src/main-app/assets/*Icon.vue` = none), so the suite's existing overdue-dot strategy
  (TC-424 / Calendar) already targets the `<circle fill="var(--color-danger)">` structurally. The new
  Projects dot's circle is geometry/fill/stroke-identical to `CalendarIcon.vue:7`, so that strategy covers
  it unchanged; adding a `data-testid` only here would diverge from the sibling dots (anti-reuse). No hook
  added.
- [x] **Spec sync — `wna_orchestration/specs/features/wna-features.md:241`** (new Sidebar §3.2 bullet):
  documents the Projects "no next action" red dot, adds the previously-missing primary description of the
  sidebar danger-dot mechanism (which icons light it + why), cross-links the GTD stalled-project concept
  (`specs/domain/wna-specification.md:44,189`). `specs/api/api.md` NOT edited here (backend owns it;
  `git status` on it = empty).

- [x] Local web slice doc lives in **develop-a only** and points to FEAT-019 by ID →
  `.claude/features/FEAT-019-empty-projects-sidebar-dot.md` (this file).

---

## Acceptance / gates (this repo's portion)
- [x] The Projects sidebar item shows the danger dot **iff** `stats.projects.empty > 0`
  (`ProjectsIcon.vue:4` `v-if="stalled"`, bound `Sidebar.vue:67`), using the same SVG circle +
  `--color-danger` token as the Calendar overdue dot (`CalendarIcon.vue:7`; token defined for both themes —
  `styles/tokens/colors.css:34` `#dc2626`, `styles/themes/dark.css:34` `#ef4444`); **no number** is shown
  (the icon renders only the `<circle>`, no `<text>`); the active-project count badge (`:count`,
  `Sidebar.vue:63`) is unaffected. Build green (`npm run build:main`).
- [x] The dot lights/clears in step with the Engage "N projects need a next action" nudge — both use
  `next_action_id IS NULL` (`engageModel.js:34`). The *Project Detail* warning was unified to the same
  predicate in code (`ProjectDetailPage.vue:779,228`, `hasNextAction`), so all three surfaces now agree.
- [x] No new component / CSS variable / util / token added (reuse-first); `statsModel.js` / `apiClient.js`
  unchanged (`git diff` on both = empty).
- [x] `specs/features/wna-features.md:241` updated; `specs/api/api.md` NOT edited here (backend owns that;
  `git status` on it = empty).
- [~] **Live confirmation** — **blocked on backend FEAT-019 deploy.** The `stats.projects.empty` field is
  not yet served by the dev target (it ships in the backend slice), so the rendered dot cannot be exercised
  end-to-end here. Code path is correct and build-verified; will light once the backend field is live.
