import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { authModel } from '@admin/scripts/core/authModel.js'
import { gatewayLabel } from '@admin/scripts/core/apiClient.js'
import UserPaymentsPage from '@admin/views/UserPaymentsPage.vue'
import UserDetailPage from '@admin/views/UserDetailPage.vue'

const routes = vi.hoisted(() => ({}))

vi.mock('@admin/scripts/core/httpApi.js', async () => (await import('../mockHttp.js')).mockHttpModule(routes))

const USER = '/admin/platform-users/u1'

beforeAll(() => {
    authModel().currentAdmin.value = { id: 'a1', role: 'super_admin', status: 'active' }
})

async function mountAt(component, path) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/users/:id', component }, { path: '/users/:id/payments', component }, { path: '/:rest(.*)', component: { render: () => null } }],
    })
    router.push(path)
    await router.isReady()
    const wrapper = mount(component, { global: { plugins: [router], stubs: { teleport: true } } })
    await flushPromises()
    return wrapper
}

const payment = (over) => ({ id: over.id, kind: 'initial', status: 'paid', amount_minor: 1100, currency: 'EUR', created_at: '2026-11-09T10:00:00Z', invoice: null, ...over })

describe('admin — App Store (W3)', () => {
    it('labels app_store as App Store', () => {
        expect(gatewayLabel('app_store')).toBe('App Store')
    })

    it('user payments: no Refund on an App Store row, a Sandbox badge on a Sandbox row', async () => {
        routes[`${USER}/payments`] = {
            total_count: 3,
            items: [
                payment({ id: 'web', provider: 'stripe' }),
                payment({ id: 'apple', provider: 'app_store', store_environment: 'Production' }),
                payment({ id: 'sandbox', provider: 'app_store', store_environment: 'Sandbox' }),
            ],
        }
        const wrapper = await mountAt(UserPaymentsPage, '/users/u1/payments')
        const rows = wrapper.findAll('tbody tr')
        expect(rows).toHaveLength(3)
        expect(rows[0].text()).toContain('Refund')
        expect(rows[1].text()).not.toContain('Refund')
        expect(rows[1].text()).toContain('App Store')
        expect(rows[1].text()).not.toContain('Sandbox')
        expect(rows[2].text()).not.toContain('Refund')
        expect(rows[2].get('.store-env').text()).toBe('Sandbox')
    })

    it('user detail: no Cancel on App Store, Cancel on Stripe stays', async () => {
        routes[USER] = { id: 'u1', email: 'a@b.c', subscription_tier: 'pro', subscription: { status: 'active', billing_period: 'monthly' } }

        routes[`${USER}/gateway-subscription`] = { present: true, provider: 'app_store', status: 'active', next_charge_on: '2026-12-09' }
        let wrapper = await mountAt(UserDetailPage, '/users/u1')
        expect(wrapper.text()).not.toContain('Cancel on App Store')
        expect(wrapper.text()).toContain('the user cancels in their Apple account')
        wrapper.unmount()

        routes[`${USER}/gateway-subscription`] = { present: true, provider: 'stripe', status: 'active', next_charge_on: '2026-12-09' }
        wrapper = await mountAt(UserDetailPage, '/users/u1')
        expect(wrapper.text()).toContain('Cancel on Stripe')
        wrapper.unmount()
    })
})
