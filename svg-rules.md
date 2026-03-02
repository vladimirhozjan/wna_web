# SVG Rules — Instructions for Claude

> Claude MUST follow these rules at every step to produce a pixel-perfect SVG. No guessing. No approximating. Every value comes from the source files.

---

## File Plan — SVG Output Files

Output is split into **8 SVG files** by group. Each file is self-contained with its own `<defs>` (fonts, filters). Steps within a file are laid out with 100px horizontal gap, 200px vertical gap between rows.

| File | Steps | Contents |
|------|-------|----------|
| `svg/01-tokens.svg` | 1, 2, 3 | Color palette, typography samples, shadow & card samples |
| `svg/02-primitives.svg` | 4, 5, 6, 7, 8, 9 | Btn, Inpt, Select, TagInput, SegmentSwitch, Checkbox |
| `svg/03-navigation.svg` | 10, 11, 12, 13 | TopNav, TopNavDropdown, Sidebar, SidebarDrawer |
| `svg/04-items.svg` | 14, 15, 16 | Item (all states), ItemList, MetadataRow |
| `svg/05-overlays.svg` | 17, 18, 19, 20, 21, 22 | Modal, ConfirmDialog, Dropdown, ErrorToaster, QuickAddBtn, TagFilter |
| `svg/06-specialized.svg` | 23, 24, 25, 26, 27, 48 | AuthDialog, UserAvatar, ClarifyPanel, GtdTip, ItemTypeIcon, Icon Grid |
| `svg/07-pages-dashboard.svg` | 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44 | DashboardLayout chrome + all dashboard pages (one per row, 1440×900 each) |
| `svg/08-pages-public.svg` | 45, 46, 47 | Landing page, Auth dialog overlaid, Pricing page |

### File rules

1. **Create the `svg/` directory** at project root before writing any files.
2. **Each file starts** with `<svg xmlns="http://www.w3.org/2000/svg">` and a `viewBox` that fits all its content with 100px padding.
3. **Each file has its own `<defs>`** containing any shadow filters and reusable elements needed by its steps.
4. **Icon paths used in multiple files** — re-read the icon `.vue` file and embed the path data in each file that needs it. Do not reference across files.
5. **Steps within a file** are wrapped in `<g id="step-NN-name">` as usual.
6. **Build files in order** (01 → 08). Earlier files don't depend on later ones, but later files reuse patterns established in earlier steps — re-read the source files, don't copy from earlier SVG output.
7. **Dashboard pages file (07)** will be the largest. Each page is a full 1440×900 frame. Stack them vertically with 200px gap. Expected total height: ~17 pages × 1100 = ~18,700px.
8. **Validation (Step 50)** applies to every file individually — each must be valid XML that opens in a browser and imports into Figma with named layers.

---

## Rule 0 — Before Starting Any Step

1. **Read the source file(s)** listed for that step. Do NOT rely on memory or assumptions.
2. **Extract every CSS value** that affects visual output: colors, font-size, font-weight, line-height, padding, margin, gap, border, border-radius, box-shadow, width, height, opacity.
3. **Resolve CSS variables** — follow the chain back to the literal value in the token files. Never put a variable name in SVG; always the final hex/rgba/px value.
4. **Resolve `clamp()` values** — we render at 1440px desktop width, so always use the **maximum** value (the third argument).
5. **Use `font-family="Inter"` on every text element.** No exceptions.
6. **Wrap each step's output** in `<g id="step-NN-name">` so Figma imports it as a named layer.
7. **Position elements** by reading actual padding/margin/gap values from CSS. Do not eyeball spacing.

---

## Rule 1 — Colors


Before rendering any colored element, look up the exact value:

| What to read | File |
|---|---|
| All color tokens | `src/main-app/styles/tokens/colors.css` |
| Button/input/toast/calendar/menu tokens | `src/main-app/styles/tokens/components.css` |

- For `rgba()` colors: use SVG `fill-opacity` or `opacity` attribute, not hex approximations.
- For overlays: render as a semi-transparent `<rect>` with the exact rgba value.
- Never darken/lighten a color manually. Every hover/active/disabled color has its own token — use it.

---

## Rule 2 — Typography

Before rendering any text, read:
- `src/main-app/styles/tokens/typography.css` — for font sizes, weights, line heights
- `src/main-app/styles/styles.css` — for which class maps to which combination

Then for every `<text>` element set ALL of these attributes:
```
font-family="Inter"
font-size="Xpx"          ← exact px from token (use clamp max)
font-weight="N"           ← exact number: 300/400/500/600/700
letter-spacing="0"
```

For vertical positioning, compute `y` from: parent top + padding-top + (font-size × line-height-ratio) to place the baseline correctly.

- `.text-body-s` = 14px weight 400
- `.text-body-m` = 16px weight 400
- `.text-body-l` = 18px weight 400
- `.text-label` = 13px weight 600
- `.text-footnote` = 11px weight 400
- `.text-h3` = 24px weight 600
- `.text-h2` = 30px weight 600
- `.text-h1` = 36px weight 700
- `.text-display` = 48px weight 700

---

## Rule 3 — Shadows

SVG has no `box-shadow`. For each shadow, create a `<filter>` in `<defs>` and apply it.

Before rendering any shadow, read `src/main-app/styles/tokens/layout.css` and map each shadow to a filter:
- `0 Ypx Bpx rgba(R,G,B,A)` → `<feDropShadow dx="0" dy="Y" stdDeviation="B/2" flood-color="rgb(R,G,B)" flood-opacity="A"/>`
- For `box-shadow: 0 0 0 Npx color` (focus rings) → render as a second `<rect>` behind the element, Npx larger on each side, filled with the ring color.

---

## Rule 4 — Icons

Before rendering any icon, read its `.vue` file from `src/main-app/assets/` and extract the literal `<svg>` markup (the `<path>`, `<circle>`, `<rect>` etc. inside it).

- Copy the path data exactly — do not simplify or redraw.
- Set `fill="currentColor"` then wrap in a `<g>` with the correct `fill` color.
- Scale the icon to match the size specified in the component CSS (check the `:deep(svg)` rules).
- Common sizes: sidebar icons = 28×28 with 4px padding (visible 20×20), metadata icons = 20×20 with 4px padding (visible 12×12), ItemTypeIcon = 20×20 with 2px padding (visible 16×16).

---

## Rule 5 — Component Rendering

For every component step (Steps 4–27), Claude MUST:

1. **Read the component's `.vue` file** — the `<style scoped>` section contains the exact CSS.
2. **Read the `<template>` section** — it shows the DOM structure, nesting, and which elements exist.
3. **Recreate the DOM structure as SVG groups** — each HTML element becomes a `<g>`, `<rect>`, or `<text>`.
4. **Apply styles element-by-element** — padding becomes x/y offsets, background becomes `<rect fill>`, border becomes `<rect stroke>`.
5. **For each state** (hover, active, disabled, etc.) — render a separate copy side-by-side, labeled. Read the exact CSS for that state from the file.
6. **Verify dimensions**: if a component has `padding: 10px 16px` and text is 14px, the total height = 10 + (14 × line-height) + 10. Calculate, don't guess.

---

## Rule 6 — Page Rendering (Steps 28–47)

For every page step, Claude MUST:

1. **Read the page's `.vue` file** from `src/main-app/views/dashboard/` or `src/main-app/views/public/`.
2. **Read the layout file** — `src/main-app/layouts/DashboardLayout.vue` for dashboard pages.
3. **Build the chrome first**: 1440×900 frame, TopNav across top, Sidebar 260px on left, content area fills remaining 1180px with `#f8fafc` background.
4. **Set the active sidebar item** — read which `<SidebarMenuItem>` matches the page route name, apply active style (color `#4185DE`, weight 600).
5. **Read the page template** to know exact layout: what header elements, what list type, what components are used.
6. **Compose from already-built components** — reuse the exact same SVG patterns from earlier steps. Don't re-interpret; copy the structure.
7. **Use realistic sample data** — item titles should be GTD-appropriate (e.g. "Call dentist to schedule appointment", "Buy groceries for the week", "Review Q3 budget proposal").

---

## Rule 7 — Spacing & Layout

Never guess spacing. For every gap between elements:

1. Check `gap`, `row-gap`, `column-gap` in the flex/grid container.
2. Check `margin` and `padding` on each child element.
3. If the component uses `padding: 12px 16px`, the content starts at x+16, y+12 inside the bounding rect.
4. If a flex container has `gap: 8px`, elements are exactly 8px apart — not 7, not 10.

For flex layouts:
- `justify-content: space-between` → first element at left edge, last at right edge, equal gaps between.
- `justify-content: flex-end` → elements packed to the right.
- `align-items: center` → vertically centered within the container height.
- `margin-left: auto` → pushes element to the far right of its flex container.

---

## Rule 8 — Borders & Outlines

- `border: 1px solid #HEX` → SVG `<rect>` with `stroke="#HEX" stroke-width="1"`. Inset the fill rect by 0.5px so the stroke doesn't overflow.
- `border-bottom: 1px solid #HEX` → draw a `<line>` at the bottom edge.
- `border-left: 3px solid #HEX` → draw a `<rect>` at the left edge, width 3, full height.
- `border-radius: Npx` → SVG `rx="N" ry="N"` on the `<rect>`.
- If only some corners are rounded (e.g. `border-radius: 16px 16px 0 0`), use a `<path>` with arcs instead of `<rect>`.

---

## Rule 9 — Interactive States

Components have multiple visual states. For the SVG, render each state as a **separate labeled copy** placed side-by-side:

- **Default** — the resting appearance
- **Hover** — read the `:hover` CSS rule, apply those overrides
- **Active** — read the `:active` CSS rule
- **Disabled** — read the `:disabled` CSS rule (often includes `opacity`, different colors)
- **Loading** — if the component has it (e.g. Btn), show the spinner overlay
- **Focused** — if applicable (inputs), show focus ring/border

Label each state with a small text below: "Default", "Hover", "Active", "Disabled", etc. Font: Inter 11px weight 400 color `#9CA3AF`.

---

## Rule 10 — Source Files to Read Per Step

| Step | Files to Read |
|------|--------------|
| 1 | `tokens/colors.css`, `tokens/components.css` |
| 2 | `tokens/typography.css`, `styles/styles.css` |
| 3 | `tokens/layout.css` |
| 4 | `components/Btn.vue`, `tokens/components.css` |
| 5 | `components/Inpt.vue`, `tokens/components.css` |
| 6 | `components/Select.vue` |
| 7 | `components/TagInput.vue` |
| 8 | `components/SegmentSwitch.vue` |
| 9 | `components/Item.vue` (checkbox styles inside) |
| 10 | `components/TopNav.vue` |
| 11 | `components/TopNavDropdown.vue` |
| 12 | `components/Sidebar.vue`, `components/SidebarMenuItem.vue` |
| 13 | `components/SidebarDrawer.vue` |
| 14 | `components/Item.vue` |
| 15 | `components/ItemList.vue` |
| 16 | `components/MetadataRow.vue` |
| 17 | `components/Modal.vue` |
| 18 | `components/ConfirmDialog.vue` |
| 19 | `components/Dropdown.vue` |
| 20 | `components/ErrorToaster.vue` |
| 21 | `components/QuickAddBtn.vue` |
| 22 | `components/TagFilter.vue` |
| 23 | `components/AuthDialog.vue` |
| 24 | `components/UserAvatar.vue` |
| 25 | `components/clarify/ClarifyPanel.vue` |
| 26 | `components/GtdTip.vue` |
| 27 | `components/ItemTypeIcon.vue` |
| 28 | `layouts/DashboardLayout.vue`, TopNav, Sidebar |
| 29 | `views/dashboard/EngagePage.vue` + Item, MetadataRow, ItemList |
| 30 | `views/dashboard/InboxPage.vue` + ClarifyPanel |
| 31 | `views/dashboard/NextPage.vue` + TagFilter, MetadataRow |
| 32 | `views/dashboard/TodayPage.vue` |
| 33 | `views/dashboard/CalendarPage.vue` + `components/calendar/*.vue` |
| 34 | `views/dashboard/ProjectsPage.vue` |
| 35 | `views/dashboard/WaitingForPage.vue` |
| 36 | `views/dashboard/SomedayPage.vue` + ItemTypeIcon |
| 37 | `views/dashboard/CompletedPage.vue` + ItemTypeIcon |
| 38 | `views/dashboard/TrashPage.vue` + ItemTypeIcon |
| 39 | `views/dashboard/ReferencePage.vue` + `components/reference/*.vue` |
| 40 | `views/dashboard/ReviewPage.vue` |
| 41 | `views/dashboard/SettingsPage.vue` |
| 42 | `views/dashboard/StuffDetailPage.vue` |
| 43 | `views/dashboard/ActionDetailPage.vue` |
| 44 | `views/dashboard/ProjectDetailPage.vue` |
| 45 | `views/public/LandingPage.vue` + `components/public/*.vue` |
| 46 | `components/AuthDialog.vue` (both modes) |
| 47 | `views/public/PricingPage.vue` |
| 48 | All files in `assets/*.vue` (45 icon files) |

All paths are relative to `src/main-app/`.

---

## Rule 11 — SVG Structure

Every step's SVG must follow this structure:

```xml
<g id="step-NN-name" transform="translate(X, Y)">
  <!-- Title label for the frame -->
  <text font-family="Inter" font-size="20" font-weight="600" fill="#374151">Step NN — Name</text>

  <!-- Frame background (if applicable) -->
  <rect width="W" height="H" fill="#FFFFFF" rx="0"/>

  <!-- Component content here -->
</g>
```

- Use `transform="translate(X,Y)"` for positioning groups on the canvas.
- Use nested `<g>` for sub-elements (e.g. each button variant gets its own `<g>`).
- Give meaningful `id` attributes so Figma layers are named properly.

---

## Rule 12 — What NOT to Do

- **Do NOT guess colors.** If you're not sure, re-read the token file.
- **Do NOT approximate font sizes.** 14px means 14, not 13 or 15.
- **Do NOT skip states.** If the plan says render hover/active/disabled, render all of them.
- **Do NOT use CSS-only features** like `backdrop-filter`, `transition`, `animation`, `:hover` in SVG. Render the visual result statically.
- **Do NOT simplify icon paths.** Copy them verbatim from the `.vue` files.
- **Do NOT add elements not present in the source.** If the component doesn't have a shadow, don't add one.
- **Do NOT hard-code values from memory.** Always read the file first for that step.
- **Do NOT use generic placeholder text.** Use GTD-realistic titles and content.

---

## Rule 13 — Validation Before Finishing Each Step

After completing each step's SVG, verify:

1. **Every color** matches a token value exactly (spot-check 3 elements).
2. **Every font-size/weight** matches the class used in the template.
3. **Every spacing value** (padding, gap, margin) matches the CSS.
4. **Every border-radius** matches the CSS.
5. **The SVG is valid XML** — all tags closed, attributes quoted, no broken entities.
6. **The group has a proper `id`** for Figma import.

---

## Rule 14 — Assembly (Step 49)

Output is **8 separate SVG files** as defined in the File Plan at the top. Within each file:

- Arrange step groups with **100px horizontal spacing** between frames on the same row.
- If steps don't fit side-by-side (e.g. pages at 1440px wide), stack them **vertically with 200px spacing**.
- Set each file's `viewBox` to encompass all its content with **100px padding** on all sides.
- After writing each file, verify it is valid XML and opens in a browser.

### Build order

```
1.  svg/01-tokens.svg          (Steps 1–3)
2.  svg/02-primitives.svg      (Steps 4–9)
3.  svg/03-navigation.svg      (Steps 10–13)
4.  svg/04-items.svg           (Steps 14–16)
5.  svg/05-overlays.svg        (Steps 17–22)
6.  svg/06-specialized.svg     (Steps 23–27, 48)
7.  svg/07-pages-dashboard.svg (Steps 28–44)
8.  svg/08-pages-public.svg    (Steps 45–47)
```

Each file is independent. No cross-file references. If an icon or pattern is needed, re-read the source and embed it.
