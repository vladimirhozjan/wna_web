# SVG Design System — Steps

> Goal: Create `wna-figma-design-system.svg` — pixel-accurate reproduction of WNA's design system, components, and pages. See `svg-rules.md` for exact CSS values per step.

---

## Step 1 — Color Palette
Render every color token as a labeled swatch (rect + name + hex). Group by: Brand, Text, Backgrounds, Borders, Status, Semantic, Dark Theme, Overlays, Focus/Action, Button Colors, Input Colors, Link Colors, Toast Colors, Calendar Colors, Menu Colors.

## Step 2 — Typography
Render each text style as a sample line at exact size/weight. Show the weight scale (300–700) separately.

## Step 3 — Shadows & Cards
Render sample cards showing each shadow level (popover, dropdown, modal, elevated, auth, focus rings). Show card border radius and spacing tokens.

## Step 4 — Btn (Button)
Render all variants × all states × all sizes:
- Variants: `primary`, `ghost`, `danger`, `ghost-danger`, `icon`, `link`
- States: default, hover, active, disabled, loading
- Sizes: sm, md, lg

## Step 5 — Inpt (Input)
Render all states: default, focused, error, disabled. Show with label and placeholder text.

## Step 6 — Select
Render trigger button + open dropdown with options. Show selected state.

## Step 7 — TagInput
Render with 3 example chips + input field + suggestion dropdown. Show preset chips below.

## Step 8 — SegmentSwitch
Render with 2 options, one active.

## Step 9 — Checkbox
Render unchecked and checked states.

## Step 10 — TopNav
Render the exact nav bar in two variants:
- Authenticated: logo + "WhatsNextAction" + QuickAddBtn + UserAvatar
- Guest/Landing: logo + center nav links + "Start Here" + "Sign In"

## Step 11 — TopNavDropdown
Render the open dropdown menu with items and divider.

## Step 12 — Sidebar
Render exact 260px sidebar with all menu items (Engage, Next, Today, Inbox, Projects, Calendar, Waiting For, Someday/Maybe, Reference, Review, Completed, Trash) + footer (Settings, Logout). Show one active item. Show count badges.

## Step 13 — SidebarDrawer (Mobile)
Render mobile drawer: 260px width, overlay with blur.

## Step 14 — Item
Render all states and all three entity types:
- **States:** normal, checked, editing, loading, with MetadataRow subtitle, with ItemTypeIcon prefix
- **Stuff item:** checkbox + title + trash action (no metadata)
- **Action item:** checkbox + title + MetadataRow with all possible metadata icons
- **Project item:** no checkbox, title + MetadataRow with project metadata

## Step 15 — ItemList
Render list with multiple items demonstrating:
- Normal items with border-bottom separators
- Active item (blue left border)
- Overdue item (red left border)
- Items with all metadata icon types (see Step 17)
- Checked/completed item
- Empty state (icon + title + text)
- Load more button

## Step 16 — MetadataRow
Render rows showing **all possible metadata indicators**:
- WarningIcon + "No next action" (warning #d97706)
- RecurringIcon + "Every week" (tertiary #9CA3AF)
- HourglassIcon + "John" (secondary #6B7280)
- CalendarIcon + due date (default)
- CalendarIcon + "Overdue Mar 10" (danger #ef4444)
- CalendarIcon + scheduled date (#0c4a6e)
- CalendarIcon + start date (tertiary)
- ProjectsIcon + project name (#4185DE, weight 500)
- AttachmentIcon + count (tertiary)
- CommentIcon + count (tertiary)
- DescriptionIcon (tertiary, no text)
- Tag chips: "@home", "@calls", "+3" overflow

## Step 17 — Modal
Render overlay + centered dialog. Title + content + action buttons.

## Step 18 — ConfirmDialog
Render: title + message + Cancel/Confirm buttons.

## Step 19 — Dropdown
Render desktop dropdown with items. Show danger item in red. Show item with icon.

## Step 20 — ErrorToaster
Render stacked toasts: error (red) and success (green).

## Step 21 — QuickAddBtn
Render collapsed (button "+" + "Quick Add") and expanded (input with placeholder).

## Step 22 — TagFilter
Render filter icon button + selected tag chips. Show context chip (blue bg).

## Step 23 — AuthDialog
Render login form: backdrop with blur, centered card, email/password inputs, "Sign In" button, register/forgot links.

## Step 24 — UserAvatar
Render: 36px circle with colored background + 2-letter initials.

## Step 25 — ClarifyPanel
Render: step counter + progress bar + question + option buttons. Show "Is it actionable?" step.

## Step 26 — GtdTip
Render: bg secondary, left border action, icon + content + dismiss X. Also show quote variant.

## Step 27 — ItemTypeIcon
Render all 3: Stuff (inbox, #6B7280), Action (bolt, #4185DE), Project (folder, #b45309).

## Step 28 — DashboardLayout Chrome
Create reusable template: 1440×900, TopNav + Sidebar (260px) + Content area (#f8fafc).

## Step 29 — Engage Page
- Active sidebar: "Engage"
- Overdue alert + Today section + Next Actions + Waiting For + Nudges
- List items with metadata: overdue CalendarIcon, due date, ProjectsIcon, tags, HourglassIcon, AttachmentIcon, CommentIcon

## Step 30 — Inbox Page
- Active sidebar: "Inbox"
- Header: h1 + "Clarify" button + input row
- ItemList with stuff items (checkbox + title only, no metadata)
- Also render clarify mode variant (320px list + clarify panel side-by-side)

## Step 31 — Next Page
- Active sidebar: "Next"
- Header: h1 + TagFilter + add toggle
- ItemList with action items showing **all metadata variants:**
  - CalendarIcon + due date + tags
  - HourglassIcon + person + CommentIcon
  - ProjectsIcon + project name + AttachmentIcon
  - RecurringIcon + rule + DescriptionIcon
  - Overdue CalendarIcon (red left border)
  - Scheduled date (blue) + start date (tertiary)

## Step 32 — Today Page
- Active sidebar: "Today"
- Same structure as Next. Actions with due dates showing CalendarIcon, overdue variant, ProjectsIcon, RecurringIcon.

## Step 33 — Calendar Page
- Active sidebar: "Calendar"
- CalendarHeader: prev/next + date + view toggles (Day/Week/Month/Year/Recurring)
- Month view: 7-column grid with day cells, today highlight, scheduled items

## Step 34 — Projects Page
- Active sidebar: "Projects"
- Header with dual-input add (title + outcome)
- ItemList (no checkbox) showing:
  - WarningIcon + "No next action"
  - AttachmentIcon + CommentIcon + tags
  - DescriptionIcon + tag
  - Minimal (no metadata)

## Step 35 — Waiting For Page
- Active sidebar: "Waiting For"
- Header with dual-input (title + waiting for)
- Items with HourglassIcon + person + CalendarIcon, ProjectsIcon, AttachmentIcon, CommentIcon

## Step 36 — Someday Page
- Active sidebar: "Someday/Maybe"
- Items with ItemTypeIcon prefix (all 3 types):
  - InboxIcon (stuff) + title + activate/trash
  - BoltIcon (action) + title + CalendarIcon + tags
  - FolderIcon (project) + title + WarningIcon
  - BoltIcon (action) + title + HourglassIcon + AttachmentIcon

## Step 37 — Completed Page
- Active sidebar: "Completed"
- Pre-checked items (opacity 0.6, strikethrough) with all type icons:
  - InboxIcon + stuff title
  - BoltIcon + action title + CalendarIcon + tags
  - FolderIcon + project title + AttachmentIcon
  - BoltIcon + action title + HourglassIcon + RecurringIcon

## Step 38 — Trash Page
- Active sidebar: "Trash"
- Header with "Empty Trash" danger button
- Items with all type icons + "Restore" link:
  - InboxIcon + stuff + Restore
  - BoltIcon + action + CalendarIcon + Restore
  - FolderIcon + project + Restore

## Step 39 — Reference Page
- Active sidebar: "Reference"
- SegmentSwitch (Files | Trash) + toolbar + file list/grid

## Step 40 — Review Page
- Active sidebar: "Review"
- 6-step checklist with checkboxes, titles, hints, count badges, "Go" links
- Progress counter + "Start Review" button

## Step 41 — Settings Page
- Active sidebar: "Settings"
- Sections: Account, Sessions, Application, Tags, Calendar, Review, About
- Show: rows, toggle switches, session list, day checkboxes

## Step 42 — Stuff Detail Page
- Back link + nav arrows + InboxIcon
- Editable title (h2) + actions (Clarify, Done, Move, Trash)
- Description + Attachments + Comments + Metadata footer
- Also show clarify slide-over (480px)

## Step 43 — Action Detail Page
- Same pattern + NextIcon + recurring badge
- Actions: Done + Move + Trash
- Sections: Project link, Description, Tags, Dates (grid), Waiting For, Attachments, Comments, Metadata

## Step 44 — Project Detail Page
- ProjectsIcon + actions (Complete, Move, Trash)
- Outcome section + Next Action card + Backlog list (draggable) + Quick-add input
- Description, Tags, Attachments, Comments, Metadata

## Step 45 — Landing Page (Dark Theme)
- TopNav: logo + center nav + auth buttons
- HeroSection: dark bg, heading, subtitle, CTAs
- HowItWorksSection: 3-step flow with numbered circles + connector line
- FeaturesSection: 3×3 grid of feature cards (light blue bg)
- WhyUsSection: 3 items with icon circles
- TestimonySection: founder quote (light blue bg)
- BookSection: book cover + description
- CtaBanner: blue bg + white button
- PublicFooter: 4-column layout

## Step 46 — Auth Dialog (overlaid)
- Login mode: email + password + "Sign In" + forgot/register links
- Register mode: email + password + confirm + agree checkbox + "Create Account"

## Step 47 — Pricing Page
- Billing toggle (Monthly/Yearly with "Save 20%" badge)
- 3 tier cards: Free, Pro (featured), Business
- Feature comparison table

## Step 48 — Icon Grid
Render all 45 icons at 40×40 in a labeled grid (~9 columns). Use actual SVG path data from `src/main-app/assets/*.vue`.

## Step 49 — Assembly
Arrange all frames on canvas with 100px spacing. Wrap each in `<g id="...">` for Figma layers.

## Step 50 — Validation
Verify: valid XML, correct colors, correct spacing, correct fonts, all groups present, opens in browser, imports into Figma.

---

## File References

| What | Where |
|------|-------|
| Color tokens | `src/main-app/styles/tokens/colors.css` |
| Typography tokens | `src/main-app/styles/tokens/typography.css` |
| Layout tokens | `src/main-app/styles/tokens/layout.css` |
| Component tokens | `src/main-app/styles/tokens/components.css` |
| Style classes | `src/main-app/styles/styles.css` |
| Components | `src/main-app/components/*.vue` |
| Calendar components | `src/main-app/components/calendar/*.vue` |
| Clarify components | `src/main-app/components/clarify/*.vue` |
| Public components | `src/main-app/components/public/*.vue` |
| Reference components | `src/main-app/components/reference/*.vue` |
| Icons | `src/main-app/assets/*.vue` (45 files) |
| Dashboard pages | `src/main-app/views/dashboard/*.vue` |
| Public pages | `src/main-app/views/public/*.vue` |
| Layouts | `src/main-app/layouts/*.vue` |
| Feature reference | `wna_features.md` |
