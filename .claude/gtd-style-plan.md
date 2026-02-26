What's Missing / Weak (Ordered by GTD Impact)


# ~~1. Weekly Review (Reflect step) - The #1 Gap~~ DONE

~~GTD lives or dies by the weekly review. Without it, lists rot and trust erodes. Currently there's zero review support.~~

~~Proposal: A guided "Review" flow accessible from sidebar:~~
- ~~Step-by-step checklist that walks through each bucket~~
- ~~"Is your Inbox empty?" → shows inbox count, link to process~~
- ~~"Review Next Actions" → scroll through each, mark stale ones someday/trash~~
- ~~"Review Waiting For" → any follow-ups needed?~~
- ~~"Review Projects" → does each have a next action? Any stuck?~~
- ~~"Review Someday" → anything ready to activate?~~
- ~~Track last review date, gently nudge after 7 days (subtle badge, not annoying)~~

> Implemented: ReviewPage.vue with 6-step guided checklist (Inbox, Next Actions, Waiting For, Projects, Someday, Calendar). reviewModel.js tracks last review date, daysSinceReview, isOverdue. Nudge shown on EngagePage. Supports creating recurring review reminders.


# ~~2. Inbox Zero Nudge - Make Processing Natural~~ PARTIAL

~~Users add stuff but forget to clarify. The app should gently guide them.~~

~~Proposal:~~
- ~~When inbox has items, show a subtle indicator (not just count badge - maybe a warm "You have 5 items to process" banner on the dashboard)~~
- ~~After adding a new stuff item, offer "Process now?" inline (one tap to start clarify)~~
- "Process all" mode that chains through inbox items one by one (already partially there with position navigation)
- Celebrate Inbox Zero with a brief, subtle visual

> Implemented: EngagePage shows "X items in inbox to clarify" nudge with link to ?clarify=1. InboxPage has "Clarify" button that starts processing. NOT implemented: "Process all" chained mode and Inbox Zero celebration visual.


# ~~3. Universal Capture - Add from Anywhere~~ DONE

~~Currently you can only add stuff from InboxPage. GTD says capture must be frictionless.~~

~~Proposal:~~
- ~~Global floating "+" button (mobile) or keyboard shortcut (desktop) available from ANY view~~
- ~~Always captures to Inbox as raw stuff (pure GTD)~~
- Optional: if user is on NextPage, ask "Add as action directly, or capture to inbox?" - this is the "do what you want" flexibility

> Implemented: QuickAddBtn in TopNav (DashboardLayout), available on every dashboard page. Captures to inbox as raw stuff. The optional "add as action directly" flexibility is NOT implemented.


# ~~4. Two-Minute Rule - During Clarify~~ DONE

~~When clarifying an item as actionable, GTD says: if it takes <2 minutes, do it now.~~

~~Proposal:~~
- ~~After user says "Yes, it's actionable" in clarify, add a step: "Can you do this in under 2 minutes?"~~
- ~~If yes → mark as completed immediately (done, not tracked)~~
- ~~If no → continue normal clarify flow~~
- ~~This is invisible GTD teaching - users learn to handle quick items without realizing~~

> Implemented: clarifyModel.js has DO_IT_NOW state. ClarifyStepCreateAction shows "Do it now" button. ClarifyStepDoItNow shows a stopwatch timer while user does the task, then marks as completed immediately.


# ~~5. Project Health Indicators~~ DONE

~~GTD rule: every project must have a next action. Stale projects = system distrust.~~

~~Proposal:~~
- ~~On ProjectsPage, show a visual indicator for projects without a next action (warning icon or subtle highlight)~~
- When viewing a project with no actions, prompt: "What's the next physical step?"
- ~~On dashboard/home, show "X projects need attention" if any lack next actions~~

> Implemented: MetadataRow shows yellow warning "No next action" for projects missing next_action_id. EngagePage shows "X projects need a next action" nudge. NOT implemented: inline prompt "What's the next physical step?" when viewing a project detail.


# ~~6. Contexts (@tags) - Work Where You Are~~ DONE

~~GTD organizes next actions by context (@phone, @computer, @errands, @office). Your tag system is close but not context-aware.~~

~~Proposal:~~
- ~~Treat certain tags as "contexts" (prefix with @ or mark as context type)~~
- ~~Add context quick-filter on NextPage: "What can I do right now?" → filter by @home, @office, @phone~~
- ~~This naturally teaches users to tag by context, making their lists actually useful for execution~~

> Implemented: contextModel.js with activeTag. ContextFilter.vue in sidebar allows setting a global context tag. All pages (Next, Today, Waiting, Projects, Someday, Engage) filter by effectiveTags using the active context. TagFilter.vue for multi-tag filtering on individual pages.


# ~~7. "Engage" Dashboard - What Should I Do Now?~~ DONE

~~The app opens to... wherever you were. GTD's engage step is about picking the right action based on context, time, energy, and priority.~~

~~Proposal:~~
~~- A home/dashboard view that shows:~~
    - ~~Inbox count (with "Process" button if >0)~~
    - ~~Today's actions (calendar items due)~~
    - ~~Overdue items (needs attention)~~
    - ~~Top 3-5 next actions~~
    - ~~Waiting items due for follow-up~~
    - ~~"Last reviewed X days ago" with review button~~
~~- Not overwhelming - think of it as a daily briefing~~

> Implemented: EngagePage.vue at /engage route. Shows: Overdue alert (red), Today section (top 5), Next Actions (top 5), Waiting For (top 3), Nudges section (inbox count + clarify link, stuck projects count, days since last review). engageModel.js loads all data. Context filtering applied.


# 8. Defer/Tickler Visibility - NOT DONE

Deferred items should surface automatically on their defer date. The backend supports defer_until but the UX around it is passive.

Proposal:
- When deferred items "wake up", show them in a "Newly available" section on the dashboard or Next Actions
- Brief notification: "3 deferred items are now active"

> NOT implemented. Backend supports defer/undefer API (apiClient.js has deferAction/undeferAction), and ClarifyStepCreateAction supports setting scheduled_date/start_date. But there is NO UI for surfacing newly-available deferred items on the dashboard or elsewhere.


# ~~9. Complete the Reference Path~~ DONE

~~Currently clarifyToReference throws "not implemented". This breaks the clarify flow.~~

~~Proposal:~~
- ~~Connect clarify → reference: when user says "not actionable → reference", allow them to save it as a reference note/file~~
- ~~Even a simple "save as note" would complete the flow~~

> Implemented: apiClient.js clarifyToReference() creates a text file from stuff content and uploads to reference storage via uploadRefFile(), then deletes original stuff item. clarifyModel.js uses NonActionableTarget.REFERENCE to trigger this flow.


# 10. Gentle Habit Building (Non-intrusive) - PARTIAL

The "without being aware" part of your request.

Proposal:
- ~~Morning prompt: When opening the app, briefly show today's items + inbox count~~
- ~~Completion celebration: Brief positive feedback when completing actions (already have success toasts)~~
- Streak tracking: "You've processed your inbox 5 days in a row" (optional, in settings)
- Smart suggestions: When an action has been in Next for 30+ days, subtly suggest: "Still relevant? Move to Someday?"
- ~~Empty state coaching: When a list is empty, show helpful text like "Nothing waiting - nice!" instead of just blank~~

> PARTIAL: EngagePage serves as the "morning prompt" showing today's items + inbox count. Success toasts exist for completions. All pages have helpful empty state text. NOT implemented: streak tracking, smart suggestions for stale actions (30+ days).

  ---
Priority Recommendation

If I were to implement these in order of GTD impact:
┌──────────┬──────────────────────────────┬───────────────────────────────────────────────────┬────────┐
│ Priority │           Feature            │                        Why                        │ Status │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 1        │ ~~Universal Capture (global +)~~ │ GTD rule #1: capture everything, everywhere       │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 2        │ ~~Two-Minute Rule in Clarify~~   │ Biggest behavior change with smallest code change │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 3        │ ~~Inbox Zero nudge~~             │ Keeps the system flowing                          │ PARTIAL│
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 4        │ ~~Project Health indicators~~    │ Prevents stuck projects                           │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 5        │ ~~Engage Dashboard~~             │ Daily starting point                              │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 6        │ ~~Weekly Review~~                │ System maintenance (bigger feature)               │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 7        │ ~~Complete Reference path~~      │ Finish the clarify flow                           │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 8        │ ~~Contexts~~                     │ Power-user GTD feature                            │ DONE   │
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 9        │ Tickler visibility           │ Nice refinement                                   │ NOT DONE│
├──────────┼──────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ 10       │ Habit building nudges        │ Polish layer                                      │ PARTIAL│
└──────────┴──────────────────────────────┴───────────────────────────────────────────────────┴────────┘
  ---

## Summary: 8/10 DONE, 2 PARTIAL, 1 NOT DONE

### Fully Done (7):
1. ~~Weekly Review~~ - ReviewPage + reviewModel + sidebar nudge
2. ~~Universal Capture~~ - QuickAddBtn in TopNav globally
3. ~~Two-Minute Rule~~ - Do It Now with stopwatch in clarify
4. ~~Project Health~~ - Warning badges + engage nudges
5. ~~Contexts~~ - contextModel + ContextFilter + all pages filter
6. ~~Engage Dashboard~~ - Full dashboard with all sections
7. ~~Reference Path~~ - clarifyToReference converts to file

### Partial (2):
- **Inbox Zero Nudge** - Has nudge + clarify button. Missing: "Process all" chain mode, Inbox Zero celebration
- **Habit Building** - Has morning dashboard + success toasts + empty states. Missing: streak tracking, smart stale-action suggestions

### Not Done (1):
- **Defer/Tickler Visibility** - Backend supports defer, but no UI for surfacing newly-available items
