const rc = (typeof window !== 'undefined' && window.RUNTIME_CONFIG) || {}

export const PAGE_SIZE = rc.PAGE_SIZE || 10

export function getDomains() {
    if (!rc.GOOGLE_CLIENT_ID) {
        console.warn('[WNA] GOOGLE_CLIENT_ID is not set in RUNTIME_CONFIG — Google SSO will not work')
    }

    return {
        base_url: rc.API_DOMAIN || '',
        google_client_id: rc.GOOGLE_CLIENT_ID || '',
    }
}
