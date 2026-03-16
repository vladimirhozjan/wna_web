import { ref, computed } from 'vue'

const ACCENTS = ['sky', 'blue', 'teal', 'ocean']
const MODES = ['system', 'light', 'dark']
const LS_ACCENT = 'wna_accent_color'
const LS_THEME = 'wna_theme'

let instance = null

export function themeModel() {
    if (instance) return instance

    const accent = ref(loadAccent())
    const mode = ref(loadMode())

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const systemDark = ref(mql.matches)

    const isDark = computed(() => {
        if (mode.value === 'system') return systemDark.value
        return mode.value === 'dark'
    })

    function loadAccent() {
        const stored = localStorage.getItem(LS_ACCENT)
        return ACCENTS.includes(stored) ? stored : 'sky'
    }

    function loadMode() {
        const stored = localStorage.getItem(LS_THEME)
        if (MODES.includes(stored)) return stored
        return 'system'
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

    function setMode(m) {
        if (!MODES.includes(m)) return
        mode.value = m
        localStorage.setItem(LS_THEME, m)
        apply()
    }

    function toggleTheme() {
        setMode(isDark.value ? 'light' : 'dark')
    }

    // Re-apply when OS preference changes (relevant in system mode)
    mql.addEventListener('change', (e) => {
        systemDark.value = e.matches
        apply()
    })

    // Apply immediately on creation
    apply()

    instance = {
        accent,
        mode,
        isDark,
        accents: ACCENTS,
        setAccent,
        setMode,
        toggleTheme,
    }

    return instance
}
