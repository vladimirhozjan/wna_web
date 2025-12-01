const devFallback = {
    API_DOMAIN: 'http://localhost:8000'
};

export function getDomains() {
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
        return {
            api: window.RUNTIME_CONFIG.API_DOMAIN
        }
    }
    return {
        api: devFallback.API_DOMAIN
    }
}