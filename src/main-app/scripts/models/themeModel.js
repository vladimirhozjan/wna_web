import { ref, watch } from 'vue'

const ACCENTS = ['sky', 'blue', 'teal', 'ocean']
const LS_ACCENT = 'wna_accent_color'
const LS_THEME = 'wna_theme'

let instance = null

export function themeModel() {
    if (instance) return instance

    const accent = ref(loadAccent())
    const isDark = ref(loadTheme())

    function loadAccent() {
        const stored = localStorage.getItem(LS_ACCENT)
        return ACCENTS.includes(stored) ? stored : 'sky'
    }

    function loadTheme() {
        const stored = localStorage.getItem(LS_THEME)
        if (stored === 'dark') return true
        if (stored === 'light') return false
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    function apply() {
        document.documentElement.setAttribute('data-accent', accent.value)
        document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    }

    function setAccent(color) {
        if (!ACCENTS.includes(color)) return
        accent.value = color
        localStorage.setItem(LS_ACCENT, color)
        apply()
    }

    function toggleTheme() {
        isDark.value = !isDark.value
        localStorage.setItem(LS_THEME, isDark.value ? 'dark' : 'light')
        apply()
    }

    // Apply immediately on creation
    apply()

    instance = {
        accent,
        isDark,
        accents: ACCENTS,
        setAccent,
        toggleTheme,
    }

    return instance
}
