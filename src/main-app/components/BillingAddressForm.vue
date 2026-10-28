<template>
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

  <div class="billing-footer">
    <span class="text-body-s billing-footer__hint">
      Prices include VAT. You will be redirected to our payment provider to complete the purchase.
    </span>
    <span v-if="isFiscalCountry" class="text-footnote billing-footer__fiscal-notice">
      Prodajalec mora za dobavo blaga ali storitev izdati račun in ga izročiti kupcu.
      Kupec mora prevzeti račun in ga zadržati neposredno po odhodu iz poslovnega prostora.
      (www.fu.gov.si/blagajne) — The seller must issue an invoice for the supplied goods or
      services and hand it over to the buyer. The buyer must take the invoice and retain it
      immediately after leaving the business premises. (Notice pursuant to Article 12 of the
      Slovenian ZDavPR.)
    </span>
    <slot />
    <template v-if="isEuCountry">
      <label class="terms-checkbox" :class="{ 'terms-checkbox--error': termsError }">
        <input v-model="termsAccepted" type="checkbox" @change="termsError = ''" />
        <span class="text-body-s">
          I agree to the
          <a href="/legal/terms" target="_blank" rel="noopener" @click.stop>Terms of Service</a>.
        </span>
      </label>
      <span v-if="termsError" class="text-footnote color-text-error">{{ termsError }}</span>
    </template>
    <p v-else class="text-body-s terms-line">
      By continuing, you agree to the
      <a href="/legal/terms" target="_blank" rel="noopener">Terms of Service</a>.
    </p>
    <slot name="action" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Inpt from './Inpt.vue'
import Select from './Select.vue'
import { COUNTRIES } from '../scripts/data/countries.js'

const props = defineProps({
  euCountries: { type: Array, default: () => [] },
  fiscalCountries: { type: Array, default: () => [] },
})

const TERMS_REQUIRED = 'You must agree to the Terms of Service'

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
const termsAccepted = ref(false)
const termsError = ref('')

const isEuCountry = computed(() => props.euCountries.includes(billingCountry.value))
const isFiscalCountry = computed(() => props.fiscalCountries.includes(billingCountry.value))

// The billing fields of a checkout request, or null with the errors shown
function validate() {
  fullNameError.value = fullName.value.trim() ? '' : 'Full name is required'
  address1Error.value = address1.value.trim() ? '' : 'Address is required'
  zipError.value = zip.value.trim() ? '' : 'Zip is required'
  cityError.value = city.value.trim() ? '' : 'City is required'
  countryError.value = billingCountry.value ? '' : 'Country is required'
  termsError.value = isEuCountry.value && !termsAccepted.value ? TERMS_REQUIRED : ''
  if (fullNameError.value || address1Error.value || zipError.value || cityError.value || countryError.value || termsError.value) return null
  return {
    billingCountry: billingCountry.value,
    billingState: stateRegion.value.trim(),
    billingName: fullName.value.trim(),
    billingAddress1: address1.value.trim(),
    billingAddress2: address2.value.trim(),
    billingZip: zip.value.trim(),
    billingCity: city.value.trim(),
    termsVersion: __TERMS_VERSION__,
    termsAccepted: isEuCountry.value && termsAccepted.value,
  }
}

function showTermsError() {
  termsError.value = TERMS_REQUIRED
}

// A state entered under a previous country must never ride along with a new country
watch(billingCountry, () => {
  stateRegion.value = ''
  termsAccepted.value = false
  termsError.value = ''
})

defineExpose({ validate, showTermsError })
</script>

<style scoped>
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

.billing-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 8px;
}

.billing-footer__hint {
  color: var(--color-text-secondary);
}

.billing-footer__fiscal-notice {
  color: var(--color-text-tertiary);
}

.terms-line {
  margin: 0;
  color: var(--color-text-secondary);
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.terms-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  cursor: pointer;
  accent-color: var(--color-action);
  flex-shrink: 0;
}

.terms-checkbox span {
  color: var(--color-text-secondary);
}

.terms-checkbox a,
.terms-line a {
  color: var(--color-link-text);
  text-decoration: underline;
}

.terms-checkbox a:hover,
.terms-line a:hover {
  color: var(--color-link-hover);
}

.terms-checkbox--error input[type="checkbox"] {
  outline: 2px solid var(--color-danger);
  outline-offset: 1px;
}
</style>
