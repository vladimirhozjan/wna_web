export function truncateTitle(title, maxLen = 30) {
    if (!title || title.length <= maxLen) return title
    return title.slice(0, maxLen).trim() + '…'
}

export const OUTCOME_HELPER = 'Why does this project matter? What does done look like?'
