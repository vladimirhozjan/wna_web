# SVG Design System — Rules per Step

> Exact CSS values for each step in `svg-plan.md`. Nothing guessed. Every value from the codebase.

---

## Global Rules

- SVG: `xmlns="http://www.w3.org/2000/svg"`
- Font: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap')`
- Default: `font-family: 'Inter', sans-serif`
- All measurements in **px** (use max clamp value for desktop at 1440px)
- Every section: `<g id="Section-Name">` for Figma layer import
- Canvas background: `#f8fafc`
- Text: `text-rendering="optimizeLegibility"`, `dominant-baseline="auto"`, `text-anchor="start"`

---

## Step 1 — Color Palette

Swatch: `<rect>` 40×40, rx=4 + `<text>` name + `<text>` hex.

| Category | Token | Value |
|----------|-------|-------|
| Brand | `--color-action` | `#4185DE` |
| Text | `--color-text-primary` | `#374151` |
| Text | `--color-text-secondary` | `#6B7280` |
| Text | `--color-text-tertiary` | `#9CA3AF` |
| Text | `--color-text-error` | `#7f1c1d` |
| Text | `--color-text-danger` | `#dc2626` |
| Text | `--color-text-success` | `#059669` |
| Text | `--color-text-inverse` | `#ffffff` |
| Text | `--color-text-prefill` | `#D1D5DB` |
| Background | `--color-app-background` | `#f8fafc` |
| Background | `--color-bg-primary` | `#FFFFFF` |
| Background | `--color-bg-secondary` | `#F3F4F6` |
| Background | `--color-bg-hover` | `#E5E7EB` |
| Background | `--color-bg-accent-light` | `#EDF3FC` |
| Border | `--color-border-light` | `#E3E8EF` |
| Border | `--color-border-medium` | `#dddddd` |
| Status | `--color-danger` | `#ef4444` |
| Status | `--color-danger-light` | `#FEE2E2` |
| Status | `--color-warning` | `#d97706` |
| Status | `--color-warning-light` | `#fef3c7` |
| Status | `--color-success` | `#16a34a` |
| Status | `--color-success-light` | `#dcfce7` |
| Semantic | `--color-project` | `#b45309` |
| Semantic | `--color-review` | `#ea580c` |
| Semantic | `--color-file-blue` | `#2563eb` |
| Semantic | `--color-highlight-amber` | `#fde68a` |
| Semantic | `--color-highlight-yellow` | `#fef08a` |
| Semantic | `--color-avatar-fallback` | `#777777` |
| Dark | `--color-bg-dark` | `#1E293B` |
| Dark | `--color-bg-dark-card` | `#283548` |
| Dark | `--color-text-on-dark` | `#F1F5F9` |
| Dark | `--color-text-on-dark-secondary` | `#94A3B8` |
| Dark | `--color-border-dark` | `rgba(148,163,184,0.15)` |
| Overlay | `--color-overlay` | `rgba(0,0,0,0.5)` |
| Overlay | `--color-overlay-light` | `rgba(0,0,0,0.4)` |
| Overlay | `--color-overlay-white` | `rgba(255,255,255,0.7)` |
| Overlay | `--color-popup-backdrop` | `rgba(247,249,251,0.5)` |
| Focus | `--color-focus-ring` | `rgba(37,99,235,0.2)` |
| Focus | `--color-danger-ring` | `rgba(239,68,68,0.2)` |
| Focus | `--color-action-ring` | `rgba(65,133,222,0.2)` |
| Focus | `--color-danger-bg-subtle` | `rgba(254,226,226,0.35)` |
| Btn Primary | bg / text / hover / active / dis-bg / dis-txt | `#4185DE` / `#FFFFFF` / `#236ac7` / `#1c539c` / `#acbfd7` / `#f2f2f2` |
| Btn Ghost | bg / text / border / hover / active | `#ecf3fc` / `#356dc0` / `#c6daf6` / `#c1d8f5` / `#95bcee` |
| Btn Ghost | dis-bg / dis-txt / dis-brd | `#f1f4f8` / `#95a9c6` / `#d2dce9` |
| Btn Danger | bg / text / hover / active / dis-bg / dis-txt | `#ef4444` / `#FFFFFF` / `#eb1414` / `#bc1010` / `#e1b7b7` / `#f2f2f2` |
| Btn Ghost-Danger | bg / text / border / hover / active | `#fef2f2` / `#dc2626` / `#fecaca` / `#fee2e2` / `#fecaca` |
| Btn Ghost-Danger | dis-bg / dis-txt / dis-brd | `#fef2f2` / `#f87171` / `#fecaca` |
| Input | border / focus / error-brd / error-bg | `#D1D5DB` / `#4185DE` / `#f9c6c6` / `#fef2f2` |
| Link | text / hover | `#4185DE` / `#0951ae` |
| Toast | error-bg / error-txt / success-bg / success-txt | `#fecaca` / `#7f1c1d` / `#d1fae5` / `#065f46` |
| Calendar | scheduled / sched-border / sched-text | `#bae6fd` / `#0284c7` / `#0c4a6e` |
| Calendar | deferred / def-border / def-text | `#e0f2fe` / `#38bdf8` / `#075985` |
| Calendar | today-bg / today-border / grid-line / hour-text / weekend-bg | `#fef3c7` / `#f59e0b` / `#e5e7eb` / `#9ca3af` / `#f9fafb` |
| Menu | default-txt / hover-bg / hover-txt / active-bg / active-txt | `#374151` / `white` / `#236ac7` / `white` / `#4185DE` |

---

## Step 2 — Typography

Font: **Inter, sans-serif**

| Class | font-size | font-weight | line-height |
|-------|-----------|-------------|-------------|
| `.text-display` | 48px | 700 | 120% |
| `.text-subtitle` | 18px | 500 | 150% |
| `.text-h1` | 36px | 700 | 125% |
| `.text-h2` | 30px | 600 | 130% |
| `.text-h3` | 24px | 600 | 135% |
| `.text-h4` | 20px | 500 | 140% |
| `.text-body-l` | 18px | 400 | 150% |
| `.text-body-m` | 16px | 400 | 150% |
| `.text-body-s` | 14px | 400 | 150% |
| `.text-footnote` | 11px | 400 | 150% |
| `.text-label` | 13px | 600 | 140% |

Fixed UI sizes: 2xs=10, xs=12, sm=14, md=16, lg=18, xl=20, 2xl=24, 3xl=28

Weights: Light=300, Normal=400, Medium=500, Semibold=600, Bold=700

---

## Step 3 — Shadows & Cards

| Token | Value |
|-------|-------|
| `--shadow-popover` | `0 4px 10px rgba(0,0,0,0.1)` |
| `--shadow-dropdown` | `0 4px 20px rgba(0,0,0,0.15)` |
| `--shadow-modal` | `0 4px 24px rgba(0,0,0,0.15)` |
| `--shadow-elevated` | `0 8px 32px rgba(0,0,0,0.2)` |
| `--shadow-auth` | `0 18px 50px rgba(15,23,42,0.2)` |
| `--shadow-focus-ring` | `0 0 0 2px rgba(37,99,235,0.2)` |
| `--shadow-focus-ring-wide` | `0 0 0 3px rgba(37,99,235,0.2)` |
| `--shadow-focus-ring-danger` | `0 0 0 3px rgba(239,68,68,0.2)` |

Card: radius=12px, padding=24px, border=`1px solid #E3E8EF`, hover-shadow=`0 4px 16px rgba(0,0,0,0.08)`

Section spacing: desktop py=64px, mobile py=40px, max-width=900px, px=20px

---

## Step 4 — Btn

Base: `border-radius: 6px`, `inline-flex`, `align-items: center`, `justify-content: center`

| Size | padding | font-size |
|------|---------|-----------|
| sm | `6px 12px` | 14px |
| md | `10px 16px` | 14px |
| lg | `14px 20px` | 16px |

| Variant | State | bg | color | border | weight |
|---------|-------|----|-------|--------|--------|
| primary | default | `#4185DE` | `#FFF` | none | 600 |
| primary | hover | `#236ac7` | `#FFF` | none | 600 |
| primary | active | `#1c539c` | `#FFF` | none | 600 |
| primary | disabled | `#acbfd7` | `#f2f2f2` | none | 600 |
| ghost | default | `#ecf3fc` | `#356dc0` | `1px solid #c6daf6` | 600 |
| ghost | hover | `#c1d8f5` | `#356dc0` | `1px solid #c6daf6` | 600 |
| ghost | active | `#95bcee` | `#356dc0` | `1px solid #c6daf6` | 600 |
| ghost | disabled | `#f1f4f8` | `#95a9c6` | `1px solid #d2dce9` | 600 |
| danger | default | `#ef4444` | `#FFF` | none | 700 |
| danger | hover | `#eb1414` | `#FFF` | none | 700 |
| danger | active | `#bc1010` | `#FFF` | none | 700 |
| danger | disabled | `#e1b7b7` | `#f2f2f2` | none | 700 |
| ghost-danger | default | `#fef2f2` | `#dc2626` | `1px solid #fecaca` | 600 |
| ghost-danger | hover | `#fee2e2` | `#dc2626` | `1px solid #fecaca` | 600 |
| ghost-danger | active | `#fecaca` | `#dc2626` | `1px solid #fecaca` | 600 |
| ghost-danger | disabled | `#fef2f2` | `#f87171` | `1px solid #fecaca` | 600 |
| icon | default | transparent | `#4185DE` | none | — |
| icon | hover | `#ecf3fc` | `#4185DE` | none | — |
| icon | disabled | transparent | `#9CA3AF` | none | — |
| link | default | transparent | `#4185DE` | none | 500 |
| link | hover | `#ecf3fc` | `#0951ae` | none | 500 |
| link | disabled | transparent | `#9CA3AF` | none | 500 |

Icon variant padding: `4px 6px`. Link variant padding: `4px 8px`.
Loading: `opacity: 0.8`, spinner 14×14, `border: 2px solid rgba(255,255,255,0.3)`, `border-top: #fff`

---

## Step 5 — Inpt

Structure: label → span (label text, 14px) → input (margin-top 8px, margin-bottom 4px)

| State | border | background | box-shadow |
|-------|--------|-----------|------------|
| default | `1px solid #D1D5DB` | `#FFF` | none |
| focused | `1px solid #4185DE` | `#FFF` | `0 0 0 1px rgba(65,133,222,0.2)` |
| error | `1px solid #f9c6c6` | `#fef2f2` | none |
| disabled | `1px solid #D1D5DB` | `#FFF` | none, opacity 0.6 |

`padding: 10px`, `border-radius: 6px`, placeholder: `#D1D5DB`, error text: `#7f1c1d`

---

## Step 6 — Select

Trigger: `padding: 6px 12px`, `border: 1px solid #E3E8EF`, `radius: 6px`, `bg: #FFF`, `gap: 8px`, arrow `#9CA3AF` 12px. Open: `border-color: #4185DE`

Dropdown: `bg: #FFF`, `border: 1px solid #E3E8EF`, `radius: 8px`, `shadow: 0 4px 20px rgba(0,0,0,0.15)`, `max-height: 300px`. Option: `padding: 10px 14px`, hover `bg: #F3F4F6`. Selected: `bg: #F3F4F6`, `color: #4185DE`, weight 500.

---

## Step 7 — TagInput

Container: `flex wrap`, `gap: 6px`, `padding: 6px 10px`, `border: 1px solid #D1D5DB`, `radius: 6px`, `min-height: 38px`. Focused: `border: #4185DE`, `shadow: 0 0 0 2px rgba(37,99,235,0.2)`

Chip: `padding: 2px 8px`, `bg: #F3F4F6`, `border: 1px solid #E3E8EF`, `radius: 4px`, `color: #374151`. Remove: `#9CA3AF`, hover `#ef4444`.

Suggestions: `margin-top: 4px`, `border: 1px solid #E3E8EF`, `radius: 6px`, `shadow: 0 4px 12px rgba(0,0,0,0.1)`, `max-height: 160px`. Item: `padding: 8px 12px`, hover `bg: #F3F4F6`.

Presets: `border: 1px dashed #E3E8EF`, `radius: 4px`, `padding: 2px 8px`, `color: #9CA3AF`. Hover: `color: #4185DE`, `border: #4185DE`.

---

## Step 8 — SegmentSwitch

`inline-flex`, `border: 1px solid #E3E8EF`, `radius: 8px`. Option: `padding: 6px 16px`, `radius: 6px`, `color: #9CA3AF`. Hover: `color: #6B7280`, `bg: #E5E7EB`. Active: `bg: #ecf3fc`, `color: #4185DE`, weight 600, `shadow: 0 1px 3px rgba(65,133,222,0.12)`.

---

## Step 9 — Checkbox

`18×18px`, `accent-color: #4185DE`. Unchecked: border `#D1D5DB`. Checked: filled `#4185DE` + white checkmark.

---

## Step 10 — TopNav

`flex`, `align-items: center`, `justify-content: space-between`, `padding: 0 4px`, `border-bottom: 1px solid #E3E8EF`, `bg: #FFF`

Left: logo 48×48, `gap: 6px`, app name body-m `#374151`
Right (auth): `gap: 10px`, `margin-right: 10px`, QuickAddBtn + UserAvatar
Right (guest): `gap: 8px`, "Start Here" primary md + "Sign In" ghost md
Center (landing): `gap: 24px`, nav links `#6B7280`, hover `#4185DE`

---

## Step 11 — TopNavDropdown

`absolute`, `top: 44px`, `right: 0`, `min-width: 160px`, `bg: white`, `padding: 8px 0`, `radius: 6px`, `shadow: 0 4px 10px rgba(0,0,0,0.1)`, `gap: 4px`

Item: `padding: 6px 12px`, `color: #374151`, hover `bg: rgba(0,0,0,0.05)`
Divider: `border-top: 1px solid #E3E8EF`, `margin: 4px 0`

---

## Step 12 — Sidebar

`width: 260px`, `bg: #FFF`, `border-right: 1px solid #E3E8EF`, `flex column`

Nav: `padding: 10px`, `row-gap: 10px`
Footer: `margin-top: auto`, `border-top: 1px solid #E3E8EF`, `padding: 10px`, `row-gap: 12px`

MenuItem: `flex`, `gap: 12px`, `color: #374151`. Icon: 28×28 with 4px padding. Hover: `bg: white`, `color: #236ac7`. Active: `bg: white`, `color: #4185DE`, weight 600. Count: `margin-left: auto`, `color: #9CA3AF`, 11px.

---

## Step 13 — SidebarDrawer

Overlay: `bg: rgba(0,0,0,0.4)`, `backdrop-filter: blur(2px)`. Drawer: `width: 260px`, `height: 100%`, `fixed top 0 left 0`, `border-right: 1px solid #ddd`, `bg: #FFF`.

---

## Step 14 — Item

Normal: `padding: 12px 16px`, `bg: #FFF`, `border-bottom: 1px solid #E3E8EF`
Main row: `flex`, `gap: 12px`. Checkbox: 18×18, `accent: #4185DE`. Title: `#374151`, ellipsis. Actions: `opacity: 0`, hover `opacity: 1`, `gap: 8px`.

With subtitle: padding `10px 16px 8px`. Subtitle row: `padding-left: 30px`, `padding-top: 6px`. With prefix: `padding-left: 44px`.

Checked: `opacity: 0.6`, title `line-through`, `color: #6B7280`
Editing: input `border-bottom: 1px solid #4185DE`, `bg: transparent`, `min-width: 50px`
Loading: `opacity: 0.7`, spinner 20×20, `border: 2px solid #E3E8EF`, `border-top: #4185DE`

---

## Step 15 — ItemList

Wrapper: `border-left: 3px solid transparent`. Active: `bg: #F3F4F6`, `border-left: #4185DE`. Overdue: `border-left: #ef4444`, `bg: rgba(254,226,226,0.35)`.

Empty: `padding: 48px 24px`, centered. Icon: 40×40 `#9CA3AF`, `mb: 16px`. Title: h3 `#374151`, `mb: 8px`. Text: body-m `#6B7280`, `max-width: 300px`.

Loading spinner: 32×32, `border: 3px solid #E3E8EF`, `border-top: #4185DE`.
Load more: centered, `margin: 16px 0`.

---

## Step 16 — MetadataRow

`flex`, `gap: 8px`. Chip: `inline-flex`, `gap: 4px`, `color: #6B7280`. Chip icon: 20×20 with 4px padding.

| Indicator | Icon color | Text color |
|-----------|-----------|------------|
| Warning "No next action" | `#d97706` | `#d97706` |
| Recurring | `#9CA3AF` | `#9CA3AF` |
| Waiting for (person) | `#6B7280` | `#6B7280` |
| Due date | inherit | inherit |
| Overdue date | `#ef4444` | `#ef4444` |
| Scheduled date | `#0c4a6e` | `#0c4a6e` |
| Start date | `#9CA3AF` | `#9CA3AF` |
| Project link | `#4185DE` | `#4185DE` weight 500 |
| Attachment count | `#9CA3AF` | `#9CA3AF` |
| Comment count | `#9CA3AF` | `#9CA3AF` |
| Description | `#9CA3AF` | (no text) |

Tag chip: `padding: 1px 6px`, `bg: #F3F4F6`, `border: 1px solid #E3E8EF`, `radius: 4px`, `color: #6B7280`, 11px. Overflow: `+N` no bg/border.

---

## Step 17 — Modal

Overlay: `bg: rgba(0,0,0,0.5)`, `padding-bottom: 48px`
Dialog: `bg: #FFF`, `radius: 12px`, `padding: 24px`, `min-width: 320px`, `shadow: 0 4px 24px rgba(0,0,0,0.15)`
Title: `mb: 16px`, `color: #374151`
Actions: `flex`, `justify-content: flex-end`, `gap: 8px`, `mt: 20px`

---

## Step 18 — ConfirmDialog

Dialog: `bg: #FFF`, `radius: 8px`, `padding: 24px`, `min-width: 300px`, `max-width: 400px`, `shadow: 0 4px 20px rgba(0,0,0,0.15)`
Title: 18px weight 600, `mb: 12px`, `color: #374151`
Message: 16px, `color: #6B7280`, `line-height: 1.5`, `mb: 20px`
Actions: `flex`, `justify-content: flex-end`, `gap: 10px`

---

## Step 19 — Dropdown

Desktop: `bg: #FFF`, `border: 1px solid #E3E8EF`, `radius: 8px`, `shadow: 0 4px 20px rgba(0,0,0,0.15)`, `min-width: 160px`, `padding: 8px`
Item: 16px, `color: #374151`, hover `bg: #F3F4F6`. Icon: 32×32, `padding: 5px`, `color: #9CA3AF`, hover `#4185DE`. Danger: `color: #dc2626`, hover `bg: rgba(220,38,38,0.08)`.

---

## Step 20 — ErrorToaster

`fixed`, `bottom: 30px`, `left: 50%`, `translateX(-50%)`
Toast: `padding: 8px 12px`, `radius: 6px`, `mb: 10px`
Error: `bg: #fecaca`, `color: #7f1c1d`. Success: `bg: #d1fae5`, `color: #065f46`.

---

## Step 21 — QuickAddBtn

Button: `padding: 8px 16px`, `radius: 6px`, `border: 1px solid #E3E8EF`, `bg: #ecf3fc`, `color: #356dc0`, `gap: 8px`, `min-width: 200px`. Hover: `bg: #c1d8f5`.
Input: same padding/radius/border, `bg: #ecf3fc`, `width: 200px`. Focus: `border: #4185DE`.

---

## Step 22 — TagFilter

`inline-flex`, `gap: 6px`. Icon: 20×20, 2px padding. Active: `color: #4185DE`.
Menu: `min-width: 180px`, `max-height: 300px`. Item: `padding: 8px 12px`, `gap: 8px`. Check: 18px, `color: #4185DE`.
Chip: `padding: 2px 8px`, `bg: #F3F4F6`, `border: 1px solid #E3E8EF`, `radius: 12px`. Context: `bg: #4185DE`, `color: #FFF`.

---

## Step 23 — AuthDialog

Backdrop: `backdrop-filter: blur(3px)`, `bg: rgba(247,249,251,0.5)`
Dialog: `bg: #FFF`, `padding: 30px`, `radius: 12px`, `max-width: 420px`, `shadow: 0 18px 50px rgba(15,23,42,0.2)`
Form: `flex column`, `gap: 20px`. Title h2 centered. Separator: `1px solid #E3E8EF`, `mb: 10px`. Links: `#4185DE`.
Checkbox: 18×18 `accent: #4185DE`. Label: `#6B7280`. Error outline: `2px solid #ef4444`.

---

## Step 24 — UserAvatar

36×36 (32 mobile), `radius: 50%`. Fallback: `color: #FFF`, weight 600, 14px, `bg: #777777`.

---

## Step 25 — ClarifyPanel

Panel: `flex column`, `height: 100%`, `bg: #FFF`, `border-left: 1px solid #E3E8EF`
Header: `padding: 12px 16px`, `border-bottom: 1px solid #E3E8EF`. Nav btn: 28×28, `radius: 4px`. Step indicator: `#9CA3AF`.
Progress bar: `height: 4px`, `bg: #F3F4F6`, fill `bg: #4185DE`.
Context: `padding: 16px 20px`, centered. Label: `#9CA3AF`. Title: `#374151`.
Content: `padding: 24px 20px`.
Done icon: 48×48 circle, `bg: #dcfce7`, `color: #16a34a`.

---

## Step 26 — GtdTip

`padding: 14px 16px`, `bg: #F3F4F6`, `border-left: 3px solid #4185DE`, `radius: 6px`, `gap: 12px`, `mb: 16px`.
Icon: `#4185DE`. Content: `#374151`, `line-height: 1.5`. Close: 18px `#9CA3AF`, hover `#374151`.
Quote: `border-left: #9CA3AF`, italic, icon `#9CA3AF`.

---

## Step 27 — ItemTypeIcon

20×20 with 2px padding. Stuff: `#6B7280`. Action: `#4185DE`. Project: `#b45309`.

---

## Step 28 — DashboardLayout Chrome

Canvas: 1440×900. Dashboard: `flex column`, `height: 100%`.
TopNav: full width, ~48-56px height, `border-bottom: 1px solid #E3E8EF`.
Body: `flex row`. Sidebar: `width: 260px`, `flex-shrink: 0`. Content: `flex: 1`, `bg: #f8fafc`.

---

## Step 29 — Engage Page

Active sidebar: "Engage". Header: `bg: #FFF`, `mb: 15px`, h1 `padding: 10px`.

Overdue alert: `padding: 12px 16px`, `border-left: 3px solid #ef4444`, `bg: rgba(254,226,226,0.35)`, `border-bottom: 1px solid #E3E8EF`.
Section header: `padding: 10px 16px 6px`, title `#6B7280` uppercase `letter-spacing: 0.03em`, count `#9CA3AF`, link `#9CA3AF`.
Nudge: `padding: 10px 16px`, `border-bottom: 1px solid #E3E8EF`, text `#6B7280`, link `#9CA3AF`.

---

## Step 30 — Inbox Page

Active sidebar: "Inbox". Header: title row `flex space-between padding-right: 10px`, "Clarify" primary md.
Input row: `flex gap: 10px padding: 0 10px mb: 5px`. Add button `mt: 8px mb: 4px`.
Content: stuff items (checkbox + title only).
Clarify mode: page `flex-direction: row`, list panel `flex: 0 0 320px border-right: 1px solid #E3E8EF`, clarify panel `flex: 1`.

---

## Step 31 — Next Page

Active sidebar: "Next". Header: `bg: #FFF mb: 15px`, h1 + header-actions `gap: 4px`.
Add input: `flex gap: 10px padding: 0 10px mb: 5px`.
Content: action items with MetadataRow subtitles.

---

## Step 32 — Today Page

Same as Step 31 but active sidebar "Today", different title/empty text.

---

## Step 33 — Calendar Page

Active sidebar: "Calendar". `padding: 0 16px 16px`.

CalendarHeader: `padding: 16px 0 gap: 16px`. Nav btns: 36×36 `border: 1px solid #E3E8EF radius: 6px bg: #FFF`. Today btn: `padding: 8px 16px`. Title: h2. View btns: `padding: 8px 16px`, active `bg: #4185DE color: #FFF`, inactive `bg: #FFF color: #6B7280`.

Month: 7-col grid. Header: `padding: 12px 8px color: #6B7280`. Cell: `min-height: 100px border: 1px solid #e5e7eb`. Today: `bg: #fef3c7`, number in 28×28 circle `bg: #4185DE color: #FFF radius: 50%`. Weekend: `bg: #f9fafb`. Other month: `bg: #F3F4F6`, number `#9CA3AF`.

---

## Step 34 — Projects Page

Active sidebar: "Projects". Same header as Next + dual-input `flex-direction: column gap: 4px`.
Items: no checkbox, MetadataRow subtitles.

---

## Step 35 — Waiting For Page

Active sidebar: "Waiting For". Dual-input: title + waiting-for. Items with HourglassIcon + person.

---

## Step 36 — Someday Page

Active sidebar: "Someday/Maybe". Items with ItemTypeIcon prefix. Actions: "Activate" link + trash.

---

## Step 37 — Completed Page

Active sidebar: "Completed". Header: `flex space-between`. Items: pre-checked, opacity 0.6, strikethrough, ItemTypeIcon prefix. No editing.

---

## Step 38 — Trash Page

Active sidebar: "Trash". Header: h1 + "Empty Trash" danger btn (`gap: 8px padding-right: 10px`). Items: ItemTypeIcon + "Restore" link. Non-interactive.

---

## Step 39 — Reference Page

Active sidebar: "Reference". Header: `padding: 10px`, h1 + SegmentSwitch.
Upload progress: `fixed bottom: 20px right: 20px`, `min-width: 240px max-width: 320px`. Item: `padding: 10px 14px border: 1px solid #E3E8EF radius: 8px`. Bar: `height: 4px bg: #F3F4F6`, fill `bg: #4185DE`.

---

## Step 40 — Review Page

Active sidebar: "Review". Header: `padding: 10px`, h1 + last date `#9CA3AF`.
Step: `padding: 14px 12px gap: 12px border-bottom: 1px solid #E3E8EF border-left: 3px solid transparent`. Checked: `border-left: #16a34a`, text opacity 0.5. Checkbox: 18×18 `accent: #16a34a`. Title: 16px `#374151`. Hint: 14px `#6B7280`. Badge: `bg: #F3F4F6 padding: 2px 8px radius: 10px color: #9CA3AF`. Go: `color: #4185DE padding: 4px 8px radius: 4px`.

---

## Step 41 — Settings Page

Active sidebar: "Settings". Header: `padding: 10px 16px border-bottom: 1px solid #E3E8EF`. Body: `padding: 16px`.
Section: `mb: 32px`. Title: label 13px weight 600 `#6B7280` uppercase `letter-spacing: 0.05em border-bottom: 1px solid #E3E8EF pb: 8px`.
Row: `padding: 12px 0 border-bottom: 1px solid #E3E8EF`. Label: `#374151`. Value: `#6B7280`.
Toggle: 44×24, track `bg: #F3F4F6 border: 1px solid #E3E8EF radius: 24px`, knob 18×18 `bg: white radius: 50% shadow: 0 1px 3px rgba(0,0,0,0.2)`. Checked: track `bg: #4185DE`, knob `translateX(20px)`.
Session: `padding: 12px 0`. Current: `bg: #F3F4F6 padding: 12px radius: 8px`. Badge: `color: #4185DE bg: rgba(37,99,235,0.1) padding: 2px 6px radius: 4px`.

---

## Step 42 — Stuff Detail Page

Header: `padding: 10px 16px border-bottom: 1px solid #E3E8EF`. Back: `color: #4185DE`. Position: `#374151 min-width: 60px`.
Title area: `padding: 24px 24px 0 50px`. Type icon: `absolute left: 16px` 18×18 `#9CA3AF`. Title: h2 `padding: 5px 0 border: 1px solid transparent`. Hover: `bg: #F3F4F6`. Edit: `border: 1px solid #D1D5DB`, focus `border: #4185DE`.
Actions: `padding: 16px 24px 16px 50px gap: 8px`.
Sections: `padding: 12px 24px 12px 50px border-bottom: 1px solid #E3E8EF`. Label: 14px weight 600 `mb: 4px`. Content: 16px `line-height: 1.5`. Empty: `#9CA3AF italic`.
Metadata: `padding: 16px 24px 24px 50px mt: 8px`. Labels: `#9CA3AF`. Values: `#6B7280`.
Clarify slide-over: `width: 480px bg: #FFF shadow: -4px 0 20px rgba(0,0,0,0.15)`.

---

## Step 43 — Action Detail Page

Same as Step 42 except: type icon `left: 11px` 28×28.
Recurring badge: `padding: 2px 10px margin: 8px 0 0 50px bg: #F3F4F6 border: 1px solid #E3E8EF radius: 4px color: #4185DE`.
Tags: chips `padding: 2px 8px bg: #F3F4F6 border: 1px solid #E3E8EF radius: 4px gap: 6px`.
Dates: `gap: 24px mt: 16px`. Input: `padding: 8px 12px border: 1px solid #D1D5DB radius: 6px`. Time: `width: 120px`. Duration: `width: 70px`.
Waiting: `color: #374151`. Since: `#9CA3AF` with `·` separator.
Project link: `color: #4185DE` icon 20×20 `gap: 6px`.

---

## Step 44 — Project Detail Page

Type icon: `left: 14px` 22×22 `#9CA3AF`.
Next Action card: `padding: 12px 16px gap: 12px bg: #F3F4F6 border: 1px solid #E3E8EF radius: 6px`. Checkbox: 18×18. Title: `#374151`, hover underline.
Prompt (no next action): `padding: 12px 16px bg: #fef3c7 border-left: 3px solid #d97706 radius: 4px`. Icon: 24×24 `#d97706`.
Backlog: `max-height: 420px`. Item: `padding: 10px 12px gap: 12px border-bottom: 1px solid #E3E8EF cursor: grab`. Hover: `bg: #E5E7EB`.
Quick-add: `padding: 10px 12px border: 1px solid #E3E8EF radius: 4px`. Focus: `border: #4185DE`.

---

## Step 45 — Landing Page

Hero: `padding: 100px 20px 80px bg: #1E293B max-width: 900px`. Heading: 48px 700 `#F1F5F9`. Subtitle: 18px 500 `#94A3B8 mt: 16px`. CTAs: `gap: 12px row`. Ghost btn: `padding: 14px 20px color: #F1F5F9 border: 1px solid #94A3B8 radius: 6px`.

HowItWorks: `bg: #FFF`. Steps row `gap: 0`. Number: 48×48 circle `bg: #4185DE color: #FFF` 20px 700. Connector: `height: 2px bg: #E3E8EF top: 24px`. Desc: `#6B7280 max-width: 280px`.

Features: `bg: #EDF3FC`. 3×3 grid `gap: 16px`. Card: `border: 1px solid #E3E8EF radius: 12px padding: 24px bg: #FFF`. Icon wrap: 52×52 `radius: 12px bg: rgba(65,133,222,0.1)`. Icon: 28×28 `#4185DE`.

WhyUs: `bg: #FFF`. 3 items `gap: 32px`. Circle: 56×56 `bg: rgba(65,133,222,0.1) radius: 50%`. Icon: 24×24 `#4185DE`.

Testimony: `bg: #EDF3FC`. `border-left: 3px solid #4185DE pl: 24px max-width: 700px`. Text: `#6B7280`. Attr: `#9CA3AF`.

Book: `bg: #FFF`. Row `gap: 32px`. Image: `width: 200px radius: 8px shadow: 0 8px 24px rgba(0,0,0,0.12)`. Desc: `#6B7280`.

CTA: `bg: #4185DE padding: 48px 20px`. Heading: `#FFF`. Subtitle: `rgba(255,255,255,0.85)`. Btn: `padding: 14px 28px bg: #FFF color: #4185DE radius: 6px`.

Footer: `bg: #F3F4F6 border-top: 1px solid #E3E8EF`. Grid: 4 cols `1.5fr 1fr 1fr 1fr gap: 32px padding: 64px 20px`. Logo: 36×36. Heading: 13px 600 `#6B7280` uppercase. Links: `#6B7280`. Bottom: `border-top: 1px solid #E3E8EF padding: 20px` 11px `#9CA3AF`.

---

## Step 46 — Auth Dialog

See Step 23 for dialog specs. Login: h2 "Sign In" centered, email+password Inpt, "Sign In" primary centered, separator, forgot/register links `#4185DE`. Register: h2 "Create Account", +confirm password, agree checkbox.

---

## Step 47 — Pricing Page

Toggle: `mt: 28px centered`. Btn: `padding: 12px 28px border: 1px solid #E3E8EF`. Left `radius: 8px 0 0 8px`. Right `radius: 0 8px 8px 0`. Active: `bg: #4185DE color: #FFF`. Badge: `absolute top: -10px right: -10px bg: #dcfce7 color: #16a34a padding: 2px 8px radius: 20px` weight 600.

Cards: 3-col `gap: 20px`, standard card styles.

Table: `border-collapse`. `th/td padding: 10px 14px`. Header: `bg: #E5E7EB` weight 600. `border-bottom: 1px solid #E3E8EF`. Check: 18×18 `#16a34a`.

---

## Step 48 — Icon Grid

45 icons from `src/main-app/assets/*.vue`. Each 40×40 using `<svg viewBox="0 0 96 96">` with actual path data. `fill="currentColor"`. Grid color: `#374151`. Label: 11px `#6B7280`. ~9 columns, 80px spacing.

---

## Step 49 — Assembly

100px spacing between frames. Each in `<g id="...">`. See svg-plan.md Step 49 for group IDs.

---

## Step 50 — Validation

Valid XML, colors match, fonts match, spacing match, radii match, all `<g>` groups, 1440×900 pages, 260px sidebar, consistent TopNav, correct active sidebar, 45 icon paths, browser render, Figma import.
