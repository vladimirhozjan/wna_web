import { vi } from 'vitest'

// Module stand-in for either app's scripts/core/httpApi.js: every request answers 200 with `routes[url]` (or {}),
// so the real apiClient and models run against canned responses — vi.mock(path, () => mockHttpModule(routes))
export function mockHttpModule(routes) {
    const respond = vi.fn(async (url) => ({ data: routes[url] ?? {} }))
    return {
        httpApi: { get: respond, post: respond, put: respond, patch: respond, delete: respond },
        logout: vi.fn(),
        refreshSession: vi.fn(async () => {}),
        sessionRejected: vi.fn(() => false),
    }
}
