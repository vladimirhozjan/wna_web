import {START_LOCATION} from 'vue-router'
import {recordVisit} from './apiClient.js'

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term']

// Read once from the URL the tab was opened with; kept in memory only — nothing is stored on the device
const utm = readUtm()
const referrer = readReferrer()

function readUtm() {
    const params = new URLSearchParams(window.location.search)
    return utmFromList(UTM_KEYS.map(key => params.get(`utm_${key}`) || null))
}

function readReferrer() {
    try {
        const url = new URL(document.referrer)
        return url.host === window.location.host ? null : url.hostname || null
    } catch {
        return null
    }
}

export function signupUtm() {
    return utm
}

export function utmToList(value) {
    return UTM_KEYS.map(key => value[key])
}

export function utmFromList(list) {
    if (!Array.isArray(list) || list.length !== UTM_KEYS.length) return null
    if (!list.every(v => v === null || typeof v === 'string') || !list.some(Boolean)) return null
    return Object.fromEntries(UTM_KEYS.map((key, i) => [key, list[i] || null]))
}

export function trackVisit(to, from) {
    if (!to.meta.countVisit) return
    if (from !== START_LOCATION && to.path === from.path) return
    recordVisit({path: to.path, ...(referrer && {referrer}), ...(utm && {utm})})
}
