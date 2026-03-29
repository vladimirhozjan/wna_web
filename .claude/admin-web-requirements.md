# WNA Admin Panel - Frontend Implementation Plan

This document is the **Web AI handoff** for implementing the admin-app frontend. It references the backend API specification (`admin-api.md`) and the full requirements document (`admin-requirements.md`) in the backend repo.

Backend API reference: `../wna_backend/.claude/admin-api.md`
Full requirements: `../wna_backend/.claude/admin-requirements.md`
Implementation guidelines: `.claude/general-guidelines.md`

---

## Architecture Overview

The admin-app is a separate Vue 3 SPA living in `src/admin-app/` within the same `wna_web` monorepo. It shares the build tooling (Vite, config/) and package.json with main-app but has its own entry point, router, layouts, styles, and components.

**Key differences from main-app:**
- Separate domain: `admin-dev.whatsnextaction.com` (dev) / `admin.whatsnextaction.com` (prod)
- Separate backend: `admin_service` on port 8004 (not through router_service on 8000)
- Separate auth: admin-specific JWT (different secret, issuer `wna.admin.service`, audience `wna.admin`)
- No Google OAuth — email + password + OTP only
- No drag-and-drop, no GTD domain logic
- Data tables and forms instead of task lists
- Role-based UI visibility (sidebar items, action buttons)

**Shared with main-app (reuse via `@/` imports where appropriate):**
- Design token CSS files can be forked/adapted (admin may use a distinct accent color)
- Btn, Inpt component patterns (re-implement for admin, don't import from main-app)
- Singleton model pattern (errorModel, confirmModel, authModel — same structure, different implementation)
- httpApi pattern (same Axios interceptor architecture, different base URL and token keys)

---

## Step-by-Step Implementation Plan

### Phase 0: Scaffolding & Infrastructure

#### Step 0.1 — Admin App Skeleton
Create the base directory structure mirroring main-app conventions:

```
src/admin-app/
├── main.js                    # Vue app entry point
├── App.vue                    # Root component (<RouterView />, ErrorToaster, ConfirmDialog)
├── index.html                 # HTML shell with splash screen (admin-branded)
├── router/
│   └── router.js              # Vue Router with auth + OTP guards
├── scripts/
│   └── core/
│       ├── domains.js         # Runtime config (ADMIN_API_DOMAIN)
│       ├── httpApi.js          # Axios instance for admin_service
│       ├── apiClient.js        # API wrapper functions
│       ├── authModel.js        # Admin auth state (JWT + OTP flow)
│       ├── errorModel.js       # Toast notifications (reuse pattern from main-app)
│       └── confirmModel.js     # Confirm dialog model
├── layouts/
│   ├── AuthLayout.vue          # Login/reset/OTP pages (no sidebar)
│   └── AdminLayout.vue         # Main layout (sidebar + topnav + content)
├── components/                 # Reusable admin components
├── views/                      # Route-level page components
├── assets/                     # Admin-specific icons
└── styles/
    ├── globals.css             # Global styles import
    ├── tokens/                 # Admin design tokens (forked from main-app, different accent)
    └── themes/                 # Light/dark theme support
```

**Files to create:**
1. `src/admin-app/index.html` — HTML shell. Same pattern as main-app but title "WNA Admin", different splash color scheme (use a darker/professional palette). Must include `<script src="/config.js"></script>` for runtime config.
2. `src/admin-app/main.js` — Import globals.css, create Vue app, install router, mount.
3. `src/admin-app/App.vue` — `<RouterView />`, `<ErrorToaster />`, `<ConfirmDialog />`

#### Step 0.2 — Runtime Config & HTTP Layer
1. `domains.js` — Read `window.RUNTIME_CONFIG.ADMIN_API_DOMAIN`. Dev fallback: empty string (use Vite proxy).
2. `httpApi.js` — Axios instance with:
   - `baseURL` from `getDomains().base_url`
   - Request interceptor: attach `Authorization: Bearer <token>` from localStorage
   - Auto-refresh JWT before expiry (same 60s-before-expiry pattern as main-app)
   - On 401: clear auth state, redirect to login
   - localStorage keys: `admin_auth_token`, `admin_refresh_token` (prefixed to avoid collision if same browser has main-app open)
3. `apiClient.js` — Start empty, add functions as features are implemented
4. `errorModel.js` — Same singleton pattern as main-app (push/success/remove, max 5 toasts, auto-dismiss)
5. `confirmModel.js` — Same singleton pattern as main-app (show returns Promise<boolean>)

#### Step 0.3 — Vite Dev Server Proxy
Update `config/vite.core.js` or add admin-specific proxy config:
- Admin app needs `/auth/*`, `/admin/*`, `/dashboard/*`, `/users/*`, etc. proxied to `http://localhost:8004` (admin_service)
- Since admin_service doesn't go through router_service, the proxy target is different
- Add to admin-app's Vite config: all API paths proxy to `http://localhost:8004`

#### Step 0.4 — Base Styles
Fork main-app's design token structure but with admin-specific adjustments:
- Professional color palette (darker primary, less playful than main-app)
- Same typography system (Montserrat body, can keep or change heading font)
- Same component token structure (buttons, inputs, modals, toasts)
- Light/dark theme support from the start
- Admin-specific tokens: status badges (active/disabled/pending), role badges, severity colors for alerts

---

### Phase 1: Authentication Flow (P0)

The admin auth flow is multi-step and must be completed before any admin pages are accessible. This is the most critical path.

#### Step 1.1 — Auth Model (`authModel.js`)
Singleton managing admin auth state:

**State (refs):**
- `currentAdmin` — `{ id, email, role, status }` from JWT claims
- `isAuthenticated` — computed: token exists and not expired
- `isPendingOtp` — computed: `currentAdmin.status === 'pending_otp_setup'`
- `loading`, `error`

**Methods:**
- `login(email, password, otpCode?)` — POST `/auth/login`. Two modes:
  - If admin status is `pending_otp_setup`: send email + password only, receive JWT with `pending_otp_setup` status
  - If admin status is `active`: send email + password + OTP code, receive JWT with `active` status
- `setPassword(token, password)` — POST `/auth/set-password`
- `getOtpSetup()` — GET `/auth/otp/setup` (returns secret + otpauth_uri for QR code)
- `confirmOtp(code)` — POST `/auth/otp/confirm`
- `logout()` — Clear tokens, redirect to login
- `loadAdmin()` — Decode JWT claims to populate currentAdmin
- `init()` — Restore auth state from localStorage on mount

**localStorage keys:** `admin_auth_token`, `admin_refresh_token`, `admin_current_user`

#### Step 1.2 — Router with Auth Guards
```
Public routes (AuthLayout):
  /login              → LoginPage
  /set-password       → SetPasswordPage (token from URL query, enter new password)

OTP-only routes (AuthLayout, requires JWT with pending_otp_setup):
  /otp-setup          → OtpSetupPage (show QR code, confirm code)

Protected routes (AdminLayout, requires JWT with active status):
  /                   → DashboardPage (redirect)
  /dashboard          → DashboardPage
  /users              → UsersPage
  /users/:id          → UserDetailPage
  /admins             → AdminUsersPage
  /admins/:id         → AdminUserDetailPage
  /content/:userId    → ContentBrowserPage
  /gdpr               → GdprRequestsPage
  /health             → SystemHealthPage
  /analytics          → AnalyticsPage
  /audit              → AuditLogPage
  /feature-flags      → FeatureFlagsPage
  /settings           → AdminSettingsPage (change password, re-configure OTP)
```

**Guards:**
- `beforeEach`: Check `isAuthenticated`. If not → redirect to `/login`
- If authenticated but `isPendingOtp` → redirect to `/otp-setup` (block all other routes)
- If authenticated and active → allow based on route's `meta.minRole`
- Route meta: `{ requiresAuth: true, minRole: 'viewer' | 'support' | 'admin' | 'super_admin' }`

#### Step 1.3 — Login Page
- Email + password form
- No "Forgot password?" link — password resets are initiated only by a `super_admin` from the Admin Users management page
- On submit: call `authModel.login(email, password)`
- If response JWT has `status=pending_otp_setup` → redirect to `/otp-setup`
- If admin is already `active`, show OTP code field in the same form (third field appears)
- Error handling: show inline errors for invalid credentials, account disabled, lockout (5 attempts / 15 min)
- No Google OAuth, no social login, no registration

#### Step 1.4 — Set Password Page
This is the shared entry point for two flows — both land on the same page:
1. **New admin onboarding** — super_admin creates account → email sent → admin clicks link → sets password
2. **Forced password reset** — super_admin triggers reset → email sent → admin clicks link → sets new password

After setting the password, both flows continue identically: login → OTP setup (if needed) → active.

- Reads `token` from URL query parameter (e.g., `/set-password?token=abc123`)
- Password + confirm password fields
- Client-side validation: min 12 chars, uppercase, lowercase, number, special char
- Password strength indicator
- On submit: call `authModel.setPassword(token, password)`
- On success: show message "Password set. Please log in." → redirect to `/login`
- Error handling: invalid/expired token, password too weak

#### Step 1.5 — OTP Setup Page
- Requires JWT (user just logged in with `pending_otp_setup` status)
- On mount: call `authModel.getOtpSetup()` to get `otpauth_uri`
- Display QR code (use a lightweight QR code library — add `qrcode` npm package)
- Also show the secret as plain text (for manual entry)
- 6-digit code input field
- On submit: call `authModel.confirmOtp(code)`
- On success: JWT status transitions to `active` → redirect to `/dashboard`
- Instructions text: "Scan this QR code with Google Authenticator or similar TOTP app"

**New dependency needed:** `qrcode` (lightweight QR code generation for the OTP setup)

---

### Phase 2: Admin Layout & Navigation (P1)

#### Step 2.1 — AdminLayout
Main layout for all authenticated pages:
- **Structure:** Sidebar (left, fixed 260px) + TopNav (top) + Content area (scrollable)
- **Sidebar:** Admin profile at top (email, role badge, status indicator), navigation items, logout at bottom
- **TopNav:** Page title, breadcrumbs (optional), admin name
- **Content:** `<slot />` for page content
- Mobile: Sidebar collapses to hamburger drawer (same pattern as main-app's SidebarDrawer)

#### Step 2.2 — Sidebar Navigation
Role-based visibility of sidebar items:

| Item | Icon | Route | Min Role |
|------|------|-------|----------|
| Dashboard | grid icon | `/dashboard` | `viewer` |
| Users | users icon | `/users` | `support` |
| Content & Data | folder icon | `/content` | `support` |
| GDPR Requests | shield icon | `/gdpr` | `admin` |
| System Health | heart-pulse icon | `/health` | `viewer` |
| Analytics | chart icon | `/analytics` | `viewer` |
| Audit Log | scroll icon | `/audit` | `admin` |
| Feature Flags | flag icon | `/feature-flags` | `admin` |
| Admin Users | user-cog icon | `/admins` | `super_admin` |

**Implementation:**
- Define navigation items as an array with `{ label, icon, route, minRole }`
- Filter items based on `currentAdmin.role` using a role hierarchy helper: `super_admin > admin > support > viewer`
- Active item highlighted based on current route
- Counts/badges next to items where applicable (e.g., pending GDPR requests count)

#### Step 2.3 — Admin Profile Section (Sidebar Top)
- Display: admin email, role badge (colored), status dot (green for active)
- Click → dropdown with:
  - "Change Password" → opens modal or navigates to `/settings`
  - "Re-configure OTP" → opens OTP re-enrollment flow
  - "Logout" → `authModel.logout()`

#### Step 2.4 — AuthLayout
Minimal layout for login/reset/OTP pages:
- Centered card on a background
- Admin branding (WNA Admin logo/text)
- No sidebar, no navigation
- Responsive

#### Step 2.5 — Base Components
Re-implement (not import from main-app) the essential components:
- **Btn.vue** — Same variant/size API: primary, ghost, danger, ghost-danger, icon. Loading state.
- **Inpt.vue** — Same props: title, placeholder, type, disabled, error. v-model.
- **ErrorToaster.vue** — Same as main-app (fixed bottom-center, TransitionGroup, z-index 99999)
- **ConfirmDialog.vue** — Same as main-app (teleport to body, ESC to cancel)
- **Dropdown.vue** — Trigger + dropdown content, click-outside to close
- **Modal.vue** — Generic modal wrapper with overlay, close button, slots (header, body, footer)
- **Badge.vue** — Role badges (super_admin, admin, support, viewer) and status badges (active, pending, disabled)
- **DataTable.vue** — Reusable data table with: sortable columns, pagination controls, loading state, empty state, row click handler. This is the core admin component (replaces ItemList from main-app).
- **Pagination.vue** — Page navigation: prev/next, page numbers, page size selector
- **SearchInput.vue** — Input with search icon, debounced input event, clear button
- **StatusDot.vue** — Colored dot indicator (green, yellow, red, gray)
- **Card.vue** — Dashboard widget card with title, optional subtitle, content slot
- **Stat.vue** — Single statistic display (label + value + optional trend indicator)
- **Spinner.vue** — Loading spinner (reuse splash screen animation style)

---

### Phase 3: Dashboard (P1)

#### Step 3.1 — Dashboard Page
Grid layout of widget cards. All data is read-only. Auto-refresh every 30 seconds (configurable).

**Widgets (each is a Card component):**

1. **System Health** — Call health/version endpoints of all services. Show status dot (green/yellow/red) + version per service. Overall status indicator.
2. **User Overview** — Total users, new signups today/this week, DAU, active sessions. Numbers with small trend arrows.
3. **Platform Activity** — Total actions/projects/stuff, completions today/this week, avg inbox size.
4. **Recent Admin Activity** — Last 10 audit log entries in a compact list (admin email, action, timestamp).
5. **Security Alerts** — Failed admin logins (24h), failed user logins above threshold, flagged accounts.
6. **Pending GDPR** — Open export requests count, open deletion requests count. Links to GDPR page.
7. **Quick Actions** — Links to user search, health detail, audit log, feature flags.

#### Step 3.2 — Dashboard API Client Functions
Add to `apiClient.js`:
- `getDashboardHealth()` — calls health endpoints of all services
- `getDashboardUsers()` — user overview stats
- `getDashboardActivity()` — platform activity stats
- `getRecentAuditLog(limit)` — last N audit log entries
- `getSecurityAlerts()` — failed login counts
- `getPendingGdprRequests()` — pending GDPR request counts

#### Step 3.3 — Dashboard Model (`dashboardModel.js`)
Singleton model managing dashboard state:
- All widget data as reactive refs
- `refresh()` method that fetches all dashboard data in parallel
- Auto-refresh timer (setInterval, cleared on unmount)
- Loading states per widget

---

### Phase 4: Admin User Management (P0 — super_admin only)

#### Step 4.1 — Admin Users List Page
- DataTable showing all admin users
- Columns: email, role (badge), status (badge), last login, created date
- "Create Admin" button (opens modal)
- Row click → navigate to admin detail

#### Step 4.2 — Create Admin Modal
- Form: email + role selector (dropdown: admin, support, viewer — not super_admin)
- On submit: POST to create admin endpoint
- Shows confirmation: "Password reset email will be sent to {email}"
- On success: toast "Admin created", refresh list

#### Step 4.3 — Admin User Detail Page
- Display: email, role, status, created by, created at, last login
- Actions (buttons):
  - "Change Role" — dropdown to select new role. Confirmation required.
  - "Disable Account" / "Enable Account" — toggle based on current status
  - "Force Password Reset" — confirmation required, invalidates password + OTP
  - "Re-send Reset Email" — for admins in `pending_reset` status
- Cannot modify own account's role or disable self
- All actions are audit-logged (handled by backend)

#### Step 4.4 — Admin Users API Client
Add to `apiClient.js`:
- `listAdmins()` — GET admin users list
- `createAdmin(email, role)` — POST create admin
- `updateAdminRole(id, role)` — PATCH change role
- `disableAdmin(id)` — PATCH disable
- `enableAdmin(id)` — PATCH enable
- `forcePasswordReset(id)` — POST force reset
- `resendResetEmail(id)` — POST resend

---

### Phase 5: Platform User Management (P1)

#### Step 5.1 — Users List Page
- DataTable with pagination (cursor-based or offset-based per backend API)
- Columns: email, created date, last login, status
- Search bar (search by email)
- Sort options: created date, last login, email
- Filter: status (active/disabled)
- Row click → navigate to `/users/:id`

#### Step 5.2 — User Detail Page
Tabs or sections:
1. **Profile** — email, name, created date, last login, login provider, account status
2. **WNA Summary** — item counts by type and state (stuff, actions by state, projects active/completed, tags)
3. **Login History** — last 10 logins (timestamp, IP, device)

**Actions** (based on admin role):
- Disable/Enable account (`admin`+)
- Delete account (`super_admin`) — requires typing user email as confirmation
- Reset password (`admin`+) — triggers reset email to user
- Force logout (`admin`+) — invalidates sessions
- "Browse Data" link → `/content/:userId`

#### Step 5.3 — Users API Client
Add to `apiClient.js`:
- `listUsers(params)` — GET with search, sort, filter, pagination
- `getUser(id)` — GET user detail
- `getUserSummary(id)` — GET WNA data summary
- `getUserLoginHistory(id)` — GET login history
- `disableUser(id)` — PATCH
- `enableUser(id)` — PATCH
- `deleteUser(id)` — DELETE (requires confirmation)
- `resetUserPassword(id)` — POST
- `forceLogoutUser(id)` — POST

---

### Phase 6: Content & Data Oversight (P2)

#### Step 6.1 — Content Browser Page
Route: `/content/:userId`
Tab-based browser for a specific user's WNA data (all read-only):

**Tabs:**
- Inbox — stuff items list
- Actions — filterable by state (next, calendar, waiting, someday, completed, trashed)
- Projects — active and completed, expandable to show actions
- Tags — list of user's tags
- Attachments — grid/list of uploaded files (viewable, downloadable)
- Reference — reference materials

Each tab shows items in a DataTable or appropriate list view.

#### Step 6.2 — Content API Client
- `getUserInbox(userId)` — GET user's stuff items
- `getUserActions(userId, state?)` — GET user's actions
- `getUserProjects(userId)` — GET user's projects
- `getUserTags(userId)` — GET user's tags
- `getUserAttachments(userId)` — GET user's attachments
- `getUserReferences(userId)` — GET user's reference items
- `downloadAttachment(userId, attachmentId)` — GET file download

---

### Phase 7: System Health (P1)

#### Step 7.1 — System Health Page
Full-page version of the dashboard health widget:
- Card per service (router, user, core, admin, notification)
- Each card shows: status dot, service name, version, git commit, build time, uptime
- Auto-refresh toggle with configurable interval (default 30s)
- History: last 10 health check results per service (simple timeline)

#### Step 7.2 — Active Users Section
- Current active sessions (last 15 min)
- DAU / WAU / MAU numbers
- Chart: active users over time (daily for last 30 days)

**Chart library:** Consider adding a lightweight charting dependency (e.g., `chart.js` or use CSS-only bar charts for V1 simplicity).

#### Step 7.3 — Health API Client
- `getServiceHealth(service)` — GET /version for each service
- `getAllServicesHealth()` — parallel calls to all services
- `getActiveUsers()` — GET active user stats

---

### Phase 8: Audit Log (P1)

#### Step 8.1 — Audit Log Page
- DataTable with filters and pagination
- Columns: timestamp, admin (email), action, target type, target ID, details (expandable), IP
- Filters: admin selector, action type, target type, date range
- Export button (`super_admin` only) — download as CSV/JSON
- Click row → expand to show full JSON details

#### Step 8.2 — Audit API Client
- `getAuditLog(params)` — GET with filters, pagination
- `exportAuditLog(params)` — GET export (CSV/JSON download)

---

### Phase 9: GDPR & Compliance (P2)

#### Step 9.1 — GDPR Requests Page
- DataTable showing all GDPR requests
- Columns: user email, request type (export/deletion), status, requested by, requested at, completed at
- Filter by: type, status
- Actions per row:
  - View details
  - Download export (if completed export)
  - Cancel deletion (if pending, `super_admin` only)

#### Step 9.2 — Trigger GDPR Actions
- "New Export Request" button → select user → trigger data export
- "New Deletion Request" button → select user → confirm with email typing → trigger deletion
- Both show progress/status updates

#### Step 9.3 — GDPR API Client
- `listGdprRequests(params)` — GET with filters
- `createExportRequest(userId)` — POST
- `createDeletionRequest(userId)` — POST
- `cancelDeletionRequest(requestId)` — PATCH
- `downloadExport(requestId)` — GET file

---

### Phase 10: Analytics (P2)

#### Step 10.1 — Analytics Page
Sections with charts and stats:
1. **Signup & Growth** — registrations over time (daily/weekly/monthly), cumulative growth, source breakdown
2. **Retention** (V2) — Day-1/7/30 rates, cohort table
3. **Feature Usage** — users by bucket usage, project adoption, tag usage
4. **WNA Health** — avg inbox size, stale actions, empty projects, completion rates

For V1: focus on simple number displays and basic bar charts. Full charting in V2.

#### Step 10.2 — Analytics API Client
- `getSignupStats(period)` — GET signup data
- `getActiveUserStats()` — GET DAU/WAU/MAU
- `getFeatureUsageStats()` — GET feature usage breakdown
- `getPlatformHealthStats()` — GET WNA health indicators

---

### Phase 11: System Configuration (P2)

#### Step 11.1 — Feature Flags Page
- DataTable of feature flags
- Columns: flag name, description, enabled (toggle), segment (all/percentage/specific users), updated at
- Click row → edit modal
- "Create Flag" button → modal with name, description, segment config

#### Step 11.2 — Feature Flags API Client
- `listFeatureFlags()` — GET all flags
- `createFeatureFlag(data)` — POST
- `updateFeatureFlag(id, data)` — PATCH
- `deleteFeatureFlag(id)` — DELETE

---

### Phase 12: Admin Settings (P1)

#### Step 12.1 — Settings Page
Route: `/settings`
Admin can manage their own account:
1. **Change Password** — current password + new password + confirm. Same validation rules as set-password.
2. **Re-configure OTP** — requires current OTP code to verify identity, then shows new QR code, confirm new code. OTP transitions directly from old to new (never disabled).

---

## Implementation Priority Order

Based on dependencies and the backend checklist status:

**Sprint 1 (Foundation): DONE**
1. ~~Step 0.1 — Scaffold (directory structure, index.html, main.js, App.vue)~~
2. ~~Step 0.2 — HTTP layer (domains, httpApi, apiClient, errorModel, confirmModel)~~
3. ~~Step 0.3 — Vite proxy config~~
4. ~~Step 0.4 — Base styles (tokens, globals, themes)~~
5. ~~Step 2.5 — Base components (Btn, Inpt, ErrorToaster, ConfirmDialog, Modal, Badge, DataTable)~~
6. ~~Step 1.1 — Auth model~~
7. ~~Step 1.2 — Router with guards~~
8. ~~Step 2.4 — AuthLayout~~

**Sprint 2 (Auth Flow): DONE**
9. ~~Step 1.3 — Login page~~
10. ~~Step 1.4 — Set password page~~
11. ~~Step 1.5 — OTP setup page (+ add `qrcode` dependency)~~

**Sprint 3 (Layout & Navigation): DONE**
13. ~~Step 2.1 — AdminLayout~~
14. ~~Step 2.2 — Sidebar navigation~~
15. ~~Step 2.3 — Admin profile section~~
16. ~~Step 3.1-3.3 — Dashboard page + model~~ (partial: health + audit + quick actions implemented; user overview, platform activity, security alerts, GDPR widgets awaiting backend endpoints)

**Sprint 4 (Core Management):**
17. Step 4.1-4.4 — Admin user management
18. Step 5.1-5.3 — Platform user management
19. Step 8.1-8.2 — Audit log

**Sprint 5 (Extended Features):**
20. Step 7.1-7.3 — System health
21. Step 12.1 — Admin settings (change password, re-configure OTP)
22. Step 6.1-6.2 — Content browser

**Sprint 6 (Compliance & Analytics):**
23. Step 9.1-9.3 — GDPR requests
24. Step 10.1-10.2 — Analytics
25. Step 11.1-11.2 — Feature flags

---

## Role Hierarchy Helper

Used throughout the app to check permissions:

```javascript
const ROLE_LEVELS = {
  viewer: 0,
  support: 1,
  admin: 2,
  super_admin: 3
}

export function hasMinRole(currentRole, requiredRole) {
  return (ROLE_LEVELS[currentRole] ?? -1) >= (ROLE_LEVELS[requiredRole] ?? Infinity)
}
```

---

## Notes

- **No Vuex/Pinia** — use the same singleton model pattern as main-app
- **No shared component imports from main-app** — admin-app components are independent (prevents coupling, allows divergent evolution)
- **Admin JWT is completely separate** from user JWT — different secret, different claims, different localStorage keys
- **OTP is mandatory** — there is no way to skip, postpone, or disable it. The router guard must enforce this strictly.
- **All data views are read-only** — admin cannot modify user WNA data (stuff, actions, projects). Only account-level actions (disable, delete, reset password, force logout).
- **Audit logging is backend-side** — the frontend doesn't need to send audit events; every API call to admin_service is automatically audit-logged by the backend.
- **Do not implement against missing backend endpoints** — before starting work on any step, verify that the required backend API endpoints exist in `admin-api.md`. If an endpoint is not yet documented or implemented, **stop implementation of that step** and clearly warn what backend endpoints are missing. Do not use mock data, stubs, or placeholder responses. Move on to the next step that has backend support, or wait for the backend to ship the missing endpoints.