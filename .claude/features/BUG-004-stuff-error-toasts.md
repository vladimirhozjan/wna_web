# BUG-004 (web slice): No error toast on 500/503/network failure when capturing Stuff

Parent / spec / root cause: `wna_orchestration/features/BUG-004-stuff-error-toasts.md`.
Do not restate the parent — this is the local checklist only. (All work on `main` — no branches.)
**Likely shares a root cause with [[BUG-003-resend-verification-429-toast]]** — fix the error-toast pipeline once.

## Checklist (web)
- [x] On `500` / `503` / network-failure (no response) from `POST /v1/stuff`, surface the exact spec
      toasts via the existing `errorModel().push(...)`. Cite `file:line` for each. Exact strings
      (`wna-features.md:1789-1791`):
      - `500` → "Internal server error. Please try again later."
      - `503` → "Service unavailable. Please try again later."
      - network (no response) → "No response from server. Check your connection."
      → All produced by `normalizeError` in `scripts/core/apiClient.js`, the path `addStuff`
      (`apiClient.js:313-321`, `throw normalizeError(err)` at `:319`) feeds every capture handler:
      `500` → `scripts/core/apiClient.js:79-80`; `503` → `scripts/core/apiClient.js:81-82`;
      network (no response) → `scripts/core/apiClient.js:89-90` (pre-existing `error.request` branch).
      Handlers then push it: `components/TopNav.vue:296` (`toaster.push(e.message || …)`),
      `layouts/DashboardLayout.vue:93` (same), and `views/dashboard/InboxPage.vue:206-209` watcher.
      NOTE: `500`/`503` cases sit after the backend-message branch (`apiClient.js:57-61`), so a
      server-supplied body message still wins — identical behaviour to BUG-003's `429` fix; not changed here.
- [x] Confirm the capture handler (`components/QuickAddBtn.vue` → `scripts/models/stuffModel.js`) does
      not swallow the rejected promise before the toast fires — the `catch` must reach `errorModel`.
      → `QuickAddBtn.vue:24,43` only `emit("add", t)` — no API call there. The three real handlers all
      reach `errorModel`: `components/TopNav.vue:292-298` and `layouts/DashboardLayout.vue:85-95` catch
      and `toaster.push(e.message …)`; `views/dashboard/InboxPage.vue:278` deliberately swallows the
      re-throw but `stuffModel.addStuff` sets `error.value = err` before re-throwing
      (`scripts/models/stuffModel.js:108-110`), firing the `watch(error)` toaster at
      `InboxPage.vue:206-209`. No path discards the error before the toast.
- [x] Confirm the 500/503/network mapping lives in the shared status→message map
      (`scripts/core/apiClient.js` / `httpApi.js`) so it isn't a one-off literal — reuse, don't
      duplicate. Same pipeline BUG-003 touched.
      → Added to `normalizeError`'s shared `switch (status)` in `scripts/core/apiClient.js:79-82`
      (alongside BUG-003's `429` at `:77-78`); network branch already shared at `:89-90`. Used by every
      apiClient call, not a page-level literal.
- [x] Grep for any local/duplicate copy of the three spec strings added by mistake → confirm `0` extra
      copies outside the shared map.
      → `grep -rn "Internal server error\|Service unavailable\|No response from server" src/main-app`
      returns only: `apiClient.js:80,82,90` (the shared map) and the PRE-EXISTING separate
      scenario-based mapper `scripts/core/errorMapper.js:11-12` (used by auth flows login/register/etc.,
      NOT the `/v1/stuff` capture path — same independent system noted in BUG-003). `0` literals added
      by me at the page/handler level.

## User flows (this project's part)
Role-agnostic — any authenticated user capturing to Inbox. Web must render the matching toast on each
failure for:
- **Free / Pro:** show the 500 / 503 / network toast on failed capture. (same code path)
- **Team owner / member:** same — capture is personal, no team-specific behaviour.
- **Admin:** n/a — admin-app has no Inbox/capture surface.
- **Unauthenticated / not-entitled:** n/a — `POST /v1/stuff` requires an authenticated session; this
  flow is never reached unauthenticated.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass".
   Concrete artifact: capture an item while forcing a real 500, then 503, then offline, and confirm
   the red toast with the exact spec text renders each time.
3. **Leave zero references to anything you renamed/removed** — grep the source and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (role-agnostic here); don't silently implement
   only the happy path.
5. **No false "complete".** If a box is partial or blocked, mark `[ ]` and write exactly what's left.
   Overstating completion is the worst failure — it ships broken work as done.