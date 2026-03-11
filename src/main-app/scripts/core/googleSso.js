import {getDomains} from './domains.js'

export function isGoogleSsoEnabled() {
    return !!getDomains().google_client_id
}

export function getGoogleAuthUrl() {
    const {google_client_id} = getDomains()
    if (!google_client_id) return null

    const redirectUri = `${window.location.origin}/google/sso`

    const params = new URLSearchParams({
        client_id: google_client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function redirectToGoogle() {
    const url = getGoogleAuthUrl()
    if (url) {
        window.location.href = url
    }
}
