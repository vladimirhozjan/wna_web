const rc = (typeof window !== 'undefined' && window.RUNTIME_CONFIG) || {}

export const PAGE_SIZE = rc.PAGE_SIZE || 10

export function getDomains() {
    if (!rc.GOOGLE_CLIENT_ID) {
        console.warn('[WNA] GOOGLE_CLIENT_ID is not set in RUNTIME_CONFIG — Google SSO will not work')
    }

    return {
        base_url: rc.API_DOMAIN || '',
        google_client_id: rc.GOOGLE_CLIENT_ID || '',
        apple_client_id: rc.APPLE_CLIENT_ID || '',
        mcp_url: rc.MCP_URL || 'http://localhost:8000/mcp',
        // false in the pre-render (no config.js), so the localhost fallback never reaches public HTML
        mcp_url_configured: Boolean(rc.MCP_URL),
        // null in the pre-render (no config.js), so App Store elements only appear once the app is live
        app_store_url: /^[0-9]+$/.test(rc.APP_STORE_ID || '') ? `https://apps.apple.com/app/id${rc.APP_STORE_ID}` : null,
    }
}
