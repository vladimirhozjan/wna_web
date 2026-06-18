// FEAT-015: client-side derivations for the Completed page redesign.
//
// The backend's /v1/completed/stats endpoint is week-start-agnostic — it returns only
// `daily` (last 90 local days, zero-filled) and `monthly` (full history) grains, already
// bucketed in the caller's local tz. ALL weekly bucketing, per-section counts, and chart
// datasets are derived here, honoring the user's `settings.weekStartsOn`.
//
// completed_at arrives as UTC; the browser's local tz equals the `tz` the client sends to
// the backend (apiClient.liveTz()), so date-fns local parsing/formatting reproduces the
// same local-day buckets the endpoint used — no separate tz library needed.
//
// The single source of truth for "which bucket does a local day fall in" is bucketForDate().
// Both the list grouping AND the per-section counts route every date through it, so each
// date maps to exactly one bucket — the Σ(section counts) == total invariant holds with no
// week/month-boundary double-count (a date claimed by `last-week`/`wd-*` is never also
// claimed by `last-month`, because today→yesterday→wd→last-week are checked first).

import {
    format,
    parseISO,
    startOfDay,
    startOfWeek,
    startOfMonth,
    subDays,
    subMonths,
    addDays,
    getWeekDays,
    getCalendarWeeks,
} from './dateUtils.js'

// Precompute the local-day boundaries that define every bucket, once per derivation.
export function buildContext(now, weekStartsOn) {
    const today = startOfDay(now)
    const yesterday = subDays(today, 1)
    const weekStart = startOfWeek(today, { weekStartsOn })
    const lastWeekStart = subDays(weekStart, 7)
    const firstOfMonth = startOfMonth(today)
    const firstOfPrevMonth = startOfMonth(subMonths(today, 1))
    return { today, yesterday, weekStart, lastWeekStart, firstOfMonth, firstOfPrevMonth, weekStartsOn }
}

// Classify one local day into its recency bucket. Order is load-bearing: today/yesterday
// are matched before the week/month ranges so a week or month boundary never double-claims.
// Returns { key, label }. Fine buckets: today, yesterday, wd-<date>, last-week, earlier-month,
// last-month. Coarse bucket: m-YYYY-MM (label "May 2026").
export function bucketForDate(date, ctx) {
    const day = startOfDay(date)
    const t = day.getTime()

    if (t === ctx.today.getTime()) return { key: 'today', label: 'Today' }
    if (t === ctx.yesterday.getTime()) return { key: 'yesterday', label: 'Yesterday' }
    // Earlier this week (each weekday its own header), older than yesterday.
    if (t >= ctx.weekStart.getTime() && t < ctx.yesterday.getTime())
        return { key: 'wd-' + format(day, 'yyyy-MM-dd'), label: format(day, 'EEEE') }
    // The whole week before this one (per weekStartsOn).
    if (t >= ctx.lastWeekStart.getTime() && t < ctx.weekStart.getTime())
        return { key: 'last-week', label: 'Last week' }
    // Current calendar month, older than last week.
    if (t >= ctx.firstOfMonth.getTime() && t < ctx.lastWeekStart.getTime())
        return { key: 'earlier-month', label: 'Earlier this month' }
    // Previous calendar month remainder (the part not already claimed by wd/last-week).
    if (t >= ctx.firstOfPrevMonth.getTime() && t < ctx.firstOfMonth.getTime())
        return { key: 'last-month', label: 'Last month' }
    // Anything older: grouped by calendar month.
    return { key: 'm-' + format(day, 'yyyy-MM'), label: format(day, 'MMMM yyyy') }
}

// Build a { date -> count } lookup from the daily series for O(1) access.
function dailyMap(stats) {
    const m = new Map()
    for (const { date, count } of stats?.daily || []) m.set(date, count)
    return m
}

// Per-section counts. Fine buckets are summed from `daily` (so a week straddling two
// calendar months is counted once, in its fine bucket); only the coarse "Older → month"
// sections come from `monthly`. The current + previous calendar months are fully inside
// the 90-day daily window, so every fine bucket is exact, and `monthly` is used only for
// months strictly older than the previous month — no overlap, no double-count.
export function buildSectionCounts(stats, now, weekStartsOn) {
    if (!stats) return null
    const ctx = buildContext(now, weekStartsOn)
    const counts = {}

    for (const { date, count } of stats.daily || []) {
        if (!count) continue
        const b = bucketForDate(parseISO(date), ctx)
        if (b.key[0] === 'm' && b.key[1] === '-') continue // coarse: counted from monthly
        counts[b.key] = (counts[b.key] || 0) + count
    }

    for (const { month, count } of stats.monthly || []) {
        if (!count) continue
        const ms = startOfMonth(parseISO(month + '-01')).getTime()
        if (ms >= ctx.firstOfPrevMonth.getTime()) continue // current/prev month covered by daily
        counts['m-' + month] = (counts['m-' + month] || 0) + count
    }

    return counts
}

// Group already-ordered (completed_at DESC) rows into recency sections via a single
// sequential pass: a new group starts whenever the bucket key changes. Append-only and
// order-stable, so load-more simply extends the last open group or starts a new one — a
// header is never duplicated. The count annotation comes from the stats-derived
// sectionCounts (not loaded rows); null when stats are unavailable.
export function buildGroups(rows, sectionCounts, now, weekStartsOn) {
    const ctx = buildContext(now, weekStartsOn)
    const groups = []
    let current = null

    for (const item of rows || []) {
        if (!item.completed_at) continue
        const b = bucketForDate(parseISO(item.completed_at), ctx)
        if (!current || current.key !== b.key) {
            const count = sectionCounts ? sectionCounts[b.key] : null
            current = { key: b.key, label: b.label, items: [], count: count != null ? count : null }
            groups.push(current)
        }
        current.items.push(item)
    }

    return groups
}

// ── Chart datasets (all derived client-side) ──

// This week: 7 bars ordered per weekStartsOn, per-day count; index of today highlighted;
// best-day marker = max of the 7 (tie → most recent), suppressed when all are 0.
export function buildWeekChart(stats, now, weekStartsOn) {
    const map = dailyMap(stats)
    const days = getWeekDays(now, weekStartsOn)
    const todayStart = startOfDay(now).getTime()
    const labels = []
    const data = []
    let highlightIndex = -1
    days.forEach((day, i) => {
        labels.push(format(day, 'EEE'))
        data.push(map.get(format(day, 'yyyy-MM-dd')) || 0)
        if (startOfDay(day).getTime() === todayStart) highlightIndex = i
    })
    let bestDayIndex = -1
    let best = 0
    data.forEach((v, i) => { if (v > 0 && v >= best) { best = v; bestDayIndex = i } }) // tie → latest
    return { labels, data, highlightIndex, bestDayIndex }
}

// This month: one bar per week of the current month, weeks per weekStartsOn (not ISO);
// each bar sums the daily counts of its 7 days. The week containing today is highlighted.
export function buildMonthChart(stats, now, weekStartsOn) {
    const map = dailyMap(stats)
    const weekStarts = getCalendarWeeks(now, weekStartsOn)
    const todayStart = startOfDay(now).getTime()
    const labels = []
    const data = []
    let highlightIndex = -1
    weekStarts.forEach((ws, i) => {
        let sum = 0
        let inThisWeek = false
        for (let d = 0; d < 7; d++) {
            const day = addDays(ws, d)
            sum += map.get(format(day, 'yyyy-MM-dd')) || 0
            if (startOfDay(day).getTime() === todayStart) inThisWeek = true
        }
        labels.push('Week ' + (i + 1))
        data.push(sum)
        if (inThisWeek) highlightIndex = i
    })
    return { labels, data, highlightIndex, bestDayIndex: -1 }
}

// This year: 12 bars Jan–Dec of the current year from `monthly`; current month highlighted.
export function buildYearChart(stats, now) {
    const byMonth = new Map()
    for (const { month, count } of stats?.monthly || []) byMonth.set(month, count)
    const year = now.getFullYear()
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const data = labels.map((_, i) => byMonth.get(`${year}-${String(i + 1).padStart(2, '0')}`) || 0)
    return { labels, data, highlightIndex: now.getMonth(), bestDayIndex: -1 }
}
