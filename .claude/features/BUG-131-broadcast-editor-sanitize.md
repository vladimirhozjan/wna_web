# BUG-131 (web slice): admin BroadcastEditor sanitizes on render

Parent: `../wna_orchestration/features/BUG-131-broadcast-editor-sanitize.md` (BUG-131) — design (C1–C4), flows and contracts live there; this file is only the web checklist. Independent of backend (item 2's spec link needs backend item 7's section).

## User flows (this project's part)
- Admin (and support, read-only): opening a broadcast renders only sanitized markup; editing, paste, raw tab, toolbar and Save work as today and Save leaves the page not dirty (parent flows 1, 5).
- Other roles, Free, Pro, Team: n/a — admin-only component.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
- `[ ]` — **Not started.** Untouched; no work done yet. This is the generator default; once you act on
  a box, resolve it to one of the three below — do not leave it bare.
- `[x]` — **Done & verified.** Work complete AND proven. Cite the `file:line` that proves it (for a
  ui-tests TC box: cite the test `file:line` AND the passing run). A green CI/test run alone is NOT
  proof — open the artifact.
- `[~]` — **Partial / blocked / deferred.** Started or attempted but NOT closed. Write exactly what
  remains and what it is blocked on / who owns it (e.g. "DEFERRED TO USER: needs a local
  user_service rebuild + restart I cannot run"). Does NOT count as done — it **blocks closure**.
- `[NA]` — **Not applicable / intentionally not done.** A precondition/gate was not met, or the item
  does not apply to this project/role. State the reason (e.g. "GATE NOT MET — no live error reproduced,
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT block closure.

## Checklist
- [ ] 1. `src/admin-app/components/BroadcastEditor.vue` per parent C4: `renderSurface()` sets `surfaceRef.value.innerHTML = toPreview(sanitizeInner(splitDocument(props.modelValue).inner))` (sanitize, then `toPreview`); `DROP_TAGS` gains `template noscript math base frame frameset applet noembed noframes`; the `style` removal regex becomes `/url\s*\(|expression\s*\(|@import|javascript:|\\/i`. Nothing else in the component changes. Data: `body_html` from `GET /admin/broadcasts/{id}` (existing field; value sanitized by backend item 2). Verify: `npm run build:admin`; local admin app — a new broadcast shows the shell with the logo, toolbar / paste / raw tab work as before (TC-669 steps), Save keeps the page not dirty.
- [ ] 2. Update `specs/features/wna-features.md` §Admin Broadcasts, BroadcastEditor paragraph: the stored body is sanitized before display too, and the server re-sanitizes on store and send (link `specs/architecture/backend.md` §Broadcast HTML sanitizing, added by backend item 7).
- Existing tests directly affected: none.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State the concrete artifact to inspect (the rendered screen, the API response, the mail body) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role** (admin; every recipient of a broadcast); don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly what's left; if intentionally not done or not applicable, mark `[NA]` with the reason. Never leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file; pull the authoritative form from its home. If your work changes a fact whose home is an orchestration spec, update that file as part of this work and cite the `file:line`. Specs describe what the code/config IS, never per-env rollout state (no "applied to dev" / "not yet on prod" notes).
7. **Run only the NEW and directly-relevant tests — never the repo's full suite** (owner directive 2026-08-19). The full regression suite is the OWNER's run before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against dev/prod, never add a "verify on dev" step.
