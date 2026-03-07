# WNA Spec vs Implementation — Gap Analysis

> Compared `.claude/wna-specification.md` (spec) against actual codebase. Last updated: 2026-03-06.

## V1 Gaps — Missing from Implementation

### Stuff / Capture
- [ ] `input_type` field (text/photo/audio/file) — only text capture exists
- [ ] `source_device` field — not tracked
- [ ] Photo/audio/file capture to Inbox — QuickAdd is text-only
- [ ] Reverse clarify (Action/Project → Stuff) — only forward clarify exists

### Project — Natural Planning Model - V2
- [ ] `purpose` field ("Why are we doing this?")
- [ ] `vision` field ("What does success look like?")
- [ ] `brainstorm_notes` field (raw ideas/considerations)
- [ ] Sub-projects / Components — flat project structure only
- [ ] Tag inheritance to new actions — each item manages tags independently

### Reference
- [ ] Reference → Stuff conversion — only Stuff → Reference exists, not reverse

### Weekly Review
- [ ] Review previous calendar (past 2 weeks) — 6 generic steps, no calendar lookback
- [ ] Review upcoming calendar (next 2 weeks)
- [ ] Get Creative section (Horizons, goals, brainstorm) — steps 10-12

### Calendar
- [ ] Google/Apple/Microsoft calendar sync
- [ ] iCal RRULE export/import — RRULE used internally but no external sync

## V2+ Features — Not Yet Implemented

Per spec's "Additional Features (V2+)" and "Version Roadmap":

- [ ] Multi-user (invites, sharing, delegation to other users)
- [ ] External integrations (Google, Apple, Microsoft calendar/reminders)
- [ ] Analytics (completed action history, project status reports)
- [ ] Checklists/Templates (reusable action sequences for recurring processes)
- [ ] Rule-based automation (auto-assignment of tags, dates)
- [ ] GDPR compliance (full data export — account deletion exists, export doesn't)
- [ ] Admin console (admin-app scaffolded but not built)
- [ ] Horizons of Focus (H2-H5: Areas of Focus, Goals, Vision, Purpose)
- [ ] Mobile native apps (iOS/Android — responsive web exists)
- [ ] Brainstorming tool (connected to Natural Planning Model)
- [ ] Notes (mentioned in V3 roadmap)

## Other Missing Features (not in spec but expected)

- [ ] Global full-text search across all items
- [ ] Bulk operations (multi-select → complete, trash, move, tag)
- [ ] Payment/subscription integration (Stripe) — pricing page exists, no billing
- [ ] Quota/limits enforcement in frontend — documented in Help FAQ only
- [ ] Dark mode / theme switching
- [ ] Advanced keyboard shortcuts (Cmd+K search, global hotkeys)
- [ ] Push notifications (browser) — only email notifications exist
- [ ] Offline / PWA support
- [ ] Undo last action (global Ctrl+Z)

## Already Implemented (Working)

Clarify workflow, Two-minute rule, Tickler/defer_until, Waiting For with waiting_since,
Backlog auto-promotion, Weekly Review (basic 6-step), Recurring actions (RRULE),
Drag & drop reordering (within-list + cross-component to sidebar), Calendar views
(Day/Week/Month/Year/Recurring), Reference file manager, Tags (as plain strings),
Engage dashboard with nudges, Notification settings (email), Gravatar avatars,
Comments, Attachments, Mobile bottom sheets, Overdue highlighting, GTD tips,
Cross-tab logout, Debug mode, Public pages (Landing, Pricing, Help, Legal).

## V1 Priority Order

1. Natural Planning Model on Projects (purpose/vision/brainstorm)
2. Estimated minutes on Actions
3. Tag type system (Context/Time/Energy/Agenda)
4. Engage filtering cascade
5. Reverse clarify (Action/Project → Stuff)
6. Reference → Stuff conversion
7. Rich capture (photo/audio/file to inbox)
