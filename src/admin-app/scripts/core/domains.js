const devFallback = {
    ADMIN_API_DOMAIN: '' // Empty for Vite proxy in development
}

export function getDomains() {
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
        return {
            base_url: window.RUNTIME_CONFIG.ADMIN_API_DOMAIN || devFallback.ADMIN_API_DOMAIN
        }
    }
    return {
        base_url: devFallback.ADMIN_API_DOMAIN
    }
}
