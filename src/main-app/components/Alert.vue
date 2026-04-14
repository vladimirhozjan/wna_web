<template>
  <div class="alert" :class="`alert--${type}`">
    <div class="alert__icon">
      <AlertInfoIcon v-if="type === 'info'" width="18" height="18" />
      <AlertSuccessIcon v-else-if="type === 'success'" width="18" height="18" />
      <AlertWarningIcon v-else-if="type === 'warning'" width="18" height="18" />
      <AlertErrorIcon v-else width="18" height="18" />
    </div>
    <div class="alert__body">
      <div class="alert__title text-label">{{ title }}</div>
      <div class="alert__message text-body-s color-text-secondary" v-if="message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import AlertInfoIcon from '../assets/AlertInfoIcon.vue'
import AlertSuccessIcon from '../assets/AlertSuccessIcon.vue'
import AlertWarningIcon from '../assets/AlertWarningIcon.vue'
import AlertErrorIcon from '../assets/AlertErrorIcon.vue'

defineProps({
  type: {
    type: String,
    default: 'info', // info, success, warning, error
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  }
})
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  width: 100%;
}

.alert__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert__body {
  flex: 1;
  min-width: 0;
}

.alert__title {
  color: var(--color-text-primary);
}

.alert__message {
  margin-top: 2px;
}

.alert--info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.alert--success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.alert--warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.alert--error {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
</style>
