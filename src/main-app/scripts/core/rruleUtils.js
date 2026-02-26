export const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

export const WEEKDAYS = [
    { value: 'MO', label: 'Mon' },
    { value: 'TU', label: 'Tue' },
    { value: 'WE', label: 'Wed' },
    { value: 'TH', label: 'Thu' },
    { value: 'FR', label: 'Fri' },
    { value: 'SA', label: 'Sat' },
    { value: 'SU', label: 'Sun' },
]

/**
 * Parse an RRULE string into a parts object.
 * E.g. "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR" →
 *   { freq: 'WEEKLY', interval: 2, byday: ['MO','FR'], bymonthday: null, count: null, until: null }
 */
export function parseRRule(str) {
    const result = {
        freq: 'WEEKLY',
        interval: 1,
        byday: [],
        bymonth: null,
        bymonthday: null,
        count: null,
        until: null,
    }

    if (!str) return result

    const parts = str.split(';')
    for (const part of parts) {
        const [key, val] = part.split('=')
        if (!key || !val) continue

        switch (key) {
            case 'FREQ':
                result.freq = val
                break
            case 'INTERVAL':
                result.interval = parseInt(val, 10) || 1
                break
            case 'BYDAY':
                result.byday = val.split(',')
                break
            case 'BYMONTH':
                result.bymonth = parseInt(val, 10) || null
                break
            case 'BYMONTHDAY':
                result.bymonthday = parseInt(val, 10) || null
                break
            case 'COUNT':
                result.count = parseInt(val, 10) || null
                break
            case 'UNTIL':
                result.until = val
                break
        }
    }

    return result
}

/**
 * Build an RRULE string from a parts object.
 */
export function buildRRule(parts) {
    const segments = []

    segments.push(`FREQ=${parts.freq || 'WEEKLY'}`)

    if (parts.interval && parts.interval > 1) {
        segments.push(`INTERVAL=${parts.interval}`)
    }

    if (parts.byday?.length && parts.freq === 'WEEKLY') {
        segments.push(`BYDAY=${parts.byday.join(',')}`)
    }

    if (parts.bymonth && parts.freq === 'YEARLY') {
        segments.push(`BYMONTH=${parts.bymonth}`)
    }

    if (parts.bymonthday && (parts.freq === 'MONTHLY' || parts.freq === 'YEARLY')) {
        segments.push(`BYMONTHDAY=${parts.bymonthday}`)
    }

    if (parts.count) {
        segments.push(`COUNT=${parts.count}`)
    } else if (parts.until) {
        segments.push(`UNTIL=${parts.until}`)
    }

    return segments.join(';')
}

/**
 * Produce a human-readable description of an RRULE string.
 * E.g. "Every 2 weeks on Mon, Fri"
 */
export function describeRRule(str) {
    if (!str) return ''

    const parts = parseRRule(str)

    const freqLabels = {
        DAILY: 'day',
        WEEKLY: 'week',
        MONTHLY: 'month',
        YEARLY: 'year',
    }

    const freqLabel = freqLabels[parts.freq] || parts.freq.toLowerCase()
    let desc = parts.interval > 1
        ? `Every ${parts.interval} ${freqLabel}s`
        : `Every ${freqLabel}`

    if (parts.freq === 'WEEKLY' && parts.byday?.length) {
        const dayLabels = Object.fromEntries(WEEKDAYS.map(d => [d.value, d.label]))
        const days = parts.byday.map(d => dayLabels[d] || d).join(', ')
        desc += ` on ${days}`
    }

    if (parts.freq === 'MONTHLY' && parts.bymonthday) {
        desc += ` on day ${parts.bymonthday}`
    }

    if (parts.freq === 'YEARLY') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if (parts.bymonth && parts.bymonthday) {
            desc += ` on ${monthNames[parts.bymonth - 1]} ${parts.bymonthday}`
        } else if (parts.bymonth) {
            desc += ` in ${monthNames[parts.bymonth - 1]}`
        } else if (parts.bymonthday) {
            desc += ` on day ${parts.bymonthday}`
        }
    }

    if (parts.count) {
        desc += `, ${parts.count} times`
    } else if (parts.until) {
        // Format UNTIL date (YYYYMMDD or YYYY-MM-DD)
        const u = parts.until.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
        const d = new Date(u + 'T00:00:00')
        if (!isNaN(d)) {
            desc += `, until ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        }
    }

    return desc
}
