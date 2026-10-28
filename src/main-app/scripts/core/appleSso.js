import {getDomains} from './domains.js'
import {randomBase64Url} from './googleSso.js'

const STATE_KEY = 'apple_sso_state'
const NONCE_KEY = 'apple_sso_nonce'

export function isAppleSsoEnabled() {
    return !!getDomains().apple_client_id
}

export function getAppleAuthUrl() {
    const {apple_client_id, base_url} = getDomains()
    if (!apple_client_id) return null

    // Apple posts the result to the API (form_post), which hands it to /apple/sso in the URL fragment
    const redirectUri = `${base_url || window.location.origin}/v1/user/apple/callback`
    const state = randomBase64Url(32)
    const nonce = randomBase64Url(32)

    sessionStorage.setItem(STATE_KEY, state)
    sessionStorage.setItem(NONCE_KEY, nonce)

    const params = new URLSearchParams({
        client_id: apple_client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        response_mode: 'form_post',
        scope: 'name email',
        state,
        nonce,
    })

    return `https://appleid.apple.com/auth/authorize?${params.toString().replace(/\+/g, '%20')}`
}

export function redirectToApple() {
    const url = getAppleAuthUrl()
    if (url) {
        window.location.href = url
    }
}

// Returns the nonce only when `state` matches the one this browser stored; clears both either way.
export function takeAppleSsoNonce(state) {
    const storedState = sessionStorage.getItem(STATE_KEY)
    const nonce = sessionStorage.getItem(NONCE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(NONCE_KEY)
    if (!state || !storedState || !nonce || state !== storedState) return null
    return nonce
}
