import {START_LOCATION} from 'vue-router'
import {recordVisit} from './apiClient.js'

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term']

// Read once from the URL the tab was opened with; kept in memory only — nothing is stored on the device
const params = new URLSearchParams(window.location.search)
const utm = readUtm()
const ref = readTag('ref')
const referrer = readReferrer()

function readTag(name) {
    return params.get(name)?.trim() || null
}

function readUtm() {
    const list = UTM_KEYS.map(key => params.get(`utm_${key}`) || null)
    list[0] ??= readTag('src')
    return utmFromList(list)
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

export function signupRef() {
    return ref
}

// The tab's source as [source, medium, campaign, content, term, ref], or null when it has none
export function sourceToList() {
    if (!utm && !ref) return null
    return [...UTM_KEYS.map(key => utm?.[key] ?? null), ref]
}

// Also accepts the five-part list of a tab opened before `ref` was carried
export function sourceFromList(list) {
    const valid = Array.isArray(list) && (list.length === UTM_KEYS.length || list.length === UTM_KEYS.length + 1)
        && list.every(v => v === null || typeof v === 'string')
    if (!valid) return {utm: null, ref: null}
    return {utm: utmFromList(list.slice(0, UTM_KEYS.length)), ref: list[UTM_KEYS.length] || null}
}

function utmFromList(list) {
    if (!list.some(Boolean)) return null
    return Object.fromEntries(UTM_KEYS.map((key, i) => [key, list[i] || null]))
}

export function trackVisit(to, from) {
    if (!to.meta.countVisit) return
    if (from !== START_LOCATION && to.path === from.path) return
    recordVisit({path: to.path, ...(referrer && {referrer}), ...(utm && {utm}), ...(ref && {ref})})
}
