<template>
    <div class="buy-credits-page">

      <div class="buy-credits-header">
        <h1 class="page-title">Buy AI credits</h1>
      </div>

      <div class="buy-credits-body">
        <div class="buy-credits-inner">

          <div v-if="!paymentsEnabled" class="card buy-credits-notice">
            <p class="text-body-m buy-credits-notice__text">
              Buying credits is temporarily unavailable. Contact us to add credits to your account.
            </p>
            <Btn variant="primary" size="md" @click="contactSupport">Contact Us</Btn>
          </div>

          <div v-else-if="loading" class="buy-credits-loading">
            <Spinner :size="16" />
            <span>Loading credit packs...</span>
          </div>

          <div v-else-if="loadError" class="buy-credits-error">
            <span class="text-body-s">Couldn't load credit packs.</span>
            <Btn variant="secondary" size="sm" @click="load">Retry</Btn>
          </div>

          <template v-else>
            <p class="text-body-s buy-credits-lead">
              Packs are used after your monthly credits and stay valid for {{ validityMonths }} months.
            </p>

            <div class="plan-grid">
              <button
                  v-for="p in packs"
                  :key="p.id"
                  type="button"
                  class="plan-card"
                  :class="{ 'plan-card--selected': selectedId === p.id }"
                  data-testid="credit-pack-card"
                  @click="selectedId = p.id"
              >
                <span class="plan-card__radio" :class="{ 'plan-card__radio--on': selectedId === p.id }" />
                <h3 class="text-h4 plan-card__name">{{ p.credits.toLocaleString('en-US') }} credits</h3>
                <div class="plan-card__price">
                  <span class="text-h2 plan-card__currency">€</span>
                  <span class="text-display">{{ amount(p) }}</span>
                </div>
                <p v-if="modelName" class="text-footnote buy-credits-estimate">
                  About {{ p.requests_estimate.toLocaleString('en-US') }} requests with {{ modelName }}
                </p>
              </button>
            </div>

            <BillingAddressForm ref="billingRef" :eu-countries="payment.state.euCountries" :fiscal-countries="payment.state.fiscalCountries">
              <p class="text-body-s buy-credits-withdrawal">
                You can <a href="/legal/terms" target="_blank" rel="noopener">withdraw</a> from a pack until you use any
                of its credits. Unused credits end when you delete your account.
              </p>
              <template #action>
                <Btn
                    variant="primary"
                    size="md"
                    class="buy-credits-cta"
                    :loading="paying"
                    :disabled="paying || !selected"
                    data-testid="credit-pack-pay"
                    @click="onPay"
                >
                  Pay — €{{ selected ? amount(selected) : '' }}
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
import Spinner from '../../components/Spinner.vue'
import BillingAddressForm from '../../components/BillingAddressForm.vue'
import { errorModel } from '../../scripts/core/errorModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { contactSupport } from '../../scripts/core/captureRules.js'
import { getCreditPacks, checkoutCreditPack } from '../../scripts/core/apiClient.js'
import { paymentModel } from '../../scripts/models/paymentModel.js'
import { assistantModel, CREDITS_BEFORE_CHECKOUT_KEY } from '../../scripts/models/assistantModel.js'

const router = useRouter()
const toaster = errorModel()
const flags = flagsModel()
const { paymentsEnabled } = flags
const payment = paymentModel()
const assistant = assistantModel()

const packs = ref([])
const validityMonths = ref(null)
const loading = ref(false)
const loadError = ref(false)
const selectedId = ref(null)
const paying = ref(false)
const billingRef = ref(null)

const selected = computed(() => packs.value.find(p => p.id === selectedId.value) || null)
const modelName = computed(() => assistant.selectedModel.value?.name || '')

function amount(p) {
  const v = p.price_minor / 100
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [data] = await Promise.all([
      getCreditPacks(),
      payment.state.loaded ? null : payment.loadStatus(),
      assistant.state.account ? null : assistant.loadAccount(),
    ])
    packs.value = data.packs || []
    validityMonths.value = data.validity_months
    if (!selected.value) selectedId.value = packs.value[0]?.id ?? null
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function onPay() {
  const billing = billingRef.value.validate()
  if (!billing || !selected.value) return

  paying.value = true
  try {
    const data = await checkoutCreditPack({ packId: selected.value.id, ...billing })
    if (data.checkout_url) {
      sessionStorage.setItem(CREDITS_BEFORE_CHECKOUT_KEY, String(assistant.state.account?.purchased_left ?? 0))
      window.location.assign(data.checkout_url)
    } else {
      toaster.push('The payment provider did not return a checkout link')
    }
  } catch (err) {
    // 502 = payment gateway failure; checkout never started, so nothing was charged
    if (err.code === 'terms_version_mismatch') {
      window.location.reload()
    } else if (err.code === 'terms_acceptance_required') {
      billingRef.value.showTermsError()
    } else if (err.code === 'pack_not_found') {
      toaster.push('This pack is no longer available. Choose another one.')
      selectedId.value = null
      load()
    } else if (err.status === 502) {
      toaster.push('Our payment provider is having trouble right now — you have not been charged. Please try again in a few minutes.')
    } else {
      toaster.push(err.message || 'Failed to start checkout')
    }
  } finally {
    paying.value = false
  }
}

// Kill switch: with the assistant off there is nothing to buy credits for
watch(() => flags.loaded.value && !assistant.enabled.value, (off) => {
  if (off) router.replace({ name: 'settings' })
}, { immediate: true })

watch(paymentsEnabled, (on) => {
  if (on && !packs.value.length && !loading.value) load()
})

onMounted(() => {
  if (paymentsEnabled.value) load()
})
</script>

<style scoped>
.buy-credits-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.buy-credits-header {
  flex-shrink: 0;
  padding: 0 16px;
  margin-bottom: 15px;
}

.buy-credits-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 20px;
}

.buy-credits-inner {
  max-width: 720px;
  margin: 0 auto;
}

.buy-credits-notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

.buy-credits-notice__text {
  margin: 0;
  color: var(--color-text-primary);
}

.buy-credits-loading,
.buy-credits-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 4px;
  color: var(--color-text-secondary);
}

.buy-credits-error {
  gap: 12px;
}

.buy-credits-lead {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
}

.buy-credits-estimate {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
}

.buy-credits-withdrawal {
  margin: 0;
  color: var(--color-text-secondary);
}

.buy-credits-withdrawal a {
  color: var(--color-link-text);
  text-decoration: underline;
}

.buy-credits-withdrawal a:hover {
  color: var(--color-link-hover);
}

.buy-credits-cta {
  align-self: flex-end;
}

@media (max-width: 768px) {
  .buy-credits-cta {
    align-self: stretch;
    width: 100%;
  }
}
</style>
