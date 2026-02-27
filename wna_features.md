# WhatsNextAction (WNA) - Complete Feature Documentation

> **Purpose:** This document describes every user-facing feature currently implemented in the WNA frontend. It is intended as a reference for creating UI test cases, Terms of Service, Help/FAQ content, and QA documentation.
>
> **Last updated:** 2026-02-26

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
26. [Limits & Quotas](#26-limits--quotas)

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
- **Fields:** Email, Password, Confirm Password
- **Presentation:** Modal dialog overlay with blur backdrop on the landing page
- **Password requirements:** Minimum 8 characters, must contain at least one letter, one digit, and one symbol
- **Validation (client-side):**
  - Email format check (`user@domain.tld`)
  - Password strength regex check
  - Confirm password must match
  - Submit button disabled until all three fields are non-empty
- **On success:** User is automatically logged in and redirected to the Dashboard (`/engage`)
- **Error handling:**
  - HTTP 409: "Email already exists. Change email or sign in."
  - Other errors shown as toast notifications

### 2.2 Login

- **Entry points:** "Sign In" button on landing page, `/login` URL
- **Fields:** Email, Password
- **Validation:** Same email and password format checks as registration
- **On success:** Tokens stored, redirected to `/engage`
- **Error handling:**
  - HTTP 400: "Incorrect email format, please correct email address."
  - HTTP 401: "Incorrect email and/or password. Please correct your credentials."

### 2.3 Forgot Password

- **Entry point:** "Forgot your password? Reset it" link on login form
- **Fields:** Email only
- **Behavior:** Submits email to backend, receives reset token, automatically transitions to the Reset Password form in the same dialog session

### 2.4 Reset Password

- **Fields:** New Password, Confirm New Password
- **Validation:** Same password strength rules as registration; confirm must match
- **On success:** Transitions to login form

### 2.5 Auth Dialog Shared Behaviors

- Fixed overlay with `backdrop-filter: blur(3px)`, centered card (max 420px wide)
- Click outside (on backdrop) closes the dialog
- Animated transitions between auth modes (fade + slide up)
- Switching modes clears errors; email is preserved when navigating to login; passwords are always cleared
- All form state is component-local (not persisted to localStorage)

### 2.6 JWT Token Management

- Access token and refresh token stored in `localStorage` (`auth_token`, `refresh_token`)
- **Proactive refresh:** Before every API call, the token expiry is checked; if it expires within 60 seconds, the token is refreshed automatically before the request proceeds
- **Refresh failure:** If the refresh token is invalid or expired (HTTP 401/404), the user is logged out and redirected to the landing page
- **Cross-tab logout:** Logging out in one browser tab instantly logs out all other open tabs (via `localStorage` `storage` event)

### 2.7 Logout

- **Entry points:** TopNav avatar dropdown "Logout", Settings page session row "End", Sidebar footer "Logout"
- **Confirmation:** A confirmation dialog ("Are you sure you want to log out?") is shown before proceeding
- **Behavior:** Calls logout API, clears localStorage tokens, broadcasts cross-tab logout signal, redirects to landing page
- **Server failure:** Silently ignored (localStorage is always cleared)

### 2.8 Route Protection

- Dashboard pages are protected at the layout level: `DashboardLayout` redirects to the landing page on mount if not authenticated
- If authentication state changes mid-session (e.g., cross-tab logout), the dashboard reactively redirects to landing
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
- Quick Add button (captures new inbox items from any page)
- Mobile: Hamburger icon to open sidebar drawer
- Desktop: User avatar with dropdown menu containing "My Dashboard", "Settings", "Logout"

### 3.2 Sidebar (Desktop)

- 260px fixed-width left panel, always visible above 768px
- **Navigation items** (each with icon and count badge):
  - Dashboard (`/engage`)
  - Context Filter (tag-based work context selector)
  - Next Action, Today, Inbox, Projects, Calendar, Waiting For, Someday / Maybe
  - Reference (shows storage quota badge instead of count)
  - Review (conditional: only shown when review is enabled in settings; shows days-since-last-review badge with color coding: orange at 7+ days, red at 14+ days)
  - Completed, Trash
- **Footer:** Settings link + Logout button
- **Drag-drop targets:** Most sidebar items accept dragged items (stuff/actions) from list views. Complex drops (Calendar, Waiting For, Projects) open modals for additional input.
- **Count badges** update after every create/complete/delete/move operation (debounced 300ms)

### 3.3 Sidebar Drawer (Mobile)

- Slide-in drawer from the left on viewports <= 768px
- Semi-transparent overlay with blur effect
- Click on overlay closes the drawer
- Contains the same Sidebar content

### 3.4 User Avatar

- 36px circle (32px on mobile)
- Shows user avatar image if available
- Fallback: Colored circle with first two characters of email (uppercased)
- Background color deterministically generated from email (consistent per user)

---

## 4. Inbox (Stuff)

### 4.1 Inbox Page

- **Purpose:** Capture zone for raw, unprocessed items ("Stuff"). Items in the inbox have no metadata - no tags, dates, or delegation.
- **URL:** `/inbox`

**Adding items:**
- Text input + "Add" button at the top
- Press Enter to submit
- Input hidden when in clarify mode

**Item list:**
- Scrollable list with cursor-based pagination (10 items per page, "Load more" button)
- Total item count shown in sidebar badge

**Per-item operations:**
- **Checkbox (complete):** Marks the stuff item as done, removes it from the list, shows success toast
- **Inline title edit:** Click the title text to edit inline; Enter or blur saves, Escape cancels
- **Trash:** Trash icon (visible on hover/always on touch) with confirmation dialog
- **Drag to reorder:** Long-press on touch (150ms delay) or drag on desktop; calls API to persist new position
- **Click to detail:** Navigates to `StuffDetailPage`

**Clarify mode:**
- Activated by the "Clarify" button in the page header (only shown when items exist)
- Can also be auto-started via URL query `?clarify=1`
- Desktop: List shrinks to 320px, ClarifyPanel opens side-by-side
- Mobile: ClarifyPanel opens as full-screen overlay
- Items in the list are disabled during clarify (no inline edit, no action buttons)
- A blue highlight indicates the item currently being processed
- Clicking a different item in the list switches the clarify target
- After completing clarification of an item, it is removed from the list; when all items are clarified, clarify mode exits automatically

**Empty state:** Inbox icon + "Your inbox is empty" + instructional text

### 4.2 Stuff Detail Page

- **URL:** `/stuff/:id`
- **Navigation:** Position-based arrows (First, Previous, Next, Last) to browse through the inbox or other lists
- **Automatic type routing:** When navigating through mixed-type lists (completed, someday), automatically redirects to the correct detail page type (action or project) if needed

**Title:** Click-to-edit auto-resizing textarea. Shows strikethrough if completed.

**Action buttons (state-dependent):**
- Normal stuff: "Clarify" (primary), "Done" (ghost), "Move" dropdown, "Trash" (danger)
- Completed stuff: "Undo" only
- Someday stuff: "Activate" only

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

- **Question:** "Is this actionable?" with two options: Yes / No
- **If No** → proceeds to non-actionable destinations
- **If Yes** → proceeds to Step 2

### 5.2 Non-Actionable Destinations (if No)

- **Reference** - Files it as a reference item. The stuff item is converted to a text file in the reference file system.
- **Someday / Maybe** - Parks it for future consideration. The stuff item's state changes to SOMEDAY.
- **Trash** - Deletes the item.
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
  - Deferred: Radio between "Scheduled for" (specific date/time/duration) and "Start after" (tickler date)
  - Due Date: Date input + optional time
  - Duration options: 15, 30, 45, 60, 90, 120, 180, 240 minutes
- **Confirm** button transforms the stuff item into an action via the API

### 5.6 Create Project Form

- **Fields:** Project Title (required), Outcome (required - "What does done look like?"), Description (optional), Tags
- Projects do not have dates.
- **Confirm** transforms the stuff item into a project via the API

### 5.7 Clarify Panel UI

- **Modes:** Inline (side panel in inbox), Modal (right slide-over from detail), Fullscreen (mobile overlay)
- **Header:** Step counter (e.g., "2/4"), back button, close (X) button
- **Progress bar:** Animated width showing progress percentage
- **Context label:** "Processing: [item title]"
- **Done state:** Green checkmark + "Item processed successfully!"
- **Keyboard shortcuts:** Escape to cancel, Backspace to go back (when not in an input field)

---

## 6. Next Actions

### 6.1 Next Page

- **URL:** `/next`
- **Purpose:** List of all actionable, ready-to-do actions

**Adding items:**
- Collapsible add form (toggle with +/- button in header)
- Title input + "Add" button; creates action with state NEXT

**Item list:**
- Cursor-based pagination (10 per page)
- Tag filtering via TagFilter component + global context tag

**Per-item operations:**
- Complete (checkbox), Inline title edit, Trash (with confirmation), Drag to reorder, Click to navigate to detail

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
- SOMEDAY: "Activate", "Trash"
- WAITING: "Got it" (unwait → moves to NEXT), "Done", "Move" dropdown

**"Move" dropdown:** Shows all valid destination states except the current one. Calendar requires a schedule dialog. Waiting For requires a waiting-for dialog.

**Sections:**
- Project link (clickable, navigates to project detail) - only if action belongs to a project
- Description (click-to-edit)
- Tags (click to show TagInput; displays as chips)
- Waiting For (only for WAITING state): shows who/what is being waited on + duration since waiting began
- Dates (collapsible):
  - Deferred: "Scheduled for" or "Start after" + date + optional time + duration (for scheduled)
  - Due Date: date + optional time
  - Each has Save, Cancel, Clear buttons
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
- All-day / dateless actions shown in a section above the time grid
- Click on an empty time slot opens a quick-add form for creating a scheduled action at that time
- Click on an item navigates to action detail

### 8.4 Week View

- 7-column grid (configurable week start: Monday or Sunday)
- Each column is a mini day view with time grid
- Scheduled actions shown as positioned blocks
- All-day section at the top

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

### 8.8 Calendar Item Interactions

- **Create:** Click empty day/time slot to quick-add a scheduled action
- **Reschedule:** Drag an item to a new date/time slot to reschedule it
- **View detail:** Click an item to navigate to action detail with `from=calendar`

### 8.9 Calendar Settings

Configurable in Settings page:
- Week starts on: Monday or Sunday
- Time format: 12-hour (AM/PM) or 24-hour
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
- Active project: "Complete" (ghost), "Move" dropdown (Someday only), "Trash" (danger)
- Completed project: "Undo" only
- Someday project: "Activate" only

**Outcome section:** Click-to-edit textarea; placeholder "What does done look like?"

**Next Action section (active projects only):**
- Shows the current next action as a card with checkbox + inline editable title + "→ Next" link
- When no next action exists: Warning icon + "What's the next physical step?" + "Every active project needs a next action"
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
- Metadata (created/updated timestamps)

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

**Per-item actions:**
- **Activate:** Moves item back to its original bucket (Stuff → Inbox, Action → Next, Project → Projects); shows toast with destination
- **Trash:** With confirmation dialog

**Item click:** Navigates to the correct detail page (stuff-detail, action-detail, or project-detail) based on item type

---

## 12. Reference (File Manager)

### 12.1 Reference Page

- **URL:** `/reference`
- **Purpose:** Non-actionable file storage (the GTD "Reference" bucket)
- **Tabs:** Files | Trash

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

- **URL:** `/recurring/new`
- **Fields:** Title, Recurrence rule, Scheduled time, Duration

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
- Recurrence rule, time, and duration: editable

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
  - User avatar (initial-based, 28px)
  - Relative timestamp ("Just now", "3 minutes ago", "Yesterday", "5 days ago", formatted date for older)
  - Comment text in a rounded bubble

**Limit reached state:**
- "Comment limit reached (50 / 50)" notice shown
- Add form hidden

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

- Located in the Top Navigation bar (when authenticated)
- Provides rapid inbox capture from any page

**Collapsed state:** Button with "+" icon and "Quick Add" label (label hidden on mobile)

**Expanded state:**
- Text input auto-focuses
- Enter submits the item to inbox and clears the input (stays expanded for rapid multi-capture)
- Escape or blur collapses and clears
- Mobile: Input expands to fill the top navigation bar width (fixed positioned overlay)
- Desktop: Inline input (min 200px)

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
- Compatible sidebar targets accept specific types:
  - Next, Today, Calendar, Waiting For, Someday, Completed, Trash accept stuff and actions
  - Projects accept stuff and actions
  - Reference accepts stuff only
- Complex drops (Calendar, Waiting For, Projects) open modal dialogs for additional input

### 23.3 Drag Discoverability

- On first visit to a list page, a "Drag to reorder" hint overlay appears
- Items display a wiggle animation to draw attention
- Hint is dismissed after the first drag and persisted to localStorage (per list type)

### 23.4 Overdue Item Highlighting

- Items with past due dates get a red left border and light red background
- Applied automatically in all list views via the `isOverdue()` utility

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

- Cursor-based pagination with "Load more" button
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

- Sidebar hidden; replaced with slide-in drawer (hamburger trigger)
- Dropdowns render as bottom action sheets (sliding up from bottom)
- Select components render as full-width bottom sheets with headers
- Modals may render full-screen instead of centered overlay
- Action buttons always visible on touch devices (no hover-to-reveal)
- Reduced metadata display (fewer tags shown, hint text hidden)
- Quick Add input becomes a fixed full-width overlay on the nav bar

### 25.8 Keyboard Shortcuts

- Enter: Submit forms, save inline edits
- Escape: Cancel editing, close modals, close dropdowns
- Backspace: Go back in clarify wizard (when not in input)
- Arrow Up/Down: Navigate tag autocomplete suggestions
- Comma: Commit tag in TagInput

---

## 26. Limits & Quotas

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

- **JWT tokens:** `localStorage` (`auth_token`, `refresh_token`)
- **User data cache:** `localStorage` (`current_user`)
- **Settings cache:** `localStorage` (fallback when API unavailable)
- **View preferences:** `localStorage` (calendar view mode, reference view mode, new items position, drag hints, debug mode, dismissed tips)
- **Cross-tab logout signal:** `localStorage` (`logout` key, listened via `storage` event)

## Appendix C: Error Handling Summary

| Scenario | HTTP Status | User Message |
|---|---|---|
| Login - bad email | 400 | "Incorrect email format, please correct email address." |
| Login - wrong credentials | 401 | "Incorrect email and/or password. Please correct your credentials." |
| Register - duplicate email | 409 | "Email already exists. Change email or sign in." |
| Change password - bad new password | 400 | "New password does not meet requirements." |
| Change password - wrong current | 401 | "Current password is incorrect." |
| Rate limited | 429 | "Too many requests. Please try again later." |
| Server error | 500 | "Internal server error. Please try again later." |
| Service unavailable | 503 | "Service unavailable. Please try again later." |
| Network error | — | "No response from server. Check your connection." |
| Attachment limit reached | 409 | "Attachment limit reached" |
| File too large | 413 | "File too large or storage quota exceeded" |
