# FEAT-112 — web slice: profile name and picture (main-app)

Parent: `FEAT-112` (`../wna_orchestration/features/FEAT-112-profile-name-and-picture.md`) — Design, Screens and Work breakdown live there. Item ids are the parent's. **Waits on backend B14** (local stack must serve B1–B12).

## User flows (this project's part)
- **Free / Pro:** Settings › Account name + picture (add, change, remove); own avatar shows picture → Gravatar → initials from the name (W3, W5, W6); no connections or shared projects, nobody else sees it.
- **Team owner / Team member (both ways):** members, connections, comments, waiting / assignee show name with the email secondary and the picture; Connections list and pickers search by name or email (W7–W11).
- **SSO user:** the stored provider name appears in Settings, editable like any name (W5).
- **Invitee before accepting:** invitation rows and pickers show the email only (W8).
- **Admin:** n/a — admin-app unchanged (owner scope). **Unauthenticated:** n/a — Settings is signed-in only.

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

## Screens (parent § Screens › Web — one box per screen, built per the parent: every state + exact copy)
- [x] §1 Settings › Account (`/settings?section=account`) — via W5 — `views/dashboard/SettingsPage.vue:76-112`; Chrome 1280 + 500 px: upload JPEG → picture, Change/Remove → initials "AM" from the name, name Edit/Enter save, too big + not-an-image toasts
- [x] §2 Own identity elsewhere (Sidebar footer, TopNav) — via W6 — `components/Sidebar.vue:161-168`, `components/TopNav.vue:146-150`; Chrome: sidebar row name over email + picture, TopNav avatar picture on `/`
- [x] §3 Project detail › Shared with — via W7 — `views/dashboard/ProjectDetailPage.vue:582-592`, remove confirm `:1224`; Chrome 1280 + 393 px as A and C (C not A's connection: name from members), " (you)" not cut
- [x] §4 Share project / Add members modal — via W7 — `ProjectDetailPage.vue:685`, `:696-700`, filter `:1083`; Chrome 500 px as B: Share modal two-line rows
- [x] §5 Connections page — via W8 — `views/dashboard/ConnectionsPage.vue:82`, `:112`, `:133-157`, `:214`; Chrome: 6 accepted → search, "zan" → Žan Kovač, no-match copy, Esc clears; 5 → no field; pending row avatar
- [x] §6 Connection picker — via W9 — `components/ConnectionPicker.vue:27-31`, `:114`, `:120`, `:124`; Chrome 393 px Waiting For add: avatars, name over email, "zan" → Žan Kovač
- [x] §7 Comments — via W10 — `components/CommentSection.vue:66-71`, `:126`; Chrome as C: "Ana Marija Novak" / "{email} · 3 minutes ago"
- [x] §8 Short spots (name first, email visible) — via W11 — backlog assignee `ProjectDetailPage.vue:430-438`, completed by `:1997`, chip `ActionDetailPage.vue:79-84`, From `:207`, Waiting on `:299-301`, `MetadataRow.vue:19`, `:47`, `StuffDetailPage.vue:142`, `notConnection.js:11`; Chrome: Waiting chip "Žan Kovač · email", Inbox "From: Maja Horvat · email", Waiting on two-line, Assigned to chip at 393 px (email ellipsizes first)
- [x] §9 In-app bell title: the text arrives from backend B11; verified by hand in W13 (no web code of its own) — local `GET /v1/notifications` for A: "Maja Horvat (f112_maja_…@example.com) delegated 'Review the contract draft' to you"; the bell renders `n.message` as built
- [x] Click budget and Data needs of the parent § Screens honoured — Account 1 click (sidebar row), name 2 (Edit, Enter), picture 2, remove 1, search type + 1; data from `GET /v1/user/get`, `/connections`, `/project/{id}/members` only

## Checklist (parent Work breakdown § web)
- [x] W1 `src/main-app/scripts/core/apiClient.js`: `updateUserName(name)` (`PUT /v1/user/name`),
  `uploadUserPicture(file)` (`PUT /v1/user/picture`, the `File` as body with `Content-Type: file.type`, like
  `uploadAttachment` :1889-1904 but no `FormData`), `removeUserPicture()`; `normalizeError` (:61-146) keeps `code` for
  `name_too_long`, `picture_too_large`, `unsupported_image` (beside :110-116) and, for the picture call, maps any `413` to
  `picture_too_large` without the storage-upgrade path (:98-108); `pictureSrc(path)` = API base + `picture_url`.
  Consumes backend B4.
  Data: `name` / `picture_url` from the responses of `PUT /v1/user/name`, `PUT` / `DELETE /v1/user/picture` — backend B4.
  Done: `scripts/core/apiClient.js:388` `updateUserName`, `:398` `uploadUserPicture` (raw body + `Content-Type`), `:409` `removeUserPicture`, `:421` `pictureSrc`; codes kept `:114`; picture 413 → `picture_too_large` without the upgrade modal `:96`.

- [x] W2 `src/main-app/scripts/core/person.js` (pure, no store): `personOf(userId, {me, connections, members})` (F5
  order), `initialsOf(name, email)` (Screens Display rules), `twoLine`, `oneLine`, `sentence` (Screens three forms; no
  name = today's text), `matchesPerson(query, person)` (NFD, strip `\p{M}`, lower-case, substring of name or email).
  Data: none read — pure helper over the shapes of `GET /v1/user/get`, `GET /v1/connections` (B5) and `GET /v1/project/{id}/members` (B10).
  Done: `scripts/core/person.js:4` `personOf` (me → connections → members, F5), `:14` `initialsOf`, `:23` `twoLine`, `:29` `oneLine`, `:35` `sentence`, `:44` `matchesPerson` (NFD, strip `\p{M}`).

- [x] W3 `components/UserAvatar.vue`: props `name`, `pictureUrl`, `size`; picture → Gravatar (as built) → initials (from
  the name, colour from the email); a picture that fails to load → initials without asking Gravatar; emits `source`
  (`picture` / `gravatar` / `initials`) for the Settings hint. Existing call sites keep working with `email` only.
  Data: `name`, `picture_url` — passed in from `GET /v1/user/get` (B5), connections (B5), members (B10).
  Done: `components/UserAvatar.vue:2-8`, `:78` picture → Gravatar → initials (failed picture → initials, no Gravatar), `:84` emits `source`, `:86` name initials; email-only call sites unchanged.

- [x] W4 `scripts/core/authModel.js`: `currentUser` keeps `name`, `picture_url`, `profile_limits` (as sent by B5);
  `setName`, `setPicture`, `removePicture` update it from the responses; subscribe to live `account` → `loadUser()`
  (no handler exists today). Consumes B5, B7.
  Data: `name`, `picture_url`, `profile_limits` — `GET /v1/user/get`, new fields from backend B5; live `account` from B7.
  Done: `scripts/core/authModel.js:335` `setName`, `:341` `setPicture`, `:347` `removePicture`; live `account` → silent re-read `:68-74`; a kept pre-profile `current_user` (no `profile_limits`) is re-read once at start.

- [x] W5 Settings › Account (`views/dashboard/SettingsPage.vue` :73-91; SECTIONS :920-921 description + keywords) per
  Screens §1: Picture row (UserAvatar 48, Upload / Change / Remove, "From Gravatar" from `source`, saving look
  `settings-control--saving`, browser size check against `profile_limits.picture_max_bytes`, `accept="image/jpeg,image/png"`),
  Name row (`maxlength` = `profile_limits.name_max_length`), every error copy of the §1 table (`picture_too_large`,
  `unsupported_image`, offline, other, `name_too_long` inline).
  Data: `profile_limits.name_max_length` / `picture_max_bytes`, `name`, `picture_url` — `GET /v1/user/get`, backend B5; responses of the picture / name calls — B4.
  Done: `views/dashboard/SettingsPage.vue:76-112` rows, `:960-961` description + keywords, `:1080` upload (browser size check, every §1 error copy), `:1132` name save (inline `name_too_long`); `Inpt` got a `maxlength` prop (`components/Inpt.vue`). Offline: Settings shows its offline screen, so the offline toast is the no-response path (`err.status == null`).

- [x] W6 own identity (Screens §2): Sidebar footer (`components/Sidebar.vue` :159-166) avatar + name over email, the row a
  button to `/settings?section=account`; TopNav avatar (`components/TopNav.vue` :146) with `name` / `pictureUrl`.
  Data: own `name`, `picture_url` — `GET /v1/user/get`, backend B5.
  Done: `components/Sidebar.vue:161-168` (button → `/settings?section=account`, hover), `components/TopNav.vue:146-150`.

- [x] W7 `views/dashboard/ProjectDetailPage.vue` (Screens §3, §4, §8): Shared-with rows (:574-598, avatar 32, two-line,
  " (you)" non-shrinking), `memberEmailFor` / `memberChipLabel` (:1019-1046) → `person.js` with members first; remove
  confirm (:1219); share / Add members modal list (:684-695) + filter (:1072-1079 → `matchesPerson`, keep the
  `.share-modal__filter` class, placeholder "Search by name or email…"); backlog assignee (:431-434, `assigneeLabel`
  :1013-1017, two-line right block); completed by (:638, `completerLabel` :1988-1993); refusal copies via W11.
  Consumes B10.
  Data: members `email`, `name`, `picture_url` — `GET /v1/project/{id}/members`, backend B10; connections `name`, `picture_url` — `GET /v1/connections`, backend B5; live `member` — backend B9.
  Done: `views/dashboard/ProjectDetailPage.vue:430-438`, `:582-592`, `:685`, `:696-700`, `:1033` `personFor`, `:1083`, `:1224`, `:1997`; `memberEmailFor` / `memberChipLabel` removed (0 matches). Person order follows F5 (me → connections → members); members carry the same fields. The backlog assignee keeps today's place right after the title (the row's separator is collapsed by design) and is capped at 40% of the row (`cqi`).

- [x] W8 `views/dashboard/ConnectionsPage.vue` (Screens §5): accepted rows (:127-148) with UserAvatar 34 + two lines;
  invitation rows (:80-84, :111-115) avatar column, email only; remove confirm (:308); search field over > 5 accepted
  (filter, count, empty copy, Esc, hide at ≤ 5).
  Data: connections `name`, `picture_url` — `GET /v1/connections`, backend B5; invitation rows `invitee_email` / `inviter_email` — `GET /v1/connections/pending`, unchanged.
  Done: `views/dashboard/ConnectionsPage.vue:82`, `:112`, `:133-157`, `:214` (search over > 5), `:335` remove confirm sentence form.

- [x] W9 `components/ConnectionPicker.vue` (Screens §6): UserAvatar 28 replaces `.cp-avatar` (:27), name over email
  (:28), `filtered` (:106-112) → `matchesPerson`, `exactMatch` (:114-118) on name or email, pick `label` = name (else
  email) (:135-142) — the request stays `{user_id, email}`.
  Data: connections `name`, `picture_url` — `GET /v1/connections`, backend B5.
  Done: `components/ConnectionPicker.vue:27-31`, `:114`, `:120`, `:124`; request unchanged `{user_id, email}`; `.cp-avatar` removed.

- [x] W10 `components/CommentSection.vue` (Screens §7): author name / email lines + avatar via `person.js` (:66-70,
  `commentEmail` :127-136); `views/dashboard/ActionDetailPage.vue` loads the members of a shared action's project
  (`apiClient` `GET /v1/project/{id}/members` :2328-2333 into a local ref, when `project_shared`; re-read on live
  `member`, :822) and passes them to CommentSection (:420) and to the "Assigned to" chip (W11). Consumes B10.
  Data: members `email`, `name`, `picture_url` — `GET /v1/project/{id}/members`, backend B10; connections — `GET /v1/connections`, backend B5; comment `user_id` as built.
  Done: `components/CommentSection.vue:66-71`, `:126` `authorOf`; `views/dashboard/ActionDetailPage.vue:598` `loadProjectMembers` (shared action's project), `:851` re-read on live `member`, `:429` passes `:members`.

- [x] W11 short spots (Screens §8): `components/MetadataRow.vue` From chip (:17-20, :139-145 → `delegated_from.user_id`
  resolved) and Waiting For chip (:41-44 → `waiting_for_user_id` resolved, one-line form); `ActionDetailPage.vue`
  "Assigned to" chip (:77-81, :679-690), "From" section (:199-205), "Waiting on" section (:286-296); `StuffDetailPage.vue`
  "From" section (:138-144); `scripts/core/notConnection.js` `recipientLabel` (:8-12) → sentence form.
  Data: ids `delegated_from.user_id`, `waiting_for_user_id`, `assigned_to`, `completed_by` as built in action / stuff JSON; resolved to people through connections (B5) and members (B10).
  Done: `components/MetadataRow.vue:19`, `:47`; `ActionDetailPage.vue:79-84`, `:207`, `:299-301`; `StuffDetailPage.vue:142`; `scripts/core/notConnection.js:11` `recipientLabel` → sentence form while the person is in the loaded connections.

- [x] W12 Help (parent § Help impact), one box each — `content/help/faq.js` :332-334 "How do I change my avatar?" → "How do I set my name and picture?" per the parent text — `content/help/faq.js:332-334` (10 MB from `contracts/limits.md` §Profile name and picture)
- [x] W12 Help — `content/help/faq.js` :223-225 "How do connections work?": the one added sentence per the parent — `content/help/faq.js:225`
- [x] W12 Help — `content/help/gettingStarted.js` :103-105 "Customizing Your Settings": Account group now also holds name and picture — `content/help/gettingStarted.js:105`
- [x] W12 Legal (parent § Legal impact, `content/legal/privacy.md`) — "Last updated" (:3) → the ship date — `privacy.md:3` already "November 11, 2026" = today's ship date
- [x] W12 Legal — §2.1 Account Data (:19-27): new bullet Profile name and picture (optional); Google bullet (:25); Apple bullet (:26) — `privacy.md:25-27`
- [x] W12 Legal — §2.4 Collaboration Data (:56-64): new bullet Profile — `privacy.md:63`
- [x] W12 Legal — §3 Legal basis table, Account data row (:173) — `privacy.md:175`
- [x] W12 Legal — §5.3 (:222) Google provides identifier, email and name — `privacy.md:224`
- [x] W12 Legal — §5.6 Avatar Service (:247-249) and §5.7 Other WhatsNextAction Users (:251-253) — `privacy.md:251`, `:255`
- [x] W12 Legal — §7 Data Retention table: row Profile picture (after :317) — `privacy.md:320`
- [x] W12 Legal — §10 (:398): iPhone app keeps profile name and picture address — `privacy.md:401`
- [NA] W12 Terms of Service — n/a per parent (§4 / §6 already cover it, no `terms_version` change)
- [NA] W12 Landing / Pricing — n/a per parent § Landing / Pricing impact (no tier, price, limit or platform change)
- [x] W13 verify: `npm run build:main` green; by hand on the local stack with two Team users (one named with a picture,
  one without) at 1300 px and 393 px: every Screens §1–§8 spot once, the §9 bell title, offline upload toast.
  Done: `npm run build:main` green (2026-11-11). Local stack, Team users A (named + picture), B (no name), C (named, B's connection, not A's) + 5 more: Chrome at 1280 px and at 393 / 500 px (same-origin iframes — the window could not be narrowed): §1–§8 each once, §9 via `GET /v1/notifications`, offline: Settings shows its offline screen; the no-response toast path is code-verified (`SettingsPage.vue:1080`). No console errors.
- [x] Update `specs/features/wna-features.md` §3.4, §21.1, §28, §30.6, §33.5 — in `wna_orchestration`, cite `file:line`. — `wna-features.md:274` (sidebar footer), `:291-311` §3.4 (incl. person forms + search), `:390` (From chip), `:565` (Assigned to / From / Waiting on / Waiting chip), `:954` §10.2 picker, `:1474` comments (they live in §20.1, not §28), `:1498` §21.1, `:1533` §21.2 rows, `:3074` §28, `:3163-3167` §30.4–30.6, `:3323` + refusal copy §33.1, `:3386` §33.5, `:3404` §33.6, `:3419` §33.8

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered email, the API response, the screen) and confirm it.
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
   applies the change to the LOCAL stack itself (local migrations, local config), and writes the exact dev and prod
   command lines as a section in `wna_deploy/backend/gce/PENDING-develop.md` / `PENDING-production.md`. Operator-only
   steps (GCP/VM provisioning, applying migrations or config to dev/prod) are authored + locally/dry-run verified,
   then marked `[NA] OPERATOR STEP — in PENDING-develop.md / PENDING-production.md §<ID>`. A task closes on
   local tests alone — never wait for a dev or prod confirmation.
