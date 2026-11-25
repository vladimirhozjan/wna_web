# FEAT-164 (web slice): web library upgrades

Parent: `wna_orchestration/features/FEAT-164-web-library-upgrades.md` — design, versions and failure handling live there; this slice is only the web checklist.

## User flows (this project's part)
- Free / Pro / Team owner / Team member / Admin / unauthenticated: n/a — dependency upgrade, no behaviour change; every role sees the same app and invoice PDFs look the same (parent: User flows).
- Not-entitled/blocked: n/a — no entitlement involved.

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
  so the hygiene edit is intentionally skipped"; "n/a — no admin surface"). Does NOT count against closure.
## Checklist
Order: 1 → 2 → 3. Consumes nothing from other siblings. No new tests (no TC reserved: ui-tests is n/a); no existing test changes behaviour.
- [x] 1. (DONE — package.json:17,24,35 ranges raised; `npm ls`: axios 1.21.1, follow-redirects 1.16.3, vue + @vue/server-renderer 3.5.46, vite 7.3.8, dompurify 3.5.0, jspdf 4.2.1, html2canvas 1.4.1; `npm audit`: found 0 vulnerabilities; no overrides, no .npmrc) Dependencies: in `package.json` raise `axios` `^1.13.2` → `^1.21.1`, `vue` `^3.5.24` → `^3.5.46`, `vite` `^7.2.4` → `^7.3.8`; leave `jspdf` `^4.2.1` and every other range as is; run `npm install` then `npm audit fix` (never `--force`) to refresh `package-lock.json`. Verify: `npm ls axios follow-redirects vue @vue/server-renderer vite dompurify jspdf html2canvas` shows `axios` >= 1.20.0, `follow-redirects` >= 1.16.2, `vue` + `@vue/server-renderer` >= 3.5.42, `vite` >= 7.3.7, `dompurify` >= 3.4.17, `jspdf` 4.2.1 and `html2canvas` 1.4.1 unchanged; `npm audit` reports 0 critical and 0 high (paste its summary line into the report). No `overrides` block, no `.npmrc` audit-level change. A high / critical that `npm audit fix` cannot fix without `--force` → stop and report it (parent Design §Flows 1).
- [x] 2. (DONE — `rm -rf node_modules && npm ci` ok, `npm run build:main` exit 0 incl. prerender, `npm run build:admin` exit 0) Builds from a clean install: `rm -rf node_modules && npm ci`, then `npm run build:main` (incl. the prerender step) and `npm run build:admin` both exit 0. Verify: both commands' exit codes in the report.
- [~] 3. (BLOCKED — `wnapm restart frontend` was denied by the permission classifier; fe.main.main on :5173 has run 9h on the OLD Vite, so a Chrome check now would not test the new Vite. Needs the owner to run `wnapm restart frontend` (or allow it), then a/b/c can be done.) Chrome check on the local stack (`http://localhost:5173`, main-app only; restart the frontend group with `wnapm restart frontend` so the dev servers run the new Vite — never start one yourself), desktop width:
  a) sign in with a local account, open Inbox and Next, capture an action and mark it done — the lists load and the change shows (Vue + `axios` happy path);
  b) sign out, sign in with a wrong password — the existing invalid-credentials error shows and the dialog stays open (`axios` error path through `apiClient.js`);
  c) Settings → Billing → Billing history: when the account has an invoice row, Download saves `invoice-<number>.pdf` as before; when it has none, say so in the report (PDF code path unchanged: same `jspdf` / `html2canvas` versions).
  Admin-app: build only (item 2), never opened in Chrome. Docs: none to update; test cases new / stale for ui-tests: none.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` (or command output) that proves it. A green test run is NOT proof — open the file.
2. **Definition of done = observable behavior**, not "code compiles". Inspect the concrete artifacts: `npm ls` / `npm audit` output, build exit codes, the Chrome screens.
3. **Leave zero references to anything you renamed/removed** — grep and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` with what's left; intentionally not done / not applicable → `[NA]` with the reason. Never leave an acted-on box bare `[ ]`, never tick `[x]` for partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** No spec home changes (`specs/ci/frontend-ci.md` stays "Vite 7"); nothing to update. Only `package.json` + `package-lock.json` change — no source file.
7. **Run only the NEW and directly-relevant checks — never the full suite.** The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Every run targets the local stack (local dev server on :5173). Never deploy, never open dev/prod. Do not commit-gate on any dev run.
