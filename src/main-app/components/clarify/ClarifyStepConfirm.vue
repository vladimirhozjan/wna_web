<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">Confirm</h3>

    <div class="clarify-summary">
      <div class="clarify-summary-action">{{ summary.action }}</div>
      <p class="clarify-summary-description">{{ summary.description }}</p>

      <!-- Show details for action/project -->
      <div v-if="summary.details" class="clarify-summary-details">
        <div v-if="summary.details.dueDate" class="clarify-detail-item">
          <span class="clarify-detail-label">Due date:</span>
          <span class="clarify-detail-value">{{ formatDate(summary.details.dueDate) }}</span>
        </div>
        <div v-if="summary.details.deferUntil" class="clarify-detail-item">
          <span class="clarify-detail-label">Defer until:</span>
          <span class="clarify-detail-value">{{ formatDate(summary.details.deferUntil) }}</span>
        </div>
      </div>
    </div>

    <div class="clarify-confirm-actions">
      <Btn
          variant="primary"
          size="md"
          :loading="loading"
          :disabled="loading"
          @click="onConfirm"
      >
        Confirm
      </Btn>
    </div>
  </div>
</template>

<script setup>
import Btn from '../Btn.vue'

defineProps({
  summary: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm'])

function onConfirm() {
  emit('confirm')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.clarify-step {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}

.clarify-step-question {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
}

.clarify-summary {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.clarify-summary-action {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-action);
  margin-bottom: 8px;
}

.clarify-summary-description {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
}

.clarify-summary-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
  text-align: left;
}

.clarify-detail-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.clarify-detail-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
}

.clarify-detail-value {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
}

.clarify-confirm-actions {
  display: flex;
  justify-content: center;
}
</style>
