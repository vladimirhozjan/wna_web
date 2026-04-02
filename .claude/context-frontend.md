# WNA Frontend — Architecture Context

## Architecture Overview

WNA Web is a **dual-SPA monorepo** powered by Vue 3 + Vite 7, producing two independent apps from a single codebase:

| App | Purpose | Port (dev) | Backend | Domain |
|-----|---------|-----------|---------|--------|
| **main-app** | User-facing GTD productivity app | 6111 | router_service :8000 | whatsnextaction.com |
| **admin-app** | Internal admin panel | 7111 | admin_service :8004 | admin.whatsnextaction.com |

Both apps are completely independent — no shared components, models, or runtime code. They share only build tooling (Vite config, package.json) and font assets.

**Build selection** is via `APP` env var: `APP=main-app npm run build:main` or `APP=admin-app npm run build:admin`.

**Runtime config** is injected via `/config.js` (not baked into the build), enabling the same Docker image to run in dev/staging/prod.

```
wna_web/
├── config/
│   ├── apps.js          # App definitions (root, port, proxy)
│   └── vite.core.js     # Shared Vite config factory
├── src/
│   ├── main-app/        # User-facing SPA
│   └── admin-app/       # Admin panel SPA
├── vite.config.js       # Entry point (reads APP env var)
└── package.json         # Shared dependencies
```

### Path Aliases
- `@/` → `src/`
- `@main/` → `src/main-app/`
- `@admin/` → `src/admin-app/`

---

## Key Modules

### Main-App

**68 Vue components** organized as:
- 38 top-level reusable components (Btn, Inpt, Modal, Item, ItemList, Sidebar, TopNav, etc.)
- 11 calendar components (CalendarDayView, CalendarWeekView, CalendarMonthView, CalendarYearView, etc.)
- 9 clarify/workflow components (ClarifyPanel, ClarifyStepActionable, ClarifyStepCreateProject, etc.)
- 10 reference/file-browser components (RefToolbar, RefListView, RefGridView, RefFileCard, RefPreviewModal, etc.)
- 10 public/marketing page components (HeroSection, PricingTier, FeaturesSection, etc.)

**25 state models** (singleton factory pattern with Vue reactive refs):
- Domain: stuffModel, nextActionModel, todayModel, projectModel, calendarModel, waitingModel, somedayModel, completedModel, trashModel, overdueModel, recurringModel, tagModel
- Reference: referenceModel, referenceTrashModel, attachmentListModel
- UI: moveModel, dragModel, clarifyModel, contextModel, engageModel, reviewModel
- Settings: settingsModel, notificationModel, themeModel, statsModel

**14 core scripts**: apiClient (1,738 lines), authModel, httpApi, errorModel, confirmModel, upgradeModel, domains, googleSso, calendarLayout, dateUtils, rruleUtils, authTools, errorMapper, haptics

**25 view pages**: InboxPage, NextPage, TodayPage, CalendarPage, ProjectsPage, ReferencePage, SettingsPage, CompletedPage, TrashPage, WaitingForPage, SomedayPage, ReviewPage, OverduePage, EngagePage + detail pages (StuffDetail, ActionDetail, ProjectDetail, RecurringDetail) + public pages (Landing, Pricing, Help, Legal, VerifyEmail, GoogleSso)

### Admin-App

**16 Vue components**: Btn, Inpt, Modal, ConfirmDialog, DataTable, Pagination, Badge, StatusDot, Card, Stat, Spinner, SearchInput, Dropdown, ErrorToaster, SidebarNav, SidebarProfile

**1 state model**: dashboardModel (system health, user overview, platform activity, security alerts, GDPR, audit)

**6 core scripts**: apiClient (594 lines), authModel (with JWT decode + role hierarchy), httpApi, errorModel, confirmModel, domains

**15 view pages**: LoginPage, SetPasswordPage, OtpSetupPage, DashboardPage, UsersPage, UserDetailPage, AdminUsersPage, AdminUserDetailPage, ContentBrowserPage, GdprRequestsPage, SystemHealthPage, AnalyticsPage, AuditLogPage, FeatureFlagsPage, AdminSettingsPage

### Model Pattern

All state management uses a singleton factory pattern (no Vuex/Pinia):

```javascript
let instance = null
export function modelName() {
    if (instance) return instance
    const items = ref([])
    const loading = ref(false)
    async function load() { /* ... */ }
    instance = { items, loading, load }
    return instance
}
```

Key conventions:
- Reactive refs for state, computed for derived data
- `try-catch-finally` for all async operations with loading/error tracking
- Race condition handling via version counters (loadVersion pattern)
- Cursor-based pagination for infinite scroll
- Tag filtering support across list models
- `statsModel().refreshStats()` called after mutations

### Three-Layer API Architecture

```
View → Model → apiClient → httpApi (Axios)
```

- **httpApi.js**: Axios instance with auto-refresh interceptor (refreshes JWT 60s before expiry)
- **apiClient.js**: Named async functions with error normalization, returns data
- **Models**: Call apiClient, manage reactive state, handle loading/error

---

## API Surface

### Main-App API Client (95+ functions)

**Auth**: registerUser, verifyEmail, resendVerification, loginUser, refreshToken, forgotPassword, resetPassword, deleteUser, changePassword, logoutUser, googleAuth, googleSso, checkVerificationStatus

**Sessions**: listSessions, revokeSession, revokeAllSessions

**User/Settings**: getUser, getSettings, updateSettings, getNotificationSettings, updateNotificationSettings

**Stuff (Inbox)**: addStuff, updateStuff, getStuff, getStuffByPosition, deleteStuff, trashStuff, moveStuff, listStuff, completeStuff, activateStuff, uncompleteStuff

**Actions**: addAction, updateAction, getAction, getActionByPosition, listActions, listTodayActions, deleteAction, trashAction, moveAction, deferAction, undeferAction, setDueDate, clearDueDate, todayAction, moveTodayAction, getTodayActionByPosition, completeAction, changeActionState, somedayAction, activateAction, uncompleteAction

**Projects**: addProject, updateProject, getProject, getProjectByPosition, listProjects, deleteProject, trashProject, moveProject, completeProject, listProjectActions, somedayProject, activateProject, uncompleteProject

**Clarify/Transform**: clarifyToAction, clarifyToProject, clarifyToReference, clarifyToSomeday, clarifyToTrash, transformStuffToFile, transformActionToProject, transformActionToFile, transformProjectToAction, transformProjectToFile, transformFileToOriginal

**Lists**: listSomeday, listCompleted, listWaiting, listCalendar, listTrash, listOverdue + position getters + move operations

**Calendar**: listCalendar, getCalendarDensity

**Tags/Comments**: getTags, listComments, createComment

**Reference Files**: createRefFolder, listRefFolders, getRefFolder, updateRefFolder, deleteRefFolder, uploadRefFile, listRefFiles, getRefFile, updateRefFile, trashRefFile, downloadRefFile, previewRefFile, getRefQuota, listRefTrash, restoreRefFile, permanentDeleteRefFile, emptyRefTrash

**Attachments**: listAttachments, uploadAttachment, downloadAttachment, replaceAttachment, deleteAttachment, listAllAttachments

**Recurring**: listRecurring, createRecurring, getRecurring, updateRecurring, deleteRecurring, spawnRecurring, moveRecurring

**Stats**: getStats, getEngage

### Admin-App API Client (50+ functions)

**Auth**: login, refreshToken, setPassword, getOtpSetup, confirmOtp, resetPassword

**Dashboard**: getSystemHealth, getDashboardUserOverview, getDashboardPlatformActivity, getDashboardRecentActivity, getDashboardSecurityAlerts, getDashboardGdprRequests, getAdminServiceVersion, getAdminServiceHealth

**Audit**: getAuditLog, exportAuditLog

**Admin Users**: listAdmins, createAdmin, updateAdmin, disableAdmin, forceResetAdmin

**Platform Users**: listPlatformUsers, getPlatformUser, disablePlatformUser, enablePlatformUser, deletePlatformUser, forceLogoutPlatformUser, resetPlatformUserPassword, changePlatformUserTier

**Content Browser**: getUserItems, getUserTags, getUserAttachments, getUserReferenceFiles, getUserDataStats

**GDPR**: listGdprRequests, getGdprRequest, cancelGdprRequest, triggerDataExport, triggerAccountDeletion, downloadGdprExport

**Analytics**: getSignupStats, getActiveUserStats, getFeatureUsageStats, getPlatformHealthStats

**Feature Flags**: listFeatureFlags, getFeatureFlag, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag

**Profile**: changePassword, resetOtp

### Backend Proxy Config

| App | Proxy Pattern | Target |
|-----|--------------|--------|
| main-app | `/v1/*` | `http://localhost:8000` (router_service) |
| admin-app | `/auth/*`, `/admin/*`, `/health`, `/readiness`, `/version` | `http://localhost:8004` (admin_service) |

### Token Management

| | Main-App | Admin-App |
|---|---------|-----------|
| Access token key | `auth_token` | `admin_auth_token` |
| Refresh token key | `refresh_token` | `admin_refresh_token` |
| User data key | `current_user` | `admin_current_user` |
| Logout signal key | `logout` | `admin_logout` |
| Refresh endpoint | `POST /v1/user/refresh` | `POST /auth/refresh` |
| Auto-refresh | 60s before expiry | 60s before expiry |
| Cross-tab sync | localStorage `storage` event | localStorage `storage` event |

---

## Tech Constraints

### Dependencies (minimal by design)
```
vue 3.5, vue-router 4.6, axios 1.13, date-fns 4.1,
chart.js 4.5 + vue-chartjs 5.3, vue-draggable-plus 0.6,
marked 17.0, qrcode 1.5
```

**Policy**: No state management libraries (Vuex/Pinia), no CSS frameworks (Tailwind/Bootstrap), no heavy UI component libraries. Prefer vanilla JS/CSS solutions.

### Build & Runtime
- **Node**: ^20.19.0 || >=22.12.0
- **Vite 7** with Terser minification (console/debugger stripped)
- **Code obfuscation** via rollup-plugin-obfuscator (configured but currently disabled)
- **No .env files** — runtime config via `window.RUNTIME_CONFIG` injected by `/config.js`
- **No SSR** — pure client-side SPAs served by Nginx
- **Code splitting**: Route-level lazy loading via dynamic `import()`

### Styling
- **CSS custom properties** (tokens) — no CSS-in-JS
- **Scoped styles** on all components (`<style scoped>`)
- **Fonts**: Libre Bodoni (serif headings), Montserrat (body/UI)
- **Responsive**: clamp() for fluid font sizing, 768px mobile breakpoint (main), 600px (ref toolbar)
- **Themes**: Light (default) + Dark via `[data-theme="dark"]` selector
- **No utility classes** beyond a small set of text/color helpers in styles.css

### Auth & Security
- JWT in localStorage (not httpOnly cookies) — consistent across both apps
- Admin app: OTP (TOTP) mandatory, role-based route guards (viewer < support < admin < super_admin)
- Main app: email/password + Google OAuth, email verification required
- 403 with `upgrade_message` triggers UpgradeModal for tier limit errors
- 413 triggers UpgradeModal for file/storage limit errors

### App Independence
- **No shared runtime code** between main-app and admin-app
- Same-named components (Btn, Inpt, Modal) are separate implementations
- Different auth tokens, different JWT secrets, different backend services
- Can be deployed independently to different domains

---

## Current Pain Points

### Bundle Size
- Main-app main chunk exceeds 500 KB (Vite warning). Needs `manualChunks` or more aggressive code splitting.
- Chart.js adds ~170 KB to admin analytics page (lazy-loaded, so not critical path).

### No Automated Tests
- Zero unit/component/E2E tests. Manual testing only. Risk of regressions.

### Code Duplication
- Both apps implement identical base components (Btn, Inpt, Modal, ErrorToaster, ConfirmDialog, Dropdown) independently. A shared component library would reduce maintenance.
- formatBytes, formatDate, formatSize utility functions duplicated across files.

### API Client Size
- Main-app apiClient.js is 1,738 lines in a single file. Could benefit from splitting by domain (auth, stuff, actions, projects, reference, etc.).

### Settings Page Complexity
- SettingsPage.vue is 1,000+ lines. Collapsible sections help UX but the component is still monolithic.

### No Offline / Optimistic Updates
- All mutations wait for server response. No offline queue or optimistic UI updates.

### No WebSocket / Real-time
- Dashboard auto-refresh uses setInterval polling (30s). No WebSocket for push updates.

### Dark Theme Gaps
- Dark theme exists but some components may have hardcoded colors that don't adapt (e.g., Chart.js reads CSS vars at render time but doesn't re-render on theme change).