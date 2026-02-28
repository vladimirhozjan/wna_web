<template>
  <div class="clarify-step">
    <h3 class="text-h4 fw-semibold clarify-step-question">Confirm</h3>

    <div class="clarify-summary">
      <div class="text-body-l fw-semibold clarify-summary-action">{{ summary.action }}</div>
      <p class="text-body-m clarify-summary-description">{{ summary.description }}</p>

      <!-- Show details for action/project -->
      <div v-if="summary.details" class="clarify-summary-details">
        <div v-if="summary.details.dueDate" class="clarify-detail-item">
          <span class="text-body-s clarify-detail-label">Due date:</span>
          <span class="text-body-s clarify-detail-value">{{ formatDate(summary.details.dueDate) }}</span>
        </div>
        <div v-if="summary.details.deferUntil" class="clarify-detail-item">
          <span class="text-body-s clarify-detail-label">Defer until:</span>
          <span class="text-body-s clarify-detail-value">{{ formatDate(summary.details.deferUntil) }}</span>
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
  color: var(--color-action);
  margin-bottom: 8px;
}

.clarify-summary-description {
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
  color: var(--color-text-tertiary);
}

.clarify-detail-value {
  color: var(--color-text-primary);
}

.clarify-confirm-actions {
  display: flex;
  justify-content: center;
}
</style>
