# FEAT-178 (web slice): Glama badge line on Connect Your Own AI

Parent: `wna_orchestration/features/FEAT-178-glama-listing-badge.md` — Design (Boundaries, Contracts C1–C3, Flows), § Screens and § Work breakdown live there; this slice is the local checklist only.

## User flows (this project's part)
- Unauthenticated visitor and every signed-in role (Free, Pro, Team owner, Team member): sees the last line of `/help/connect-ai` per parent § Screens; a click opens the Glama listing in a new tab. Same for all; line hidden when the image fails.
- Admin: n/a — main-app public page only.

## Checkbox legend (every box resolves to one of these — never leave a box you acted on as bare `[ ]`)
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
Consumes C1 from deploy only at runtime — all local checks stub it (parent Mocks / stubs: Playwright / DevTools `route` on `**/badges/glama-score.svg`: `200 image/svg+xml` 110 × 20 fixture = loaded, `404` = failed), so no wait on deploy. Screens: one screen, one box below. Order 1 → 3.
- [x] 1. `content/help/connectAi.js`: add `glama` per parent C3 (`listingUrl`, `badgeSrc`). Verify: `grep -rn "badges/score.svg" src config` → 0 hits.
  Done: `src/main-app/content/help/connectAi.js:6-9`; grep `badges/score.svg` in src+config → 0.
  Data: the image body (success vs error only), source `GET /badges/glama-score.svg` (C1), provided by deploy slice items 1 + 3 (new).
- [x] 2. Screen **Connect Your Own AI** (`/help/connect-ai`, `HelpConnectAiPage.vue`): replace the `1e68a18` line with the parent § Screens line — one `<a>` (test id `help-connect-ai-glama`, `href` = `glama.listingUrl`, `target="_blank" rel="noopener"`, no `nofollow`) wrapping the label "Listed in the Glama MCP directory" and the `<img>` (test id `help-connect-ai-glama-badge`, `:src="glama.badgeSrc"`, `width="110" height="20"`, `loading="lazy"`, alt per § Screens, `@error` → a `ref` flag that removes the whole `<a>` with `v-if`); every state, copy, colours, layout, 500px wrap per § Screens.
  Data: same as item 1 (image from `/badges/glama-score.svg`, deploy items 1 + 3). Verify on `:5173` with the stub: loaded → label + badge, one click target; `404` stub → no line, no broken image; no request to `glama.ai` in the Network panel while loading and scrolling.
  Done: `src/main-app/views/public/HelpConnectAiPage.vue:61-79` (link + img), `:113` (flag), `:269-284` (`.listed` + hover/focus `--color-text-secondary`). Verified on `:5173` with headless Puppeteer + route stub (Chrome extension not connected): 200 stub at 1280 / 500 → one `<a>` "Listed in the Glama MCP directory" + 110×20 badge in one row; 360 → badge wraps under label, centred; 404 stub → no line, no `<img>`; 0 requests to glama.ai in all runs.
- [x] 3. `config/prerender.js`: in the request handler, fulfil `/badges/glama-score.svg` (same origin) with a 110 × 20 placeholder SVG (`image/svg+xml`) instead of letting it 404. Verify: `npm run build:main`, then `dist/main-app/_prerender/help/connect-ai/index.html` contains `href="https://glama.ai/mcp/connectors/com.whatsnextaction/wna"` and `src="/badges/glama-score.svg"`, and does not contain `badges/score.svg`.
  Done: `config/prerender.js:26-28,47`; `npm run build:main` green; snapshot has the `href`, `src="/badges/glama-score.svg"`, 0 × `badges/score.svg`.
- [x] 4. Update `wna_orchestration/specs/features/wna-features.md` §24.3 — the Glama line ("served by glama.ai" → served from our `/badges/glama-score.svg`, label / states per § Screens). Cite the `file:line`.
  Done: `wna_orchestration/specs/features/wna-features.md:2686-2690`.

Legal: n/a (parent). Help: n/a (parent). Landing / Pricing: n/a (parent).
Tests: no existing test asserts the Glama line (`grep -rni glama tests` → 0 hits); the new test is the ui-tests slice's. Web adds no spec file test.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the concrete artifact (the rendered page, the HTTP response, the script output) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` (NOT `[x]`) with exactly what's left; intentionally not done / not applicable → `[NA]` with the reason. Never leave an acted-on box bare `[ ]`, never tick `[x]` for partial work. Overstating completion is the worst failure. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file (parent, specs, contracts, decisions). If your work changes a fact whose home is an orchestration spec (Fact Index), you MUST update it there and cite the `file:line`; the slice never restates the spec. Specs describe what the code/config IS, never per-env rollout state ("applied to dev", "not yet on prod"); applied migration state lives in `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, deployed config in `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite.** The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.
