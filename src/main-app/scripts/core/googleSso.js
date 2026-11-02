import {getDomains} from './domains.js'
import {signupUtm, utmToList, utmFromList} from './visitTracker.js'

const STATE_KEY = 'google_sso_state'
const VERIFIER_KEY = 'google_sso_verifier'
// Apple's callback caps `state` at 1024 characters
const MAX_STATE_LENGTH = 1000

export function isGoogleSsoEnabled() {
    return !!getDomains().google_client_id
}

export function randomBase64Url(byteCount) {
    return base64Url(crypto.getRandomValues(new Uint8Array(byteCount)))
}

function base64Url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// The tab's UTM rides after the first '.' so it survives the redirect; only the random part is stored and compared
export function ssoState(random) {
    const utm = signupUtm()
    if (!utm) return random
    const state = `${random}.${base64Url(new TextEncoder().encode(JSON.stringify(utmToList(utm))))}`
    return state.length > MAX_STATE_LENGTH ? random : state
}

export function splitSsoState(state) {
    const dot = state.indexOf('.')
    if (dot < 0) return {random: state, utm: null}
    try {
        const bytes = Uint8Array.from(atob(state.slice(dot + 1).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
        return {random: state.slice(0, dot), utm: utmFromList(JSON.parse(new TextDecoder().decode(bytes)))}
    } catch {
        return {random: state.slice(0, dot), utm: null}
    }
}

async function codeChallenge(verifier) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    return base64Url(new Uint8Array(digest))
}

export async function getGoogleAuthUrl() {
    const {google_client_id} = getDomains()
    if (!google_client_id) return null

    const redirectUri = `${window.location.origin}/google/sso`
    const state = randomBase64Url(32)
    const verifier = randomBase64Url(32)

    sessionStorage.setItem(STATE_KEY, state)
    sessionStorage.setItem(VERIFIER_KEY, verifier)

    const params = new URLSearchParams({
        client_id: google_client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: ssoState(state),
        code_challenge: await codeChallenge(verifier),
        code_challenge_method: 'S256',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function redirectToGoogle() {
    const url = await getGoogleAuthUrl()
    if (url) {
        window.location.href = url
    }
}

// Returns the PKCE verifier only when `state` matches the one this browser stored; clears both either way.
export function takeGoogleSsoVerifier(state) {
    const storedState = sessionStorage.getItem(STATE_KEY)
    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    sessionStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(VERIFIER_KEY)
    if (!state || !storedState || !verifier || splitSsoState(state).random !== storedState) return null
    return verifier
}
