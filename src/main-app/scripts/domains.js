const devFallback = {
    API_DOMAIN: 'http://localhost:8000'
};

export function getDomains() {
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
        return {
            base_url: window.RUNTIME_CONFIG.API_DOMAIN
        }
    }
    return {
        base_url: devFallback.API_DOMAIN
    }
}
