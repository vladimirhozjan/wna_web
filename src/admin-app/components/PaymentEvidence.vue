<template>
  <span
      class="payment-evidence"
      :class="{ 'payment-evidence--conflict': payment.location_conflict }"
  >{{ evidenceText }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payment: {
    type: Object,
    required: true,
  },
})

const evidenceText = computed(() => [
  props.payment.billing_country ? `Billing ${props.payment.billing_country}` : null,
  props.payment.card_country ? `Card ${props.payment.card_country}` : null,
  props.payment.ip_country ? `IP ${props.payment.ip_country}` : null,
].filter(Boolean).join(' · '))
</script>

<style scoped>
.payment-evidence {
  color: var(--color-text-tertiary);
}

.payment-evidence--conflict {
  color: var(--color-warning);
}
</style>
