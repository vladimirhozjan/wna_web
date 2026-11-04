# BUG-080 (web slice): AI assistant "Thinking…" spinner clipped on the left

Parent: `wna_orchestration/features/BUG-080-assistant-thinking-spinner-clipped.md` (BUG-080) — problem, Design § Boundaries and Work breakdown live there; not restated here.
Job: items W1 (1 box).

## User flows (this project's part)
- Free / Pro / Team owner / Team member: while the assistant works, the "Thinking…" / running-step row shows a whole round spinner beside the text (parent § User flows).
- Admin: n/a — admin-app has no AI assistant panel.
- Unauthenticated: n/a — the assistant is only in the dashboard.
- Not-entitled / blocked: n/a — no entitlement rule touches the step row.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the rendered assistant panel and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` with exactly what's left; intentionally not done / n/a → `[NA]` with the reason. Never leave a box you acted on as bare `[ ]`; never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file. If your work changes a fact whose home is an orchestration spec (Fact Index), update that file as part of this work and cite the `file:line`. Specs describe what the code IS, never per-env rollout state.
7. **Run only the NEW and directly-relevant tests — never the full suite** (owner directive 2026-08-19). The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never add a "verify on dev" step.

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
- [x] W1 — `src/main-app/components/AssistantPanel.vue:148` (`:size="12"` + `data-testid="assistant-step-spinner"`; slot `.assistant-step__mark` is 16×16 at :680-687, Spinner 12 + 2×2 border = 16); `npm run build:main` passes. Layout assertion (spinner 16 × 16, slot wholly inside `assistant-steps`) is covered by ui-tests TC-1366 — `wna-ui-tests/tests/e2e/ai-assistant.spec.ts:429`, passed 2/2 chromium + mobile-chrome, run row `specs/tests/wna-test-cases.md:27873` = P. Original item text: `src/main-app/components/AssistantPanel.vue` live step row: `<Spinner v-if="step.status === 'running'"
  :size="12" data-testid="assistant-step-spinner" />` (was `:size="16"`, no test id); no other file. Verify:
  `npm run build:main` passes; on `:5173` (desktop and a ≤ 768 px viewport) ask the assistant `[slow 6] tidy my inbox`
  — the "Thinking…" row shows a whole round spinner, its left edge not cut; the step text does not shift when a step
  turns done. Consumes nothing.
  Data: none — no new server data.
