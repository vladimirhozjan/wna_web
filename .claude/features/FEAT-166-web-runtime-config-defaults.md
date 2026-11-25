# FEAT-166 (web slice): MCP address without a localhost fallback

Parent: `../wna_orchestration/features/FEAT-166-web-runtime-config-defaults.md` — Design (Boundaries, Contracts, Flows) and § Work breakdown live there; this slice is the local checklist only.

## User flows (this project's part)
n/a — build configuration; every role (Free, Pro, Team owner/member, Admin, unauthenticated) sees the same app while `MCP_URL` is configured. Parent flows 2–5: `getDomains()` without fallback; Settings → AI Apps hides only the connect row when `MCP_URL` is unset (list and Remove stay); Help → Connect Your Own AI unchanged. Screens: n/a — no UI change (parent § Screens).

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

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the concrete artifact (the rendered page, the generated `config.js`, the script output) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` (NOT `[x]`) with exactly what's left; intentionally not done / not applicable → `[NA]` with the reason. Never leave an acted-on box bare `[ ]`, never tick `[x]` for partial work. Overstating completion is the worst failure. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file (parent, specs, contracts, decisions). If your work changes a fact whose home is an orchestration spec (Fact Index), you MUST update it there and cite the `file:line`; the slice never restates the spec. Specs describe what the code/config IS, never per-env rollout state ("applied to dev", "not yet on prod"); applied migration state lives in `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, deployed config in `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite.** The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.

## Checklist (parent § Work breakdown → web)
Deploy (W-D1) is independent; no backend box.
- [x] W-W1 `src/main-app/scripts/core/domains.js:16` → `mcp_url: rc.MCP_URL || ''`; the line 17 comment no longer names a localhost fallback; `mcp_url_configured` stays `Boolean(rc.MCP_URL)`. Data: none (`RUNTIME_CONFIG` from `config.js`). Verify: `grep -rn "localhost:8000/mcp" src` hits only the git-ignored `public/config.js`.
  — Done: `src/main-app/scripts/core/domains.js:16` `mcp_url: rc.MCP_URL || ''`, comment :17 no localhost, :18 unchanged. `grep -rn "localhost:8000/mcp" src` → only `src/main-app/public/config.js:1` (git-ignored, `.gitignore:4`); `npm run build:main` green, `dist/` hits only `config.js`.
- [~] W-W2 `src/main-app/views/dashboard/SettingsPage.vue` §AI Apps: read `mcp_url_configured` from `getDomains()` next to `mcp_url` (line ~2004) and wrap the "Connect an AI app" row (label, address, Copy, hint, "Step-by-step guide") in `v-if` on it; connected-apps list (`GET /v1/user/ai-apps`), its loading / error / empty states and Remove unchanged; sidebar entry, search keywords and `/settings/aiApps` link unchanged. Data: `mcp_url_configured` from `getDomains()` (W-W1); list from `GET /v1/user/ai-apps` as today. Consumes W-W1. Verify locally: with `MCP_URL` removed from the local `public/config.js` the row is gone and the list still loads; restore the file after.
  — Code done: `src/main-app/views/dashboard/SettingsPage.vue:2004` reads `mcp_url_configured`; `:636` `v-if="mcpConfigured"` on the connect row only; list/loading/error/empty/Remove (`:646-672`) untouched; build green. REMAINING: Chrome check on :5173 (desktop + 500px, row hidden without `MCP_URL`, list loads) — Claude-in-Chrome extension was not connected; ui-tests slice covers it. Local `public/config.js` restored.
- [x] W-W3 Update `wna_orchestration/specs/features/wna-features.md` §21.14 — connect row "shown only when `MCP_URL` is configured"; and `wna_orchestration/specs/ci/frontend-ci.md` §3 `MCP_URL` paragraph — no `domains.js` fallback, empty = connect address off (Settings row + Help card hidden). Cite the `file:line`. Consumes W-W1, W-W2.
  — Done: `wna_orchestration/specs/features/wna-features.md:2401`; `wna_orchestration/specs/ci/frontend-ci.md:88-91`.

Existing tests directly affected: none — every existing AI-apps / Help test runs with `MCP_URL` configured, where behaviour stays; TC-1271 (Help without `MCP_URL`) is unchanged. New test is in the ui-tests slice.
