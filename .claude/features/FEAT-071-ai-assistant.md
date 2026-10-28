# FEAT-071 — web slice: AI assistant (internal)

- Parent (single source of truth): `wna_orchestration/features/FEAT-071-ai-assistant.md`
- Decisions: `wna_orchestration/decisions.md` 2026-10-28 FEAT-071 (D1–D15), FEAT-071 (architect), FEAT-071 (owner
  D16–D26); parent `## Locked decisions D16–D26`. All locked — no box waits on an answer. D16 (a) is the owner's approval
  of the new component set: `assistantModel.js`, `AssistantPanel.vue`, `AssistantMemoryModal.vue`, `BuyCreditsPage.vue`,
  `BillingAddressForm.vue` (parent §Boundaries row web main-app) — no other new component without asking.
- Work: parent `## Work breakdown` §web (main-app W1–W15, admin-app A1–A3). The spec: parent `## Screens` S1–S9, A1–A3
  (every element, state, exact copy, desktop + 500px, click budget), `## Design` §Boundaries (rows web main-app /
  admin-app) + "Technical choices", §Contracts C1–C11, §Flows F1–F9; parent `## Data contract`; `## Legal impact`;
  `## Help impact`. API: `wna_orchestration/specs/api/api.md` / `admin-api.md` once backend B9 lands. Numbers:
  `contracts/limits.md` §AI assistant, `contracts/subscription-tiers.md` §AI credit packs. This slice does not restate
  them — read them there.
- Order (parent §Work breakdown): web runs after backend **B5–B8** on the local stack (W* / A* after "(B5, B6, B7, B8)");
  ui-tests come after. Inside: W1 (consumes B5, B6, B7) → W2 → W3 / W4; W5, W6, W7, W9, W15 consume W1; W8 consumes B7;
  W10 nothing; W11 the flag seed (deploy P1); A1–A3 consume B8 (A3 also B7). Work only in the `main` worktree.

## User flows (this project's part)
- Free user: types in Quick Add (TopNav / mobile +) or ⌘K — Enter still captures; "Tell AI what to do" row (⌘/Ctrl+↵)
  sends, "Open AI conversation" on an empty field while a conversation exists (W3, W4, D6, D18); the conversation opens
  in the right-docked panel / full screen on mobile with Changes, chips, Go ahead / Cancel confirm, Stop, out-of-credits
  card → Buy credits (W2, D16, D17, D19); open lists refresh after a reply with changes (W5); offline the row and composer
  are disabled, capture still works (W2–W4); Settings card: balance, model, memory, buy (W6); Buy credits page (W7) →
  gateway → return states (W6); history row (W8); canvas Convert with AI (W9); Delete account line for unused extra
  credits (W15, D20); Legal + Help texts. Flag `ai_assistant` off → none of it renders (W11, D26).
- Pro user: same as Free — no tier-specific screen (Screens S3 / S4 "Per tier"; numbers come from C1).
- Team owner: same as Pro — rights differences arrive as assistant reply text in S3; canvas Convert with AI for the
  project owner (W9).
- Team member: same; read-only refusals arrive as reply text; on a shared project the member sees no Convert with AI
  (W9, owner-only rule).
- Admin (relevant role `admin`): A1 `/ai-assistant` (models, monthly credits, packs), A2 `/ai-usage` (ledger by user /
  tier / model; deleted accounts read "Deleted user", D23), A3 user-detail "AI Credits" card with Add credits (admin and
  above only) + the `credit_pack` payment row (D20, D25).
- Unauthenticated / not-entitled: n/a — every tier has the assistant (D10); the admin pages follow the existing admin
  auth + minRole guard; gifted Pro / Team see what C1 gives.

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
### Main-app
- [x] **W1 `apiClient.js` C1–C10 + `scripts/models/assistantModel.js`** — account, conversation, send, poll every 2 s
  independent of the panel, stop, new conversation, memory, model, `onAssistantChange` register / unregister, offline
  from `offlineModel`, resume on load from `working_request_id` — per parent W1 / §Flows F1, F2, F4, F8.
  Data: C1 `GET /v1/assistant` + C2 `PUT /v1/assistant/model` (all C1 fields), C3 `GET/DELETE /v1/assistant/conversation`,
  C4 `POST /v1/assistant/messages` (`request_id`, `user_message`, `assistant_message`; errors `error`,
  `monthly_resets_at`, `model_name`), C5 `GET /v1/assistant/requests/{id}`, C6 `POST …/stop`, C8 `/v1/assistant/memory`
  — new, backend **B5**; C9 `POST /v1/assistant/canvas-convert` + C5 `proposal`, `skipped_count` — new, **B6**; C10
  `/v1/payments/credit-packs` (+ `/checkout`) — new, **B7**.
  → `src/main-app/scripts/core/apiClient.js:2475-2610` (C1–C10), `src/main-app/scripts/models/assistantModel.js:35` (`onAssistantChange`), `:44` (singleton; poll `:230`, stop `:270`, new conversation `:285`, canvas wait `:304`, resume on load `:348`). Chrome :5173: send, poll, follow-up, stop, error; resume after a reload while working by code (→ ui-tests U2).
- [x] **W2 Screen S3 — `AssistantPanel.vue`** — built per parent § Screens S3 (every element, every state + exact copy,
  desktop right-docked / mobile full screen); markdown via `marked` on HTML-escaped text, `http(s)` links only; Changes
  links per C3 `item_type` map; chips (incl. the D17 Go ahead / Cancel); Stop (D19); New conversation confirm; mounted
  once in `DashboardLayout` — per parent W2. Verify Chrome `:5173` desktop + 500px, every state.
  Data: `messages[].{id,role,text,created_at,request_id,status,error,changes[],changes_total,choices,upgrade_hint,
  summary,low_credits}` ← C3 / C5; `status` ← C6; `low`, `monthly_resets_at`, `models[]`, `selected_model_id` ← C1 —
  new, backend **B5**, via W1.
  → `src/main-app/components/AssistantPanel.vue` (markdown `:231-254`), mounted once `src/main-app/layouts/DashboardLayout.vue:52`, FAB hidden while open `:40`. Chrome :5173 desktop + 500px (iframe): working, done + Changes, follow-up chips, Stop → stopped, model_unavailable, over-cap counter, low-credits footnote, out-of-credits card, New conversation confirm → empty state, light + dark. Not run live (→ ui-tests U2): D17 Go ahead/Cancel gate, limit_reached, interrupted, not_enough_for_model, 409 busy, 503, 429, done-while-closed toast.
- [x] **W3 Screen S1 — Quick Add row** — `CaptureBar` quick variant + FAB bar row, built per parent § Screens S1: rules,
  ⌘/Ctrl+↵, offline, attachment hide, "Open AI conversation" (D18), text caps 4,000 / 20,000 as web constants (D22) +
  the `400 text_too_long` state — per parent W3. Verify Chrome `:5173` desktop + 500px, every state.
  Data: `has_conversation` ← C1; send + errors (incl. `text_too_long`) ← C4 — new, backend **B5**, via W1.
  → `src/main-app/components/CaptureBar.vue:96-112` (row), `:243-250` (rules), `:483-505` (send / ⌘↵). Chrome :5173: desktop row + ⌘↵ send, "Open AI conversation" on empty field, 500px FAB row + tap → full-screen panel. Offline + attachment-hide + text_too_long by code (→ ui-tests U1).
- [x] **W4 Screen S2 — Command palette** — `CommandPalette` Create row + "Open AI conversation" command (D18), built per
  parent § Screens S2 — per parent W4. Verify Chrome `:5173` desktop (palette is desktop only), every state.
  Data: `has_conversation` ← C1; send ← C4 — new, backend **B5**, via W1.
  → `src/main-app/components/CommandPalette.vue:127` (Open AI conversation command), `:167` (Create row, offline skipped). Chrome :5173: Go to list + Create last row.
- [x] **W5 `onAssistantChange` refresh** — pages register their existing refresh (Inbox, Next, Today, Calendar,
  Projects, Project detail, Waiting For, Someday, Completed, Trash, Engage, Overdue, Horizons, Stuff / Action / Recurring
  detail, Project templates) + `statsModel().refreshStats()` — per parent W5. Verify: "[tool:create_stuff …]" from the
  panel on Inbox shows the new row without reload.
  Data: each page's existing source, unchanged (parent Data contract "Lists reloaded…" row); trigger = C3/C5
  `changes_total` (B5, via W1).
  → `onAssistantChange` in Inbox/Next/Today/Calendar/Projects/ProjectDetail/WaitingFor/Someday/Completed/Trash/Engage/Overdue/Horizons/StuffDetail/ActionDetail/RecurringDetail/ProjectTemplates(+Detail) pages (next to `undo.registerRefresh`) + `statsModel().refreshStats()` in `assistantModel.js` `onRequestEnded`. Chrome :5173: `[tool:create_stuff …]` from the panel on Inbox → row "Call the plumber" + sidebar count appeared without reload.
- [x] **W6 Screen S4 + S4a — Settings card `assistant` + `AssistantMemoryModal.vue`** — built per parent § Screens S4
  (rows, `SECTION_KEYWORDS`, `/settings/assistant`, checkout return states) and S4a (every state + copy) — per parent
  W6. Verify Chrome `:5173` desktop + 500px, every state.
  Data: `total`, `requests_left`, `monthly_left`, `monthly_allowance`, `monthly_resets_at`, `purchased_left`,
  `purchased_next_expiry`, `models[]`, `selected_model_id` ← C1 / C2; `text`, `max_chars`, error `max_chars` ← C8 —
  new, backend **B5**, via W1. Return convergence = C1 `purchased_left` (Checkout convergence poll, `contracts/limits.md`).
  → Card `src/main-app/views/dashboard/SettingsPage.vue:152-226`, keywords + `/settings/assistant`, return states `:1179` (`applyCreditsReturn`), `src/main-app/components/AssistantMemoryModal.vue`. Chrome :5173 desktop + 500px: all rows incl. Extra credits, model select (widened to 380px so "… · 30 credits per request" fits; stacked full width at 500px), memory save. Checkout return states by code (→ ui-tests U4).
- [x] **W7 Screen S5 — `BillingAddressForm.vue` + `BuyCreditsPage.vue` `/buy-credits`** — billing block extracted from
  `UpgradePage.vue` and shared (D16; `/upgrade` unchanged — check it in Chrome), page built per parent § Screens S5 incl.
  the withdrawal line per Legal §5.4 (D20) — per parent W7. Verify Chrome `:5173` desktop + 500px, every state.
  Data: `packs[].{id,credits,price_minor,currency,requests_estimate}`, `validity_months` ← `GET /v1/payments/credit-packs`;
  `checkout_url` + errors ← `POST /v1/payments/credit-packs/checkout` — new, backend **B7**, via W1; `terms_version`,
  `eu_countries`, `fiscal_countries` ← `GET /v1/payments/status` (existing,
  `wna_backend/user_service/src/services/payment/payment_service_impl.cpp:442-459`).
  → `src/main-app/components/BillingAddressForm.vue` (used by `UpgradePage.vue:81` and `BuyCreditsPage.vue:55`), shared `.plan-card` CSS moved to `src/main-app/styles/globals.css`, route `src/main-app/router/router.js:57`. Chrome :5173: `/upgrade` unchanged; `/buy-credits` payments-off notice, load error + Retry, and — with stubbed pack/status responses in the page (the local test user has no `payments` flag) — pack cards, billing block, withdrawal line, Pay, desktop + 500px. Live checkout → gateway → return (→ ui-tests U4).
- [x] **W8 Screen S6 — Billing history row** — `BillingHistoryPage` label "AI credits · {status}" for `credit_pack`,
  built per parent § Screens S6; invoice opens / downloads as today. Verify Chrome `:5173` desktop + 500px with a local
  pack payment.
  Data: `kind` (new value `credit_pack`), `status`, amount fields, invoice ← `GET /v1/payments/history` (existing,
  `wna_backend/user_service/src/services/payment_admin/payment_admin_service_impl.cpp:93`); the value is added by backend **B7**.
  → `src/main-app/views/dashboard/BillingHistoryPage.vue:127`. No local pack payment to view (payments off for the local test user) → ui-tests U4.
- [x] **W9 Screen S7 + S7a — canvas Convert with AI** — toolbar + mobile menu, owner only, disabled rule;
  `CanvasConvertModal` AI mode (waiting, editable titles, "From:", left-out line, errors); `canvasModel.convert` takes
  `{title, source_ids}` (manual mode passes `{title: text, source_ids: [id]}` — unchanged behaviour); built per parent
  § Screens S7 / S7a — per parent W9. Verify Chrome `:5173` desktop + 500px, every state. Manual Turn into actions unchanged.
  Data: `request_id` + errors (`canvas_read_only`, `canvas_empty`, C4's) ← C9; `status`, `error`, `proposal[]`,
  `skipped_count` ← C5 — new, backend **B6**, via W1; tooltip credits ← C1 `models[].credits_per_request` (B5); idea text,
  `converted`, `parent_id`, project `shared` / `my_role` ← canvas read (existing, `canvasModel.js:59`); Add ← `POST /v1/action`
  (existing, `canvasModel.js:575`).
  → Toolbar + mobile menu `src/main-app/views/dashboard/ProjectCanvasPage.vue:20-24, 51-54, 207-217`; AI mode `src/main-app/components/canvas/CanvasConvertModal.vue:173`; `canvasModel.convert(rows)` `src/main-app/scripts/models/canvasModel.js:569`, 403 handler `onLostEditRights`. Chrome :5173: waiting → proposal (merge + skip per mock), title edit, Add → 2 actions in backlog in order + both merged ideas converted; manual Turn into actions unchanged; `canvas_empty` message; mobile ⋯ menu at 500px. Credits/model/busy/read-only errors by code (→ ui-tests U5).
- [x] **W10 Screen S8 — Keyboard shortcuts dialog** — `ShortcutsDialog` General block line ⌘↵ / Ctrl+↵, built per parent
  § Screens S8. Verify Chrome `:5173` (macOS and non-macOS key label).
  → `src/main-app/components/ShortcutsDialog.vue:43`. Chrome :5173 (macOS label ⌘↵; Ctrl+↵ by code).
- [x] **W11 Kill switch (D26)** — flag `ai_assistant` off (from `flagsModel`) → S1 / S2 rows + command, S3, S4 card +
  keywords, S7 button, S9 line not rendered; `/buy-credits` redirects to `/settings` — per parent W11. Verify with the
  flag off in admin.
  Data: `ai_assistant` ← `GET /v1/flags/public` (existing, `src/main-app/scripts/core/apiClient.js:327`); flag seeded by
  deploy **P1**.
  → Code: every entry is gated by `assistantModel().enabled` (`ai_assistant` from `flagsModel`) — `DashboardLayout.vue:52`, `CaptureBar.vue:243`, `CommandPalette.vue:127,167`, `ShortcutsDialog.vue:43`, `SettingsPage.vue:55,152`, `ProjectCanvasPage.vue:207`, redirect `BuyCreditsPage.vue:170`. Seen in Chrome with the flag removed in the page: Settings card hidden, `/buy-credits` → `/settings`. Reviewer J380 2026-10-28: flag OFF via admin covered by ui-tests U7 TC-1142–1144 (green) → done.
- [x] **W15 Screen S9 — Delete account modal line** "Your unused extra AI credits are lost too." while C1
  `purchased_left` > 0 (D20), built per parent § Screens S9 — per parent W15. Verify Chrome `:5173` desktop + 500px,
  with and without purchased credits.
  Data: `purchased_left` ← C1 `GET /v1/assistant` — new, backend **B5**, via W1.
  → `src/main-app/views/dashboard/SettingsPage.vue:55`. Chrome :5173: line shown with 5,000 extra credits (local grant batch), absent at 0.

### Legal (parent `## Legal impact`, W12 — `content/legal/`)
- [x] **Privacy Policy §2.11 AI Assistant (new)** — per parent § Legal impact.
  → `src/main-app/content/legal/privacy.md:144`
- [x] **Privacy Policy §3 table** — row "AI assistant (conversation, memory, usage)" — per parent.
  → `privacy.md:168`
- [x] **Privacy Policy §4** — the "carry out the requests you give the AI assistant" purpose — per parent.
  → `privacy.md:187`
- [x] **Privacy Policy §5.12 AI model processing (new)** — per parent, incl. its **Verify before ship** note (Google's
  Vertex AI partner-model data-governance page; adjust the wording if it does not confirm).
  → `privacy.md:259` — verified on Google docs: no prompt sharing with partner-model makers and no training (confirmed); EU multi-region data residency (confirmed); per-model EU support marks for Haiku/Sonnet 5.5 could not be read — check the live table before ship
- [x] **Privacy Policy §5.4** — Dinaro / Stripe "subscription and AI credit pack payments" — per parent.
  → `privacy.md:219, 223`
- [x] **Privacy Policy §6** — the EEA sentence — per parent.
  → `privacy.md:265`
- [x] **Privacy Policy §7 table** — rows open conversation, memory, credit balance and batches, usage records (D23) —
  per parent.
  → `privacy.md:295-298`
- [x] **ToS §2 Core Features** — the AI assistant bullet — per parent.
  → `src/main-app/content/legal/terms.md:49`
- [x] **ToS §5.8 AI Credits (new)** — per parent, incl. the refill rule (D21), when a request is charged (D19) and the
  goodwill sentence (D25).
  → `terms.md:194` (D21, D19, D25)
- [x] **ToS §5.4 Right of Withdrawal** — credit-pack text (D20) + the model form gains "AI credit pack" — per parent.
  → `terms.md:151`, model form `:160`
- [x] **ToS §5.5 Refunds** — packs non-refundable outside §5.4 — per parent.
  → `terms.md:178`
- [x] **ToS §9.7 / new §9.8 AI output** — per parent.
  → `terms.md:310` (new §9.8; §9.7 unchanged)
- [x] **"Last updated" of both files = ship date** = deploy P3 `legal.terms_version` (check `__TERMS_VERSION__` in the build).
  → both files already read October 28, 2026 = `legal.terms_version` "2026-10-28" in all three deploy configs; `__TERMS_VERSION__` is read from terms.md at build (`config/vite.core.js:139`)

### Help (parent `## Help impact`, W13 — `content/help/`)
- [x] **`gettingStarted.js` new "Working With the AI Assistant"** (after "Connecting an AI App") — per parent.
  → `src/main-app/content/help/gettingStarted.js:113`
- [x] **`gettingStarted.js` change "Quick Add — Capture From Anywhere"** — per parent.
  → `gettingStarted.js:33`
- [x] **`gettingStarted.js` change "Brainstorming a Project"** — per parent.
  → `gettingStarted.js:63`
- [x] **`faq.js` new "What is the AI assistant?"** — per parent.
  → `src/main-app/content/help/faq.js:252`
- [x] **`faq.js` new "How do AI credits work?"** — per parent, incl. when a request is charged (D19).
  → `faq.js:257`
- [x] **`faq.js` new "Can I buy more AI credits?"** — per parent, incl. withdrawal (D20).
  → `faq.js:262`
- [x] **`faq.js` new "What does the AI assistant remember about me?"** — per parent.
  → `faq.js:267`
- [x] **`faq.js` change "Are there keyboard shortcuts?"** — per parent.
  → `faq.js:363`
- [x] **`faq.js` change "What are the limits on each plan?"** — per parent (numbers from `contracts/limits.md` at write time).
  → `faq.js:279`
- [x] **`faq.js` change "Where can I find my invoices?"** — per parent.
  → `faq.js:305`
- [x] **`faq.js` change "Is my data secure?"** — per parent.
  → `faq.js:235`
- [x] **`bestPractices.js` new "Hand the Busywork to the AI — Then Check the Changes"** — per parent.
  → `src/main-app/content/help/bestPractices.js:93`

### Admin-app
- [x] **A1 Screen A1 — `/ai-assistant`** — Models table + Add / Edit modal incl. the three prices, Monthly credits,
  Packs; SidebarNav "AI Assistant" (minRole admin); apiClient — built per parent § Screens A1 (every card, error copy).
  Verify Chrome `:6173` (functional layout; admin UI polish out of scope).
  Data: C11 `models[].{id,vertex_model_id,display_name,offered,is_default,credits_per_request,context_tokens,
  conversation_tokens,price_*,avg_cost_eur_30d,requests_30d}` ← `GET/POST/PATCH /admin/ai/models`; `free/pro/team` ←
  `GET/PUT /admin/ai/tier-credits`; packs ← `GET/POST/PATCH /admin/ai/packs` — new, backend **B8**.
  → Built: route `src/admin-app/router/router.js:185`, sidebar `src/admin-app/components/SidebarNav.vue:103` (bolt icon), `src/admin-app/views/AiAssistantPage.vue`, apiClient `src/admin-app/scripts/core/apiClient.js:1147-1246`; `npm run build:admin` green. Reviewer J380 2026-10-28: code verified against Screens A1 (acceptance review); admin-app Chrome check out of scope (owner: admin UI polish not reviewed) → done.
- [x] **A2 Screen A2 — `/ai-usage`** — filters, group by, Stat tiles, table, user row → user detail, "Deleted user" row
  (D23); SidebarNav "AI Usage" (minRole admin) — built per parent § Screens A2 (every state). Verify Chrome `:6173`.
  Data: `totals.{requests,tokens_in,tokens_out,cost_eur,credits}`, `rows[].{key,name,user_id,requests,tokens_in,
  tokens_out,cost_eur,credits}` (no `user_id` = deleted account) ← `GET /admin/ai/usage` — new, backend **B8**.
  → Built: route `router.js:191`, sidebar `SidebarNav.vue:109`, `src/admin-app/views/AiUsagePage.vue`; build green. Reviewer J380 2026-10-28: code verified against Screens (acceptance review); admin-app Chrome check out of scope → done.
- [x] **A3 Screen A3 — user detail "AI Credits" card + `credit_pack` payment row** (D25, D20) — card for role admin and
  above only, balance rows + Add credits modal (credits, reason), every error copy; the user's Payments list
  `credit_pack` row "{remaining} of {credits} left · expires {date}" — built per parent § Screens A3. Verify Chrome `:6173`.
  Data: `total`, `monthly_left`, `monthly_allowance`, `monthly_resets_at`, `purchased_left`, `purchased_next_expiry`,
  `validity_months` ← `GET /admin/platform-users/{id}/ai-credits`; add ← `POST` same path — new, backend **B8**;
  `credit_pack.{credits,remaining,expires_at}` on the admin user payments rows — new, backend **B7**.
  → Built: card `src/admin-app/views/UserDetailPage.vue:275` (+ modal `:308`), payments row + Kind filter `src/admin-app/views/UserPaymentsPage.vue:38,146`; build green. Reviewer J380 2026-10-28: code verified against Screens (acceptance review); admin-app Chrome check out of scope → done.

### Specs
- [x] **W14 Update `wna_orchestration/specs/features/wna-features.md`** — main route `/buy-credits`, admin routes
  `/ai-assistant`, `/ai-usage`, S1–S9, A1–A3 — per parent W14.
  → `wna_orchestration/specs/features/wna-features.md` §41 AI Assistant (new, `:3453`), §21.15, §9.3, §21.2, §21.3, §22.1, §37.1–37.3, admin pages AI Assistant / AI Usage, User detail AI Credits card, payments Kind filter.
- [x] **Update `wna_orchestration/contracts/limits.md` §AI assistant** — poll 2 s (W1) — per parent `## Contracts touched`.
  → `wna_orchestration/contracts/limits.md:152`.
- [x] **W14 List new / stale TCs for ui-tests** in the output (never edit `wna-test-cases.md`).
  → Listed in the implementer output (ui-tests owns `wna-test-cases.md`).

### Review fixes (reviewer J380) — Chrome :5173 desktop (1280px) + 500px
- [x] **R1 S4a confirm under the memory modal** → `src/main-app/components/ConfirmDialog.vue:48` (100000, above every
  Modal / picker), `src/main-app/components/ErrorToaster.vue:42` (100001, toasts stay on top). Global, so every
  `confirm.show` from an open Modal is fixed. Chrome: Clear → confirm on top → toast "Memory cleared", field and server
  empty; Cancel keeps the text.
- [x] **R2 refresh on canvas / Connections / Search** → `src/main-app/scripts/models/canvasModel.js:242`
  (`refreshFromServer`: pending save first, 409 → existing conflict path, the idea being typed survives),
  `views/dashboard/ProjectCanvasPage.vue:239`, `views/dashboard/ConnectionsPage.vue:325`,
  `views/dashboard/SearchPage.vue:116`; editing ids exposed from `CanvasMap.vue` / `CanvasDrillDown.vue`. Chrome:
  `[tool:add_canvas_idea …]` shows the idea on the map (desktop) and in the drill-down (500px) without reload; with an
  idea open in the editor the new idea appears, the typed text stays and saves without a conflict.
- [x] **R3 S5 withdrawal line above fiscal notice and Terms** → named slot `src/main-app/components/BillingAddressForm.vue:64`,
  used at `views/dashboard/BuyCreditsPage.vue:56`. Chrome: SI = hint · withdrawal · fiscal · tick · Pay; DE = hint ·
  withdrawal · tick · Pay; US = hint · withdrawal · Terms line · Pay; `/upgrade` with SI unchanged (hint · fiscal ·
  Renews · tick · Subscribe).
- [x] **R4 S3 ⋯ menu icons** → `src/main-app/components/AssistantPanel.vue:22` `RecurringIcon` (2px stroke, viewBox 24, the
  SettingsIcon weight). Chrome desktop.
- [x] **R5 S3 mobile composer** → `AssistantPanel.vue:733-743`: field and Send / Stop `min-height: var(--touch-target-min)`,
  bottom-aligned; desktop unchanged. Chrome 500px: both 44px, same bottom.
- [x] **R6 S4 Model select** → `views/dashboard/SettingsPage.vue:2316-2321`: 260px, trigger padding as the other Settings
  selects. Chrome: 260×33 (all Settings selects 33px), long name ellipsized; 500px stacked full width.
- [x] **R7 S7a title editor = Item inline edit** → `components/canvas/CanvasConvertModal.vue:345` (no box, action underline,
  title metrics; redundant mobile font rule removed). Chrome desktop + 500px: text top / left and row height unchanged
  when editing starts. Plus: proposal ideas the local canvas does not know (added elsewhere) load first, so "From:"
  always names them (`:190`).
- [x] **R8 S1 paste with empty field** → `components/CaptureBar.vue:497` (`splitPasted`: first line → `text`, capped at the
  typed limit, the rest → `pasted_text`). Chrome: 100-line paste (10,403 chars), field cleared → sent text 102 /
  pasted 10,286, no over-cap; one 10,000-char line → 4,000 / 6,000.
- [x] **A1 owner answer (Make default only in Edit)** → `src/admin-app/views/AiAssistantPage.vue:118` + body rule; build
  green. Chrome on :6173 still not possible (admin TOTP).

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
   and their schedules, and new pages/routes. Specs describe what the code/config IS, never per-env rollout state: no
   "applied to dev", "not yet on prod", "to be applied" notes — the home for applied migration state is
   `wna_deploy/backend/db_tools/sql/*/MIGRATION_VERSION`, for deployed config `wna_deploy/backend/gce/config/<env>/`
   and `vm/wna/<env>/`. Test cases (`specs/tests/wna-test-cases.md`) are authored by ui-tests only — list them, never edit.
7. **Run only the NEW and directly-relevant checks — never a full regression during slice work**
   (owner directive 2026-08-19): `npm run build:main` / `npm run build:admin` plus the Chrome check of the states you
   touched (`:5173` main, `:6173` admin; desktop + 500px for main-app). The full regression suite is run by the OWNER
   before deploy — never by the implementer.
8. **Test and verify LOCALLY only — never on dev/prod** (owner directive). Every check targets the
   local stack (`http://localhost:5173` / `:6173`, dev servers run by `wnapm`, local backend + mocks). Never deploy,
   never test against `dev.whatsnextaction.com` / `api-dev` / the VM, never add a "verify on dev" / "needs a dev
   deploy" step. A missing dev/prod run is never a reason for `[~]`. Env values are the **deploy** slice's; a task closes
   on local checks alone — never wait for a dev or prod confirmation.
