<template>
  <span class="payment-evidence">
    <span class="evidence-icon" :title="infoTitle">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 9v4.5"/>
        <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    </span>
    <span v-if="payment.location_conflict" class="evidence-icon evidence-icon--warning" :title="conflictTitle">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M10 3.5 2.5 16.5h15L10 3.5z"/>
        <path d="M10 8.5v3.5"/>
        <circle cx="10" cy="14.2" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payment: {
    type: Object,
    required: true,
  },
})

const infoTitle = computed(() =>
    `Billing: ${props.payment.billing_country || '—'}\nCard: ${props.payment.card_country || '—'}\nIP: ${props.payment.ip_country || '—'}`)

const conflictTitle = computed(() =>
    `Location evidence contradicts billing country: card ${props.payment.card_country} and IP ${props.payment.ip_country} both differ from billing ${props.payment.billing_country}.`)
</script>

<style scoped>
.payment-evidence {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.evidence-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  cursor: help;
}

.evidence-icon svg {
  width: 100%;
  height: 100%;
}

.evidence-icon--warning {
  color: var(--color-warning);
}
</style>
