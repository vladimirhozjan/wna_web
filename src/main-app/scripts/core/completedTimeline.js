// Weekly bucketing, per-section counts, and chart datasets are derived client-side: the stats endpoint returns only daily+monthly grains (already in local tz), and local date-fns parsing reproduces the same local-day buckets.

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

// Order is load-bearing: today/yesterday are matched before the week/month ranges so a boundary never double-claims.
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

// Fine buckets come from `daily` and coarse older months from `monthly`; current+prev months sit inside the 90-day daily window, so the two sources never overlap or double-count.
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

// Rows must arrive pre-ordered (completed_at DESC): a new group starts when the bucket key changes, so load-more extends the last group without duplicating headers. Counts come from stats, not loaded rows.
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
