ok pu# WNA Platform - GTD Domain Specification

This document defines the domain model and business rules for the WNA GTD platform.

## Version Roadmap

- **V1**: Platform basics - login, tasks, projects, calendar
- **V2**: Full functionality, monetization, Google integration, production-ready
- **V3**: User-requested features - other integrations, brainstorming tool, notes, mobile apps

## Core Domain Entities

### Stuff
Raw, unclarified input. Exists only in Inbox (IN state).

**Fields**: id, title, description (optional), attachments, created_at, input_type (text/photo/audio/file), source_device

**Rules**:
- Cannot have tags, due dates, delegation, or project IDs
- Ephemeral - always transforms into Action/Project/Someday/Reference or deleted
- Reverse allowed: Action/Project → Stuff for re-clarification

### Action
Concrete physical step toward completion. May belong to a Project or be standalone.

**Fields**: id, title, description, project_id (nullable), tags[], due_date, due_time, defer_until, recurrence_rule, waiting_for, waiting_since, completed_at, estimated_minutes

**Rules**:
- If due_date exists → appears in Calendar/Today
- If defer_until exists → hidden until that date, then appears in Next (tickler functionality)
- If waiting_for exists → in Waiting For bucket, must have waiting_since
- If project_id exists → may be Project's Next Action
- Exactly one Action per Project is the Next Action
- Standalone actions (no project_id) go directly to Next
- Actions without due date, delegation, or backlog assignment belong to Next

### Project
Anything requiring more than one action.

**Fields**: id, title, outcome (goal), purpose, vision, description, created_at, next_action_id, tags[], backlog_items[], documents[], comments[], brainstorm_notes

**Rules**:
- Outcome is mandatory (cannot be empty) when creating or editing a project
- Must always have one Next Action (unless completed/archived)
- Backlog contains planned but unscheduled actions
- Completing Next Action auto-promotes next Backlog item
- If backlog empty → user must create new actions
- Tags inherited by new actions (editable)
- Can contain Components (sub-projects with same structure)

**Natural Planning Model** (optional fields for complex projects):
1. **Purpose**: Why are we doing this? What's the intent?
2. **Vision**: What does success look like? Desired outcome.
3. **Brainstorm**: Raw ideas, considerations, possibilities
4. **Organize**: Structure emerges from brainstorm (becomes backlog)
5. **Next Action**: First physical step to move forward

### Someday/Maybe
Paused items with no actionability.

**Rules**:
- Can convert: Someday → Stuff → Clarify
- Weekly Review prompts re-evaluation
- Can store both potential actions and potential projects

### Waiting For
Delegated actions.

**Rules**:
- Must have: waiting_for + waiting_since
- Optional reminder scheduling (auto-reminder to calendar)
- Remove delegation to bring back to Next
- Weekly Review prompts follow-up on stale items

### Reference
Structured folder tree for non-actionable materials.

**Rules**:
- Contains folders and files (txt, image, video, pdf)
- Files cannot be actionable
- Any file can convert → Stuff → Clarify
- Projects can store project-bound documents separately

### Tags
Filtering system (not rigid categorization).

**Types**:
- **Context** (environment/tool): @phone, @computer, @office, @home, @errands
- **Time** (estimated duration): <5min, <15min, <30min, 1h+
- **Energy** (cognitive load): low-energy, high-focus
- **Agenda** (person/meeting): @boss, @partner, @weekly-team, @1on1-john
- **Custom**: user-defined

**Rules**:
- Single action may have many tags
- Project tags inherited by new actions (unless overridden)
- Tags do not apply to Stuff
- Agenda tags collect items to discuss with specific people/meetings

### Calendar Actions
Always derived from an Action.

**Rules**:
- No standalone calendar items - must originate from actionable work
- Sync optional (Google/Apple/Microsoft)
- Recurrence follows RFC5545 iCal RRULE
- Today view shows only actions with specific date + overdue

### Checklists / Templates (V2+)
Reusable action sequences for recurring processes.

**Examples**: Travel packing, meeting prep, weekly review, project kickoff

**Rules**:
- Template defines sequence of actions with relative timing
- Instantiating template creates real Actions attached to a Project or standalone
- Can include default tags, estimated times

### Horizons of Focus (V2+)
GTD higher-level goals for perspective and priority.

| Horizon | Name | Timeframe | Description |
|---------|------|-----------|-------------|
| Ground | Actions | Now | Current next actions |
| H1 | Projects | Short-term | Active outcomes (30-100 projects typical) |
| H2 | Areas of Focus | Ongoing | Roles & accountabilities (job, family, health, finances) |
| H3 | Goals | 1-2 years | What you want to achieve |
| H4 | Vision | 3-5 years | Long-term aspirations |
| H5 | Purpose | Life | Why you exist, core principles |

## State Model - GTD Buckets

| Bucket | Contains | Entry | Exit |
|--------|----------|-------|------|
| Inbox (IN) | Stuff only | Capture | Clarify |
| Next | Actions & project Next Actions | No due date, not delegated, not deferred, not in backlog | Complete, Clarify, Defer, Delegate |
| Calendar (Today) | Scheduled actions | due_date = today OR overdue | Completed or rescheduled |
| Waiting For | Delegated actions | waiting_for is set | Undelegate, complete |
| Someday | Stuff-like long-term items | User decides not-now | Activate → Stuff |
| Reference | Files, notes | User stores data | Convert to Stuff |
| Tickler (deferred) | Actions with defer_until | defer_until is set | Date arrives → moves to Next |

## User Flows

### Capture Flow
- Input: Quick text, mobile photo/audio, files dropped
- Always creates Stuff with minimal metadata
- No tags, dates, or delegation allowed
- UX hint: "What's on your mind?"

### Clarify Flow (most important)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLARIFY WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│  STUFF → "Is this actionable?"                              │
│           │                                                  │
│           ├─ NO  → "Is it useful?"                          │
│           │         ├─ NO  → TRASH (delete)                 │
│           │         ├─ MAYBE LATER → SOMEDAY/MAYBE          │
│           │         └─ YES → REFERENCE                      │
│           │                                                  │
│           └─ YES → "Will it take <2 minutes?"               │
│                     ├─ YES → DO IT NOW (don't add to system)│
│                     └─ NO  → "Is it a single action?"       │
│                               ├─ YES → ACTION               │
│                               └─ NO  → PROJECT              │
│                                        (define first action) │
│                                                              │
│  ACTION → "What's the next physical step?"                  │
│           │                                                  │
│           ├─ "Should someone else do it?" → WAITING FOR     │
│           ├─ "Does it have a specific date?" → CALENDAR     │
│           ├─ "Should it wait until later?" → TICKLER        │
│           └─ Otherwise → NEXT                               │
└─────────────────────────────────────────────────────────────┘
```

**Two-Minute Rule**: If clarifying reveals an action that takes less than 2 minutes, do it immediately. Don't add it to the system - the overhead of tracking exceeds the effort of doing.

### Today Flow
Shows: scheduled actions for today, overdue (in red), reminders triggering today

### Project Flow
- Header: outcome + tags
- Next Action prominently displayed
- Backlog list, Documents, Comments
- Completing next action auto-promotes next backlog item
- If backlog empty → prompt to add new action

### Backlog Promotion
- FIFO unless manually reordered
- Promotion is atomic (avoid race conditions across devices)

### Weekly Review Flow
The Weekly Review is the critical success factor for GTD. Schedule 1-2 hours weekly.

**Get Clear (process all inputs)**:
1. Collect loose papers/materials → Inbox
2. Process Inbox to zero (clarify each item)
3. Empty head - capture any new stuff
4. Review previous calendar (past 2 weeks) for loose ends
5. Review upcoming calendar (next 2 weeks) for prep actions

**Get Current (review all lists)**:
6. Review Next Actions list - mark complete, delete obsolete
7. Review Waiting For list - follow up on stale items, add reminders
8. Review Projects list - ensure each has a Next Action
9. Review Someday/Maybe - activate, delete, or keep

**Get Creative (optional)**:
10. Review Horizons of Focus (monthly)
11. Review goals and vision (quarterly)
12. Brainstorm new projects or ideas

### Engage Flow
When choosing what to do now, filter by (in order):
1. **Context**: What can I do here? (tags: @phone, @computer, @office)
2. **Time available**: How much time do I have? (tags: <5min, <30min)
3. **Energy**: What's my energy level? (tags: low-energy, high-focus)
4. **Priority**: What's most important given the above constraints?

Actions are filtered using AND logic across selected tags.

## Business Rules Summary

**Projects**: Exactly one Next Action, auto-promotion from backlog, cannot exist without Next Action (unless archived)

**Actions**: Cannot be in both backlog and next, due date requires Calendar, delegation requires Waiting For, no actions in Inbox

**Tags**: Don't apply to Stuff, project tags inherited (soft), one category per tag

**Stuff**: No GTD metadata allowed, transforms exactly once, Someday → Stuff creates new object

**Calendar**: Shows only actions, iCal RRULE for recurrence, Today derived from Calendar

**Tickler**: Actions with defer_until hidden until date, then surface to Next automatically

**Two-Minute Rule**: Actions <2 min should be done immediately during clarify, not tracked

## Additional Features (V2+)

- **Multi-user**: Invites, sharing, delegation to other users
- **Integrations**: Google, Apple, Microsoft (calendar, reminders)
- **Analytics**: Completed action history, project status
- **Checklists/Templates**: Reusable action templates for recurring processes
- **Rule-based automation**: Auto-assignment of tags, dates
- **GDPR**: Account deletion, full data export
- **Admin console**: View users, tasks, projects, reminders (metadata only)
- **Horizons of Focus**: Higher-level goal tracking

## UX Principles

- Pre-fill as much data as possible
- Don't over-restrict users
- Give clear hints for input fields
- Keyboard shortcuts for power users
- Simple interface - complexity hidden until needed
- Two-minute rule reminder during clarify
- Weekly Review should be guided/prompted
