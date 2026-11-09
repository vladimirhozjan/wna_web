import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BillingHistoryPage from '@main/views/dashboard/BillingHistoryPage.vue'

const routes = vi.hoisted(() => ({ '/v1/payments/history': { payments: [] } }))

vi.mock('@main/scripts/core/httpApi.js', async () => (await import('../mockHttp.js')).mockHttpModule(routes))

const row = (over) => ({ id: over.id, provider: 'stripe', kind: 'initial', status: 'paid', created_at: '2026-11-09T10:00:00Z', invoice: null, ...over })

async function mountWith(payments) {
    routes['/v1/payments/history'] = { payments }
    const wrapper = mount(BillingHistoryPage, { global: { stubs: { teleport: true } } })
    await flushPromises()
    return wrapper.findAll('.billing-row')
}

describe('BillingHistoryPage — amounts in the row currency (F9)', () => {
    it('formats EUR, USD and JPY by their minor units', async () => {
        const rows = await mountWith([
            row({ id: 'eur', amount_minor: 11299, currency: 'EUR' }),
            row({ id: 'usd', amount_minor: 499, currency: 'USD' }),
            row({ id: 'jpy', amount_minor: 1200, currency: 'JPY' }),
        ])
        expect(rows.map(r => r.get('.billing-row-amount').text())).toEqual(['€112.99', '$4.99', '¥1,200'])
    })

    it('prefixes a refund with a minus', async () => {
        const [r] = await mountWith([row({ id: 'r', kind: 'refund', amount_minor: 1100, currency: 'EUR' })])
        expect(r.get('.billing-row-amount').text()).toBe('−€11.00')
    })

    it('formats a credit note in its payment currency', async () => {
        const invoice = { id: 'i1', invoice_number: '2026-1', credit_notes: [{ id: 'c1', credit_note_number: 'CN-1', amount_minor: 500, issued_at: '2026-11-09T10:00:00Z' }] }
        const rows = await mountWith([row({ id: 'p', amount_minor: 1100, currency: 'EUR', invoice })])
        expect(rows[1].get('.billing-row-amount').text()).toBe('−€5.00')
    })
})

describe('BillingHistoryPage — App Store row (S7)', () => {
    it('shows "{date} · App Store", is not clickable and has no Download', async () => {
        const [r] = await mountWith([row({ id: 'a', provider: 'app_store', amount_minor: 11299, currency: 'EUR' })])
        expect(r.get('.billing-row-meta').text()).toBe('Nov 9, 2026 · App Store')
        expect(r.classes()).not.toContain('billing-row--clickable')
        expect(r.find('button').exists()).toBe(false)
    })

    it('a web row with an invoice keeps its invoice number and Download', async () => {
        const invoice = { id: 'i1', invoice_number: '2026-1', credit_notes: [] }
        const [r] = await mountWith([row({ id: 'w', amount_minor: 1100, currency: 'EUR', invoice })])
        expect(r.get('.billing-row-meta').text()).toBe('Nov 9, 2026 · Invoice 2026-1')
        expect(r.classes()).toContain('billing-row--clickable')
        expect(r.get('button').text()).toBe('Download')
    })
})
