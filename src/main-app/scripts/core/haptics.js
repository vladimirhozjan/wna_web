export function hapticFeedback(type = 'light') {
    if (!navigator.vibrate) return
    const patterns = { light: [5], medium: [10], success: [8, 50, 8] }
    navigator.vibrate(patterns[type] || patterns.light)
}
