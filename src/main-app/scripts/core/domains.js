export function getDomains() {
    const rc = (typeof window !== 'undefined' && window.RUNTIME_CONFIG) || {}

    if (!rc.GOOGLE_CLIENT_ID) {
        console.warn('[WNA] GOOGLE_CLIENT_ID is not set in RUNTIME_CONFIG — Google SSO will not work')
    }

    return {
        base_url: rc.API_DOMAIN || '',
        google_client_id: rc.GOOGLE_CLIENT_ID || '',
    }
}
