# FEAT-051 — web slice: Reference Local | Google Drive switch (main-app)

**Status:** closed 2026-10-21 — W-1…W-32 resolved (`[x]` / W-26 `[NA]`), build green; runtime coverage handed to
ui-tests (owner 2026-10-21).

**Parent (canonical):** `../wna_orchestration/features/FEAT-051-reference-local-drive-switch.md` — §User flows,
**§Screens (S1–S5, P1, P2, H1, H2 — every state + exact copy; the build spec for every web box)**, §Design (D1–D20,
Derived, S1–S3, G1–G9), §Help impact. Read it first, plus `specs/features/wna-features.md` §12.2 / §12.3 / §21.13 and the
API shape the backend slice documents in `specs/api/api.md` §Reference / §Attachments. This file is only this repo's
checklist; nothing from the parent is restated.

**Scope:** `src/main-app/views/dashboard/ReferencePage.vue`, `src/main-app/components/reference/*`,
`src/main-app/scripts/models/referenceModel.js` (+ trash / attachment-list models), `apiClient.js`. **Before creating
any new `.vue` component, model or CSS variable, ask the owner** (repo Mandatory Rules) — e.g. whether the switch reuses
an existing tab/toggle control.

## User flows (this project's part)
- **Free** — parent "Free user": switch after connect; Google side fully writable; Local side writes open the
  existing upgrade modal; **Move to Google Drive** offered on Local items, **Move to Local** not offered.
- **Pro** — parent "Pro user": both sides writable; Local toolbar shows the quota, Google toolbar does not;
  both move directions; storage-limit 413 on Google → Local shows the existing upgrade modal.
- **Team owner / Team member** — parent flows: as Pro/Free by own tier; shared-project attachments appear on the
  Local side of Attachments (backend filter, no web-specific logic).
- **Admin** — n/a — admin-app has no Reference page.
- **Not-entitled / blocked** — Drive disconnected / grant broken: Google side lists, reconnect bar with
  **Reconnect**, New Folder / Upload / rename / move disabled; `drive` flag off: no switch, Local only.
- **Unauthenticated visitor (public Pricing / Help, G1–G6)** — parent § Screens P1 / P2 / H1 / H2 copy, shown
  regardless of the `drive` / `calendar` flags (Q13).

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
- [x] W-1 Switch **Local | Google Drive** at the top of Reference: visibility from the backend signal (parent
  "Switch visibility", D12), last selected side in `localStorage` with first-visit default (D3).
  → `ReferencePage.vue:14-21` (own row under the header, SegmentSwitch, `v-if` `model.showSwitch`); signal
  `referenceModel.js:66` `loadSides()` (`GET /v1/reference/sides`, `apiClient.js:1476`); `ref_side` in `localStorage` +
  first-visit default `referenceModel.js:79-80`, `setSide` `:88-91`; lists wait for the signal `ReferencePage.vue:393-394`.
- [x] W-2 Switch drives all three tabs (D4): Files, Attachments and Trash request the selected side; remove the
  Google/Local headings — delete `providerSections` and the `ref-section-gdrive` / `ref-section-local` markup; grep
  `0` remaining references.
  → side on Files `referenceModel.js:117`, Trash `referenceTrashModel.js:33,86`, Attachments
  `attachmentListModel.js:33`; side change reloads the active tab `ReferencePage.vue:411`. `providerSections`,
  `ref-section-*`, `list-section`, `grid-section`: `grep -rn src/` → 0.
- [x] W-3 Per-side operations (D1, D10, Derived): New Folder, Upload (button + drag-and-drop), search, rename, move
  within a side and breadcrumb navigation all use the selected side; folder navigation `?folder=` stays valid per side.
  → new folder `referenceModel.js:157`, upload (button + drop) `referenceModel.js:270`, search/list
  `referenceModel.js:125`; rename / in-side move unchanged (item's own side, api.md); `?folder=` of the other side
  switches side `referenceModel.js:99-100` (owner 2026-10-21: switch to the folder's side).
- [x] W-4 Google toolbar without the quota display (D11); Local toolbar unchanged.
  → `ReferencePage.vue:33,128` quota only when `isLocal` (Files + Attachments toolbars).
- [x] W-5 Free gate per side (D5): Local-side writes open the existing upgrade modal; Google side has no gate.
  → no web gate: Local writes get the backend 403 `upgrade_message`, which opens the existing upgrade modal
  (`apiClient.js:82-89` `normalizeError` 403 branch); Google side has no client gate. Free gets no Move to Local
  `ReferencePage.vue:298`.
- [x] W-6 Disconnected / broken grant (D8): reconnect bar "Google Drive is not connected" + **Reconnect** (existing
  Google connect flow, `drive` feature) above the Google list; New Folder / Upload / rename / move disabled; preview /
  download keep the existing reconnect toast.
  → bar `ReferencePage.vue:23-24` (Alert.vue extended with a slot `Alert.vue:13-14`, owner 2026-10-21), Reconnect =
  `startGoogleConnect('drive', route.fullPath)` `ReferencePage.vue:442`; disabled: New Folder / Upload
  `RefToolbar.vue:21-22` (`ReferencePage.vue:34`), drop upload `RefUploadZone.vue:36` (`ReferencePage.vue:43`),
  empty-state Upload disabled `ReferencePage.vue:56`, rename `RefListView.vue:38,84`, `RefFileCard.vue:20`,
  `RefFolderCard.vue:19`, drag-move `ReferencePage.vue:549`, cross-side move (`moveSide.disabled`
  `ReferencePage.vue:300`). Disabled dropdown style `Dropdown.vue:288`. Preview / download unchanged.
- [x] W-7 Cross-side move (D9, S1): **Move to Google Drive** / **Move to Local** on files and folders (Free: only to
  Google); on success the item leaves the current side; on failure the existing error toast / storage-limit modal and
  the item stays.
  → menu items `RefListView.vue:41,87`, `RefFileCard.vue:23`, `RefFolderCard.vue:22`; handlers
  `ReferencePage.vue:562,572`; model removes the item only on success `referenceModel.js:219,232`; 413 → existing
  storage-limit modal (no extra toast), 409 name clash → toast, other errors → toast.
- [x] W-8 Test ids for ui-tests (switch, side buttons, reconnect bar, move actions) — list them here for the ui-tests
  slice.
  → test ids for ui-tests: `ref-side-switch`, `ref-side-local`, `ref-side-gdrive` (`ReferencePage.vue:18,273-274`,
  `SegmentSwitch.vue:10` option `testid`), `ref-reconnect-bar`, `ref-reconnect-btn` (`ReferencePage.vue:23-24`),
  `ref-move-gdrive` / `ref-move-local` (file and folder menus, list + grid). **ui-tests hand-over:** the write
  toast for `drive_reconnect_required` is now "Reconnect Google Drive to make changes" (`apiClient.js:30`, owner
  2026-10-21) — `wna-ui-tests/tests/e2e/drive-storage.spec.ts:46` `RECONNECT_UPLOAD` must follow.
- [x] W-9 Update `../wna_orchestration/specs/features/wna-features.md` §12.2 / §12.3 (switch replaces "Google / Local
  sections"; per-side folders, search, quota, reconnect bar, cross-side move, test ids). Cite `file:line`.
  → `wna_orchestration/specs/features/wna-features.md:738-766` (switch, per-side tier, reconnect bar, test ids),
  `:770-776` (toolbar per side), `:783,810` (cross-side move), `:816,820` (search, Attachments), `:829` (write
  toast), `:837,841` (Trash per side), `:1899-1900` (§21.13 storage sentence); `specs/tests/wna-test-cases.md:17999`
  (TC-761 toast text; `regression-ui-tests/update-tests.sh` run).
- [x] W-10 Legal re-confirm (parent §Legal impact): check `src/main-app/content/legal/privacy.md` §2.8 / §5.3 still
  describe what WNA does in Drive after D7 (`WNA/trash`) and S3 (folders moved to the Google Drive trash); edit only
  if a sentence became false, else `[NA]` with the lines checked.
  → §2.8 `privacy.md:117` was false ("your reference folders are mirrored") — reworded: only Google-side folders,
  `WNA/trash`, deleted folders to the Google Drive trash; `Last updated` → October 21, 2026 (`privacy.md:3`).
  §5.3 `privacy.md:185` still true (files uploaded/read/renamed/moved/deleted) — unchanged.
- [x] W-11 `npm run build:main` passes.
  → `npm run build:main` ✓ (2026-10-21).

### Refresh 2026-10-21 — parent § Screens (owner Q1–Q16), § Help impact, public pages gaps G1–G9
Re-check the W-1…W-11 work above against the parent § Screens and fix any drift. Each box below is built per
§ Screens: every state, with the exact copy given there.
- [x] W-12 Screen S1 (header switch): Q1 `SegmentSwitch` row. Visible only while the Google side holds files (Q2: empty
  folders don't count). Loading spinner until the side is known, with no empty-state flash. `?folder=` switches side.
  → row `ReferencePage.vue:14-21` (SegmentSwitch, `v-if` `showSwitch`); visibility = backend `show_switch`, already
  files-only per `specs/api/api.md:4589` (Q2 — no web logic); sides failure → hidden + Local, no toast
  `referenceModel.js:63-80`; spinner until sides + first list `ReferencePage.vue:45,137,191,287,403`; `?folder=` side
  switch `referenceModel.js` `navigateToFolder`.
- [x] W-13 Screen S2 (Files per side): toolbar order, quota on Local only. Empty states as Local (Q10). Free-on-Local
  `UpgradeModal` copy + Drive hint (Q11), including the `friendlyUpgradeMessage` "file" before "reference" fix in
  `apiClient.js`.
  → toolbar order unchanged (`RefToolbar.vue`), quota Local only `ReferencePage.vue:33`; empty state same on both
  sides, Upload File disabled while disconnected `ReferencePage.vue:56` (`EmptyState.vue:5,17` `buttonDisabled` prop);
  Free-on-Local copy + Drive hint, "reference" matched before "file" `apiClient.js:15-18`.
- [x] W-14 Screen S3 (Attachments / Trash per side): Google Attachments empty-state copy (Q10).
  → Google Attachments empty copy `ReferencePage.vue:146`; Trash empty copy same on both sides (unchanged).
- [x] W-15 Screen S4 (reconnect bar):
  - title only (Q2);
  - Reconnect returns to `/reference` when started there (Q3);
  - the first Google-side 409 `drive_reconnect_required` switches to the bar for the session (Q4);
  - trash / delete / restore stay enabled and fail with the toast (Q5);
  - Move to Google Drive hidden on Local while disconnected (Q6).
  → title only `ReferencePage.vue:23`; Reconnect `startGoogleConnect('drive', route.fullPath)` + fixed start-error toast
  `ReferencePage.vue:442,444`, return stored `apiClient.js:1801-1802`, consumed `GoogleConnectPage.vue:44,55-56`;
  first Reference 409 `drive_reconnect_required` → `markGrantBroken()` `apiClient.js:75`, `referenceModel.js:29,70,83`
  (kept until app reload); trash / delete / restore never disabled (toast "Reconnect Google Drive to make changes",
  `apiClient.js:30`); Move to Google Drive hidden on Local while disconnected `ReferencePage.vue:299`.
- [x] W-16 Screen S5 (cross-side move): no confirm (Q7); item menu disabled + spinner while moving (Q8). Failure copy: 502 /
  404 / other (Q9). 413 storage modal sentence "Or keep it on the Google Drive side…" while connected (Q12).
  → no confirm (`onMoveFileSide` / `onMoveFolderSide`); spinner replaces the `⋯` menu while moving — model
  `movingIds` `referenceModel.js:27,216-237`, list `RefListView.vue:32,72`, grid `RefGridView.vue:10,25`, cards
  `RefFileCard.vue:7-8`, `RefFolderCard.vue`; folder 502 / 404 copy `ReferencePage.vue:580-583`, other → backend
  message; 413 sentence "Or keep it on the Google Drive side…" via `storageHint: 'side'` `apiClient.js:24,1487,1496`
  (move-side calls only; Team keeps its storage variant).
- [x] W-17 Screen P1 (Pricing tier cards, G4/D15): `PricingTier` lead-in line without a check for "Everything in Pro,
  plus:" (Q14 — small prop; ask the owner before anything larger). Drive line on all three cards (Q15). Free
  Reference bullet (Q16). Values from `contracts/limits.md`. Shown regardless of flags (Q13).
  → `PricingTier.vue:35,54` `lead` prop (lead-in line, no check); cards `PricingPage.vue:186-235` — Free Reference
  bullet `:191`, Drive on all three, Pro Email to Inbox + Calendar sync, Team `lead` `:226` + Connections & delegation,
  Shared projects, storage; values match `contracts/limits.md:9-13`; no flag checks on the page.
- [x] W-18 Screen P2 (Pricing comparison table + mobile cards, G5/D16): Integrations + Collaboration groups; Free
  Reference cell (Q16).
  → `PricingPage.vue:243` Free "View only · Full in Google Drive"; Integrations `:247` (Email to Inbox — / 50 / 100
  per day per `contracts/limits.md` §Email-to-inbox daily cap, Calendar sync, Drive) and Collaboration `:251`; same
  rows feed the mobile cards.
- [x] W-19 Screen H1 (Help impact, FAQ copy per § Screens H1):
  - Reference file manager entry (G1, incl. the Drive per-file carve-out);
  - plans entry Free Drive exception (D5);
  - operator sentence removed from "Can I sign in with Google?" (G2);
  - two new D17 entries.
  → `content/help/faq.js:169` Reference answer (H1 copy, 20 MB / 50 MB from `contracts/limits.md`); `:174` "Can I keep
  my files in my Google Drive?"; `:128` "How does Google Calendar sync work?" after the Calendar entry; `:16` operator
  sentence removed (grep 0); `:219` plans entry Drive exception. Order checked with node import.
- [x] W-20 Screen H2 (Help impact, Getting Started copy per § Screens H2): "Keeping a Reference Library" (G1) + two new
  D17 cards (Calendar sync, Drive storage). Best Practices unchanged (D18).
  → `content/help/gettingStarted.js:70` last sentence replaced; new cards `:73` "Storing Files in Google Drive",
  `:78` "Syncing With Google Calendar (Pro & Team)"; Best Practices untouched.
- [x] W-21 Legal (parent § Legal impact, G9/D19–D20): `src/main-app/content/legal/privacy.md` §5.1 + §6 hosting →
  servers Warsaw, Poland; backups Madrid, Spain. Bump the §12 "Last updated" date. No user notice, no ToS /
  `terms_version` change.
  → `privacy.md:174` (§5.1) and `:225` (§6): servers Warsaw, Poland; backups Madrid, Spain; `Last updated` already
  October 21, 2026 (`privacy.md:3`, today). "Prague" grep in `src/` → 0. No terms / `terms_version` change.
- [x] W-22 Update `../wna_orchestration/specs/features/wna-features.md`:
  - §12.1 / §12.2 to the final S1–S5 copy;
  - §24.2 Pricing to the final copy (G8: badge "3 months free", tier descriptions, D15–D16);
  - the Help section if it lists FAQ / Getting Started entries.
  Cite `file:line`.
  → `wna_orchestration/specs/features/wna-features.md:736-765` (§12.1 S1 + S4 final copy: visibility, loading,
  change side, Free-on-Local copy, reconnect bar, grant broken, test ids), `:781-792` + `:808` (S5 move copy),
  `:816-823` (empty states, Attachments copy), `:1869-1871` (§21.12 return path), `:1896-1899` (§21.13 move-to-Local
  storage sentence), `:2021` (badge "3 months free"), `:2027-2044` (tier descriptions synced to code + card bullets),
  `:2071-2077` (comparison table 4 groups). Help §24.3 lists no FAQ / Getting Started entries — no change.
- [x] W-23 `npm run build:main` passes after W-12…W-22.
  → `npm run build:main` ✓ (2026-10-21, after W-12…W-22).

### Fixes from /conclude 2026-10-21 (closure blocked)
- [x] W-24 Q9 folder-move 404 copy. "\"{name}\" was not moved — a file in it was deleted in Google Drive." should fire
  only on `error: drive_file_not_found`. Today it fires on any 404 (`ReferencePage.vue:582`), including a plain
  "Folder not found". Map `drive_file_not_found` to `err.code`; any other 404 shows the backend message
  (parent § Screens S5).
  → `apiClient.js:106` sets `code` for `drive_file_not_found` (owner 2026-10-21: on every request, so preview /
  download of a file deleted in Drive now toast the backend `detail` "File no longer exists in Google Drive" and the
  Reference preview closes, like the other Drive codes); `ReferencePage.vue:582` Q9 copy only on that code; any other
  404 falls to the backend message `:584-585`.
- [x] W-25 Q4 broken grant from any Google-side request. The first 409 `drive_reconnect_required` switches the Google
  side to the reconnect bar for the session; this includes Google-side attachment requests
  (`/v1/{entity}/{id}/attachments/…`), not only `/v1/reference/` (`apiClient.js:74`). Parent § Screens S4.
  → `apiClient.js:73-76` URL check dropped: any `drive_reconnect_required` → `markGrantBroken()` (api.md §Reference
  Drive errors: the code is only sent for Google-side requests); the flag is read on the next `loadSides()`
  `referenceModel.js:70`.
- [NA] W-26 If backend B-20 adds a distinct name-taken code for a file move-side 409: show the file name-taken toast
  per § Screens S5, not the reconnect toast; else `[NA]` with the reason.
  → GATE NOT MET — backend B-20 is still open (`wna_backend/.claude/features/FEAT-051-*.md:139` `[ ]`) and
  `specs/api/api.md:4615` lists only `drive_reconnect_required` for the file move-side 409. Today the file 409 shows
  the backend message (`ReferencePage.vue:568`); revisit when B-20 lands a distinct code.
- [x] W-27 Update `../wna_orchestration/specs/features/wna-features.md` §12.1 to W-24 / W-25 ("from a Reference request"
  → any Google-side request; 404 copy only for `drive_file_not_found`). Cite `file:line`.
  → `wna_orchestration/specs/features/wna-features.md:762-763` (any Google-side request, incl. attachments), `:791`
  (404 `drive_file_not_found`), `:831` and `:1133` (`drive_file_not_found` shows the backend `detail` on
  preview / download / attachments).
- [x] W-28 Refresh stale citations in W-1, W-3, W-5, W-6, W-7, W-9 to the current lines.
  → re-read each cited line after W-24…W-27; citations above updated.
- [x] W-29 `npm run build:main` passes after W-24…W-28.
  → `npm run build:main` ✓ (2026-10-21).

### Fix from ui-tests TC-822 re-run 2026-10-21 (U-5 blocked)
- [x] W-30 Q4 reconnect toast on New Folder / rename. `ReferencePage.vue` `onRenameConfirm` (~`:486-505`) maps every
  409 to "A {folder/file} with this name already exists" and leaves the dialog open.
  - For a 409 `drive_reconnect_required` (new folder, folder rename, file rename on the Google side): show the toast
    "Reconnect Google Drive to make changes" and close the dialog. Per parent § Screens S4 (Q4), the bar then
    disables New Folder / Rename.
  - The name-taken 409 keeps today's toast and keeps the dialog open.
  - Grep the other Google-side write handlers for the same any-409 branch (upload, drag-move, move-side, trash /
    restore) and fix them the same way.
  → `ReferencePage.vue:501-506` name-taken only on `409 && !err.code` (dialog stays open); otherwise the toast
  (`drive_reconnect_required` → "Reconnect Google Drive to make changes", `apiClient.js:35`) and `closeRename()`
  `:506`; `markGrantBroken()` (`apiClient.js:74-76`) then shows the bar and disables New Folder / Rename. Same any-409
  branch fixed in delete folder `:523` ("Folder is not empty" only without a code, Q5) and drag-move `:555`. Upload
  (`referenceModel.js:282-287`), trash / restore / permanent delete / empty trash, file move-side (`:569`) already show
  `err.message`; folder move-side already `409 && !err.code` `:579`.
- [x] W-31 `../wna_orchestration/specs/features/wna-features.md` §12.1: confirm the reconnect-toast wording covers
  W-30, else update it. Cite `file:line`.
  → write list did not name new folder / rename / drag-move — updated `wna_orchestration/specs/features/wna-features.md:828-830`
  (incl. "the name dialog closes"; name-taken / not-empty 409 keep their toast); `specs/tests/wna-test-cases.md:18574`
  TC-822 step 3 "the name dialog closes"; `regression-ui-tests/update-tests.sh` run.
- [x] W-32 `npm run build:main` passes after W-30…W-31.
  → `npm run build:main` ✓ exit 0 (2026-10-21).

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the Reference screen per side, the toolbar, the reconnect bar) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (viewer-centric / entitlement rules etc.); don't
   silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work. Overstating
   completion is the worst failure — it ships broken work as done. (See the Checkbox legend.)
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file (the parent FEAT/BUG, specs, contracts, decisions) — pull the
   authoritative form (exact predicate, response shape, DDL) from its home rather than guessing or asking.
   Reading is unrestricted; only *writing* is scoped (to the spec homes this repo owns). If your work
   changes a fact whose canonical home is a spec in `wna_orchestration` (response shapes →
   `specs/api/*`; SQL DDL / CI → `specs/ci/*`; features → `specs/features/*`; test cases →
   `specs/tests/*`; architecture → `specs/architecture/*`; numbers → `contracts/*`), you MUST update
   that spec file in `wna_orchestration` as part of this work. Editing the spec's orchestration home is
   the documented sibling sync requirement (see this repo's CLAUDE.md) — it is REQUIRED, never
   forbidden, and never "deferred to the user." The local-slice rule forbids only *restating* shared
   facts inside the slice, NOT updating their canonical home. Cite the orchestration `file:line` you
   updated. (Find the home in the orchestration Fact Index.) This includes `/internal/*` routes, CronJobs
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config `wna_deploy/backend/gce/config/<env>/` and `vm/wna/<env>/`.
7. **Run only the NEW and directly-relevant tests — never the repo's full suite during slice work**
   (owner directive 2026-08-19). Scope every run to the tests you added or changed plus the directly
   affected targets (e.g. one gtest binary via `ctest -R <target>`, one service's integration dir,
   one platform module, a single spec file or TC by name). The full regression suite is run by the
   OWNER before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every run targets the
   local stack (local docker services, local web dev server, local mocks; ui-tests `BASE_URL` = local).
   Never deploy, never run tests against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a
   "verify on dev" / "needs a dev deploy" step. A missing dev/prod run is never a reason for `[~]`.
   The **deploy** slice always prepares BOTH environments — dev AND prod compose overrides, config.json, crontabs, scripts —
   and hands over the exact command lines for dev AND for prod. Operator-only steps (GCP/VM
   provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — handed over: <dev command> / <prod command>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
