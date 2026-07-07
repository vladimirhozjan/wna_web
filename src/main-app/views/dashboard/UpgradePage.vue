<template>
  <DashboardLayout>
    <div class="upgrade-page">

      <div class="upgrade-header">
        <h1 class="page-title">Upgrade Your Plan</h1>
      </div>

      <div class="upgrade-body">
        <div class="upgrade-inner">

          <!-- Payments not enabled — contact support -->
          <div v-if="!paymentsEnabled" class="card upgrade-notice">
            <p class="text-body-m upgrade-notice-text">
              Self-service upgrades aren't available yet. Contact us to enable a paid plan on your account.
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

            <!-- Billing details -->
            <div class="card billing-details">
              <h2 class="text-h4 billing-details__title">Billing address</h2>
              <p class="text-body-s billing-details__hint">
                This appears on your invoice. Your country determines the VAT.
              </p>

              <div class="billing-details__fields">
                <Inpt
                    v-model="fullName"
                    v-model:error="fullNameError"
                    type="text"
                    title="Full name"
                    placeholder="Enter your full name"
                />
                <Inpt
                    v-model="address1"
                    v-model:error="address1Error"
                    type="text"
                    title="Address 1"
                    placeholder="Street address"
                />
                <Inpt
                    v-model="address2"
                    type="text"
                    title="Address 2 (optional)"
                    placeholder="Apartment, suite, unit, floor"
                />
                <div class="billing-details__row">
                  <Inpt
                      v-model="zip"
                      v-model:error="zipError"
                      type="text"
                      title="Zip"
                      placeholder="Zip / postal code"
                  />
                  <Inpt
                      v-model="city"
                      v-model:error="cityError"
                      type="text"
                      title="City"
                      placeholder="City"
                  />
                </div>
                <Inpt
                    v-model="stateRegion"
                    type="text"
                    title="State (optional)"
                    placeholder="State, province or region"
                />
                <div class="billing-details__country">
                  <span class="text-footnote fw-semibold billing-details__label">Country</span>
                  <Select v-model="billingCountry" :options="countryOptions" title="Country" searchable />
                  <span v-if="countryError" class="text-footnote color-text-error">{{ countryError }}</span>
                </div>
              </div>
            </div>

            <!-- Continue -->
            <div class="upgrade-footer">
              <span class="text-body-s upgrade-footer__hint">
                Prices include VAT. You will be redirected to our payment provider to complete the purchase.
              </span>
              <Btn
                  variant="primary"
                  size="lg"
                  class="upgrade-footer__cta"
                  :loading="payment.state.acting"
                  :disabled="payment.state.acting"
                  @click="onContinue"
              >
                Continue to Payment — {{ selectedOption.price }}
              </Btn>
            </div>
          </template>

        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import Select from '../../components/Select.vue'
import Spinner from '../../components/Spinner.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import { authModel } from '../../scripts/core/authModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { paymentModel, PLAN_OPTIONS, loadPlanCatalog } from '../../scripts/models/paymentModel.js'
import { COUNTRIES } from '../../scripts/data/countries.js'

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

const fullName = ref('')
const fullNameError = ref('')
const address1 = ref('')
const address1Error = ref('')
const address2 = ref('')
const zip = ref('')
const zipError = ref('')
const city = ref('')
const cityError = ref('')
const stateRegion = ref('')
const billingCountry = ref('')
const countryError = ref('')
const countryOptions = [{ value: '', label: 'Select country…' }, ...COUNTRIES]

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
  fullNameError.value = fullName.value.trim() ? '' : 'Full name is required'
  address1Error.value = address1.value.trim() ? '' : 'Address is required'
  zipError.value = zip.value.trim() ? '' : 'Zip is required'
  cityError.value = city.value.trim() ? '' : 'City is required'
  countryError.value = billingCountry.value ? '' : 'Country is required'
  if (fullNameError.value || address1Error.value || zipError.value || cityError.value || countryError.value) return

  try {
    const data = await payment.subscribe({
      plan: selectedPlan.value,
      billingPeriod: billingPeriod.value,
      billingCountry: billingCountry.value,
      billingState: stateRegion.value.trim(),
      billingName: fullName.value.trim(),
      billingAddress1: address1.value.trim(),
      billingAddress2: address2.value.trim(),
      billingZip: zip.value.trim(),
      billingCity: city.value.trim(),
    })
    if (data.checkout_url) {
      window.location.assign(data.checkout_url)
    } else {
      toaster.push('The payment provider did not return a checkout link')
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to start checkout')
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

/* Plan cards */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}

.plan-card {
  position: relative;
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: 24px;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  text-align: center;
  cursor: pointer;
  font: inherit;
  transition: 0.15s border-color, 0.15s box-shadow;
}

.plan-card:hover {
  border-color: var(--color-action);
}

.plan-card--selected {
  border: 2px solid var(--color-action);
  box-shadow: 0 4px 24px rgba(65, 133, 222, 0.15);
  padding: 23px;
}

.plan-card__radio {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border-light);
  border-radius: 50%;
  box-sizing: border-box;
}

.plan-card__radio--on {
  border-color: var(--color-action);
  background: radial-gradient(circle, var(--color-action) 0 5px, transparent 6px);
}

.plan-card__name {
  color: var(--color-text-primary);
  margin: 0;
}

.plan-card__price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-top: 12px;
}

.plan-card__price .text-display {
  color: var(--color-text-primary);
}

.plan-card__currency {
  color: var(--color-text-primary);
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

/* Billing details */
.billing-details {
  margin-top: 20px;
  padding: 20px;
}

.billing-details__title {
  color: var(--color-text-primary);
  margin: 0;
}

.billing-details__hint {
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.billing-details__fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.billing-details__row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 14px;
}

@media (max-width: 768px) {
  .billing-details__row {
    grid-template-columns: 1fr;
  }
}

.billing-details__country {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.billing-details__label {
  color: var(--color-text-secondary);
}

/* Footer */
.upgrade-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 8px;
}

.upgrade-footer__hint {
  color: var(--color-text-secondary);
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
