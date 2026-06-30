# BUG-010 — Recurring template can persist a mixed exhaustion state · wna_web slice (optional trigger mitigation)

**Parent (orchestration):** `wna_orchestration/features/BUG-010-recurring-mixed-exhaustion-state.md`
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's design, the
exhaustion contract, or any shared fact; it **links** them. **This repo is NOT the fix** — the fix is
backend (parent `### backend`). This slice is **optional defense-in-depth**: remove the duplicate
`PUT /v1/recurring/{id}` burst that is the realistic source of the concurrent-write race (H1). The
backend must be correct **regardless** of whether this is done.

> **Parent-completeness note:** the parent's `## User flows` is filled for every role (authenticated user
> of any tier; admin / unauthenticated / not-entitled marked n/a with reason). The flows below restate
> only what **this repo** (the front-end) must implement to satisfy them, per role.

---

## User flows (this project's part)

- **Free** — n/a — recurring actions are Pro/Team-only; a Free user never reaches the recurrence-rule
  editor (the recurring UI / `POST/PUT /v1/recurring` is gated). No Free front-end change.
- **Pro** — when editing a recurring action's rule (the recurrence editor), selecting the **"Until date"**
  end-option before a date is entered currently emits a redundant `{"recurrence_rule":"FREQ=DAILY"}`
  `PUT /v1/recurring/{id}` (captured trace step 4) — this is the burst that can interleave with the real
  exhausting edit and trigger the backend lost-update race. The front end must **debounce/dedupe** so it
  does not fire a PUT for an intermediate end-option selection that carries no actual rule change (no
  duplicate / no-op PUT). The real save (once a date is entered, or on commit) is unchanged.
- **Team owner / Team member** — same UI, no owner/member branch; the dedupe applies identically.
- **Admin** — n/a — no admin surface for recurrence editing in this repo's main-app.
- **Unauthenticated / not-entitled** — n/a — recurrence editing is an authenticated Pro/Team page; no
  public surface, and Free is gated out.

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
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — the duplicate PUT does not
  reproduce on the current build, so the dedupe is intentionally skipped"; "n/a — no admin surface").
  Does NOT block closure.

> **ui-tests scope (resolves the legend's "ui-tests TC box" clause):** this web slice contains **no
> ui-tests TC boxes**. The TC-501/TC-564/TC-565 E2E cases live in the `wna-ui-tests` repo (parent
> `### ui-tests`). Do **not** add or tick a ui-tests box here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the
   concrete artifact to inspect (the **Network panel** while editing a recurrence rule: selecting the
   "Until date" end-option before entering a date issues **no** `PUT /v1/recurring/{id}`; only the real
   rule change does) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (the dedupe applies to Pro/Team identically; Free and
   admin are n/a). Don't change the real save path — only suppress the redundant/no-op PUT.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if the duplicate PUT does not reproduce on the current build (so there's nothing to
   debounce), mark `[NA]` with that reason. Never leave a box you acted on as a bare `[ ]`.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. This change is a **behavioral/implementation** dedupe with **no
   user-facing feature change** (the recurrence editor behaves the same to the user; only a redundant
   network call is removed) → **no `specs/features/wna-features.md` edit** and **no `specs/api/api.md`
   edit** (the endpoint/payload contract is unchanged). If your dedupe turns out to alter a documented
   user-facing behavior, update `wna_orchestration/specs/features/wna-features.md` and cite the
   orchestration `file:line` — otherwise tick the spec-sync box `[NA]` with "no contract/feature change".
   **Reuse-first rule (this repo's CLAUDE.md): use the existing recurrence-editor component and model;
   do not create a new component/CSS/util without asking first.**

---

## Work breakdown (this repo)

- [x] **Reproduce the duplicate PUT.** Confirmed in source: selecting "Until date" runs
  `onEndTypeChanged()` → the `until` branch sets `parts.value.count = null` but leaves `parts.value.until`
  null (`RecurrenceInput.vue:244-248`), then `onChanged()` emits `buildRRule(parts.value)`
  (`RecurrenceInput.vue:256-258`); with both `count` and `until` null, `buildRRule` reproduces the
  **same** serialized rule (`rruleUtils.js:80-84`). That bubbles to `RecurrenceInput` consumer
  `@update:model-value="onRecurrenceChanged"` (`RecurringDetailPage.vue:120`), which (pre-fix)
  unconditionally called `updateRecurring(id, { recurrence_rule: newRule })` → the redundant no-op
  `{"recurrence_rule":"FREQ=DAILY"}` `PUT /v1/recurring/{id}` (captured trace step 4).
- [x] **Debounce / dedupe the no-op PUT.** Added an equality guard at the top of `onRecurrenceChanged`
  that skips the save when the newly serialized rule equals the last persisted value
  (`RecurringDetailPage.vue:418-419`): `if (newRule === (template.value.recurrence_rule || '')) return`.
  Reuses the existing `RecurrenceInput` component + `recurringModel.updateRecurring` save path; no new
  component/util added. The real rule-change save (date entered → different serialized rule) still fires
  exactly once.
- [NA] **Spec sync.** Implementation-only dedupe — no contract/feature change. `PUT /v1/recurring/{id}`
  is a partial update whose `{ recurrence_rule }` payload shape is unchanged (`wna_orchestration`
  `specs/api/api.md:4961-4992`); the guard only suppresses an *identical* PUT, so the documented
  endpoint/payload and the recurrence-editor UX are both unchanged → no `specs/features/wna-features.md`
  / `specs/api/api.md` edit.

---

## Acceptance / gates (this repo's portion)
- [x] Editing a recurrence rule no longer emits a redundant/no-op `PUT /v1/recurring/{id}` for an
  intermediate end-option selection — the equality guard short-circuits before `updateRecurring`
  (`RecurringDetailPage.vue:418-419`), so the concurrent-write burst that feeds the backend race is
  removed. The real rule-change save still fires exactly once (control falls through to
  `RecurringDetailPage.vue:421-426` only when the serialized rule differs).
  *Live confirmation (manual, needs running dev server + browser):* `npm run dev:main`, open a recurring
  template, pick "Until date" before entering a date → Network panel shows **no** `PUT /v1/recurring/{id}`.
- [x] No user-facing behavior change to the recurrence editor (same UX; only the redundant network call
  is gone) — the guard is a pure short-circuit, the `RecurrenceInput` template/handlers are untouched; no
  new component/CSS/util added (reuse-first).
- [NA] Spec-sync box resolved: "no contract/feature change" — see Work-breakdown spec-sync box above
  (`specs/api/api.md:4961-4992` payload/contract unchanged).
- [x] **Defense-in-depth, not the fix:** closing this slice does **not** close BUG-010 — the backend fix
  (parent `### backend`, Fix A + Fix B) is the authoritative close gate. This front-end change only
  removes the realistic concurrent-write trigger (H1); the backend must be correct regardless.
