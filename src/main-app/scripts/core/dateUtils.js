import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    isSameDay,
    isSameMonth,
    isToday,
    parseISO,
    getHours,
    getMinutes,
    setHours,
    setMinutes,
    differenceInMinutes,
    differenceInDays,
    startOfDay,
} from 'date-fns'

export {
    format,
    parseISO,
    isSameDay,
    isSameMonth,
    isToday,
    getHours,
    getMinutes,
    setHours,
    setMinutes,
    differenceInMinutes,
    startOfDay,
    startOfWeek,
    startOfMonth,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
}

export function getWeekDays(date, weekStartsOn = 0) {
    const start = startOfWeek(date, { weekStartsOn })
    const end = endOfWeek(date, { weekStartsOn })
    return eachDayOfInterval({ start, end })
}

export function getMonthDays(date, weekStartsOn = 0) {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const start = startOfWeek(monthStart, { weekStartsOn })
    const end = endOfWeek(monthEnd, { weekStartsOn })
    return eachDayOfInterval({ start, end })
}

export function getCalendarWeeks(date, weekStartsOn = 0) {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const start = startOfWeek(monthStart, { weekStartsOn })
    const end = endOfWeek(monthEnd, { weekStartsOn })
    return eachWeekOfInterval({ start, end }, { weekStartsOn })
}

export function getYearMonths(date) {
    const yearStart = startOfYear(date)
    const yearEnd = endOfYear(date)
    return eachMonthOfInterval({ start: yearStart, end: yearEnd })
}

export function formatDate(date, formatStr = 'yyyy-MM-dd') {
    return format(date, formatStr)
}

export function formatTime(date) {
    return format(date, 'HH:mm')
}

export function formatMonthYear(date) {
    return format(date, 'MMMM yyyy')
}

export function formatDayHeader(date) {
    return format(date, 'EEE d')
}

export function formatWeekdayShort(date) {
    return format(date, 'EEE')
}

export function formatDayNumber(date) {
    return format(date, 'd')
}

export function formatMonthShort(date) {
    return format(date, 'MMM')
}

export function formatYear(date) {
    return format(date, 'yyyy')
}

export function getDateRange(date, viewMode, weekStartsOn = 0) {
    switch (viewMode) {
        case 'day':
            return { start: startOfDay(date), end: addDays(startOfDay(date), 1) }
        case 'week':
            return { start: startOfWeek(date, { weekStartsOn }), end: endOfWeek(date, { weekStartsOn }) }
        case 'month': {
            const monthStart = startOfMonth(date)
            const monthEnd = endOfMonth(date)
            return {
                start: startOfWeek(monthStart, { weekStartsOn }),
                end: endOfWeek(monthEnd, { weekStartsOn })
            }
        }
        case 'year':
            return { start: startOfYear(date), end: endOfYear(date) }
        default:
            return { start: date, end: date }
    }
}

export function navigateDate(date, viewMode, direction) {
    const amount = direction === 'next' ? 1 : -1
    switch (viewMode) {
        case 'day':
            return direction === 'next' ? addDays(date, 1) : subDays(date, 1)
        case 'week':
            return direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1)
        case 'month':
            return direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
        case 'year':
            return direction === 'next' ? addYears(date, 1) : subYears(date, 1)
        default:
            return date
    }
}

export function parseTimeString(timeStr) {
    if (!timeStr) return { hours: 0, minutes: 0 }
    const [hours, minutes] = timeStr.split(':').map(Number)
    return { hours: hours || 0, minutes: minutes || 0 }
}

export function timeStringToMinutes(timeStr) {
    const { hours, minutes } = parseTimeString(timeStr)
    return hours * 60 + minutes
}

export function minutesToTimeString(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getTimeSlotPosition(timeStr, hourHeight = 60) {
    const minutes = timeStringToMinutes(timeStr)
    return (minutes / 60) * hourHeight
}

export function getTimeSlotHeight(startTime, endTime, hourHeight = 60) {
    const startMinutes = timeStringToMinutes(startTime)
    const endMinutes = timeStringToMinutes(endTime)
    const duration = endMinutes - startMinutes
    return Math.max((duration / 60) * hourHeight, hourHeight / 2)
}

export function isOverdue(dateStr) {
    if (!dateStr) return false
    const endOfDueDay = new Date(dateStr + 'T23:59:59')
    return new Date() > endOfDueDay
}

export function formatShortDate(dateStr) {
    if (!dateStr) return ''
    return format(parseISO(dateStr), 'MMM d')
}

export function formatWaitingDuration(waitingSince) {
    if (!waitingSince) return ''
    const since = parseISO(waitingSince)
    const now = new Date()
    const days = differenceInDays(now, since)

    if (days === 0) return 'today'
    if (days === 1) return '1d'
    if (days < 7) return `${days}d`
    if (days < 14) return '1w'
    if (days < 30) return `${Math.floor(days / 7)}w`
    if (days < 60) return '1mo'
    return `${Math.floor(days / 30)}mo`
}
