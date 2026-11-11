// A person = { user_id, email, name, picture_url } from the own user, GET /v1/connections or a project's members.
// Without a name every form is the email, as before profiles existed.

export function personOf(userId, { me = null, connections = [], members = [] } = {}) {
    if (!userId) return null
    if (me?.id === userId) return { user_id: userId, email: me.email || '', name: me.name || null, picture_url: me.picture_url || null }
    const c = (connections || []).find(x => x.user_id === userId)
    if (c?.email) return c
    const m = (members || []).find(x => x.user_id === userId)
    if (m?.email) return m
    return null
}

export function initialsOf(name, email) {
    const words = (name || '').trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase()
    if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('').toUpperCase()
    if (!email) return '?'
    return email.slice(0, 2).toUpperCase()
}

// Lists and detail sections: name over email
export function twoLine(person) {
    if (!person) return { primary: '', secondary: '' }
    return person.name ? { primary: person.name, secondary: person.email || '' } : { primary: person.email || '', secondary: '' }
}

// Chips and meta lines
export function oneLine(person) {
    if (!person) return ''
    return person.name ? `${person.name} · ${person.email}` : person.email || ''
}

// Confirms, toasts, error lines
export function sentence(person) {
    if (!person) return ''
    return person.name ? `${person.name} (${person.email})` : person.email || ''
}

function fold(text) {
    return (text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function matchesPerson(query, person) {
    const q = fold(query).trim()
    if (!q) return true
    return fold(person?.name).includes(q) || fold(person?.email).includes(q)
}
