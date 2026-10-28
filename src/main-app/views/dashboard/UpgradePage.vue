<template>
    <div class="upgrade-page">

      <div class="upgrade-header">
        <h1 class="page-title">Upgrade Your Plan</h1>
      </div>

      <div class="upgrade-body">
        <div class="upgrade-inner">

          <!-- Payments not enabled — contact support -->
          <div v-if="!paymentsEnabled" class="card upgrade-notice">
            <p class="text-body-m upgrade-notice-text">
              Self-service upgrades are temporarily unavailable. Contact us to enable a paid plan on your account.
            </p>
            <Btn variant="primary" size="md" @click="onContactSupport">Contact Us</Btn>
          </div>

          <!-- Loading subscription state -->
          <div v-else-if="payment.state.loading && !payment.state.loaded" class="upgrade-loading">
            <Spinner :size="16" />
            <span>Loading subscription...</span>
          </div>

          <!-- Already on a paid plan — manage in Settings -->
          <div v-else-if="hasPaidPlan" class="card upgrade-notice">
            <p class="text-body-m upgrade-notice-text">
              You're already on a paid plan. You can manage it in Settings.
            </p>
            <Btn variant="primary" size="md" @click="router.push({ path: '/settings', query: { section: 'plan' } })">Open Settings</Btn>
          </div>

          <template v-else>
            <!-- Billing period toggle -->
            <div class="toggle-wrap">
              <button
                  :class="['text-body-m fw-semibold toggle-btn', { 'toggle-btn--active': !yearly }]"
                  @click="yearly = false"
              >
                Monthly
              </button>
              <button
                  :class="['text-body-m fw-semibold toggle-btn toggle-btn--yearly', { 'toggle-btn--active': yearly }]"
                  @click="yearly = true"
              >
                Yearly
                <span class="save-badge text-footnote">3 months free</span>
              </button>
            </div>

            <!-- Plan cards -->
            <div class="plan-grid">
              <button
                  v-for="t in TIERS"
                  :key="t.plan"
                  type="button"
                  class="plan-card"
                  :class="{ 'plan-card--selected': selectedPlan === t.plan }"
                  @click="selectedPlan = t.plan"
              >
                <span class="plan-card__radio" :class="{ 'plan-card__radio--on': selectedPlan === t.plan }" />
                <h3 class="text-h4 plan-card__name">{{ t.name }}</h3>
                <div class="plan-card__price">
                  <span class="text-h2 plan-card__currency">€</span>
                  <span class="text-display">{{ yearly ? optionFor(t.plan).perMonth : optionFor(t.plan).amount }}</span>
                  <span class="text-body-m plan-card__period">/{{ t.perUser ? 'user/' : '' }}{{ yearly ? 'mo' : 'month' }}</span>
                </div>
                <p class="text-footnote plan-card__footnote" :style="{ visibility: yearly ? 'visible' : 'hidden' }">
                  Billed annually at €{{ optionFor(t.plan).amount }}{{ t.perUser ? '/user' : '' }}
                </p>
                <p class="text-body-s plan-card__description">{{ t.description }}</p>
                <ul class="plan-card__features">
                  <li v-for="f in t.features" :key="f" class="text-body-s plan-card__feature">
                    <CheckIcon class="plan-card__check" />
                    {{ f }}
                  </li>
                </ul>
              </button>
            </div>

            <BillingAddressForm ref="billingRef" :eu-countries="payment.state.euCountries" :fiscal-countries="payment.state.fiscalCountries">
              <p class="text-body-s upgrade-footer__renewal">
                Renews every {{ yearly ? 'year' : 'month' }} at €{{ selectedOption.amount }} until you cancel.
              </p>
              <template #action>
                <Btn
                    variant="primary"
                    size="lg"
                    class="upgrade-footer__cta"
                    :loading="payment.state.acting"
                    :disabled="payment.state.acting"
                    @click="onContinue"
                >
                  Subscribe and pay — {{ selectedOption.price }}
                </Btn>
              </template>
            </BillingAddressForm>
          </template>

        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Btn from '../../components/Btn.vue'
import BillingAddressForm from '../../components/BillingAddressForm.vue'
import Spinner from '../../components/Spinner.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import { authModel } from '../../scripts/core/authModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { paymentModel, PLAN_OPTIONS, loadPlanCatalog } from '../../scripts/models/paymentModel.js'

const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const { paymentsEnabled } = flagsModel()
const payment = paymentModel()

const TIERS = [
  {
    plan: 'pro',
    name: 'Pro',
    description: 'For the individual power user.',
    features: [
      'Unlimited projects & tags',
      'Recurring actions',
      'Full reference files',
      '250 MB storage',
    ],
  },
  {
    plan: 'team',
    name: 'Team',
    perUser: true,
    description: 'For teams that delegate work together.',
    features: [
      'Unlimited projects & tags',
      'Recurring actions',
      'Full reference files',
      '1 GB/user storage',
    ],
  },
]

const yearly = ref(true)
const selectedPlan = ref('pro')

const billingRef = ref(null)

const billingPeriod = computed(() => yearly.value ? 'yearly' : 'monthly')

function optionFor(plan) {
  return PLAN_OPTIONS.find(o => o.plan === plan && o.billingPeriod === billingPeriod.value)
}

const selectedOption = computed(() => optionFor(selectedPlan.value))

const hasActiveSubscription = computed(() =>
    payment.state.tier !== 'free' && ['active', 'past_due'].includes(payment.state.status))

// Also covers a paid tier granted without a subscription (admin) — nothing to upgrade
const hasPaidPlan = computed(() =>
    hasActiveSubscription.value || (auth.currentUser.value?.subscription_tier || 'free') !== 'free')

function onContactSupport() {
  window.location.href = 'mailto:support@whatsnextaction.com'
}

async function onContinue() {
  const billing = billingRef.value.validate()
  if (!billing) return

  try {
    const data = await payment.subscribe({
      plan: selectedPlan.value,
      billingPeriod: billingPeriod.value,
      ...billing,
    })
    if (data.checkout_url) {
      window.location.assign(data.checkout_url)
    } else {
      toaster.push('The payment provider did not return a checkout link')
    }
  } catch (err) {
    // 502 = payment gateway failure; checkout never started, so nothing was charged
    if (err.status === 409 && err.message === 'terms_version_mismatch') {
      // The Terms changed since this page loaded — reload so the buyer sees and accepts the current version
      window.location.reload()
    } else if (err.status === 400 && err.message === 'terms_acceptance_required') {
      billingRef.value.showTermsError()
    } else if (err.status === 502) {
      toaster.push('Our payment provider is having trouble right now — you have not been charged. Please try again in a few minutes.')
    } else {
      toaster.push(err.message || 'Failed to start checkout')
    }
  }
}

async function loadPaymentStatus() {
  if (!paymentsEnabled.value || payment.state.loading || payment.state.loaded) return
  try {
    await payment.loadStatus()
  } catch (err) {
    toaster.push(err.message || 'Failed to load subscription')
  }
}

watch(paymentsEnabled, (on) => {
  if (on) loadPaymentStatus()
})

onMounted(() => {
  loadPlanCatalog()
  loadPaymentStatus()
})
</script>

<style scoped>
.upgrade-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upgrade-header {
  flex-shrink: 0;
  padding: 0 16px;
  margin-bottom: 15px;
}

.upgrade-header h1 {
  margin: 0;
}

.upgrade-body {
  flex: 1;
  overflow-y: auto;
  /* top padding keeps the toggle's overhanging "3 months free" badge inside the scroll clip */
  padding: 14px 16px 20px;
}

.upgrade-inner {
  max-width: 720px;
  margin: 0 auto;
}

/* Notice / fallback states */
.upgrade-notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

.upgrade-notice-text {
  margin: 0;
  color: var(--color-text-primary);
}

.upgrade-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 4px;
  color: var(--color-text-secondary);
}

/* Billing period toggle */
.toggle-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.toggle-btn {
  min-width: 130px;
  padding: 12px 28px;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: center;
  transition: 0.15s background, 0.15s color, 0.15s border-color;
}

.toggle-btn:first-child {
  border-radius: 8px 0 0 8px;
  border-right: none;
}

.toggle-btn--yearly {
  position: relative;
  border-radius: 0 8px 8px 0;
}

.toggle-btn--active {
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-color: var(--color-action);
}

.toggle-btn:first-child.toggle-btn--active + .toggle-btn {
  border-left-color: var(--color-action);
}

.save-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: var(--color-bg-primary);
  background-image: linear-gradient(var(--color-success-light), var(--color-success-light));
  color: var(--color-success);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  line-height: var(--lh-normal);
}

.plan-card__period {
  color: var(--color-text-secondary);
}

.plan-card__footnote {
  color: var(--color-text-secondary);
  margin: 4px 0 0;
  min-height: 17px;
}

.plan-card__description {
  color: var(--color-text-secondary);
  margin: 8px 0 0;
}

.plan-card__features {
  list-style: none;
  padding: 16px 0 0;
  margin: 16px 0 0;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-card__feature {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  text-align: left;
}

.plan-card__check {
  width: 18px;
  height: 18px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
  color: var(--color-success);
}

.upgrade-footer__renewal {
  margin: 0;
  color: var(--color-text-primary);
}

.upgrade-footer__cta {
  align-self: flex-end;
}

@media (max-width: 768px) {
  .upgrade-footer__cta {
    align-self: stretch;
    width: 100%;
  }
}
</style>
