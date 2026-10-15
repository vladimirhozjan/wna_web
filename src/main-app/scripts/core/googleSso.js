import {getDomains} from './domains.js'

const STATE_KEY = 'google_sso_state'
const VERIFIER_KEY = 'google_sso_verifier'

export function isGoogleSsoEnabled() {
    return !!getDomains().google_client_id
}

function randomBase64Url(byteCount) {
    return base64Url(crypto.getRandomValues(new Uint8Array(byteCount)))
}

function base64Url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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
        state,
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
    if (!state || !storedState || !verifier || state !== storedState) return null
    return verifier
}
