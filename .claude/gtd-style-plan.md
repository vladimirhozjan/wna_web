What's Missing / Weak (Ordered by GTD Impact)


# 1. Weekly Review (Reflect step) - The #1 Gap

GTD lives or dies by the weekly review. Without it, lists rot and trust erodes. Currently there's zero review support.

Proposal: A guided "Review" flow accessible from sidebar:
- Step-by-step checklist that walks through each bucket
- "Is your Inbox empty?" → shows inbox count, link to process
- "Review Next Actions" → scroll through each, mark stale ones someday/trash
- "Review Waiting For" → any follow-ups needed?
- "Review Projects" → does each have a next action? Any stuck?
- "Review Someday" → anything ready to activate?
- Track last review date, gently nudge after 7 days (subtle badge, not annoying)


# 2. Inbox Zero Nudge - Make Processing Natural

Users add stuff but forget to clarify. The app should gently guide them.

Proposal:
- When inbox has items, show a subtle indicator (not just count badge - maybe a warm "You have 5 items to process" banner on the dashboard)
- After adding a new stuff item, offer "Process now?" inline (one tap to start clarify)
- "Process all" mode that chains through inbox items one by one (already partially there with position navigation)
- Celebrate Inbox Zero with a brief, subtle visual


# ~~3. Universal Capture - Add from Anywhere~~

~~Currently you can only add stuff from InboxPage. GTD says capture must be frictionless.~~

~~Proposal:~~
- ~~Global floating "+" button (mobile) or keyboard shortcut (desktop) available from ANY view~~
- ~~Always captures to Inbox as raw stuff (pure GTD)~~
- ~~Optional: if user is on NextPage, ask "Add as action directly, or capture to inbox?" - this is the "do what you want" flexibility~~

# ~~4. Two-Minute Rule - During Clarify~~

~~When clarifying an item as actionable, GTD says: if it takes <2 minutes, do it now.~~

~~Proposal:~~
- ~~After user says "Yes, it's actionable" in clarify, add a step: "Can you do this in under 2 minutes?"~~
- ~~If yes → mark as completed immediately (done, not tracked)~~
- ~~If no → continue normal clarify flow~~
- ~~This is invisible GTD teaching - users learn to handle quick items without realizing~~


# 5. Project Health Indicators

GTD rule: every project must have a next action. Stale projects = system distrust.

Proposal:
- On ProjectsPage, show a visual indicator for projects without a next action (warning icon or subtle highlight)
- When viewing a project with no actions, prompt: "What's the next physical step?"
- On dashboard/home, show "X projects need attention" if any lack next actions


# 6. ~~Contexts (@tags) - Work Where You Are~~

~~GTD organizes next actions by context (@phone, @computer, @errands, @office). Your tag system is close but not context-aware.

Proposal:
- Treat certain tags as "contexts" (prefix with @ or mark as context type)
- Add context quick-filter on NextPage: "What can I do right now?" → filter by @home, @office, @phone
- This naturally teaches users to tag by context, making their lists actually useful for execution


# 7. "Engage" Dashboard - What Should I Do Now?

The app opens to... wherever you were. GTD's engage step is about picking the right action based on context, time, energy, and priority.

Proposal:
- A home/dashboard view that shows:
    - Inbox count (with "Process" button if >0)
    - Today's actions (calendar items due)
    - Overdue items (needs attention)
    - Top 3-5 next actions
    - Waiting items due for follow-up
    - "Last reviewed X days ago" with review button
- Not overwhelming - think of it as a daily briefing


# 8. Defer/Tickler Visibility

Deferred items should surface automatically on their defer date. The backend supports defer_until but the UX around it is passive.

Proposal:
- When deferred items "wake up", show them in a "Newly available" section on the dashboard or Next Actions
- Brief notification: "3 deferred items are now active"


# ~~9. Complete the Reference Path~~

~~Currently clarifyToReference throws "not implemented". This breaks the clarify flow.~~

~~Proposal:~~
- ~~Connect clarify → reference: when user says "not actionable → reference", allow them to save it as a reference note/file~~
- ~~Even a simple "save as note" would complete the flow~~


# 10. Gentle Habit Building (Non-intrusive)

The "without being aware" part of your request.

Proposal:
- Morning prompt: When opening the app, briefly show today's items + inbox count
- Completion celebration: Brief positive feedback when completing actions (already have success toasts)
- Streak tracking: "You've processed your inbox 5 days in a row" (optional, in settings)
- Smart suggestions: When an action has been in Next for 30+ days, subtly suggest: "Still relevant? Move to Someday?"
- Empty state coaching: When a list is empty, show helpful text like "Nothing waiting - nice!" instead of just blank

  ---
Priority Recommendation

If I were to implement these in order of GTD impact:
┌──────────┬──────────────────────────────┬───────────────────────────────────────────────────┐
│ Priority │           Feature            │                        Why                        │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 1        │ Universal Capture (global +) │ GTD rule #1: capture everything, everywhere       │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 2        │ Two-Minute Rule in Clarify   │ Biggest behavior change with smallest code change │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 3        │ Inbox Zero nudge             │ Keeps the system flowing                          │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 4        │ Project Health indicators    │ Prevents stuck projects                           │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 5        │ Engage Dashboard             │ Daily starting point                              │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 6        │ Weekly Review                │ System maintenance (bigger feature)               │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 7        │ Complete Reference path      │ Finish the clarify flow                           │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 8        │ Contexts                     │ Power-user GTD feature                            │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 9        │ Tickler visibility           │ Nice refinement                                   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┤
│ 10       │ Habit building nudges        │ Polish layer                                      │
└──────────┴──────────────────────────────┴───────────────────────────────────────────────────┘
  ---
What resonates with you? Want me to plan and implement any of these? I can start with the high-impact, low-effort ones (two-minute rule, inbox nudge, universal capture) or
tackle the bigger features (weekly review, dashboard).
