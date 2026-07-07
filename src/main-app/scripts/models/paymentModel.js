import { reactive } from 'vue'
import { subscribePayment, getPaymentStatus, cancelSubscription, getPublicPlans } from '../core/apiClient.js'

// Defaults mirror contracts/subscription-tiers.md (EUR, VAT-inclusive);
// loadPlanCatalog overlays the live billing_plan catalog so displayed price = charged price
export const PLAN_OPTIONS = reactive([
    {plan: 'pro', billingPeriod: 'monthly', label: 'Pro', periodLabel: 'monthly', price: '€11/month', amount: 11},
    {plan: 'pro', billingPeriod: 'yearly', label: 'Pro', periodLabel: 'yearly', price: '€96/year', amount: 96, perMonth: 10.67},
    {plan: 'team', billingPeriod: 'monthly', label: 'Team', periodLabel: 'monthly', price: '€18/month', amount: 18, perUser: true},
    {plan: 'team', billingPeriod: 'yearly', label: 'Team', periodLabel: 'yearly', price: '€156/year', amount: 156, perMonth: 17.33, perUser: true},
])

const euro = (v) => Number.isInteger(v) ? String(v) : v.toFixed(2)

// Yearly = 9 paid months ("3 months free"), so the shown per-month rate is amount / 9
const yearlyPerMonth = (amount) => Math.round(amount / 9 * 100) / 100

let catalogLoaded = false

export async function loadPlanCatalog() {
    if (catalogLoaded) return
    try {
        const data = await getPublicPlans()
        for (const p of data.plans || []) {
            const opt = PLAN_OPTIONS.find(o => o.plan === p.plan && o.billingPeriod === p.billing_period)
            if (!opt || !(p.price_minor > 0)) continue
            opt.amount = p.price_minor / 100
            opt.price = `€${euro(opt.amount)}/${opt.billingPeriod === 'yearly' ? 'year' : 'month'}`
            if (opt.billingPeriod === 'yearly') opt.perMonth = yearlyPerMonth(opt.amount)
        }
        catalogLoaded = true
    } catch { /* keep the contract defaults */ }
}

let instance = null

export function paymentModel() {
    if (instance) return instance

    const state = reactive({
        loading: false,
        loaded: false,
        acting: false,
        tier: 'free',
        billingPeriod: '',
        status: 'none',
        expiresAt: '',
        cancelAtPeriodEnd: false,
    })

    function applyStatus(data) {
        state.tier = data.tier || 'free'
        state.billingPeriod = data.billing_period || ''
        state.status = data.status || 'none'
        state.expiresAt = data.expires_at || ''
        state.cancelAtPeriodEnd = data.cancel_at_period_end === true
    }

    const hasSubscription = () => state.tier !== 'free' && state.status !== 'none' && state.status !== 'expired'

    async function loadStatus() {
        state.loading = true
        try {
            applyStatus(await getPaymentStatus())
            state.loaded = true
        } finally {
            state.loading = false
        }
    }

    async function subscribe({plan, billingPeriod, billingCountry, billingState, billingName, billingAddress1, billingAddress2, billingZip, billingCity}) {
        state.acting = true
        try {
            return await subscribePayment({plan, billingPeriod, billingCountry, billingState, billingName, billingAddress1, billingAddress2, billingZip, billingCity})
        } finally {
            state.acting = false
        }
    }

    async function cancel() {
        state.acting = true
        try {
            const data = await cancelSubscription()
            await loadStatus()
            return data
        } finally {
            state.acting = false
        }
    }

    instance = { state, hasSubscription, loadStatus, subscribe, cancel }
    return instance
}
