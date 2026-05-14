# WhatsNextAction (WNA) - Complete Feature Documentation

> **Purpose:** This document describes every user-facing feature currently implemented in the WNA frontend. It is intended as a reference for creating UI test cases, Terms of Service, Help/FAQ content, and QA documentation.
>
> **Last updated:** 2026-03-16

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Authentication & Account](#2-authentication--account)
3. [Dashboard Layout & Navigation](#3-dashboard-layout--navigation)
4. [Inbox (Stuff)](#4-inbox-stuff)
5. [Clarify Workflow](#5-clarify-workflow)
6. [Next Actions](#6-next-actions)
7. [Today](#7-today)
8. [Calendar](#8-calendar)
9. [Projects](#9-projects)
10. [Waiting For](#10-waiting-for)
11. [Someday / Maybe](#11-someday--maybe)
12. [Reference (File Manager)](#12-reference-file-manager)
13. [Completed Items](#13-completed-items)
14. [Trash](#14-trash)
15. [Engage (Dashboard Overview)](#15-engage-dashboard-overview)
16. [Weekly Review](#16-weekly-review)
17. [Recurring Actions](#17-recurring-actions)
18. [Context Tags & Filtering](#18-context-tags--filtering)
19. [Attachments](#19-attachments)
20. [Comments](#20-comments)
21. [Settings](#21-settings)
22. [Quick Add](#22-quick-add)
23. [Drag & Drop](#23-drag--drop)
24. [Public Pages](#24-public-pages)
25. [Shared UI Behaviors](#25-shared-ui-behaviors)
26. [Email System (Backend)](#26-email-system-backend)
27. [Notification Settings](#27-notification-settings)
28. [Limits & Quotas](#28-limits--quotas)
29. [Feedback Button](#29-feedback-button)
30. [Connections (Team Tier)](#30-connections-team-tier)
31. [In-App Notifications](#31-in-app-notifications)
32. [Delegation (Team Tier)](#32-delegation-team-tier)
33. [Shared Projects (Team Tier)](#33-shared-projects-team-tier)

---

## 1. Platform Overview

WhatsNextAction (WNA) is a web-based productivity platform implementing the Getting Things Done (GTD) methodology by David Allen. The platform provides a structured system for capturing, clarifying, organizing, reviewing, and engaging with tasks.

**Core GTD entities:**
- **Stuff** - Raw, unprocessed inbox items with no metadata
- **Action** - A concrete physical next step (may belong to a project or be standalone)
- **Project** - An outcome requiring multiple action steps

**GTD Buckets:**
| Bucket | Purpose |
|---|---|
| Inbox | Capture zone for raw items |
| Next Actions | Ready-to-do actions |
| Today | Actions focused on for today |
| Calendar | Time-specific actions and commitments |
| Waiting For | Delegated actions |
| Someday / Maybe | Paused items for future consideration |
| Reference | Non-actionable files and notes |
| Projects | Multi-action outcomes |
| Completed | Finished items |
| Trash | Deleted items (soft delete, recoverable) |

---

## 2. Authentication & Account

### 2.1 Registration

- **Entry points:** "Start Here" / "Start Free" buttons on landing page, `/register` URL
- **Heading:** "Create Your Account"
- **Fields:** Email (placeholder: "Enter your email address"), Password (placeholder: "Enter your password"), Confirm Password (placeholder: "Confirm your password")
- **Terms of Service checkbox:** "I agree to the Terms of Service and Privacy Policy" — must be checked before the Register button enables
- **Presentation:** Modal dialog overlay with blur backdrop on the landing page
- **Password requirements:** Minimum 8 characters, must contain at least one letter, one digit, and one symbol
- **Validation (client-side):**
  - Email format check (`user@domain.tld`)
  - Password strength regex check
  - Confirm password must match
  - Submit button disabled until all three fields are non-empty AND the ToS checkbox is checked
- **On success:** User account is created but **not yet authenticated**. The dialog transitions to the "verify-sent" mode showing a confirmation message that a verification email has been sent. The user must verify their email before they can log in.
- **Error handling:**
  - HTTP 409: "Email already exists. Change email or sign in."
  - Other errors shown as toast notifications

### 2.2 Email Verification

#### 2.2.1 Verification Email (Backend)

- **Trigger:** Automatically sent when a new user registers
- **From address:** `noreply@whatsnextaction.com` ("WhatsNextAction")
- **Subject:** "Verify your WNA account"
- **Content:** HTML + plaintext email containing a verification link with a unique token
- **Token:** 64-character cryptographically secure random string
- **Expiry:** 24 hours from creation
- **Delivery:** Sent via SMTP through the notification service's message queue (RabbitMQ, urgent priority)

#### 2.2.2 Post-Registration "Verify Sent" Screen

- **Presentation:** Auth dialog transitions to "verify-sent" mode after successful registration
- **Content:** Confirmation message that a verification email has been sent to the registered email address
- **Resend button:** Allows resending the verification email
  - 60-second cooldown between resend requests (button disabled with countdown timer)
  - Calls `POST /v1/user/resend-verification`
  - Success/error feedback shown to user
- **Navigation:** Link to switch to login form
- **Auto-detect verification:** While the "verify-sent" screen is open, the app automatically detects when the user verifies their email from another tab or device:
  - **Same browser (another tab):** Detected instantly via `localStorage` `storage` event when `auth_token` is set by the verify page
  - **Different browser/device:** Detected by polling `GET /v1/user/{user_id}/verified` every 3 seconds using the `user_id` returned from registration
  - **On detection:** Automatically logs the user in with the email/password still held in memory, then redirects to `/engage`
  - **Cleanup:** Polling and listener are stopped when the dialog closes or the component unmounts

#### 2.2.3 Verify Email Page (`/verify`)

- **URL:** `/verify?token=<verification_token>`
- **Entry point:** User clicks the verification link in their email
- **States:**
  - **Loading:** Spinner shown while verification request is in progress
  - **Success:** Verification confirmed, user is automatically authenticated (JWT tokens stored), auto-redirects to `/engage` after a 3-second countdown
  - **Invalid:** Token parameter missing from URL — shows error message
  - **Expired:** Token has expired or is malformed — shows error with option to resend
  - **Error:** Network or server error — shows generic error message
- **API call:** `POST /v1/user/verify-email` with the token
- **On success:** Backend sets `email_verified` flag, creates JWT session, returns access + refresh tokens

#### 2.2.4 Resend Verification

- **Available from:** "verify-sent" screen (after registration), "unverified" login screen, Verify Email page (on expired token)
- **API call:** `POST /v1/user/resend-verification` with email address
- **Cooldown:** 60 seconds between resend attempts
- **Backend behavior:** Deletes existing verification tokens, generates a new token, sends new verification email
- **Security:** Always returns HTTP 200 regardless of whether the email exists (prevents email enumeration)

### 2.3 Login

- **Entry points:** "Sign In" button on landing page, `/login` URL
- **Heading:** "Welcome Back"
- **Submit button:** "Sign In"
- **Fields:** Email, Password
- **Validation:** Same email and password format checks as registration
- **On success:** Tokens stored, redirected to `/engage`
- **Unverified email:** If the user's email has not been verified, login returns HTTP 403 with `user_id` in the response. The dialog transitions to "unverified" mode showing a message that email verification is required, with a "Resend Verification Email" button (60-second cooldown). The same auto-detect verification logic starts (polling + localStorage listener) to automatically log the user in once they verify from any device.
- **Error handling:**
  - HTTP 400: "Incorrect email format, please correct email address."
  - HTTP 401: "Incorrect email and/or password. Please correct your credentials."
  - HTTP 403: Email not verified — transitions to unverified mode with resend option

### 2.4 Forgot Password

- **Entry point:** "Forgot your password? Reset it" link on login form
- **Fields:** Email only
- **Behavior:** Submits email to backend; backend sends a password reset email with a reset link (token valid for 1 hour). The dialog transitions to the Reset Password form.
- **Backend email:** Subject "Reset your WNA password", contains reset URL with token, expires in 1 hour
- **Security:** Always returns HTTP 200 regardless of whether the email exists (prevents email enumeration)

### 2.5 Reset Password

- **Entry points:** Reset link in password reset email (`/reset-password?token=<reset_token>`), or via Forgot Password flow in Auth dialog
- **Fields:** New Password, Confirm New Password
- **Validation:** Same password strength rules as registration; confirm must match
- **On success:** Password updated, transitions to login form
- **Backend:** After password reset, a "Your WNA password was changed" confirmation email is sent

### 2.6 Auth Dialog Shared Behaviors

- Fixed overlay with `backdrop-filter: blur(3px)`, centered card (max 420px wide)
- Click outside (on backdrop) closes the dialog
- Animated transitions between auth modes (fade + slide up)
- **7 dialog modes:** login, register, forgot, reset, verify-sent, unverified, closed
- **Mode switching links:** Registration→Login via "Sign In" link; Login→Registration via "Create new account" button
- Switching modes clears errors; email is preserved when navigating to login; passwords are always cleared
- All form state is component-local (not persisted to localStorage)

### 2.7 JWT Token Management

- Access token and refresh token stored in `localStorage` (`auth_token`, `refresh_token`)
- **Proactive refresh:** Before every API call, the token expiry is checked; if it expires within 60 seconds, the token is refreshed automatically before the request proceeds
- **Refresh failure:** If the refresh token is invalid or expired (HTTP 401/404), the user is logged out and redirected to the landing page
- **Cross-tab logout:** Logging out in one browser tab instantly logs out all other open tabs (via `localStorage` `storage` event)

### 2.8 Logout

- **Entry points:** TopNav avatar dropdown "Logout", Settings page session row "End", Sidebar footer "Logout"
- **Confirmation:** A confirmation dialog ("Are you sure you want to log out?") with "Cancel" and "Log out" buttons is shown before proceeding
- **Behavior:** Calls logout API, clears localStorage tokens, broadcasts cross-tab logout signal, redirects to landing page
- **Server failure:** Silently ignored (localStorage is always cleared)

### 2.9 Route Protection

- Protected routes are guarded globally in `router.beforeEach`: a public-route allowlist (landing, login, register, forgot, reset, reset-password, verify-email, google-sso, pricing, help/*, legal/*) is checked first; any other route requires authentication
- **Deep-link login flow:** When an unauthenticated user opens a protected URL (e.g. an email link to `/overdue`, `/project/:id`, `/settings/connections`), the guard redirects to `/login?redirect=<original-fullPath>`. The `LandingPage` opens the `AuthDialog` in login mode. After successful login or registration, the user is navigated to the original `redirect` path instead of the default `/engage`. The `redirect` query is also preserved through the password-reset → login hop. Only same-origin paths (starting with `/` and not `//`) are honored to prevent open-redirect abuse.
- If authentication state changes mid-session (e.g., cross-tab logout), the dashboard reactively redirects to landing
- `/settings/:section` is rewritten to `/settings?section=:section` so email links like `/settings/connections` resolve to the corresponding expanded section in `SettingsPage`
- A catch-all route (`/:pathMatch(.*)*`) redirects unknown URLs to `/`

---

## 3. Dashboard Layout & Navigation

### 3.1 Top Navigation Bar

**Left side (always):**
- App icon (48x48 SVG) + "WhatsNextAction" text

**Center (landing page, guest only, desktop):**
- "Why GTD", "Features", "Pricing", "Help" links

**Right side (guest):**
- Desktop: "Start Here" (primary) + "Sign In" (ghost) buttons
- Mobile: Hamburger menu with the same links and buttons

**Right side (authenticated):**
- "+ Quick Add" button (captures new inbox items from any page; hidden on mobile — replaced by FAB)
- Mobile: Animated hamburger icon (☰ → X) to toggle sidebar drawer
- Desktop: User avatar with dropdown menu containing "Settings", "Logout" (plus "My Dashboard" on public pages only)

### 3.2 Sidebar (Desktop)

- 260px fixed-width left panel, always visible above 768px, `complementary` ARIA role
- **Navigation items** (buttons, not links; each with icon and count badge):
  - Dashboard (`/engage`)
  - Context Filter (tag-based work context selector)
  - Next Action, Today, Inbox, Projects, Calendar, Waiting For, Someday / Maybe
  - Reference (shows storage quota badge instead of count)
  - Review (conditional: only shown when review is enabled in settings; shows days-since-last-review badge with color coding: orange at 7+ days, red at 14+ days)
  - Completed, Trash
- **Footer:** Accent color picker + Settings link + Logout button
- **Drag-drop targets:** Most sidebar items accept dragged items (stuff/actions) from list views. Complex drops (Calendar, Waiting For, Projects) open modals for additional input.
- **Count badges** update after every create/complete/delete/move operation (debounced 300ms)

### 3.3 Sidebar Drawer (Mobile)

- Slide-in drawer from the left on viewports <= 768px
- Triggered by animated hamburger icon (☰ → X with CSS transition) in TopNav, or overlay tap to close
- Semi-transparent overlay with blur effect
- Auto-closes on route change (navigating via sidebar menu items)
- Contains the same Sidebar content

### 3.4 User Avatar

- 36px circle (32px on mobile)
- **Gravatar integration:** Automatically fetches the user's avatar from [Gravatar](https://gravatar.com) using a SHA-256 hash of the lowercase/trimmed email
  - Request URL: `https://gravatar.com/avatar/{sha256hash}?s=72&d=404`
  - `d=404` tells Gravatar to return HTTP 404 if no account exists, triggering the fallback
  - Hash is computed client-side using the Web Crypto API (no external dependencies)
- **Fallback:** If Gravatar returns 404 or the image fails to load, displays a colored circle with the user's initials (uppercased)
- Background color of the fallback is deterministically generated from the email (consistent per user)

---

## 4. Inbox (Stuff)

### 4.1 Inbox Page

- **Purpose:** Capture zone for raw, unprocessed items ("Stuff"). Items in the inbox have no metadata - no tags, dates, or delegation.
- **URL:** `/inbox`

**Adding items:**
- Text input (placeholder "Add new stuff") + "Add" button, always visible at the top
- Press Enter to submit
- Input hidden when in clarify mode

**Item list:**
- All items load at once (no pagination)
- Total item count shown in sidebar badge

**Per-item operations:**
- **Checkbox (complete):** Marks the stuff item as done, removes it from the list, shows success toast
- **Inline title edit:** Click the title text to edit inline; Enter or blur saves, Escape cancels
- **Trash:** ✕ button (visible on hover/always on touch) with "Move to Trash" confirmation dialog
- **Drag to reorder:** Long-press on touch (150ms delay) or drag on desktop; calls API to persist new position
- **Click to detail:** Navigates to `StuffDetailPage`

**Clarify mode:**
- Activated by the "Clarify" button in the page header (only shown when items exist); an "Exit" button appears in the header to leave clarify mode
- Can also be auto-started via URL query `?clarify=1`
- Desktop: List shrinks to 320px, ClarifyPanel opens side-by-side
- Mobile: ClarifyPanel opens as full-screen overlay
- Items in the list are disabled during clarify (no inline edit, no action buttons, no checkbox, no drag-to-reorder)
- A blue highlight indicates the item currently being processed
- Clicking an item switches the clarify target (does not navigate to the detail page)
- After completing clarification of an item, it is removed from the list; when all items are clarified, clarify mode exits automatically

**Empty state:** Inbox icon + "Your inbox is empty" + "Capture everything on your mind. Add new stuff above to get started."

**Inbox Zero celebration:**
- When the user clears the last item from the inbox (via clarify, complete, trash, drag-to-sidebar, or from the detail page), a brief celebration animation plays
- Animation: Green circle blooms in with a spring curve, checkmark icon fades/scales in, "Inbox Zero" title and "You're in control." subtitle slide up with staggered timing
- Auto-dismisses after 3 seconds, or click anywhere on the celebration to dismiss early
- Does NOT trigger when the inbox was already empty on page load (only when the user actively empties it)
- After the celebration fades out, the normal empty state is shown

### 4.2 Stuff Detail Page

- **URL:** `/stuff/:id`
- **Navigation:** Position-based arrows (First, Previous, Next, Last) to browse through the inbox or other lists
- **Automatic type routing:** When navigating through mixed-type lists (completed, someday), automatically redirects to the correct detail page type (action or project) if needed

**Title:** Displayed as h2 heading. Click-to-edit auto-resizing textarea. Shows strikethrough if completed.

**Action buttons (state-dependent):**
- Normal stuff: "Clarify" (primary), "Done" (ghost), "Move" dropdown, "Trash" (danger)
- Completed stuff: "Undo" only
- Someday stuff: "Activate", "Trash"

**"Move" dropdown destinations:**
- Next Actions, Today, Calendar (opens date/time modal), Waiting For (opens waiting-for modal), Projects (opens outcome modal), Someday, Reference

**Additional sections:**
- Description (click-to-edit textarea)
- Attachments (file upload/download/delete, max 10)
- Comments (add comments, view history)
- Metadata footer (created/updated timestamps)

**Clarify from detail:** "Clarify" button opens ClarifyPanel as a right slide-over (480px) on desktop, full-screen on mobile. After clarifying, automatically advances to the next item.

**Context-aware back navigation:** Returns to Inbox, Completed, or Someday based on the source.

---

## 5. Clarify Workflow

The clarify workflow is a multi-step guided wizard for processing inbox items according to GTD methodology. It uses a state machine with the following decision path:

### 5.1 Step 1: Is It Actionable?

- **Question:** "Is it actionable?" with two options: "Yes Y" / "No N" (keyboard shortcuts Y and N)
- **If No** → proceeds to non-actionable destinations
- **If Yes** → proceeds to Step 2

### 5.2 Non-Actionable Destinations (if No)

- **Reference** button - Files it as a reference item. The stuff item is converted to a text file in the reference file system.
- **Someday** button - Parks it for future consideration. The stuff item's state changes to SOMEDAY.
- **Trash** button - Deletes the item.
- All three options execute immediately (no further steps).

### 5.3 Step 2: Single Action or Project?

- **Question:** "Is it a single step or does it require multiple steps?"
- **Single action** → proceeds to Step 3
- **Project (multiple steps)** → proceeds to Create Project form

### 5.4 Step 3: Two-Minute Rule

- **Question:** "Can you do this in less than 2 minutes?"
- **Yes** → "Do It Now" screen. Shows a countdown-style encouragement. Completing marks the original stuff item as done immediately.
- **No** → proceeds to Create Action form

### 5.5 Create Action Form

- **Fields:** Title (required, pre-filled from stuff item), Description (optional), Tags (multi-select with autocomplete and presets)
- **Dates section (collapsed by default):**
  - Uses `DateTimeInput` component for all date/time fields (date always shown, "Add time..." placeholder reveals time + duration for scheduled, "Clear" link to remove time)
  - Deferred: Radio between "Scheduled for" (date + optional time with duration, default 30 min) and "Start after" (tickler date + optional time, no duration)
  - Due Date: Date input + optional time (no duration) — **hidden when "Scheduled for" is selected** (mutual exclusivity)
  - Duration (scheduled only): Automatically appears when time is added. Default 30 min. Uses `DurationInput` component: dropdown with preset options (15, 30, 45, 60, 90, 120, 180, 240 minutes) + editable number input for any value > 0.
- **Confirm** button transforms the stuff item into an action via the API

### 5.6 Create Project Form

- **Fields:** Project Title (required), Outcome (required - "What does done look like?"), Description (optional), Tags
- Projects do not have dates.
- **Confirm** transforms the stuff item into a project via the API

### 5.7 Clarify Panel UI

- **Modes:** Inline (side panel in inbox), Modal (right slide-over from detail), Fullscreen (mobile overlay)
- **Header:** "Clarify" h2 heading, step counter (e.g., "1/3"), back button, close (×) button
- **Progress bar:** Animated width showing progress percentage
- **Context label:** "Processing: [item title]"
- **Done state:** Panel auto-advances to the next item or closes when all items are processed (no explicit success message shown)
- **Keyboard shortcuts:** Escape to cancel, Backspace to go back (when not in an input field)

---

## 6. Next Actions

### 6.1 Next Page

- **URL:** `/next`
- **Page heading:** "Next"
- **Purpose:** List of all actionable, ready-to-do actions

**Adding items:**
- Collapsible add form (toggle with +/− button in header, using Unicode minus U+2212), starts expanded
- Title input (placeholder "Add new action") + "Add" button; creates action with state NEXT

**Item list:**
- All items load at once (no pagination)
- Tag filtering via TagFilter component + global context tag

**Per-item operations:**
- Complete (checkbox), Inline title edit, Trash (✕ button with "Move to Trash" confirmation), Drag to reorder, Click to navigate to detail

**Empty states:**
- With tag filter: "No actions for this context" + tag name
- Without filter: "No next actions" + instructional text

### 6.2 Action Detail Page

- **URL:** `/action/:id`
- **Navigation:** Position-based arrows (hidden when viewing from calendar, project, recurring, or engage contexts)

**Recurring indicator:** Badge shown when the action was spawned from a recurring template. Special "Weekly Review" badge when it belongs to the review template.

**Action buttons (state-dependent):**
- NEXT / TODAY / CALENDAR: "Done", "Move" dropdown, "Trash"
- COMPLETED: "Undo" only
- SOMEDAY: "Activate", "Move" dropdown (Today, Calendar, Waiting For, Project, Reference), "Trash"
- WAITING: "Got it" (unwait → moves to NEXT), "Done", "Move" dropdown

**"Move" dropdown:** Shows all valid destination states except the current one. Includes: Next Actions, Today (schedule dialog), Calendar (schedule dialog), Waiting For (waiting-for dialog), Someday, Projects (outcome dialog, uses backend transform endpoint), Reference (transforms action to file).

**Sections:**
- Project link (clickable, navigates to project detail) - only if action belongs to a project
- Description (click-to-edit)
- Tags (click to show TagInput; displays as chips)
- Waiting For (only for WAITING state): shows who/what is being waited on + duration since waiting began
- Dates (collapsible):
  - Deferred: "Scheduled for" or "Start after" — uses `DateTimeInput` component. Duration auto-appears with default 30 min when time is added (scheduled only).
  - Due Date: date + optional time. Shows **"N/A (has scheduled date)"** and is non-editable when a scheduled_date is set (mutual exclusivity). Editable when start_date is set (start_date + due_date can coexist).
  - **Mutual exclusivity:** Setting scheduled_date clears due_date (on backend). Setting due_date clears scheduled_date (on backend). start_date and due_date can coexist.
  - Each has Save, Cancel, Clear buttons
- **Move from Calendar:** Moving an action from CALENDAR to another state (Next, Today, Someday) clears scheduled_date/start_date via undefer. due_date is preserved.
- Attachments (max 10)
- Comments
- Metadata (created/updated timestamps)

**Back navigation:** Context-aware based on source (Dashboard, Recurring, Project, Calendar, Completed, Someday, Waiting For, Today, Next)

---

## 7. Today

### 7.1 Today Page

- **URL:** `/today`
- **Purpose:** Actions specifically focused on for today
- **Behavior:** Structurally identical to Next Actions page
- **Differences:** Title "Today", items have state TODAY, empty state reads "No actions for today" + "Move actions here to focus on what matters most today."
- **Operations:** Add (creates with state TODAY), Complete, Inline edit, Trash, Drag to reorder, Tag filter

---

## 8. Calendar

### 8.1 Calendar Page

- **URL:** `/calendar`
- **View modes:** Day, Week, Month, Year, Recurring
- **View persistence:** Selected view mode saved to localStorage and restored on return
- **Default view:** Month

### 8.2 Navigation

- Previous / Next buttons advance by day, week, month, or year depending on view
- "Today" button jumps to the current date
- View mode toggle buttons in the header

### 8.3 Day View

- 24-hour time grid with configurable business hours highlighting
- Scheduled actions rendered as time blocks positioned by start time and sized by duration
- All-day / dateless actions shown in a section above the time grid (including start/due items without time)
- **Start date indicators:** Items with `start_date` + `start_time` shown as a yellow dot+line at the exact time, with a yellow gradient fading downward and the task title below the line
- **Due date indicators:** Items with `due_date` + `due_time` shown as a red dot+line at the exact time, with a red gradient fading upward and the task title above the line
- **Current time indicator:** Accent-colored dot+line showing the current time (updates every minute, visible only when viewing today)
- Click on an empty time slot opens a quick-add form for creating an action at that time
- Click on an item or indicator label navigates to action detail

### 8.4 Week View

- 7-column grid (configurable week start: Monday or Sunday)
- Each column is a mini day view with time grid
- Scheduled actions shown as positioned blocks
- Start date and due date indicators shown per column (same visual style as day view)
- All-day section at the top (includes start/due items without time)

### 8.5 Month View

- Calendar grid with day cells
- Each cell shows action titles (truncated)
- Click on a day cell to view that day's actions
- Click on an item to navigate to detail

### 8.6 Year View

- 12-month grid with density heat-map (color intensity based on item count per day)
- Click a day to navigate to day view
- Click a month to navigate to month view
- Uses lightweight density endpoint for efficiency (counts only, not full item data)

### 8.7 Recurring View

- List of all recurring action templates (see [Recurring Actions](#17-recurring-actions))
- **Drag-to-reorder:** Templates can be reordered by dragging, same UX as other lists (150ms delay on touch, wiggle hint on first visit)

### 8.8 Calendar Item Interactions

- **Create:** Click empty day/time slot to open quick-add form. Form includes type selector ("Scheduled" / "Start after") and optional due date field (when "Start after" selected).
- **Reschedule:** Drag an item to a new date/time slot. Scheduled items auto-reschedule as scheduled. Start_after items auto-reschedule as start. Due-only items show a type-selection popover ("Scheduled for [date]" / "Start after [date]").
- **View detail:** Click an item to navigate to action detail with `from=calendar`

### 8.8b Calendar Item Visual States

Four color-coded states for calendar items:
- **Scheduled** (blue): Items with `scheduled_date` — time-specific commitments
- **Start after** (yellow/amber): Items with `start_date` and no `scheduled_date` — tickler/deferred items
- **Due only** (red): Items appearing on their `due_date` with no `scheduled_date`
- **Overdue** (dark red): Due-only items where `due_date` is in the past

### 8.8c Multi-Date Display

An item can appear on multiple dates in the calendar:
- On its `scheduled_date` (blue styling)
- On its `start_date` (yellow/amber styling)
- On its `due_date` (red styling) — only when `scheduled_date` is not set

Priority: if an item's `scheduled_date`, `start_date`, and `due_date` all fall on the same day, it shows once with scheduled taking precedence, then start, then due.

### 8.8d Date Mutual Exclusivity

- `scheduled_date` and `due_date` are mutually exclusive — setting one clears the other (both locally and on the backend)
- `start_date` and `due_date` can coexist — an action can have both a start date and a due date
- `start_date` and `scheduled_date` are mutually exclusive (handled by the backend defer API)

### 8.9 Calendar Settings

Configurable in Settings page:
- Week starts on: Monday or Sunday
- Time format: 12-hour (AM/PM) or 24-hour — respected by all time inputs via `TimeInput` component (hour/minute/period selects) and calendar hour labels
- Business hours: Start and end hour
- Business days: Selectable days of the week

---

## 9. Projects

### 9.1 Projects Page

- **URL:** `/projects`
- **Purpose:** List of all active multi-action outcomes

**Adding projects:**
- Collapsible add form with two required fields: Project title + Outcome
- Add button disabled until both fields have content

**Item list:**
- No checkbox (projects cannot be completed from the list view)
- Tag filtering, drag to reorder, inline title edit, trash with confirmation
- Click to navigate to project detail

### 9.2 Project Detail Page

- **URL:** `/project/:id`
- **Navigation:** Position-based arrows

**Title:** Click-to-edit auto-resizing textarea

**Action buttons:**
- Active project: "Complete" (ghost), "Move" dropdown (Next Actions, Reference, Someday), "Trash" (danger)
- Completed project: "Undo" only
- Someday project: "Activate", "Complete", "Move" dropdown (Next Actions, Reference), "Trash"

**Cascade behaviors:**
- **Complete project:** If the project has unfinished actions, a confirmation warns "This will also complete all active actions in this project." No confirmation if there are no actions.
- **Trash project:** If the project has unfinished actions, the confirmation warns "This will also move all actions in this project to trash." Standard confirmation if there are no actions.
- **Move to Someday:** Shelves active actions (NEXT, TODAY, CALENDAR, WAITING) to BACKLOG. Toast informs: "Active actions shelved."
- **Activate (from Someday):** Restores shelved actions from BACKLOG to their previous states. Toast: "moved to Projects"
- **Undo (from Completed):** Restores project to active. Toast: "restored to projects"
- **Convert to Action:** If backlog actions exist, confirmation warns "This will trash all backlog actions in this project."
- **Convert to Reference:** If any actions exist, confirmation warns "This will convert the project and all its actions to a reference file."
- **Restore (from Trash):** Also restores cascade-trashed actions. Toast: "Project and its actions restored."

**Outcome section:** Click-to-edit textarea; placeholder "What does done look like?"

**Next Action section (active and someday projects, hidden for completed):**
- Shows the current next action as a card with checkbox + inline editable title + "→ Next" link
- When no next action exists (active projects only): Warning icon + "What's the next physical step?" + "Every active project needs a next action"
- Someday projects: The warning prompt is hidden (actions are shelved to backlog, so having no next action is expected)
- Expand/collapse toggle shows backlog action count (+N)

**Expanded action list:**
- First item styled as "next action card" with full interactions
- Subsequent items (backlog) with title + trash button
- All items draggable to reorder (drag changes backlog priority order)
- Quick-add input at the bottom to add new actions to the project

**Completing the next action:**
- Checkbox marks the next action as done
- The next item in the backlog automatically promotes to become the new next action (FIFO order, handled by backend)

**Additional sections:**
- Tags (click to edit, displayed as chips)
- Description (click-to-edit)
- Attachments (max 10)
- Comments
- Completed (collapsible — lists previously completed actions in this project; see §33.6)
- Metadata (created/updated timestamps)

**Shared project additions** (visible when `project.shared = true`):

- **Shared badge** beside the project title.
- **"Share…" button** (owner only, hidden when completed) — opens the share / add-member modal.
- **"Backlog" section** replaces the personal "Next Action" section. Single flat list of all project actions with assignee chip per row. Write members can add and reorder; read-only members see view-only.
- **Per-row controls**:
  - Unassigned + caller is write/owner + has no current assigned action → "Assign to me" icon button
  - Action assigned to caller → "You" badge + "Unassign" icon button
  - Action assigned to someone else → assignee email/name, plus "· waiting" suffix when in WAITING state
  - Trash button on a row only when caller can delete it (unassigned + write/owner, OR assigned to caller)
- **Field-level permissions** are described in §33.4 below. In short: owner edits title/outcome/description; all members edit their own private tags; write+owner manage attachments; everyone comments.
- **"Leave" button** replaces "Trash" for non-owner members in the action button row. Click → confirm dialog; on confirm, the user is removed from the project and routed back to Projects.
- **"Shared with" section** lists project members with avatars and roles; owner sees a role dropdown for non-owner members and a per-member remove button. Owner sees "Add another member..." link when there are addable connections.
- **Completed section** — for shared projects, each completed row shows "completed by [email] · [date]".

---

## 10. Waiting For

### 10.1 Waiting For Page

- **URL:** `/waiting-for`
- **Purpose:** List of delegated/waiting actions

**Adding items:**
- Collapsible add form with two fields: Action title + "Waiting for..." (both required)
- Creates action with state WAITING and `waiting_for` text

**Item list:**
- Checkbox visible (can complete from list)
- Tag filtering, inline title edit, trash with confirmation, drag to reorder
- Click to navigate to action detail

**Action detail behavior for WAITING items:**
- Shows "Got it" button: Removes waiting status, moves action to NEXT
- Shows "Waiting for" section: Displays the person/thing being waited on + duration since waiting began (e.g., "today", "3d", "2w", "1mo")

### 10.2 Connection picker for delegation

Wherever an action lands in the WAITING state — clarify "Delegate It", `MoveModal` (drag onto Waiting For, Move dropdown, action detail state change) — the "Who/what are you waiting on?" input is a connection-aware combobox:

- Typing filters the user's accepted connections (`GET /v1/connections`) by display label and email.
- Selecting a connection delegates the action via `POST /v1/action/{id}/delegate` (Team tier only). Backend sets `waiting_for_user_id` on the assigner's action and creates a Stuff in the receiver's inbox; on receiver completion, the assigner's action auto-unwaits to NEXT and gains a "Done." comment.
- Free text (no connection match) keeps the legacy behavior: `POST /v1/action/{id}/wait` with the typed string.
- Free / Pro tier users see no connection options (their list is empty) and continue to use plain free-text waiting.

---

## 11. Someday / Maybe

### 11.1 Someday Page

- **URL:** `/someday`
- **Purpose:** Mixed-type list of paused items (Stuff, Actions, and Projects can all be in someday state)

**Adding items:**
- Single title input; creates a new Stuff item with state SOMEDAY

**Item list:**
- No checkbox (items cannot be completed from the list)
- Type icon prefix: Inbox icon (Stuff), Arrow icon (Action), Projects icon (Project)
- Tag filtering (only applies to actions/projects since stuff has no tags), drag to reorder, inline title edit
- Items are draggable to sidebar navigation targets (move to other buckets)

**Per-item actions:**
- **Activate:** Moves item back to its original bucket (Stuff → Inbox, Action → Next, Project → Projects); shows toast with destination
- **Activate project:** Also restores shelved actions from BACKLOG to their previous states. Toast: "moved to Projects"
- **Trash:** With confirmation dialog

**Item click:** Navigates to the correct detail page (stuff-detail, action-detail, or project-detail) based on item type

---

## 12. Reference (File Manager)

### 12.1 Reference Page

- **URL:** `/reference`
- **Purpose:** Non-actionable file storage (the GTD "Reference" bucket)
- **Tabs:** Files | Attachments | Trash

### 12.2 Files Tab

**Toolbar:**
- Breadcrumb navigation (clickable path segments)
- Search input (300ms debounce, searches globally across all folders)
- "New Folder" button
- "Upload" button
- View mode toggle: List / Grid (persisted to localStorage)
- Storage quota display (used / total)

**Folder operations:**
- **Navigate:** Click folder to enter it; URL updates with `?folder=ID`
- **Create folder:** Opens rename modal with empty name
- **Rename folder:** Opens rename modal
- **Delete folder:** Confirmation dialog (warns about contents); permanent deletion (no trash for folders)

**File operations:**
- **Upload:** Via file picker button or drag-and-drop
  - Max 50 MB per file (client-side check)
  - Upload progress shown as a 3px progress bar per file
  - Progress panel in bottom-right corner shows status per file (uploading / done / error)
  - Auto-clears completed uploads after 3 seconds
- **Preview:** Click file to open preview modal
  - Images and PDFs rendered in browser
  - Text and JSON files shown as plain text
  - Other types via browser's native blob handling
  - For transformed files (items converted from stuff/action/project to reference), the preview modal shows a "Restore" button to transform the item back to its original type
- **Download:** Downloads file via browser download mechanism
- **Rename file:** Opens rename modal
- **Trash file:** Confirmation dialog; moves to reference trash

**Pagination:** Offset-based (20 files per page), "Load more" button

**Search:** When searching, folders are hidden; search is global across all folders

**Quota:** Displayed in toolbar; refreshed after upload, trash, and restore operations

### 12.3 Trash Tab

- Tabular list showing file name, size, and actions
- **Restore:** Moves file back to its original folder
- **Permanently delete:** Confirmation dialog; irreversible
- **Empty Trash:** Confirmation dialog ("This cannot be undone"); permanently deletes all trashed files
- Mobile: Size column hidden

---

## 13. Completed Items

### 13.1 Completed Page

- **URL:** `/completed`
- **Purpose:** Read-mostly list of all completed items (Stuff, Actions, Projects)

**Item list:**
- Checkboxes are pre-checked (items are completed)
- **Unchecking restores the item** to its original bucket
- Not editable (no inline title editing)
- No trash button from this view
- Type icons shown as prefix
- Cursor-based pagination
- Items are draggable to sidebar targets for quick restore to original bucket

**Uncomplete project behavior:**
- Restores the project to active state
- Toast: "restored to projects"

**Uncomplete action conflict (409):**
- If a completed action's parent project is also completed or trashed, uncompleting the action is blocked
- Error message: "Cannot restore this action — its parent project is completed or trashed. Restore the project first."

**Item click:** Navigates to correct detail page with "Undo" button context

**Empty state:** "No completed items" + instructional text

---

## 14. Trash

### 14.1 Trash Page

- **URL:** `/trash`
- **Purpose:** Soft-deleted items holding area

**Item list:**
- No checkbox, no inline editing, no drag-drop
- Type icons shown as prefix
- Per-item "Restore" link button
- Items are not clickable (no detail navigation from trash)
- Cursor-based pagination

**Bulk action:**
- "Empty Trash" button in header (disabled when empty)
- Confirmation dialog: "This cannot be undone"
- Permanently deletes all items in trash

**Per-item action:**
- **Restore:** Moves item back to its original bucket; shows toast "restored"
- **Restore project:** Also restores cascade-trashed actions (actions that were trashed together with the project). Toast: "and its actions restored"
- **Restore action conflict (409):** If a trashed action's parent project is completed or trashed, restore is blocked. Error message: "Cannot restore this action — its parent project is completed or trashed. Restore the project first."

**Empty state:** "Trash is empty" + instructional text

---

## 15. Engage (Dashboard Overview)

### 15.1 Engage Page

- **URL:** `/engage`
- **Purpose:** Main landing dashboard after login; bird's-eye overview of the GTD system

**Sections (top to bottom):**

**1. Overdue Alert (conditional):**
- Red-bordered sticky alert when any items are overdue
- Shows count: "N overdue items need attention"
- "View" button navigates to Today page
- Overdue count aggregated from Next, Today, Calendar, and Waiting For

**2. Today section:**
- Header "TODAY" with count + "View all" link to `/today`
- Shows up to 5 items from the Today list
- Can complete items inline (checkbox)
- Can drag to reorder
- Click item to navigate to detail

**3. Next Actions section:**
- Header "NEXT ACTIONS" with count + "View all" link to `/next`
- Shows up to 5 items; same interactions as Today section

**4. Waiting For section:**
- Header "WAITING FOR" with count + "View all" link to `/waiting-for`
- Shows up to 5 items

**5. Nudges ("Keep your system clean"):**
- Low-priority prompts shown when conditions are met:
  - **Inbox nudge:** "N items in inbox to clarify" → links to `/inbox?clarify=1`
  - **Stuck projects nudge:** "N projects need a next action" → links to `/projects`
  - **Review nudge:** "Last reviewed N days ago" or "Never reviewed" → links to `/review` (only when review is enabled and there are items to review)

**Context filtering:** The global context tag filters all dashboard sections simultaneously

**Empty states:**
- With context filter but no matching items: "No actions for this context"
- Truly empty system: "Ready to get things done?" + "Go to Inbox" button

---

## 16. Weekly Review

### 16.1 Review Page

- **URL:** `/review`
- **Purpose:** Guided GTD weekly review checklist
- **Conditional:** Only accessible when "Weekly Review" is enabled in settings

**Header:** "Weekly Review" + last review date ("Last reviewed: N days ago" or "Never reviewed")

**Setup tip (first visit):**
- Suggests creating a recurring weekly reminder
- "Create reminder" button creates a recurring action (weekly on Fridays, 9:00 AM, 60 min)
- Dismissible; persisted across sessions

**6 review steps:**
1. Empty your Inbox → link to `/inbox`
2. Review Next Actions → link to `/next`
3. Review Waiting For → link to `/waiting-for`
4. Review Projects → link to `/projects`
5. Review Someday/Maybe → link to `/someday`
6. Review Calendar → link to `/calendar`

Each step shows: title, hint text, item count badge from stats, "Go" link to the relevant page.

**Workflow:**
- "Start Review" button enables the checkboxes
- Progress counter: "N of 6 complete"
- "Complete Review" button (only enabled when all 6 checked) saves the review date
- Mobile: Hint text hidden

---

## 17. Recurring Actions

### 17.1 Recurring Templates

- **Accessible from:** Calendar page → Recurring view
- **Purpose:** Automatically spawn action instances on a schedule

### 17.2 Creating a Recurring Action

- **How:** On the Calendar Recurring view, click "+" to reveal the quick-add input, enter a title, and press Enter (or click "Add"). This creates a template with default `FREQ=WEEKLY` and navigates to the detail page (`/recurring/:id`) for full configuration.
- **Fields (on detail page):** Title, Description, Recurrence rule, Scheduled time + Duration (uses `DateTimeInput` with `withDate=false` and `withDuration=true`; shows "Add time" when no time is set, clicking sets default 09:00 + 30 min duration), Tags

### 17.3 Recurrence Rule Configuration

- **Frequency:** Daily, Weekly, Monthly, Yearly
- **Interval:** Every N days/weeks/months/years (1-99)
- **Day picker (weekly):** Multi-select days of the week (Mon-Sun)
- **Day of month (monthly/yearly):** 1-31
- **Month (yearly):** January-December
- **End condition:**
  - Never (no end)
  - After N occurrences (1-999)
  - Until specific date

**Human-readable summary** shown below the form (e.g., "Every 2 weeks on Mon, Wed, until Jun 15, 2025")

### 17.4 Editing a Recurring Action

- **URL:** `/recurring/:id`
- Title: click-to-edit
- Shows "Active instance" badge linking to the currently spawned action (if any)
- "Spawn next" button: manually creates the next action instance from the template
- "Trash" button: deletes the recurring template
- Description: click-to-edit
- Recurrence rule: editable via `RecurrenceInput`
- Scheduled time + Duration: uses `DateTimeInput` component (`withDate=false`, `withDuration=true`, `clearable=true`). When no time is set, shows "Add time..." placeholder (tertiary color, italic, matching detail page empty field pattern); clicking sets 09:00 + 30 min. "Clear" link removes time and duration (reverts to all-day event). Time and duration editable via `DurationInput` dropdown.

---

## 18. Context Tags & Filtering

### 18.1 Tags System

- Tags are free-form text strings (lowercased, trimmed)
- All tags ever used by the user are cached and available for autocomplete
- Tags can be added to Actions and Projects (not to Stuff)

### 18.2 Tag Input

- Chip-style multi-value input with autocomplete dropdown
- Enter or comma commits the current text as a new tag
- Backspace on empty input removes the last tag
- Arrow keys navigate the suggestion dropdown
- Escape closes suggestions
- Click on a suggestion selects it

**Preset chips:** Displayed below the input as dashed-border buttons. Default presets:
- `@computer`, `@office`, `@home`, `@calls`, `@anywhere` (location contexts)
- `energy:high`, `energy:low` (energy level)
- `min:5`, `min:30` (estimated time)

Presets are customizable in Settings.

### 18.3 Tag Filter (Per-page)

- Filter icon button in list page headers (Next, Today, Waiting For, Projects, Someday)
- Click opens a dropdown listing all known tags as checkable items
- Selected tags shown as chips with remove (X) buttons
- Multiple tags can be selected simultaneously
- "Clear all" button when filters are active

### 18.4 Context Filter (Global)

- Located at the top of the sidebar, below the Dashboard link
- "Work where you are" concept from GTD
- Dropdown lists all known tags (presets + used tags)
- **Single-select toggle:** Selecting a tag sets it as the active global context; selecting it again clears it
- Active context tag is shown as a chip in the sidebar
- The active context filters all list views simultaneously: Next, Today, Waiting For, Projects, Someday, and the Engage dashboard
- When a page also has a per-page TagFilter, the context tag appears as a pre-applied, non-removable filter chip

---

## 19. Attachments

### 19.1 Attachment Section

- Available on: Action detail, Project detail, Stuff detail
- **Maximum:** 10 attachments per item
- **Maximum file size:** 50 MB per file

**File list:** Each attachment shows:
- File type icon (based on MIME type)
- File name (truncated with ellipsis)
- File size (formatted as B/KB/MB/GB)
- Download button (hover-visible on desktop, always visible on touch)
- Delete button (hover-visible on desktop, always visible on touch)

**Upload:**
- Click the "Attach a file..." placeholder or the add button to open file picker
- Drag-and-drop files onto the section
- Upload progress shown as a 3px progress bar
- Success: file appended to list
- File size limit checked client-side before upload

**Preview:**
- Click a file to open preview modal
- Images and PDFs rendered in-browser
- Text/JSON shown as plain text
- Object URLs cleaned up on close

**Delete:** Requires confirmation dialog; optimistically removed from list

**Limit reached state:**
- "Attachment limit reached (10 / 10)" notice shown
- Upload controls hidden
- Count always displayed (e.g., "3 / 10")

**Error mapping:**
- HTTP 409: "Attachment limit reached"
- HTTP 413: "File too large or storage quota exceeded"

**Read-only mode (`readonly` prop):**
- Used on shared projects when the caller is a read-only member (`<AttachmentSection :readonly="!canWrite" />`)
- Hides the empty-state drop zone, the "Attach another file..." link, and the per-file delete button
- Empty state renders "—" instead of "Attach a file..."
- Download remains available for all attachments

---

## 20. Comments

### 20.1 Comment Section

- Available on: Action detail, Project detail, Stuff detail
- **Maximum:** 50 comments per item
- Comments are **create-only** (no editing or deletion)

**Adding a comment:**
- Click "Add a comment..." placeholder to focus the textarea
- Textarea expands from 1 row to 3 rows when focused
- Cancel and Save buttons appear below when focused
- Escape cancels without saving
- Character counter: shows "N / 2000"
  - Turns secondary color above 1800 characters
  - Turns red above 2000 characters
  - Save button disabled above 2000

**Comment display:**
- Newest first
- Each comment shows:
  - Author's user avatar (initial-based, 28px) — resolved from `comment.user_id`
  - Author's email (above timestamp) — resolved from `comment.user_id` via: self check → project members (passed as `:members` prop) → connection list → fallback `Unconnected member`
  - Relative timestamp ("Just now", "3 minutes ago", "Yesterday", "5 days ago", formatted date for older)
  - Comment text in a rounded bubble
- Backend payload returns `user_id` (UUID) per comment (`GET /v1/{entity}/{id}/comments`); the frontend resolves the email/avatar locally — backend does not return `user_email`.

**Limit reached state:**
- "Comment limit reached (50 / 50)" notice shown
- Add form hidden

**Shared projects:** Comments are NOT role-gated. All members of a shared project — including read-only members — can post comments on the project itself and on any action within it. This is the only edit capability granted to read-only members per the P2 spec.

---

## 21. Settings

### 21.1 Settings Page

- **URL:** `/settings`
- **Auto-save:** Every setting change saves immediately to the backend
- **Saving indicator:** Spinning overlay on the control being saved; pointer events disabled during save
- **Offline fallback:** Settings load from localStorage immediately, then overwrite with API response; if API fails, localStorage values persist

### 21.2 Account Section

- **Email:** Read-only display of the user's email
- **Change Password:** Opens a modal
  - Fields: Current Password, New Password, Confirm New Password
  - Validation: Same password rules as registration
  - Error mapping: HTTP 400 → "New password does not meet requirements"; HTTP 401 → "Current password is incorrect"
  - On success: Shows count of other sessions revoked; refreshes session list
  - Mobile: Full-screen modal; Desktop: centered overlay (max 400px)

### 21.3 Sessions Section

- Loaded on mount; shows all active login sessions
- **Current session** identified and marked with "Current" badge

**Per-session display:**
- Device icon (phone or laptop emoji based on device string)
- Device name or "Unknown Device"
- IP address
- Last active time (relative: "Just now", "Xm ago", "Xh ago", "Xd ago", or formatted date)

**Actions:**
- Current session: "End" button → confirmation dialog → logs out, redirects to `/login`
- Other sessions: "End" button → confirmation dialog ("will be signed out within the next hour") → revokes session, removes from list
- "End Others" button (when >1 session): Confirmation with device count → revokes all except current

**Error state:** Error message + "Retry" button

### 21.4 Application Section

- **Theme:** Dropdown with three options:
  - **System Default** (default) — follows the operating system's light/dark preference; updates live when OS preference changes
  - **Light** — forces light theme regardless of OS setting
  - **Dark** — forces dark theme regardless of OS setting
  - Saved to `localStorage` only (no API call); takes effect immediately
  - Backwards-compatible: users with existing `wna_theme=dark` or `wna_theme=light` keep their choice; new users default to System Default
- **New items position:** Dropdown - "End" (default) or "Beginning"
  - Controls where newly created items appear in lists (top or bottom)

### 21.5 Tags Section

- **Quick-add presets:** Displayed as read-only chips
  - Click to edit with TagInput component showing default presets as suggestions
  - Focus-out auto-saves
  - Defaults: `@computer`, `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`

### 21.6 Calendar Section

- **Week starts on:** Monday (default) / Sunday
- **Time format:** 24-hour (default) / 12-hour (AM/PM)
- **Business hours start:** Hour picker (0-23), displayed in selected time format
- **Business hours end:** Hour picker (0-23)
- **Business days:** Row of clickable day buttons (Sun-Sat); selected days highlighted in blue

### 21.7 Review Section

- **Weekly Review toggle:** Shows/hides the Weekly Review section in the sidebar
- Default: enabled

### 21.8 About Section

- **Version:** Displays the app version number
- **Debug Mode toggle:** Enables a debug window overlay showing version, base URL, auth state, and window dimensions

---

## 22. Quick Add

### 22.1 QuickAddBtn

- Provides rapid inbox capture from any page

**Desktop (TopNav inline):**
- Button with "+ Quick Add" label in TopNav
- Click expands to inline input (min 200px)
- Enter submits to inbox and clears (stays expanded for rapid multi-capture)
- Escape or blur collapses and clears

**Mobile (FAB — floating action button):**
- QuickAdd is hidden from TopNav on mobile
- 52px circular "+" FAB fixed at bottom-right (20px inset)
- Tap FAB → expands into a full-width pill-shaped input bar at the bottom with "Add" button
- Enter or "Add" button submits to inbox, clears input, keeps focus for multi-capture
- Escape collapses back to FAB
- FAB hides behind sidebar overlay when sidebar drawer is open (z-index 899 < overlay 900)

---

## 23. Drag & Drop

### 23.1 Within-list Reorder

- Available on: Inbox, Next, Today, Waiting For, Someday, Projects, Project actions
- Uses touch-friendly drag library (`vue-draggable-plus`)
- Touch delay: 150ms (prevents accidental reorders while scrolling)
- Animation: 150ms move transition
- Visual states: chosen item highlighted, ghost placeholder shows drop position
- API call on drop to persist new position; full list reload on error

### 23.2 Cross-component Drag (List to Sidebar)

- Items can be dragged from list views to sidebar menu items
- Native HTML5 drag-and-drop API used for cross-component communication
- Draggable source pages: Inbox, Next Actions, Today, Waiting For, Projects, Someday, Completed, Reference (transformed files only)
- Compatible sidebar targets accept specific types:
  - Next, Today, Calendar, Waiting For accept stuff, actions, projects, someday items, completed items, and reference files
  - Inbox accepts someday items, completed items, and reference files (source_type=stuff)
  - Projects accept stuff, actions, someday items, completed items, and reference files (source_type=project)
  - Someday accepts stuff, actions, projects, and completed items
  - Completed accepts stuff, actions, projects, and someday items
  - Trash accepts stuff, actions, projects, someday items, and completed items
  - Reference accepts stuff, actions, and projects (transforms to file)
- Projects dragged to Next/Today/Calendar/Waiting For are transformed to actions (single API call)
- Complex drops (Calendar, Waiting For, Projects) open modal dialogs for additional input
- Completed/Someday items are routed by their entity type (STUFF/ACTION/PROJECT) to the correct API

### 23.3 Drag Discoverability

- On first visit to a list page, a "Drag to reorder" hint overlay appears
- Items display a wiggle animation to draw attention
- Hint is dismissed after the first drag and persisted to localStorage (per list type)

### 23.4 Overdue Item Highlighting

- Items with past due dates get a red left border and light red background in list views
- Applied automatically in all list views via the `isOverdue()` utility
- **MetadataRow badges:** Due chips show "Due [date]" in red; overdue chips show "Overdue [date]" in dark red
- **Calendar items:** Due-only items show red styling; overdue due-only items show dark red styling
- **Color coding across views:** Consistent use of red (due, future) and dark red (overdue, past) in MetadataRow chips and calendar items

---

## 24. Public Pages

### 24.1 Landing Page

- **URL:** `/`
- **Layout:** Top navigation + content sections + footer

**Sections:**

1. **Hero Section** (dark background)
   - Heading: "Capture. Clarify. Organize. Reflect. Engage."
   - Subtitle: "Achieve stress-free productivity with the GTD methodology."
   - CTAs: "Start Free" (opens registration) + "Learn More" (scrolls to How It Works)

2. **How It Works** (white background, anchor: `#how-it-works`)
   - 3-step flow: Capture → Clarify → Engage
   - Each with numbered circle, title, and description
   - Desktop: horizontal layout with connector line; Mobile: vertical stack

3. **Features** (light blue background, anchor: `#features`)
   - Heading: "Your Trusted System, Organized"
   - 9 feature cards with icons: Inbox, Next Actions, Projects, Waiting For, Someday/Maybe, Calendar, Weekly Review, Context Tags, Reference Files
   - Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

4. **Why Us** (white background)
   - Heading: "Designed for Clarity and Focus"
   - 3 items: Pure GTD, Minimalist Design, Cross-Platform

5. **Testimonial** (light blue background)
   - Heading: "Why I Built This"
   - Founder's quote (Dr. Vladimir Hozjan) about building WNA

6. **Book Section** (white background)
   - GTD book cover image + description + "Get the Book on Amazon" link

7. **CTA Banner** (blue background)
   - Heading: "Ready to Get Things Done?"
   - "Start Free" button

### 24.2 Pricing Page

- **URL:** `/pricing`

**Billing toggle:** Monthly / Yearly (default yearly). "Save 20%" badge on yearly option.

**3 tiers:**

| | Free | Pro | Business |
|---|---|---|---|
| Monthly | €0 | €25/mo | €60/mo |
| Yearly | €0 | €20/mo (€240/yr) | €48/mo (€576/yr) |
| Description | "Get started with the basics of GTD." | "For individuals serious about productivity." | "For teams and power users who need it all." |
| Featured | No | Yes ("Most Popular") | No |
| CTA | "Start for Free" (opens register) | "Contact Us" (email) | "Contact Us" (email) |
| Storage | 10 MB | 250 MB | 1 GB |
| Projects | 10 | 100 | Unlimited |
| Actions | 50 | 500 | Unlimited |
| Stuff items | 10 | 100 | Unlimited |
| Context tags | 5 | 25 | Unlimited |
| Recurring | No | Yes | Yes |
| Support | Email | Priority | Dedicated |

**Feature comparison table:**
- Desktop: Full table with columns (Feature / Free / Pro / Business)
- Mobile: Card per feature with 3-column grid
- 16 comparison rows covering all major features

### 24.3 Help Page

- **URL:** `/help`
- **Status:** Placeholder - shows "Help & Resources" heading + "Coming soon."

### 24.4 Legal Pages

- **URLs:** `/legal/terms`, `/legal/privacy`
- **Status:** Placeholders - show "Terms of Service" / "Privacy Policy" headings + "Coming soon."
- `/legal` redirects to `/legal/terms`

### 24.5 Public Footer

- Appears on all public pages
- **Columns:**
  - Brand: Logo + "WhatsNextAction"
  - Product: Features, Pricing links
  - Support: Help & FAQ link
  - Legal: Terms of Service, Privacy Policy links
- Responsive: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)

---

## 25. Shared UI Behaviors

### 25.1 Toast Notifications

- **Error toasts:** Red, auto-dismiss after 5 seconds
- **Success toasts:** Green, auto-dismiss after 3 seconds
- Maximum 5 toasts visible simultaneously (oldest dropped when full)
- Identical messages are deduplicated
- Click a toast to dismiss immediately
- Animated with fade + slide up/down transitions
- Fixed at bottom-center of screen

### 25.2 Confirmation Dialogs

- Modal overlay with title, message, confirm button, and cancel button
- Used for all destructive actions (delete, trash, empty trash, logout, end session)
- Global singleton pattern (one confirmation at a time)

### 25.3 GTD Tips

- Educational tip components embedded in various pages
- Styled with a blue or grey left border
- Dismissible (X button); dismissed state persisted to backend settings
- Animated entrance (fade + slide)

### 25.4 Inline Title Editing

- Click on item title in any list to start editing
- Input auto-sizes to match the text width
- Enter or blur saves changes
- Escape cancels editing
- Optimistic update with rollback on API error

### 25.5 Item List Common Features

- All items load at once (no pagination for Inbox, Next Actions, Today; cursor-based pagination with "Load more" used for Completed, Trash, and Reference files)
- Per-item loading spinners (spinning ring replaces action buttons)
- Empty state with icon + message + instructional text
- Overdue items highlighted with red left border
- Active item (currently viewed in detail) highlighted with blue left border

### 25.6 Detail Page Common Features

- Position-based navigation arrows (First/Previous/Next/Last)
- Click-to-edit title (auto-resizing textarea)
- Click-to-edit description
- Context-aware back navigation
- State-dependent action buttons
- Attachments section (when applicable)
- Comments section (when applicable)
- Created/Updated timestamp metadata

### 25.7 Mobile Adaptations

- Sidebar hidden; replaced with slide-in drawer triggered by animated hamburger (☰ → X) in TopNav
- Sidebar auto-closes on route change
- User avatar hidden on mobile dashboard (profile accessible via Settings)
- Quick Add moved from TopNav to a floating action button (FAB) at bottom-right
- Dropdowns render as bottom action sheets (sliding up from bottom)
- Select components render as full-width bottom sheets with headers
- Modals may render full-screen instead of centered overlay
- Action buttons always visible on touch devices (no hover-to-reveal)
- Reduced metadata display (fewer tags shown, hint text hidden)

### 25.8 Keyboard Shortcuts

- Enter: Submit forms, save inline edits
- Escape: Cancel editing, close modals, close dropdowns
- Backspace: Go back in clarify wizard (when not in input)
- Arrow Up/Down: Navigate tag autocomplete suggestions
- Comma: Commit tag in TagInput

---

## 26. Email System (Backend)

The backend notification service handles all outbound email delivery via SMTP with TLS support.

### 26.1 SMTP Configuration

- **From address:** `noreply@whatsnextaction.com` ("WhatsNextAction")
- **Protocol:** SMTP with STARTTLS and optional AUTH LOGIN
- **Default dev server:** Mailpit on `localhost:1025` (no auth required)
- **Production:** Configurable SMTP host, port, username, password via `notification_service/config/config.json`
- **Message format:** Multipart MIME (HTML + plaintext fallback)

### 26.2 Email Templates

The backend defines 8 email templates with variable substitution (`{{variable}}`):

| Template | Subject | Priority | Trigger |
|----------|---------|----------|---------|
| Email Verification | "Verify your WNA account" | Urgent | User registration |
| Welcome | "Welcome to WNA!" | Urgent | Email verified successfully |
| Login Alert | "New login to your WNA account" | Normal | Successful login (device, IP, time) |
| Password Reset | "Reset your WNA password" | Urgent | Forgot password request |
| Password Changed | "Your WNA password was changed" | Urgent | Password changed or reset |
| Tasks Due Today | "Tasks due today" | Normal | Daily digest (if tasks are due) |
| Daily Next Actions | "Your next actions for today" | Normal | Daily digest (next actions summary) |
| Project Needs Next Action | "Project needs a next action" | Normal | Project has no next action assigned |

### 26.3 Message Queue & Delivery

- **Message broker:** RabbitMQ with exchange `notifications`
- **Priority queues:**
  - `q.notification.urgent` — Email verification, password reset, password changed, welcome (always delivered, cannot be disabled by user)
  - `q.notification.normal` — Login alerts, task reminders (respects user notification preferences)
  - `q.notification.marketing` — Promotional emails
  - `q.notification.update` — Feature update emails
- **Delivery logging:** All email sends are logged to `notification_log` table with status (sent/failed/skipped), recipient, subject, and error detail

### 26.4 Security

- **Token generation:** 64-character cryptographically secure random tokens for email verification and password reset
- **Email verification tokens:** Expire after 24 hours, single-use (deleted after verification)
- **Password reset tokens:** Expire after 1 hour, single-use (deleted after reset)
- **Anti-enumeration:** Forgot password and resend verification endpoints always return HTTP 200 regardless of whether the email exists
- **Rate limiting:**
  - Register: 5.0 req/s
  - Login: 3.0 req/s
  - Forgot password: 3.0 req/s
  - Verify email / Resend verification / Reset password: 1.0 req/s

---

## 27. Notification Settings

### 27.1 Notification Preferences (Frontend)

- **API endpoints:**
  - `GET /v1/notification/settings` — Retrieve current notification preferences
  - `PUT /v1/notification/settings` — Update notification preferences
- **Master email toggle:**
  - A top-level "Email notifications" toggle acts as an on/off switch for all email notifications
  - When OFF, the backend receives `disabled_events.email: ["*"]` (wildcard disabling all events)
  - When ON, the backend receives the individual disabled list (or empty array if all enabled)
  - Individual event toggles appear below the master toggle and are disabled (greyed out) when the master is OFF
  - Individual event states are preserved in memory; turning the master back ON restores previous individual settings
- **Individual event toggles** (each maps 1:1 to a backend event name in `disabled_events.email`):
  - **Task due today** (`task_due_today`) — daily reminder for tasks due today
  - **Daily next actions** (`daily_next_actions`) — summary of next actions for the day
  - **Project needs next action** (`project_needs_next_action`) — alert when a project has no next action
  - **Delegated to you** (`delegated_to_you`) — email when a connection delegates an action to you
  - **Delegation completed** (`delegation_completed`) — email when an action you delegated is completed
  - **Connection invitations** (`connection_invite`) — email when someone invites you to connect
- **In-app notifications cannot be disabled.** The backend only accepts the `email` channel in `disabled_events`. In-app notifications are intentionally low-volume per-item events and are always delivered. The notification bell in the top nav (§31) always shows them.
- **Urgent notifications** (email verification, welcome, password reset, password changed, login alert) are always delivered and cannot be disabled.
- The footer note in the Notifications section reads: *"In-app notifications are always on. Security emails (verification, password reset, login alerts) cannot be disabled."*

---

## 28. Limits & Quotas

| Resource | Free | Pro | Business |
|---|---|---|---|
| Storage | 10 MB | 250 MB | 1 GB |
| Projects | 10 | 100 | Unlimited |
| Actions | 50 | 500 | Unlimited |
| Stuff items | 10 | 100 | Unlimited |
| Context tags | 5 | 25 | Unlimited |
| Recurring templates | No | Yes | Yes |
| Attachments per item | 10 | 10 | 10 |
| Max attachment file size | 50 MB | 50 MB | 50 MB |
| Comments per item | 50 | 50 | 50 |
| Comment max length | 2000 chars | 2000 chars | 2000 chars |

---

## 29. Feedback Button

A floating feedback button is available on every page (both dashboard and public/landing pages). It provides quick access to support and bug reporting.

### 29.1 Appearance & Position

- Small circular button (40×40px) with a speech bubble icon, fixed to the bottom-right corner
- **Desktop:** `bottom: 24px; right: 24px`
- **Mobile (≤768px):** `bottom: 92px; right: 16px` — positioned above the Quick Add FAB to avoid overlap
- Uses elevated shadow for visibility; adapts to light and dark themes

### 29.2 Popover Menu

Clicking the button opens an upward popover with two options:

| Option | Action | Email |
|---|---|---|
| Contact Support | Opens email client with pre-filled subject | `support@whatsnextaction.com` (Subject: "Support Request - WhatsNextAction") |
| Report a Bug | Opens email client with pre-filled subject | `bug@whatsnextaction.com` (Subject: "Bug Report - WhatsNextAction") |

- Clicking outside the popover closes it
- Selecting an option closes the popover and opens the user's default email client

---

## 30. Connections (Team Tier)

Connections are bidirectional peer-to-peer relationships between Team tier users. They are the foundation for P2 collaboration features (delegation, shared projects). Connections are flat — there is no "team" entity, just a contact list of other WNA users you collaborate with.

### 30.1 Tier Eligibility

Connections are a **Team tier** feature, but received invitations are visible to all tiers so recipients always know who is trying to connect.

| Capability | Free | Pro | Team |
|------------|------|-----|------|
| See received invitations | Yes | Yes | Yes |
| Decline received invitations | Yes | Yes | Yes |
| Accept received invitations | No (triggers upgrade modal) | No (triggers upgrade modal) | Yes |
| Send invitations | No | No | Yes |
| See accepted connections list | No | No | Yes |
| See sent invitations list | No | No | Yes |

Backend gate: `POST /v1/connections/invite` and `POST /v1/connections/invite/{token}/accept` return `403 Not Team tier` for Free/Pro. `GET /v1/connections/pending` is open to all tiers so received invitations can be shown. If a user downgrades from Team, the backend auto-removes all their connections.

### 30.2 UI Location

- Settings → **Connections** section (collapsible card).
- The section header shows a small numeric badge when there are unseen received invitations (badge shown regardless of tier).

### 30.3 Invite by Email (Team tier only)

- Email input with a **Send** button — rendered only for Team tier users.
- Frontend validates the address is a valid email and not the current user's own address before sending.
- On success: a toast confirms the invitation was sent, and the invitation appears in the "Pending invitations" list.
- If the invitee already has a WNA account, they receive an in-app notification + email. If they do not yet have an account, the backend email includes a registration link; the invitation stays pending until they register and upgrade to Team.

### 30.4 Received Invitations (all tiers)

- Each pending received invitation displays the inviter's email and the time since it was sent.
- **Accept** and **Decline** buttons are shown for every tier.
- **Team tier:** Accept calls the backend; on success the invitation disappears from the received list and the contact appears in the accepted list. Decline removes the invitation from the received list.
- **Free / Pro tier:** clicking Accept opens the standard upgrade modal with a tier-specific message ("Accepting connections is available on the Team plan…") — no backend call is made. A hint above the list reminds the user: *"Accepting a connection requires the Team plan. You can decline any invitation on your current plan."* Decline still works normally.
- If the backend returns `403` on Accept (e.g. tier changed mid-session), the upgrade modal is shown as a fallback.

### 30.5 Sent Invitations

- Each pending sent invitation shows the recipient's email and when it was sent, plus a **Cancel** action to withdraw it.

### 30.6 Accepted Connections

- Each entry shows the other user's email and the date the connection was established.
- **Remove** button is available on either side — either the inviter or invitee can sever the connection.
- Remove is confirmed via the standard confirm dialog. In-flight delegations (if any) stay in the assigner's Waiting For and the receiver's Inbox — removing the connection does not cancel in-progress work.

### 30.7 API endpoints

- `POST /v1/connections/invite` — Invite by email
- `POST /v1/connections/invite/{token}/accept` — Accept invitation
- `POST /v1/connections/invite/{token}/decline` — Decline invitation
- `GET /v1/connections` — List accepted connections
- `GET /v1/connections/pending` — List pending invitations (sent + received)
- `DELETE /v1/connections/{id}` — Remove connection

### 30.8 Related P2 Features

- Per-connection **delegation** is implemented and documented in §32. The connection picker is wired into the Clarify panel ("Delegate It" substep) and Action Detail (state changes that land in WAITING).
- **Shared Projects** are implemented and documented in §33. Sharing is initiated from Project Detail by the project owner.

---

## 31. In-App Notifications

In-app notifications surface meaningful events (delegated items, completed delegations, connection invitations) without requiring email. This supplements the existing email-based notification settings (see §27).

### 31.1 Bell in Top Nav

- A bell icon is visible in the authenticated top nav (dashboard and non-dashboard contexts).
- When there are unread notifications, a small numeric badge shows the count (displayed as `99+` when over 99).
- Clicking the bell opens a dropdown panel with the most recent notifications.

### 31.2 Notification Dropdown

- Panel shows up to 20 recent notifications with unread items highlighted and marked with a small dot.
- Each notification displays its message and time since creation (e.g. "12m ago").
- Clicking an unread notification marks it as read optimistically (badge decrements immediately; rolled back on API error).
- Clicking a notification routes to the linked entity when available:
  - `entity_type = stuff` → stuff detail
  - `entity_type = action` → action detail
  - `entity_type = project` → project detail
  - `type = connection_invite` → settings (Connections section)
- Empty state: "You're all caught up."

### 31.3 Polling

- The unread count is refreshed every 30 seconds while the top nav is mounted (dashboard or landing).
- Polling starts on mount when authenticated and stops on logout or unmount.

### 31.4 API Endpoints

- `GET /v1/notifications` — List notifications (paginated, returns unread count)
- `POST /v1/notifications/{id}/read` — Mark as read
- `GET /v1/notifications/unread-count` — Badge count

### 31.5 Unified with Email Notifications

- In-app notifications share the backend's notification system with email. A notification is stored as a row in `notification_log` with `channel='in_app'` whenever the corresponding event fires. Any authenticated user can receive in-app notifications — the feed is not Team-tier gated.
- **In-app notifications cannot be disabled.** Per the backend contract (`PUT /v1/notification/settings` accepts only the `email` channel in `disabled_events`), in-app delivery is always on. Email preferences for the same event names — including the P2 events `delegated_to_you`, `delegation_completed`, `connection_invite` — are managed in Settings → Notifications (§27.1).
- Polling errors are swallowed silently so transient network issues don't surface as toasts.

---

## 32. Delegation (Team Tier)

Delegation is fire-and-forget assignment of an action to one of your accepted connections. The assigner's action moves to Waiting For; a new Stuff item appears in the receiver's Inbox; the receiver clarifies it like any other Stuff. **Self-delegation is blocked.**

### 32.1 Where Delegation Can Be Triggered

The same connection-aware "Who/what are you waiting on?" combobox is used everywhere an action lands in WAITING:

- **Clarify panel** — "Delegate It" substep
- **Action Detail** — state change to WAITING via the Move dropdown or detail form
- **Move modal** — drag onto Waiting For in the sidebar
- **Waiting For page** — adding a new waiting item

Typing filters accepted connections (`GET /v1/connections`) by display label and email. Selecting a connection delegates via `POST /v1/action/{id}/delegate`. Free-text input falls back to legacy `POST /v1/action/{id}/wait`.

### 32.2 Assigner Side

- Action moves to WAITING with `waiting_for` (user's display label) and `waiting_for_user_id` (real user ID) populated.
- Action appears in the assigner's Waiting For list with the receiver's name and "since" duration.
- The assigner sees no information about how the receiver organizes the work — it's a black box.
- **No recall.** The assigner cannot pull the delegation back. They can only manually resolve their own Waiting For.

### 32.3 Receiver Side

- New Stuff item lands in the receiver's Inbox with title + description copied from the assigner's action.
- The Inbox row and the Stuff Detail page both show a small "From: [assigner name/email]" indicator (rendered by `MetadataRow`).
- Receiver clarifies normally — Action / Project / Someday / Reference / Trash. No special flow.
- Hidden meta (`delegated_from_user_id`, `delegated_from_action_id`) carries forward when Stuff transforms into Action or Project.

### 32.4 Resolution Sync

Any receiver-side **terminal event** triggers automatic resolution on the assigner's side:

- **Completion**: receiver checks the box on the Stuff/Action/Project, clicks "Do it now" in Clarify, or completes from the detail page
- **Trash**: receiver trashes the Stuff/Action/Project — same outcome as completion (real life: discarded delegations also unblock the assigner)

When triggered:
- A "Done." comment is written on the assigner's original action (the receiver may extend the message)
- Assigner's action auto-promotes from WAITING → NEXT (or → CALENDAR if `scheduled_date` is set)
- `waiting_for`, `waiting_since`, `waiting_for_user_id` are cleared
- Assigner receives a `delegation_completed` in-app + email notification

**Non-terminal**: Sending the item to Someday or Reference does NOT trigger sync.

### 32.5 Delegation Chains

Re-delegation is allowed. Each link is independent:

- Alice → Bob → Carol
- Carol completes → Bob's Waiting For resolves, Bob is notified
- Bob completes → Alice's Waiting For resolves, Alice is notified

### 32.6 Edge Cases

- **Self-delegation blocked**: the connection picker excludes the current user (`excludeUserIds` includes self).
- **Tier downgrade**: a non-Team user cannot create new delegations (`POST /v1/action/{id}/delegate` returns 403). In-flight delegations they are part of (either side) continue to function — completing on either side still unwaits and notifies as expected.
- **Connection removed mid-delegation**: in-flight delegations are NOT cancelled. The assigner's Waiting For stays open and the receiver's Stuff stays in their inbox.
- **Receiver sends to Reference**: delegation link is lost (Reference is non-completable). The assigner's Waiting For stays open until manually resolved.
- **Assigner deletes their action**: not implemented yet (no UI to "abandon" without resolving).

### 32.7 API Endpoints

- `POST /v1/action/{id}/delegate` — Delegate an action to a connection
  - Body: `{ user_id: string }`
  - 403 when caller is not Team tier or `user_id` matches the caller
  - 404 if the target user is not an accepted connection

---

## 33. Shared Projects (Team Tier)

A shared project is a personal project that has been shared with one or more accepted connections, each assigned a per-project role (write or read-only). There is no "create shared project" entry point — sharing is the conversion path.

### 33.1 Sharing a Personal Project

- Trigger: **"Share…"** button in the Project Detail action row (owner only, hidden when the project is completed)
- Opens the **Share / Add member modal**:
  - Search box filters accepted connections by email
  - Multi-select list with checkmarks
  - Selected connections receive the **Write** role by default
  - Submit calls `POST /v1/project/{id}/share` with `{ members: [{ user_id, role }, …] }`
- On success: the project becomes shared, the badge appears, and the shared layout (backlog, members list, completed section) renders
- Tier gate: `myTier !== 'team'` opens the upgrade modal instead of the share dialog

### 33.2 Roles

Set per-project. Owner can change any non-owner member's role at any time via a dropdown next to the member's name in the "Shared with" section.

| Role | Edit project metadata | Manage backlog | Self-assign | Edit action descriptions/attachments | Edit own private tags | Add comments | Manage members | Trash project |
|---|---|---|---|---|---|---|---|---|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Write** | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| **Read-only** | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | ✅ | 🚫 | 🚫 |

"Edit project metadata" = title, outcome, description, project-level attachments.

### 33.3 Backlog View

For shared projects the personal "Next Action" section is replaced by a **Backlog** section: a single flat list of all project actions (assigned + unassigned) with assignee chips per row.

- **Add action** (write members): quick-add input above the list. Hidden for read-only members.
- **Reorder** (write members): drag-and-drop. The draggable is `:disabled="!canWrite"` so read-only members cannot reorder.
- **Per-row assignee display**:
  - Unassigned: no chip
  - Assigned to current caller: green "You" badge
  - Assigned to someone else: their email/display label, plus "· waiting" when the action is in WAITING state
- **Per-row controls** (visible when applicable):
  - **Assign to me** (PersonAddIcon): unassigned action + caller is write/owner + caller has no current assigned action on this project
  - **Unassign** (PersonRemoveIcon): action is assigned to caller
  - **Trash**: caller is write/owner on an unassigned action, OR caller is the assignee
- **Inline title edit** on a row is allowed only when `canWrite && (!action.assigned_to || isAssignedToMe(action))`.
- **Checkbox** on a row appears only when `canCompleteAction(action)` returns true (unassigned + write/owner, or assigned to caller).

### 33.4 Project-Level Field Permissions

Field gating is enforced both in the UI and in the save handlers. Per the P2 spec, project-level fields are **owner-only**; tags are **always editable** since they are private per user.

| Field | Owner | Write | Read-only |
|---|---|---|---|
| Title | ✅ click-to-edit | view only (no pointer cursor, no hover bg) | view only (no pointer cursor, no hover bg) |
| Outcome | ✅ click-to-edit, placeholder "What does done look like?" | view only, placeholder "—" | view only, placeholder "—" |
| Description | ✅ click-to-edit, placeholder "Add a description..." | view only, placeholder "—" | view only, placeholder "—" |
| Tags (private per user) | ✅ click-to-edit, placeholder "Add tags..." | ✅ click-to-edit, placeholder "Add tags..." | ✅ click-to-edit, placeholder "Add tags..." |
| Attachments (upload/delete) | ✅ | ✅ | 🚫 download only (see §19.1 read-only mode) |
| Comments | ✅ | ✅ | ✅ |

**Save body shape** — `PUT /v1/project/{id}` is atomic on the backend. The frontend selects the body based on the caller's role:

- **Owner** (personal or shared): full body — `{ title, description, outcome, tags }`
- **Non-owner** (write OR read-only): tags-only — `{ tags }`. Sending any of `title` / `outcome` / `description` returns 403 and rejects the tag write too.

### 33.5 Members ("Shared with") Section

- Lists all project members with avatar + display label, ordered: owner first, then current user, then by joined date.
- Owner badge or per-role label next to each name.
- **Owner-only controls**:
  - Role dropdown for non-owner members (Write / Read-only) → `PATCH /v1/project/{id}/members/{uid}`
  - Per-member remove button → `DELETE /v1/project/{id}/members/{uid}`
  - "Add another member..." link (when there are addable connections) → opens the Add member variant of the share modal
- **Non-owner**: see the list with no edit controls. Leave is handled via the action button row (see §33.7), not from this section.

### 33.6 Completed Section

Collapsible "Completed" section is rendered for **all projects** (personal and shared).

- **Data source:** `GET /v1/project/{id}/completed` (per-project endpoint). Returns only completed actions belonging to this project, ordered by `completed_at DESC`. Caller must be the owner (personal) or a project member (shared).
- **Personal projects**: each row shows the action title + completion date.
- **Shared projects**: each row shows the title + "completed by [email] · [date]" (the completer is resolved from the action's `completed_by` field against the members list).
- Empty state: "No completed tasks yet."
- Loaded lazily on first expand to avoid blocking the project page; first page is 100 items.

### 33.7 Leaving a Shared Project

- Non-owner members see a **"Leave"** button in the action button row (where owners see "Trash"). Trash is not visible to non-owners.
- Click → confirm dialog: *"You will lose access. Any actions assigned to you return to the backlog."*
- On confirm: `DELETE /v1/project/{id}/members/{my_user_id}` is called; on success, the user is routed back to `/projects`.
- If the user is the **last non-owner**, the project automatically reverts to a personal project on the owner's side (auto-conversion).

### 33.8 Owner Removing a Member

- Owner clicks the per-member remove button in "Shared with".
- Confirm dialog: *"[email] will lose access. Their assigned actions return to the backlog."*
- On confirm: `DELETE /v1/project/{id}/members/{uid}`. The member's in-progress assigned action returns to backlog; completed actions stay.
- If the removed member was the last non-owner, the project auto-reverts to personal.

### 33.9 What's NOT Yet Implemented

- **Force-convert shared → personal** (`POST /v1/project/{id}/unshare`): apiClient wraps the endpoint but no UI surface exposes it yet. Auto-conversion (last non-owner removed) still works via the backend.
- **Per-user private tags on actions**: backend stores them; frontend reads/writes them at the action level — see Action Detail. Project-level tags follow the same per-user-private rule and the conditional save body shape above.
- **Real-time updates**: shared project state still polls (no WebSocket). Members may need to refresh to see other members' changes.

### 33.10 API Endpoints

- `POST /v1/project/{id}/share` — Convert personal → shared with initial members
- `POST /v1/project/{id}/unshare` — Convert shared → personal (force) — apiClient wired, no UI yet
- `GET /v1/project/{id}/members` — List project members with roles
- `POST /v1/project/{id}/members` — Add a member (must be a connection)
- `PATCH /v1/project/{id}/members/{uid}` — Change a member's role
- `DELETE /v1/project/{id}/members/{uid}` — Remove a member (or self → leave)
- `POST /v1/action/{id}/assign` — Self-assign an unassigned backlog action
- `POST /v1/action/{id}/unassign` — Return your assigned action to the backlog
- `PUT /v1/project/{id}` — Update project; body shape depends on caller role (see §33.4)
- `GET /v1/project/{id}/completed` — List completed actions for this project (used by §33.6)

---

## Appendix A: GTD Business Rules Enforced

1. **Stuff has no metadata:** Inbox items cannot have tags, dates, or delegation until clarified into an Action or Project.
2. **Two-minute rule:** During clarify, actions that can be done in under 2 minutes are completed immediately rather than tracked.
3. **Projects must have a next action:** Project detail shows a warning when no next action is assigned.
4. **Backlog auto-promotion:** When a project's next action is completed, the next item in the backlog automatically becomes the new next action (FIFO order).
5. **Projects cannot be completed from list view:** Only from the detail page.
6. **Clarify is the required path from Stuff:** Stuff items must be clarified to become actionable.
7. **Tickler system:** Actions with a `defer_until` / `start_date` are hidden until that date, then appear in Next.
8. **Hard landscape:** Calendar is reserved for time-specific commitments only.

## Appendix B: Data Persistence

- **JWT tokens:** `localStorage` (`auth_token`, `refresh_token`, `refresh_token_hash`)
- **User data cache:** `localStorage` (`current_user`)
- **Settings cache:** `localStorage` (fallback when API unavailable)
- **View preferences:** `localStorage` (calendar view mode, reference view mode, new items position, drag hints, debug mode, dismissed tips)
- **Cross-tab logout signal:** `localStorage` (`logout` key, listened via `storage` event)

## Appendix C: Error Handling Summary

| Scenario | HTTP Status | User Message |
|---|---|---|
| Login - bad email | 400 | "Incorrect email format, please correct email address." |
| Login - wrong credentials | 401 | "Incorrect email and/or password. Please correct your credentials." |
| Login - email not verified | 403 | Transitions to "unverified" mode with resend verification option |
| Register - duplicate email | 409 | "Email already exists. Change email or sign in." |
| Verify email - invalid token | 400 | "Invalid verification link" |
| Verify email - expired token | 410 | "Verification link has expired" with resend option |
| Change password - bad new password | 400 | "New password does not meet requirements." |
| Change password - wrong current | 401 | "Current password is incorrect." |
| Rate limited | 429 | "Too many requests. Please try again later." |
| Server error | 500 | "Internal server error. Please try again later." |
| Service unavailable | 503 | "Service unavailable. Please try again later." |
| Network error | — | "No response from server. Check your connection." |
| Attachment limit reached | 409 | "Attachment limit reached" |
| File too large | 413 | "File too large or storage quota exceeded" |
