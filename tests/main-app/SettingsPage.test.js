import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const routes = vi.hoisted(() => ({ '/v1/flags/public': { flags: ['payments'] }, '/v1/payments/status': {} }))

vi.mock('@main/scripts/core/httpApi.js', async () => (await import('../mockHttp.js')).mockHttpModule(routes))

const PAID = { tier: 'pro', status: 'active', billing_period: 'monthly', expires_at: '2026-12-09T00:00:00Z', cancel_at_period_end: false }

let SettingsPage
let paymentModel

beforeAll(async () => {
    localStorage.setItem('auth_token', 'test')
    localStorage.setItem('current_user', JSON.stringify({ id: 'u1', email: 'a@b.c', subscription_tier: 'pro' }))
    SettingsPage = (await import('@main/views/dashboard/SettingsPage.vue')).default
    paymentModel = (await import('@main/scripts/models/paymentModel.js')).paymentModel
})

beforeEach(() => {
    paymentModel().state.loaded = false
})

async function mountPlan(status) {
    routes['/v1/payments/status'] = status
    const router = createRouter({
        history: createMemoryHistory(),
        routes: ['settings', 'upgrade', 'billing-history', 'buy-credits'].map(name => ({ path: `/${name}`, name, component: { render: () => null } })),
    })
    router.push({ name: 'settings', query: { section: 'plan' } })
    await router.isReady()
    const wrapper = mount(SettingsPage, { global: { plugins: [router], stubs: { teleport: true } }, attachTo: document.body })
    await flushPromises()
    return wrapper
}

async function openDeleteModal(wrapper) {
    await wrapper.vm.$router.push({ name: 'settings', query: { section: 'account' } })
    await flushPromises()
    await wrapper.get('[data-testid="settings-delete-account"]').trigger('click')
    await flushPromises()
    return document.querySelector('[data-testid="delete-account-modal"]')
}

describe('SettingsPage — App Store subscription (S7)', () => {
    it('keeps provider from the payment status', async () => {
        await mountPlan({ ...PAID, provider: 'app_store' })
        expect(paymentModel().state.provider).toBe('app_store')
    })

    it('Plan replaces Cancel with the App Store line', async () => {
        const wrapper = await mountPlan({ ...PAID, provider: 'app_store' })
        expect(wrapper.get('[data-testid="plan-app-store"]').text())
            .toBe('Billed through the App Store. Change or cancel it on your iPhone in Settings → your name → Subscriptions.')
        expect(wrapper.text()).not.toContain('Cancel subscription')
        wrapper.unmount()
    })

    it('Plan keeps Cancel for a web subscription', async () => {
        const wrapper = await mountPlan({ ...PAID, provider: 'stripe' })
        expect(wrapper.find('[data-testid="plan-app-store"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('Cancel subscription')
        wrapper.unmount()
    })

    it('delete modal warns a renewing App Store subscriber', async () => {
        const wrapper = await mountPlan({ ...PAID, provider: 'app_store' })
        const modal = await openDeleteModal(wrapper)
        expect(modal.querySelector('[data-testid="delete-account-app-store"]').textContent)
            .toBe("Deleting your account doesn't cancel your App Store subscription. Cancel it on your iPhone first, or Apple keeps charging you.")
        expect(modal.textContent).not.toContain('Your paid subscription is cancelled too.')
        wrapper.unmount()
    })

    it('delete modal has no App Store line once auto-renew is off', async () => {
        const wrapper = await mountPlan({ ...PAID, provider: 'app_store', cancel_at_period_end: true })
        const modal = await openDeleteModal(wrapper)
        expect(modal.querySelector('[data-testid="delete-account-app-store"]')).toBeNull()
        expect(modal.textContent).not.toContain('Your paid subscription is cancelled too.')
        wrapper.unmount()
    })

    it('delete modal keeps the web line for a web subscription', async () => {
        const wrapper = await mountPlan({ ...PAID, provider: 'paywiser' })
        const modal = await openDeleteModal(wrapper)
        expect(modal.querySelector('[data-testid="delete-account-app-store"]')).toBeNull()
        expect(modal.textContent).toContain('Your paid subscription is cancelled too.')
        wrapper.unmount()
    })
})
