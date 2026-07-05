import { reactive } from 'vue'
import { subscribePayment, getPaymentStatus, cancelSubscription, changeSubscriptionPlan } from '../core/apiClient.js'

// Prices mirror contracts/subscription-tiers.md (EUR, VAT-inclusive)
export const PLAN_OPTIONS = [
    {plan: 'pro', billingPeriod: 'monthly', label: 'Pro', periodLabel: 'monthly', price: '€11/month'},
    {plan: 'pro', billingPeriod: 'yearly', label: 'Pro', periodLabel: 'yearly', price: '€96/year'},
    {plan: 'team', billingPeriod: 'monthly', label: 'Team', periodLabel: 'monthly', price: '€18/month'},
    {plan: 'team', billingPeriod: 'yearly', label: 'Team', periodLabel: 'yearly', price: '€156/year'},
]

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
        queuedPlan: null,
    })

    function applyStatus(data) {
        state.tier = data.tier || 'free'
        state.billingPeriod = data.billing_period || ''
        state.status = data.status || 'none'
        state.expiresAt = data.expires_at || ''
        state.cancelAtPeriodEnd = data.cancel_at_period_end === true
        state.queuedPlan = data.queued_plan || null
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

    async function subscribe({plan, billingPeriod, billingCountry, billingState}) {
        state.acting = true
        try {
            return await subscribePayment({plan, billingPeriod, billingCountry, billingState})
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

    async function changePlan({plan, billingPeriod}) {
        state.acting = true
        try {
            const data = await changeSubscriptionPlan({plan, billingPeriod})
            await loadStatus()
            return data
        } finally {
            state.acting = false
        }
    }

    instance = { state, hasSubscription, loadStatus, subscribe, cancel, changePlan }
    return instance
}
