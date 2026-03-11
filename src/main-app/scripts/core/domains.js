const devFallback = {
    API_DOMAIN: '', // Empty for Vite proxy in development
    GOOGLE_CLIENT_ID: '783327214800-cn835rehm6gn7i2v9ep4j3b1vuidjec1.apps.googleusercontent.com'
};

export function getDomains() {
    if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
        return {
            base_url: window.RUNTIME_CONFIG.API_DOMAIN,
            google_client_id: window.RUNTIME_CONFIG.GOOGLE_CLIENT_ID || devFallback.GOOGLE_CLIENT_ID
        }
    }
    return {
        base_url: devFallback.API_DOMAIN,
        google_client_id: devFallback.GOOGLE_CLIENT_ID
    }
}
