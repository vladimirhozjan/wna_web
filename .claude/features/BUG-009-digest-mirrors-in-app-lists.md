# BUG-009 — Daily digest must mirror the in-app lists · wna_web slice (Settings timezone)

**Parent (orchestration):** `wna_orchestration/features/BUG-009-digest-mirrors-in-app-lists.md`
**This slice is LOCAL** — wna_web's checklist only (front-end Settings timezone override). It does **not**
restate the parent's design, the digest behavior, or any shared fact; it **links** them. The digest
itself and the per-user tz store are backend; this repo only adds the **Settings override** the user
sets and the optional digest hint. Override semantics (settings > auto-capture > UTC) home:
parent Design §2. Feature catalog home: `wna_orchestration/specs/features/wna-features.md`.

> **Parent-completeness note:** the parent's `## User flows` is filled for every role. The flows below
> restate only what **this repo** (the front-end) must implement to satisfy them, per role.

---

## User flows (this project's part)

- **Free** — Settings exposes a timezone selector; choosing one optimistically updates state and saves
  `application.timezone` to `/v1/user/settings` (which the backend treats as the **override** that wins
  over auto-capture). If no override is stored yet, the *displayed* default is seeded from the live
  browser tz for UX only — **not** auto-saved (server-side auto-capture owns the real default).
- **Pro** — same as Free (no tier gating on the selector).
- **Team owner / Team member** — same UI; the selector saves **this user's own** tz. Viewer-centric
  digest attribution is entirely backend; the front end is identical for owner and member (no
  owner/member branch in the Settings UI). n/a beyond "saves my own tz".
- **Admin** — n/a — no admin surface in this repo's main-app Settings for the digest tz.
- **Unauthenticated / not-entitled** — n/a — Settings is an authenticated page; no public surface.

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
> ui-tests TC boxes**. The Settings-timezone E2E lives in the `wna-ui-tests` repo (parent `### ui-tests`).
> Do **not** add or tick a ui-tests box here.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered Settings timezone row, the `PUT /v1/user/settings`
   request payload carrying `application.timezone`, optimistic update + rollback on error) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (displayed-default seeded from `liveTz()` but never
   auto-saved as an override); don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. This repo adds a user-facing Settings control, so you MUST update
   the **Settings timezone selector** entry in `wna_orchestration/specs/features/wna-features.md` (the
   Daily Digest behavior entry is owned by the backend slice — touch a different section). Cite the
   orchestration `file:line`. **Reuse-first rule (this repo's CLAUDE.md): use the existing `Select.vue`
   and the `weekStart` pattern — do not create a new component/CSS without asking.**

---

## Work breakdown (this repo)

- [ ] Add `application.timezone` (IANA, default `'UTC'`) to `settingsModel.js` DEFAULTS, reactive state +
  saving flag, parse in `applySettings()`, and a setter following `setWeekStart()` (optimistic set →
  `await save('application', { timezone })` → rollback on error); export it on the instance.
- [ ] On first load, if no stored override exists, seed the **displayed** default from `liveTz()` for UX
  only — do **not** auto-save it as an override (server-side auto-capture owns the default).
- [ ] Add a `Select`-backed timezone row in `SettingsPage.vue` (computed get/set bridge like `weekStart`
  + an options array), in the Application or Calendar section; **reuse `Select.vue`**. Optional hint near
  the Daily-digest toggle that the digest uses this timezone.
- [ ] Update `wna_orchestration/specs/features/wna-features.md` — **Settings timezone selector** entry
  (per-user IANA override that feeds the daily digest). Cite the `file:line` you edit.

---

## Acceptance / gates (this repo's portion)
- [ ] Selecting a timezone in Settings issues `PUT /v1/user/settings` with `application.timezone` and
  updates optimistically, rolling back on error.
- [ ] With no stored override, the displayed value defaults to the live browser tz **without** writing
  an override.
- [ ] Settings feature entry synced in `wna_orchestration/specs/features/wna-features.md` (cited `file:line`).
