# FEAT-001 — Email to Inbox · wna_web slice (main-app Settings only)

**Parent (orchestration):** `wna_orchestration/features/FEAT-001-email-to-inbox.md`
**Design home:** `wna_orchestration/specs/features/email-to-inbox.md` (UI = **§8**; endpoints = **§9**; user stories = **§10**)
**This slice is LOCAL** — wna_web's checklist only. It does **not** restate the parent's design or any
shared fact (tier caps, endpoint shapes, GTD rules); it **links** them. Scope is **main-app Settings only**
(parent §13 wna_web table): the four `apiClient.js` functions + the "Email to Inbox" card in
`SettingsPage.vue`. No new endpoints, no backend behavior — UX/copy only (design §8 "UX polish").

> **Parent-completeness note:** the parent has no section literally titled "User flows"; roles come from
> design **§10 User Stories** (Free E-6, Pro/Team E-1…E-5, downgrade E-6b, Admin E-31/E-32) plus the
> parent role rules. Proceeding on that basis.

---

## User flows (this project's part)

Per the parent's roles. wna_web implements **only the Settings UI** of the parent flow; capture,
tier-gating, dedup, and the cap itself are enforced **server-side** in `email_service` (backend slice) —
this slice never enforces entitlement, it only **reflects** it.

- **Free** — locked card: a 🔒 line ("Email to Inbox is available on Pro and Team plans.") + an
  `[Upgrade]` button that opens `UpgradeModal` via `upgradeModel` (design §8 Free block; story **E-6**).
  No address controls rendered.
- **Pro / Team** — full card (design §8 Pro/Team block; stories **E-1…E-5**):
  - **Empty state** (no address yet): value-prop line **"Get a private email address. Forward anything to
    capture it instantly."** + `[Generate Address]` (primary) → `generateInboxEmail()`.
  - **Address present**: address display + `[Copy]` (→ "Copied!" for 2 s) + usage
    **"Used today: N of {cap}"** (the **"today"** qualifier is mandatory; `N` + cap come from the
    `GET` response — never restate the cap number here) + `[Reset address]` ghost (confirm via
    `confirmModel`) → `regenerateInboxEmail()` + a **state-reflecting** capture toggle reading
    **"Capture is on"** / **"Capture is paused"** that flips `enabled` → `setInboxEmailEnabled()`.
  - **Team owner vs member** — n/a: identical UI; tier (`team`) alone drives the card, no team-role branch.
- **Admin** — **n/a.** Admin inbox-email surfaces (parent E-31/E-32) live in **admin-app**, which the
  parent's wna_web table does **not** list. This slice is **main-app Settings only**; no admin UI here.
- **Not-entitled / blocked (downgrade-to-Free)** — the card must **reactively revert** to the Free locked
  state when `subscription_tier` becomes `free` (story **E-6b**). The kept-but-deactivated address is
  **not** shown to a downgraded user — the lockout view replaces the address controls entirely.

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
  does not apply to this project/role. State the reason. Does NOT block closure.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". State
   the concrete artifact to inspect (the rendered Settings "Email to Inbox" card in the running app — the Pro/Team states AND the Free locked state — not a passing build) and confirm it.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (Free lockout / Pro-Team entitlement / downgrade
   rules); don't silently implement only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[~]` (NOT `[x]`) and write exactly
   what's left; if it's intentionally not done or doesn't apply, mark `[NA]` with the reason. Never
   leave a box you acted on as a bare `[ ]`, and never tick `[x]` to cover partial work.
6. **Read freely from orchestration; sync the shared specs you change there — never defer it.** You MAY
   read any `wna_orchestration` file. If your work changes a fact whose canonical home is an
   orchestration spec (user-facing features → `specs/features/wna-features.md`; numbers → `contracts/*`), you MUST update that spec there as part of the implementation and
   cite the orchestration `file:line`. This slice never *restates* a shared fact; it points to the home.

---

## Reuse-first ground (web CLAUDE.md is strict — reuse before creating; ASK before any new component/CSS)

Verified in this worktree (`/Users/vladimirhozjan/Documents/wna_web/develop-a`):
- **apiClient pattern** — named `export async function` + try/`httpApi`/`authHeaders()` + `normalizeError`.
  Mirror `getNotificationSettings`/`updateNotificationSettings` at
  `src/main-app/scripts/core/apiClient.js:157-173` (GET + PUT example).
- **Tier source** — `auth.currentUser.value?.subscription_tier` (already computed as `tier` in
  `src/main-app/views/dashboard/SettingsPage.vue:564`). Free vs Pro/Team branch off this; it is reactive
  so the downgrade revert (E-6b) is automatic.
- **Card / collapsible-section markup + `Btn`** — copy the existing card pattern in
  `src/main-app/views/dashboard/SettingsPage.vue:46-73` (`.card` / `.card-header--toggle` /
  `.settings-section-body` / `.settings-row` / `.settings-label` / `.settings-value`).
- **Confirm dialog** — `confirmModel` already imported at `SettingsPage.vue:481` and instantiated at
  `:495` (`const confirm = confirmModel()`); reuse for the Reset-address confirm.
- **Toasts** — `errorModel` imported at `SettingsPage.vue:480`, instance at `:494` (`toaster`); use
  `.push` / `.success` for error/success feedback.
- **Upgrade modal** — `upgradeModel` singleton at `src/main-app/scripts/core/upgradeModel.js:5`
  (`show({ message, limit })` / `close`); `UpgradeModal.vue` exists at
  `src/main-app/components/UpgradeModal.vue`. SettingsPage does **not** import it yet — add the import.

**No existing component fits these two — do NOT invent; ASK first:**
- **Binary on/off switch**: `SegmentSwitch.vue:1` is a multi-option **tab** (`role="tablist"`,
  `update:modelValue` of a string), not a two-state on/off switch — it can render two segments but is not
  a semantic toggle. There is no dedicated switch/toggle component in `src/main-app/components/`.
- **Copy-to-clipboard helper**: `grep` for `clipboard`/`writeText`/`Copied` across `src/main-app/`
  returns **0** matches — no existing copy helper or "Copied!" affordance.

---

## Work checklist (main-app Settings only)

### apiClient.js (`src/main-app/scripts/core/apiClient.js`) — follow the `:157-173` pattern
> **Endpoint path note:** the slice's `/v1/user/inbox-email` wording is a loose paraphrase; it cites
> "design §9" as the authority, and design §9 + the code-synced `specs/api/api.md` ("Email to Inbox")
> both use **`/v1/email/inbox*`**. Implemented against the canonical path.
- [x] Add `getInboxEmail()` — `GET /v1/email/inbox` (design §9; returns email/enabled/emails_today/daily_limit/created_at; 404 if none) with `authHeaders()` + `normalizeError`. **`apiClient.js:177-184`**.
- [x] Add `generateInboxEmail()` — `POST /v1/email/inbox/generate` (design §9). **`apiClient.js:186-193`**.
- [x] Add `regenerateInboxEmail()` — `POST /v1/email/inbox/regenerate` (design §9; UI label is "Reset address", endpoint name unchanged). **`apiClient.js:196-203`**.
- [x] Add `setInboxEmailEnabled(enabled)` — `PUT /v1/email/inbox` with `{ enabled }` (design §9, flips capture on/paused). **`apiClient.js:205-212`**.

### SettingsPage.vue (`src/main-app/views/dashboard/SettingsPage.vue`) — "Email to Inbox" card
- [x] Add an "Email to Inbox" collapsible card matching the existing card pattern (`:46-73`); add its
  section key to the search-keyword map alongside `plan`. Card **`SettingsPage.vue:75-141`**; search-map
  key `emailInbox` **`:588`**.
- [x] Branch on `tier`: `free` → locked block; `pro`/`team` → full block. Reactive so a downgrade to
  `free` reverts to the locked block (E-6b) — kept address not shown. `isProOrTeam` **`:652`**; template
  branch `v-if="!isProOrTeam"` **`:84`** / `v-else` **`:82`**; tier `watch` clears state on downgrade
  **`:968-975`**.
- [x] **Free locked block** — 🔒 value line + `[Upgrade]` `Btn` → `upgradeModel().show(...)` (imported
  `:485`); `UpgradeModal` already globally mounted in `App.vue:6` (reused, not re-added). Markup
  **`:84-87`**; handler `onUpgradeEmail` **`:760-764`** (E-6).
- [x] **Pro/Team empty state** — value-prop line "Get a private email address. Forward anything to
  capture it instantly." + `[Generate Address]` primary `Btn` → `generateInboxEmail()`, then refresh card
  state from the GET. Markup **`:98-101`**; handler `onGenerateAddress` **`:694-705`** (E-1).
- [x] **Pro/Team address present** — address rendered in a `.settings-value` (monospace) + `[Copy]` `Btn`
  → "Copied!" for 2 s. Markup **`:105-112`**; handler `onCopyAddress` **`:707-717`** (E-2).
- [x] **Usage line** — renders **"Used today: N of {cap}"** from the `getInboxEmail()` response. **`:116`**
  (E-5).
- [x] **Reset address** — ghost `Btn` labelled "Reset address" → `confirm.show({...})` (reuses `confirm`);
  on confirm calls `regenerateInboxEmail()`, replaces the displayed address. Markup **`:134-135`**;
  handler `onResetAddress` **`:719-739`** (E-3).
- [x] **Capture toggle** — state-reflecting control reading "Capture is on" / "Capture is paused"
  (**`:122`**); flipping calls `setInboxEmailEnabled(val)` and updates local state. Reuses the existing
  `.settings-toggle` markup **`:125-129`**; `captureEnabled` computed **`:741-744`** → `onToggleCapture`
  **`:748-758`** (E-4).
- [x] **Load** — fetch `getInboxEmail()` on mount for Pro/Team (`onMounted` **`:961`**); 404 (no address
  yet) → empty state (**`:682-684`**); other errors surfaced via `toaster` (**`:685`**). `loadInboxEmail`
  **`:675-692`**.
- [x] Use only existing CSS tokens/text classes — no hardcoded colors/sizes/spacing, scoped styles only.
  New rules reuse `var(--lh-normal)` / `var(--font-family-mono)` and existing `.settings-*` classes
  **`:1379-1396`**.

### Reuse gates — ASK USER before creating (no existing component found)
- [x] **ASKED & RESOLVED BY REUSE** — user chose "Reuse `.settings-toggle`". The capture toggle reuses
  the existing in-file `.settings-toggle` checkbox-slider pattern already used by the Review/Notifications
  rows (no new component). Toggle markup **`SettingsPage.vue:125-129`**; styles already defined at
  `:1269-1321`.
- [x] **ASKED & APPROVED** — user chose "New clipboard util module". Created
  **`src/main-app/scripts/core/clipboardUtils.js:4`** (`copyText(text)` — Clipboard API with a textarea
  fallback); consumed by `onCopyAddress` (**`SettingsPage.vue:709`**).

### Verify (definition of done = the rendered card, not a green build)
- [~] Run the app and inspect the **rendered** card. **Done so far:** `npm run build:main` compiles &
  obfuscates the SFC clean; `npm run dev:main` boots and serves `/` HTTP 200. **REMAINING (DEFERRED TO
  USER):** the live per-state render (Pro/Team empty → Generate → address+Copy("Copied!")+usage+Reset+
  toggle; Free locked → Upgrade modal; downgrade revert) cannot be exercised headless here — it needs
  (a) the **email_service** backend endpoints `GET/POST/PUT /v1/email/inbox*`, which are a **separate
  backend slice (wna_backend), not implemented in this repo**, and (b) a logged-in user per tier
  (auth-guarded route). To verify locally: run the backend (or stub the 4 endpoints), log in as a
  Pro/Team user → open Settings → "Email to Inbox"; then as a Free user for the locked state.
- [x] Grep confirms 0 stale references — **nothing was renamed/removed** (additions only); and
  `grep -rn "v1/user/inbox-email" src/` → **0 matches** (no leftover paraphrased path).

## Orchestration spec sync
- [x] Update `specs/features/wna-features.md` — added the Settings "Email to Inbox" user-facing feature
  (Pro/Team card + Free locked state) as **§21.9**. Citation:
  **`wna_orchestration/specs/features/wna-features.md:1148`**.

---

## Done-when (this slice)
- The running main-app Settings page shows the "Email to Inbox" card with the full Pro/Team flow
  (empty-state value prop → Generate → display/Copy/usage/Reset/toggle) **and** the Free locked state
  with Upgrade → `UpgradeModal`, reverting reactively on downgrade — confirmed by inspecting the
  **rendered card**, not a green build.
- The four `apiClient.js` functions exist and follow the `:157-173` pattern; no endpoint shapes are
  restated here (they link design §9).
- The orchestration spec-sync box is `[x]` with a `wna_orchestration/specs/features/wna-features.md`
  `file:line` citation.
- Any new component/helper (switch, clipboard) was **approved by the user first** (the two ASK gates),
  or an existing one was reused.
