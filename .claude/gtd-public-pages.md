# WNA Public Pages - Implementation Guide

## Context

Replace the "Under Construction" landing page with a real public website. Create landing, pricing, help, and legal pages. All pages must be mobile-first and touch-friendly. HTML renders in `/renders/` are content/feel guides only - use the app's established design system.

---

## Golden Rules (Read Before Every Page)

1. **Use existing CSS tokens** from `src/main-app/styles/tokens.css` - colors, fonts, sizes
2. **Use existing typography classes** from `src/main-app/styles/styles.css` - `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-subtitle`, `text-body-m`, `text-body-s`, `text-label`, `text-footnote`
3. **Use existing color utility classes** - `color-text-primary`, `color-text-error`
4. **Use existing `Btn.vue`** for all buttons - variants: `primary`, `ghost`, `danger`, `link`; sizes: `sm`, `md`, `lg`
5. **No Tailwind, no CSS framework** - pure scoped CSS referencing CSS variables
6. **Mobile-first** - design for mobile, enhance for desktop at `@media (min-width: 769px)`
7. **Touch-friendly** - min tap target 44px, adequate spacing, no hover-only interactions
8. **Scoped styles** in every component - no global CSS additions except tokens
9. **Font**: Inter (already loaded via `--font-family-default`)
10. **Primary color**: `--color-action: #4185DE` for all accent/interactive elements

---

## Key Existing Tokens Reference

```
Colors:
  --color-action: #4185DE          (primary blue - buttons, links, accents)
  --color-text-primary: #374151    (headings, body text)
  --color-text-secondary: #6B7280  (descriptions, secondary text)
  --color-text-tertiary: #9CA3AF   (hints, placeholders)
  --color-bg-primary: #FFFFFF      (white backgrounds)
  --color-bg-secondary: #F3F4F6    (light gray section backgrounds)
  --color-bg-hover: #E5E7EB        (hover states)
  --color-border-light: #E3E8EF    (borders, separators)
  --color-app-background: #f8fafc  (page background)
  --color-link-text: #4185DE       (link color)
  --color-link-hover: #0951ae      (link hover)

Typography classes:
  .text-display  - 32-48px, bold 700, line-height 120%
  .text-h1       - 26-36px, bold 700, line-height 125%
  .text-h2       - 24-30px, semi-bold 600, line-height 130%
  .text-h3       - 20-24px, semi-bold 600, line-height 135%
  .text-h4       - 18-20px, medium 500, line-height 140%
  .text-subtitle - 15-18px, medium 500, line-height 150%
  .text-body-m   - 15-16px, regular 400, line-height 150%
  .text-body-s   - 13-14px, regular 400, line-height 150%
  .text-label    - 13px, semi-bold 600
  .text-footnote - 11px, regular 400

Button usage:
  <Btn variant="primary" size="lg">Start Free</Btn>
  <Btn variant="ghost" size="md">Learn More</Btn>
  <Btn variant="link" size="sm">Read more</Btn>
```

---

## Shared Components (Build First - Step 0)

### 0A. Add tokens to `tokens.css`

Add these at the end of `:root` block:

```css
/* Public page section spacing */
--section-py: 64px;
--section-py-mobile: 40px;
--section-max-width: 900px;
--section-px: 20px;

/* Card styling */
--card-radius: 12px;
--card-padding: 24px;
--card-border: 1px solid var(--color-border-light);
--card-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.08);
```

### 0B. Create `PublicFooter.vue` at `src/main-app/components/public/PublicFooter.vue`

Footer shared across ALL public pages. Content:
- 4 columns on desktop, stacked on mobile
- Column 1: Logo (AppIcon.svg) + "WhatsNextAction"
- Column 2 "Product": Features, Pricing (router-link to /pricing)
- Column 3 "Support": Help & FAQ (router-link to /help), Contact
- Column 4 "Legal": Terms of Service (/legal/terms), Privacy Policy (/legal/privacy)
- Bottom row: "© 2025 WhatsNextAction. All rights reserved."
- Second line: "Getting Things Done® and GTD® are registered trademarks of the David Allen Company."

Styling:
- Background: `var(--color-bg-secondary)`
- Top border: `1px solid var(--color-border-light)`
- Column headings: `text-label` class, `color: var(--color-text-secondary)`, uppercase, letter-spacing 0.05em
- Links: `text-body-s` class, `color: var(--color-text-secondary)`, hover `color: var(--color-action)`
- Copyright: `text-footnote`, `color: var(--color-text-tertiary)`
- Padding: `var(--section-py) var(--section-px)` top area, `20px var(--section-px)` bottom row
- Max-width inner: `var(--section-max-width)`, centered
- Grid: `grid-template-columns: 1.5fr 1fr 1fr 1fr` on desktop, `repeat(2, 1fr)` on tablet, `1fr` on mobile
- Gap: 32px

### 0C. Modify `LandingLayout.vue`

Changes:
1. Import and add `PublicFooter` after the `<main>` slot
2. Remove `max-width: 900px` from `.landing-container` - each section handles its own max-width
3. Remove `text-align: center` from `.landing-container`
4. Keep `flex: 1` and `display: flex; flex-direction: column`

Result:
```html
<template>
  <div class="landing-layout">
    <TopNav ... />
    <main class="landing-main">
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>
```

```css
.landing-layout { min-height: 100vh; display: flex; flex-direction: column; }
.landing-main { flex: 1; display: flex; flex-direction: column; }
```

### 0D. Modify `TopNav.vue`

Add center navigation links when in landing/public context (desktop only):
- Between `.topnav-left` and the right section
- Links: "Why GTD" (anchor /#why-gtd), "Features" (anchor /#features), "Pricing" (router-link /pricing), "Help" (router-link /help)
- Style: `text-body-s`, `color: var(--color-text-secondary)`, hover `color: var(--color-action)`, gap 24px
- Desktop only (hidden on mobile via `desktop-only` class)
- Add these links to mobile hamburger menu too (for mobile users)

### 0E. Modify `router.js`

Add routes:
```js
{ path: '/pricing', name: 'pricing', component: () => import('../views/PricingPage.vue') },
{ path: '/help', name: 'help', component: () => import('../views/HelpPage.vue') },
{ path: '/legal', name: 'legal', redirect: '/legal/terms' },
{ path: '/legal/terms', name: 'legal-terms', component: () => import('../views/LegalPage.vue'), props: { doc: 'terms' } },
{ path: '/legal/privacy', name: 'legal-privacy', component: () => import('../views/LegalPage.vue'), props: { doc: 'privacy' } },
```

Add scroll behavior to router:
```js
scrollBehavior(to, from, savedPosition) {
  if (to.hash) return { el: to.hash, behavior: 'smooth' }
  if (savedPosition) return savedPosition
  return { top: 0 }
}
```

---

## Section Component Convention

Every section component follows this pattern:

```html
<template>
  <section class="section" id="section-id">
    <div class="section-inner">
      <!-- content -->
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
}
.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}
@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}
</style>
```

- Alternating backgrounds: white (`var(--color-bg-primary)`) and gray (`var(--color-bg-secondary)`)
- All text centered within sections by default (unless content dictates left-align)
- Headings use `text-h1` or `text-h2` with `color: var(--color-text-primary)`
- Body text uses `text-body-m` with `color: var(--color-text-secondary)`
- Spacing between heading and content: `margin-top: 16px` for paragraphs, `margin-top: 32px` for grids/cards

---

## Step 1: Landing Page

**File**: `src/main-app/views/LandingPage.vue`
**Route**: `/`

Replace `<UnderConstruction/>` with section components. Remove UnderConstruction import. Delete `UnderConstruction.vue` after.

### Sections in order:

#### 1.1 Hero Section (`components/public/HeroSection.vue`)
- Background: white, subtle radial gradient `radial-gradient(circle at 50% 50%, rgba(65,133,222,0.04) 0%, transparent 70%)`
- Centered content, generous padding (100px top / 80px bottom on desktop, 60px/48px mobile)
- Headline: **"Capture. Clarify. Organize. Reflect. Engage."** - `text-display`, `color-text-primary`
- Subtitle: **"Achieve stress-free productivity with the GTD methodology."** - `text-subtitle`, `color: var(--color-text-secondary)`, margin-top 16px
- Two buttons side-by-side (row, gap 12px, centered), margin-top 32px:
  - `<Btn variant="primary" size="lg">Start Free</Btn>` - emits 'open-register'
  - `<Btn variant="ghost" size="lg">Learn More</Btn>` - smooth scrolls to #why-gtd
- On mobile: buttons stack vertically, full width

#### 1.2 Why GTD Section (`components/public/WhyGtdSection.vue`)
- Background: `var(--color-bg-secondary)`
- ID: `why-gtd`
- Heading: **"Why GTD?"** - `text-h1`
- Paragraph: **"Getting Things Done is a proven methodology by David Allen for reducing mental clutter and increasing focus. By capturing everything that has your attention, clarifying what it means, organizing it into a trusted system, and regularly reflecting on it, you can engage with your work with confidence and clarity."** - `text-body-m`, `color: var(--color-text-secondary)`, max-width 700px centered, margin-top 16px

#### 1.3 Features Grid (`components/public/FeaturesSection.vue`)
- Background: white
- ID: `features`
- Heading: **"Your Trusted System, Organized"** - `text-h1`, centered
- Grid of 6 cards, margin-top 32px
- Grid: 3 columns desktop, 2 tablet, 1 mobile (`grid-template-columns` with auto-fill minmax(260px, 1fr))
- Gap: 16px

Cards (each card):
- Border: `var(--card-border)`
- Border-radius: `var(--card-radius)`
- Padding: `var(--card-padding)`
- Background: `var(--color-bg-primary)`
- Text-align: left
- Hover: `box-shadow: var(--card-shadow-hover)`, transition 0.2s
- Icon: Reuse existing SVG components from `assets/` at 28px, `color: var(--color-action)`, margin-bottom 12px
- Title: `text-h4`, margin-top 0
- Description: `text-body-s`, `color: var(--color-text-secondary)`, margin-top 6px

Card content:
1. **Inbox** (InboxIcon) - "Capture everything that has your attention. Get it out of your head and into your trusted system."
2. **Next Actions** (NextIcon) - "See the concrete physical steps you can take right now to move things forward."
3. **Projects** (ProjectIcon) - "Track outcomes that require more than one action step to complete."
4. **Waiting For** (HourglassIcon) - "Keep track of everything you're waiting on from other people."
5. **Someday / Maybe** (SomedayIcon) - "Park ideas and possibilities you might want to pursue in the future."
6. **Calendar** (TodayIcon) - "Your hard landscape - only for time-specific actions and commitments."

#### 1.4 Why Us Section (`components/public/WhyUsSection.vue`)
- Background: `var(--color-bg-secondary)`
- Heading: **"Designed for Clarity and Focus"** - `text-h1`, centered
- 3 items in a row (stacked on mobile), margin-top 32px, gap 32px
- Each item centered:
  - Circular icon container: 56px circle, `background: rgba(65,133,222,0.1)`, centered, inline SVG icon 24px in `var(--color-action)`
  - Title: `text-h4`, margin-top 16px
  - Description: `text-body-s`, `color: var(--color-text-secondary)`, margin-top 8px, max-width 280px

Items:
1. **Pure GTD** (water drop icon SVG) - "Built with strict adherence to the Getting Things Done methodology. No compromises, no shortcuts."
2. **Minimalist Design** (layout icon SVG) - "A clean, distraction-free interface that helps you focus on what truly matters."
3. **Cross-Platform** (sync icon SVG) - "Access your system from any device. Your lists stay in sync everywhere you go."

#### 1.5 Personal Testimony (`components/public/TestimonySection.vue`)
- Background: white
- Heading: **"Why I Built This"** - `text-h2`, centered
- Blockquote-style content, margin-top 24px:
  - Left border: `3px solid var(--color-action)`
  - Padding-left: 24px
  - Max-width: 700px, centered
  - Text-align: left
- Content (2-3 paragraphs): `text-body-m`, `color: var(--color-text-secondary)`
  - "I discovered David Allen's Getting Things Done methodology years ago, and it changed how I think about productivity. The idea of capturing everything, clarifying it, and organizing it into a trusted system gave me a sense of control I'd never had before."
  - "But I could never find the right tool. Every app I tried was either too complex, too simple, or treated GTD as an afterthought - bolting on features that didn't respect the methodology."
  - "So I built WhatsNextAction. A tool designed from the ground up around GTD principles. Nothing more, nothing less. And now I'm sharing it with anyone who wants to experience truly stress-free productivity."
- Attribution below: name/title in `text-label`, `color: var(--color-text-tertiary)`, margin-top 16px

#### 1.6 Book Section (`components/public/BookSection.vue`)
- Background: `var(--color-bg-secondary)`
- Two-column layout on desktop (image left, text right), stacked on mobile
- Gap: 32px, items vertically centered
- Left: Book cover image (placeholder `<img>` with src to be provided, ~200px wide on desktop, centered on mobile, with rounded corners 8px and subtle shadow)
- Right (text-align left):
  - Heading: **"Want to Know More About GTD?"** - `text-h2`
  - Paragraph: **"Getting Things Done by David Allen is the definitive guide to stress-free productivity. Learn the complete methodology that inspired this app."** - `text-body-m`, `color: var(--color-text-secondary)`, margin-top 12px
  - Button: `<Btn variant="ghost" size="md">Get the Book on Amazon</Btn>` - opens Amazon link in new tab, margin-top 20px
  - Link attributes: `target="_blank" rel="noopener noreferrer"`

#### 1.7 CTA Banner (`components/public/CtaBanner.vue`)
- Background: `var(--color-action)` (solid blue)
- All text white
- Centered content, padding 48px vertical
- Heading: **"Ready to Get Things Done?"** - `text-h2`, color white
- Subtitle: **"Start organizing your life for free today."** - `text-body-m`, color white (opacity 0.85), margin-top 8px
- Button: white background, `color: var(--color-action)`, font-weight 600, padding 14px 28px, border-radius 6px, margin-top 24px. Custom styled (not Btn component - since it needs inverted colors). Hover: slight opacity or scale.
- Emits 'open-register'

---

## Step 2: Pricing Page

**File**: `src/main-app/views/PricingPage.vue`
**Route**: `/pricing`

Uses `LandingLayout` wrapper (same as landing page).

### Content:

#### Header section
- Heading: **"Find Your Focus, Achieve Your Goals"** - `text-h1`, centered
- Subtitle: **"Choose the plan that's right for you."** - `text-body-m`, `color: var(--color-text-secondary)`, margin-top 12px

#### Pricing Tiers (3 cards)
- Container: max-width 900px, centered
- Grid: 3 columns desktop, stacked on mobile
- Gap: 20px, margin-top 40px

Each tier card (`components/public/PricingTier.vue` - reusable):
- Props: `{ name, price, period, description, features: string[], featured: boolean, ctaText, ctaAction }`
- Border: `var(--card-border)`, or `2px solid var(--color-action)` if featured
- Border-radius: `var(--card-radius)`
- Padding: 32px
- Background: `var(--color-bg-primary)`
- If featured: subtle shadow `0 4px 24px rgba(65,133,222,0.15)` and a "Most Popular" badge (small pill at top)

Card layout:
- Plan name: `text-h4`
- Price: `text-display` for number + `text-body-s` for "/month"
- Description: `text-body-s`, `color: var(--color-text-secondary)`, margin-top 8px
- CTA button: full width, `Btn variant="primary"` if featured, `Btn variant="ghost"` otherwise, margin-top 20px
- Feature list: border-top separator, margin-top 20px, padding-top 20px
- Each feature: flex row, checkmark icon (SVG, `color: var(--color-action)`) + text (`text-body-s`), gap 10px, margin-bottom 10px

Tiers:
1. **Free** - $0/month - "For individuals starting with GTD" - Features: Up to 5 projects, Basic inbox, Email support - CTA: "Start for Free"
2. **Pro** (featured) - $10/month - "For professionals who need more power" - Features: Unlimited projects, Advanced filtering, Reminders, Priority support - CTA: "Choose Pro"
3. **Team** - $25/user/month - "For teams that collaborate and win" - Features: Everything in Pro, Team collaboration, Admin controls, Dedicated support - CTA: "Contact Sales"

#### Feature Comparison Table
- Below tiers, margin-top 64px
- Heading: **"Compare Features"** - `text-h2`, centered
- Responsive table, margin-top 24px
- Border: `var(--card-border)`, border-radius: `var(--card-radius)`, overflow hidden
- Header row: `background: var(--color-bg-secondary)`
- Columns: Feature | Free | Pro | Team
- Rows with check/dash icons
- On mobile: horizontally scrollable with `-webkit-overflow-scrolling: touch`

---

## Step 3: Help Page

**File**: `src/main-app/views/HelpPage.vue`
**Route**: `/help`

Uses `LandingLayout` wrapper.

### Content:

#### Header
- Heading: **"Help & Resources"** - `text-h1`
- Optional search input (can be added later, skip for v1)

#### Getting Started Section
- Heading: **"Getting Started"** - `text-h2`, margin-top 40px
- 3 cards in a row (stacked on mobile), gap 16px, margin-top 20px
- Card style: same card conventions (border, radius, padding, hover shadow)
- Cards:
  1. **What is GTD?** - "A brief overview of the Getting Things Done methodology."
  2. **Your First Five Minutes** - "A quick-start guide to setting up WhatsNextAction."
  3. **The Five Steps** - "Capture, Clarify, Organize, Reflect, and Engage explained."

#### FAQ Section
- Heading: **"Frequently Asked Questions"** - `text-h2`, margin-top 48px
- Accordion items (`components/public/FaqItem.vue`), margin-top 20px
- Each item: border `var(--card-border)`, border-radius 8px, margin-bottom 8px
- Question row: padding 16px 20px, clickable (full width), flex between question text and chevron icon
- Question text: `text-body-m`, font-weight 600
- Chevron: rotates 180deg when open, transition 0.2s
- Answer: padding 0 20px 16px, `text-body-s`, `color: var(--color-text-secondary)`, line-height 160%
- Expand/collapse with Vue `<Transition>` or max-height animation
- **Touch**: entire question row is the tap target (min 44px height)

FAQ items:
1. "How do I add a new item?" - "Use the quick-add button (+) in the top bar, or navigate to your Inbox and start typing. Everything starts as 'stuff' in your inbox."
2. "What's the difference between a project and an action?" - "A project is any outcome requiring more than one action step. An action is a single, concrete, physical step you can take."
3. "How does the Inbox work?" - "The Inbox is where you capture everything on your mind. During clarification, you decide what each item is and where it belongs."
4. "Can I set due dates?" - "Yes. In GTD, due dates are reserved for hard deadlines. For everything else, use your Next Actions list and context tags."
5. "What is the Weekly Review?" - "A weekly routine where you review all your lists, get clear on commitments, and ensure your system is current and complete."

#### GTD Best Practices Section
- Heading: **"GTD Best Practices"** - `text-h2`, margin-top 48px
- 3 cards, same grid as Getting Started
- Cards:
  1. **The Two-Minute Rule** - "If it takes less than two minutes, do it now."
  2. **Weekly Review** - "Set aside time each week to review your lists and get current."
  3. **Use Contexts** - "Tag actions by context (@computer, @phone, @errands) to filter by what you can do right now."

#### Contact / Support
- Simple centered section at bottom, margin-top 48px, padding-top 32px, border-top
- Text: "Can't find what you're looking for?" - `text-body-m`
- Link: "Contact Support" - styled as `Btn variant="link"`

---

## Step 4: Legal Page

**File**: `src/main-app/views/LegalPage.vue`
**Route**: `/legal/terms`, `/legal/privacy`
**Props**: `{ doc: 'terms' | 'privacy' }`

Uses `LandingLayout` wrapper.

### Layout:
- Two-column on desktop: sticky sidebar (200px) + content area
- Single column on mobile: sidebar becomes horizontal tabs/links at top
- Gap: 40px

### Sidebar (`components/public/LegalSidebar.vue`):
- Heading: "Legal Documents" - `text-label`, uppercase
- Links: router-links, `text-body-s`
  - Terms of Service → `/legal/terms`
  - Privacy Policy → `/legal/privacy`
- Active link: `color: var(--color-action)`, font-weight 600
- Inactive: `color: var(--color-text-secondary)`, hover `color: var(--color-action)`
- Desktop: `position: sticky; top: 80px`
- Mobile: horizontal row with gap 16px, border-bottom, padding-bottom 16px

### Content:
- Heading: document title - `text-h1`
- "Last updated: [date]" - `text-body-s`, `color: var(--color-text-tertiary)`, margin-top 8px
- Body: prose-style content, text-align left
- Subheadings: `text-h3`, margin-top 40px, margin-bottom 12px
- Paragraphs: `text-body-m`, `color: var(--color-text-secondary)`, margin-top 12px, line-height 170%
- Lists: standard HTML ul/ol with left padding 24px, list items `text-body-m`
- Links within text: `color: var(--color-link-text)`, hover `color: var(--color-link-hover)`, underline

Content for Terms of Service and Privacy Policy: Use placeholder lorem-ipsum style content initially, with proper section structure (Definitions, User Responsibilities, Intellectual Property, Limitation of Liability, Contact). The content from the render can be used as starting point.

---

## Mobile Responsiveness Checklist (Apply to Every Page)

- [ ] Breakpoint: `@media (min-width: 769px)` for desktop enhancements
- [ ] All tap targets minimum 44px height
- [ ] Buttons: full-width on mobile (`width: 100%`) where appropriate (hero, pricing CTAs)
- [ ] Grids: collapse to single column on mobile
- [ ] Horizontal padding: `var(--section-px)` (20px) on all sections
- [ ] No horizontal scroll (test with `overflow-x: hidden` on layout)
- [ ] Font sizes: already responsive via `clamp()` in tokens
- [ ] Images: `max-width: 100%; height: auto`
- [ ] Tables: horizontally scrollable wrapper on mobile
- [ ] Spacing: reduced section padding on mobile via `var(--section-py-mobile)`

---

## Implementation Order

| Step | What | Depends On |
|------|------|------------|
| 0 | Shared foundation: tokens, PublicFooter, LandingLayout refactor, TopNav center links, router changes | Nothing |
| 1 | Landing page: all 7 sections + assemble in LandingPage.vue | Step 0 |
| 2 | Pricing page: PricingTier component + PricingPage | Step 0 |
| 3 | Help page: FaqItem component + HelpPage | Step 0 |
| 4 | Legal page: LegalSidebar component + LegalPage | Step 0 |
| 5 | Delete UnderConstruction.vue, final cleanup | Steps 1-4 |

---

## Verification Per Page

After each page, run `npm run dev` and check:
1. Desktop layout (>769px) looks correct
2. Mobile layout (<769px) - use browser dev tools responsive mode
3. All links/buttons work (router-links navigate, anchors scroll)
4. Auth dialog opens from "Start Free" / "Sign In" buttons
5. Footer renders correctly with working links
6. No console errors
7. Touch simulation: buttons are easy to tap, no hover-dependent interactions
