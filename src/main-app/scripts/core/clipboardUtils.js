// Legacy textarea + execCommand fallback because the Clipboard API only works in secure contexts.
export async function copyText(text) {
    if (text == null) return false
    const value = String(text)

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value)
            return true
        } catch {
            // fall through to the legacy path
        }
    }

    try {
        const el = document.createElement('textarea')
        el.value = value
        el.setAttribute('readonly', '')
        el.style.position = 'absolute'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(el)
        return ok
    } catch {
        return false
    }
}
