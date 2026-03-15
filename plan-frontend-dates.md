# Frontend Plan: Dates & Calendar

## F1. Mutual Exclusivity UI

### ActionDetailPage.vue
- When user sets scheduled date -> auto-clear due date fields in local state, API call (defer type=scheduled) handles backend
- When user sets due date -> auto-clear scheduled fields in local state, API call (/due) handles backend
- Show only relevant sections: if scheduled is set, due section shows "N/A" or is hidden; if due is set, scheduled section shows "N/A"
- start_after + due can both be shown/editable simultaneously

### ClarifyStepCreateAction.vue
- If defer type = "Scheduled for" -> hide due date section entirely
- If defer type = "Start after" -> show due date section (they can coexist)
- If no defer (creating as NEXT) -> show due date section

### CalendarQuickForm.vue
- When creating from calendar, offer choice: "Scheduled for" vs "Start after"
- If "Scheduled for" -> no due date field
- If "Start after" -> also show optional due date field

## F2. Next page: show arrived start_after actions

- Backend `/v1/nextActions` will return CALENDAR-state actions where `start_date <= today`
- **NextPage.vue:** Display these items normally but with a visual indicator (yellow hue "Starts [date]" badge)
- All inline actions (complete, trash, move to today, etc.) work normally
- Reordering in Next list does NOT clear their dates or change state -- they remain technically in CALENDAR state

## F3. Calendar: show due-only actions + multi-date display

- Backend `/v1/calendar` will return them

**Visual distinction by date type:**
- **Scheduled items:** Regular calendar event block (default styling, with time slot if time set, all-day if no time)
- **Start-after items:** **Yellow hue** (yellow background/border/badge, dashed border or "starts" label)
- **Due-only items:** **Red hue** (red background/border/badge, flag/pin icon, "due" label)

**Multi-date display:** If action has `start_date=March 15` AND `due_date=March 20`, render it on BOTH dates with appropriate styling on each (yellow on March 15, red on March 20).

**CalendarMonthView:** Due-only items render as compact markers (not full blocks).
**CalendarDayView:** Due-only items appear in all-day section (unless they have due_time).

## F4. Overdue red marking

- **Where:** NextPage, CalendarPage, TodayPage, WaitingPage, ProjectDetailPage -- anywhere actions are listed
- **Logic:** If `due_date < today` and action is in active state -> red/warning styling (darker red than the regular due red hue)
- **Components:** MetadataRow.vue and/or Item.vue -- check `due_date` against today's date
- Use/extend `dateUtils.js` for an `isOverdue(action)` helper

## F5. Calendar drag behavior

**On drop in CalendarMonthView/DayView/WeekView:**
1. If action currently has `scheduled_date` -> call `deferAction(id, 'scheduled', newDate)` -- updates scheduled to new date
2. If action currently has `start_date` (no scheduled) -> call `deferAction(id, 'start', newDate)` -- updates start_after to new date
3. If action only has `due_date` (no scheduled, no start) -> show a small popover/dropdown asking:
   - "Scheduled for [date]" -> calls `deferAction(id, 'scheduled', newDate)` -- **this will clear due_date** per exclusivity rule
   - "Start after [date]" -> calls `deferAction(id, 'start', newDate)` -- **keeps due_date** since they can coexist
4. Time is always optional -- if dropping onto a time slot in day/week view, include time; otherwise all-day

## F6. Moving out of Calendar clears dates

**When user moves action FROM calendar TO another state (Next, Today, Someday, Waiting):**
1. Call `undeferAction(actionId)` to clear scheduled/start_after on backend
2. Then call the target state endpoint (e.g., `/today`, or update state to NEXT)
3. Update local state to reflect cleared scheduled/start fields
4. `due_date` remains intact

**UI flows affected:**
- Move to Next button/action on calendar items
- Move to Today button/action on calendar items
- Move to Someday/Waiting from calendar
- Any "move" dialog that changes state away from CALENDAR

## F7. Today page: no overdue auto-inclusion

- No changes needed to Today fetching logic
- Today shows: manual items (state=TODAY), scheduled items (CALENDAR with scheduled_date=today), due items (NEXT/WAITING with due_date=today)
- Overdue items do NOT appear in Today -- they stay in their respective views with red marking (F4)

## F8. Date display in lists -- MetadataRow enhancements

Date badges on actions across all list views:
- **Scheduled:** default styling -- "Scheduled Mar 20" (or with time: "Scheduled Mar 20 9:00 AM")
- **Start after:** **yellow hue badge** -- "Starts Mar 15" (or with time: "Starts Mar 15 9:00 AM")
- **Due:** **red hue badge** -- "Due Mar 20" (darker red if overdue)
- If multiple dates exist (start_after + due), show both badges

This yellow/red color coding applies consistently everywhere dates appear: calendar views, list item badges, action detail page, and clarify panel.

## Summary

| #  | Change                                                | Effort       |
|----|-------------------------------------------------------|--------------|
| F1 | Mutual exclusivity UI in detail/clarify/quick-form    | Medium       |
| F2 | Next page shows arrived start_after actions            | Small        |
| F3 | Calendar renders due-only actions + multi-date display | Large        |
| F4 | Overdue red marking across all views                   | Small-Medium |
| F5 | Calendar drag behavior with type detection/popover     | Medium       |
| F6 | Moving out of calendar clears dates flow               | Medium       |
| F7 | No Today changes                                       | None         |
| F8 | MetadataRow date badge enhancements (yellow/red hues)  | Small        |
