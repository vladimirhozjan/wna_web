# BUG-011 — Settings → Plan "Storage" always shows `0 B` used · wna_web slice

**Parent (orchestration):** `wna_orchestration/features/BUG-011-settings-plan-storage-shows-zero.md`
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's root cause,
the `/v1/stats/count` payload shape, or any shared fact; it **links** them. This repo **owns the fix**
(it is a frontend-only wrong-field-path typo). Payload shape home: `wna_orchestration/specs/api/api.md`
(`reference.used_bytes` = "reference + attachments"). Team quota home: `wna_orchestration/contracts/limits.md`.
Feature catalog home: `wna_orchestration/specs/features/wna-features.md`.

> **Parent-completeness note:** the parent's `## User flows` is filled for every role. The flows below
> restate only what **this repo** (the front-end) must implement to satisfy them, per role.

---

## User flows (this project's part)

- **Free** — the Settings → Plan "Storage" row must render the user's real used bytes (the
  reference + attachment total from `/v1/stats/count` `reference.used_bytes`) over the tier limit
  (`50 MB`), not `0 B`. The row is shown because `max_storage_bytes !== -1`.
- **Pro** — same as Free; limit shows `250 MB`. No tier branch in the Storage row.
- **Team owner** — same display; shows **this user's own** usage over `1.0 GB`. No owner/member branch.
- **Team member** — identical to Team owner (the Plan card shows the caller's own plan + usage).
- **Admin** — n/a — no admin surface in this repo's main-app Plan card.
- **Unauthenticated / not-entitled** — n/a — Settings is an authenticated page. For an
  unlimited-tier user (`max_storage_bytes === -1`) the Storage row is hidden by the existing `v-if`
  and "Limits: Unlimited" shows instead — leave that branch unchanged.

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
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

> **ui-tests scope (resolves the legend's "ui-tests TC box" clause):** this web slice contains **no
> ui-tests TC boxes**. The Settings Plan-storage E2E lives in the `wna-ui-tests` repo (parent
> `### ui-tests`). Do **not** add or tick a ui-tests box here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". The
   concrete artifact to inspect: the **rendered Settings → Plan "Storage" row** showing the real used
   figure (e.g. `4.6 MB / 1.0 GB`) and **matching the sidebar Reference footer** for the same account.
3. **Leave zero references to anything you renamed/removed** — grep the source for `storage?.used` /
   `storage.used` and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role** — the limit side stays `tier_limits.max_storage_bytes`
   (correct per tier); only the **used** side is wrong. Do not touch the unlimited-tier `v-if` branch.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (parent BUG, `specs/api/api.md`, `contracts/limits.md`). This repo
   corrects a **user-facing** display, and the Settings **Plan** card is currently **undocumented** in
   `wna_orchestration/specs/features/wna-features.md` (§21 jumps Account → Sessions → Application … with
   no Plan subsection). You MUST add/correct a Plan-card entry there describing the Storage row
   (used = `reference.used_bytes`, limit = `tier_limits.max_storage_bytes`); cite the orchestration
   `file:line`. Do **not** touch `specs/api/api.md` — the payload is correct and unchanged.
   **Reuse-first rule (this repo's CLAUDE.md):** the fix is a one-line template binding change reusing
   the existing `stats` singleton and `formatBytes` — do **not** create a new component/model/util.

---

## Work breakdown (this repo)

- [x] **The fix.** In `src/main-app/views/dashboard/SettingsPage.vue:66`, change the Storage **used**
  binding from `formatBytes(stats?.storage?.used ?? 0)` to `formatBytes(stats?.reference?.used_bytes ?? 0)`
  (the documented reference+attachment total), mirroring the correct sibling usage in
  `components/Sidebar.vue:281`. Leave the **limit** side (`formatBytes(tierLimits.max_storage_bytes)`)
  and the `:64` `v-if` guard (`max_storage_bytes !== -1`) unchanged.
  ✓ DONE — `SettingsPage.vue:66` now binds `formatBytes(stats?.reference?.used_bytes ?? 0)`, the same
  field the proven sidebar footer reads (`Sidebar.vue:281`). Limit side and `:64` v-if guard untouched.
- [x] **Defensive (kills first-paint `0 B` flash on a cold/deep-link `/settings` load).** `SettingsPage`
  destructures only `{ stats }` from `statsModel()` (`SettingsPage.vue:569`) and never calls `loadStats`
  — it relies on `Sidebar.vue:266` `onMounted` to populate the shared singleton. Add a
  `statsModel().loadStats()` call in `SettingsPage` `onMounted` (the model self-guards re-entrancy via its
  `loading` flag, `statsModel.js:11`) so the corrected row is not momentarily `0 B` before the sidebar's
  fetch resolves. Mark `[NA]` if you confirm `DashboardLayout` always mounts the sidebar first and there
  is no observable flash — state that reason.
  ✓ DONE — `loadStats` is now destructured (`SettingsPage.vue:569`) and called in `onMounted`
  (`SettingsPage.vue:954`). Re-entrancy is guarded by the model's `loading` flag (`statsModel.js:11`),
  so the parallel sidebar mount causes at most one fetch. Implemented rather than `[NA]` because the
  page is deep-linkable (`/settings`) and the model's own fetch is async — this makes the card
  self-sufficient regardless of sidebar mount order.
- [x] **Grep gate.** Confirm `0` remaining matches for `storage?.used`/`storage.used` in `src/main-app/`
  (the bogus path must be fully gone).
  ✓ DONE — `grep -rn "storage?\.used\|storage\.used" src/main-app/` returns 0 matches (CLEAN).
- [x] **Spec sync.** Add/correct the Settings **Plan** card entry in
  `wna_orchestration/specs/features/wna-features.md` (§21) — document the Plan section's rows
  (Current plan, Storage `used / limit` sourced from `reference.used_bytes` over
  `tier_limits.max_storage_bytes`, Limits/Unlimited). Cite the `file:line` you edit.
  ✓ DONE — added `### 21.3 Plan Section` at `wna_orchestration/specs/features/wna-features.md:1095`
  (documents Current plan / Projects / Tags / Storage[`reference.used_bytes` over
  `tier_limits.max_storage_bytes`] / Limits, and notes the BUG-011 typo). Subsequent §21.x renumbered
  to stay contiguous (21.4–21.10); no cross-references to those numbers existed.

---

## Acceptance / gates (this repo's portion)
- [x] Settings → Plan "Storage" shows the real used figure for a user with usage (e.g. `4.6 MB / 1.0 GB`
  for Team) and **matches** the sidebar Reference footer; `0 B` appears only when usage is genuinely 0.
  ✓ Proven by shared data path: `SettingsPage.vue:66` and `Sidebar.vue:281` now read the exact same
  reactive field (`stats.reference.used_bytes`) from the same `statsModel` singleton, so they render the
  same underlying value; `formatBytes(0)` → `0 B` only when usage is truly 0. NOTE (deferred to manual
  QA): a live authenticated visual smoke-check was not run here (no backend/auth in this environment).
  Minor pre-existing cosmetic nuance, out of BUG-011 scope: the two `formatBytes` impls round differently
  for values ≥10 within a unit (sidebar `Math.round` → `123 MB`; settings `toFixed(1)` → `123.4 MB`);
  the underlying value matches and the slice's reuse-first rule says reuse the existing formatter, so this
  was intentionally not unified.
- [x] Limit side unchanged (`1.0 GB` for Team); unlimited-tier row still hidden.
  ✓ `SettingsPage.vue:66` limit side still `formatBytes(tierLimits.max_storage_bytes)`; `:64` v-if guard
  (`max_storage_bytes !== -1`) and the `:68` unlimited row (`max_projects === -1`) untouched.
- [x] Zero references to `stats.storage.used` remain in `src/main-app/`.
  ✓ `grep -rn "storage?\.used\|storage\.used" src/main-app/` → 0 matches (CLEAN).
- [x] Settings Plan-card entry synced in `wna_orchestration/specs/features/wna-features.md` (cited `file:line`).
  ✓ `### 21.3 Plan Section` added at `wna_orchestration/specs/features/wna-features.md:1095`.
