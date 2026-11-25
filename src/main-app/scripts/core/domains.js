const rc = (typeof window !== 'undefined' && window.RUNTIME_CONFIG) || {}

export const PAGE_SIZE = rc.PAGE_SIZE || 10

export function getDomains() {
    if (!rc.GOOGLE_CLIENT_ID) {
        console.warn('[WNA] GOOGLE_CLIENT_ID is not set in RUNTIME_CONFIG — Google SSO will not work')
    }

    const app_store_url = /^[0-9]+$/.test(rc.APP_STORE_ID || '') ? `https://apps.apple.com/app/id${rc.APP_STORE_ID}` : null

    return {
        base_url: rc.API_DOMAIN || '',
        google_client_id: rc.GOOGLE_CLIENT_ID || '',
        apple_client_id: rc.APPLE_CLIENT_ID || '',
        mcp_url: rc.MCP_URL || '',
        // false in the pre-render (no config.js) and wherever MCP_URL is unset: the connect address stays hidden
        mcp_url_configured: Boolean(rc.MCP_URL),
        // null in the pre-render (no config.js), so App Store elements only appear once the app is live
        app_store_url,
        // set only with the App Store link too: Android elements appear only once both apps are live
        google_play_url: app_store_url && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(rc.GOOGLE_PLAY_PACKAGE || '')
            ? `https://play.google.com/store/apps/details?id=${rc.GOOGLE_PLAY_PACKAGE}`
            : null,
    }
}
