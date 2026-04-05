# WNA Roadmap

## V1 — Frontend-only (no backend changes needed)

### High Priority
- [ ] **Tickler visibility** — surface newly-available deferred items on Engage/Next Actions ("3 deferred items are now active")
- [ ] **Stale item nudges** — actions 30+ days in Next ("Still relevant?"), waiting 14+ days ("Follow up?"), projects 30+ days inactive ("Still active?"). Show on Engage or during Weekly Review. Note: basic nudges exist (inbox count, stuck projects, review reminder) — this is about age-based staleness detection
- [ ] **Onboarding** — first-login welcome modal (3-4 slides), explain sidebar sections, prompt first inbox item

### Medium Priority
- [ ] **Streak tracking** — inbox processing streak + weekly review streak on Engage/Review pages (optional, behind settings)
- [ ] **Review improvements** — progress ring/stepped bar (currently linear text "X of Y"), calendar lookback (past + upcoming 2 weeks), completion celebration
- [ ] **Global search** — full-text search across all items (needs backend endpoint)
- [ ] **Bulk operations** — multi-select → complete, trash, move, tag

### Low Priority (polish)
- [ ] **Empty state illustrations** — currently uses simple SVG icons + text; upgrade to unique decorative illustrations per section
- [ ] **Mobile swipe gestures** — swipe right to complete, left to defer/trash (drag-to-reorder exists, but no action swipes)
- [ ] **Pull-to-refresh** on list pages
- [ ] **Bottom sheet** for clarify on mobile instead of fullscreen modal
- [ ] **Larger touch targets** on mobile action buttons

## V1 — Needs backend work

- [ ] **Reverse clarify** — Action/Project → Stuff for re-clarification
- [ ] **Payment integration** (Stripe) — pricing page exists, no billing
- [ ] **Keyboard shortcuts** — Cmd+K command palette, global hotkeys (basic Escape/Backspace exists in ClarifyPanel only)

## V2+ Features

### Core GTD
- [ ] Natural Planning Model on Projects — purpose/vision/brainstorm fields (outcome field exists, rest missing)
- [ ] Tag type system — formal Context/Time/Energy/Agenda categories (convention-based prefixes exist: `@`, `energy:`, `min:`)
- [ ] Engage filtering cascade (context → time → energy → priority)
- [ ] Horizons of Focus (H2-H5: Areas, Goals, Vision, Purpose)
- [ ] Weekly Review "Get Creative" section (steps 10-12)

### Capture
- [ ] Rich capture to Inbox (photo/audio/file, not just text)
- [ ] `input_type` and `source_device` fields on Stuff

### Integrations
- [ ] Google/Apple/Microsoft calendar sync
- [ ] iCal RRULE export/import
- [ ] Push notifications (browser)

### Platform
- [ ] Multi-user (invites, sharing, delegation)
- [ ] Analytics (completed action history, project status reports)
- [ ] Checklists/Templates (reusable action sequences)
- [ ] Rule-based automation (auto-assignment of tags, dates)

### V3
- [ ] Mobile native apps (iOS/Android)
- [ ] Brainstorming tool
- [ ] Notes
- [ ] Offline / PWA support
- [ ] Undo last action (global Ctrl+Z)