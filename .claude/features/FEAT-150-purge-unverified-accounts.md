# FEAT-150 (web slice): purge unverified accounts after 30 days

Parent: `wna_orchestration/features/FEAT-150-purge-unverified-accounts.md` — D1, § Legal impact and § Help impact (the exact texts) live there; this slice is the web checklist only. Legal + Help text only; no code, no screen.

## User flows (this project's part)
- Free user (unverified): reads in ToS §3.2, Privacy §7 and the Help FAQ that an unverified account is deleted after 30 days and that signing up again with the same email works.
- Free (verified) / Pro / Team owner / Team member / Admin / unauthenticated: n/a — text only; no screen or behaviour change.

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
Consumes nothing from another sibling. Screens: n/a (parent § Screens). Data: n/a (parent § Data contract). Backend B6 and deploy DP3 wait for W1's date.
- [x] W1 — Legal impact: `src/main-app/content/legal/terms.md` §3.2 sentence and `src/main-app/content/legal/privacy.md` §7 Data Retention row, exactly as parent § Legal impact; both "Last updated" = the day of the edit (that date is what backend B6 / deploy DP3 copy). `npm run build:main` passes (the build parses the ToS date).
  Done: `src/main-app/content/legal/terms.md:3` (November 25, 2026), `:62` (§3.2 sentence); `src/main-app/content/legal/privacy.md:3` (November 25, 2026), `:345` (§7 row). Build green; bundle ToS version `2026-11-25` (`config/vite.core.js:141`); text present in `dist/main-app/_prerender/legal/{terms,privacy}/index.html`. **B6 / DP3 date = `2026-11-25`.**
- [x] W2 — Help impact: `src/main-app/content/help/faq.js` entry "I didn't get the verification email. What do I do?" — append the text exactly as parent § Help impact.
  Done: `src/main-app/content/help/faq.js:53`; present in `dist/main-app/_prerender/help/faq/index.html`.

Landing / Pricing: n/a (parent). No existing test asserts the legal or help text; no test box.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Inspect the concrete artifact (the rendered ToS / Privacy / Help text, the build output) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches before claiming done.
4. **Honor the parent's User flows for every role**; don't silently implement only the happy path.
5. **No false "complete".** Partial or blocked → `[~]` (NOT `[x]`) with exactly what's left; intentionally not done / not applicable → `[NA]` with the reason. Never leave an acted-on box bare `[ ]`, never tick `[x]` for partial work. Overstating completion is the worst failure. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY read any `wna_orchestration` file (parent, specs, contracts, decisions). If your work changes a fact whose home is an orchestration spec (Fact Index), you MUST update it there and cite the `file:line`; the slice never restates the spec. Specs describe what the code/config IS, never per-env rollout state ("applied to dev", "not yet on prod"); applied migration state lives in `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, deployed config in `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite.** The owner runs the full regression before deploy.
8. **Test and verify LOCALLY only — never on dev/prod.** Never deploy, never run against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" step. A missing dev/prod run is never a reason for `[~]`.
