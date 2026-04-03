<template>
  <div class="alert" :class="`alert--${type}`">
    <div class="alert__icon">
      <!-- Info -->
      <svg v-if="type === 'info'" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.15"/>
        <path d="M9 5.5V5M9 8v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <!-- Success -->
      <svg v-else-if="type === 'success'" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.15"/>
        <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <!-- Warning -->
      <svg v-else-if="type === 'warning'" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.15"/>
        <path d="M9 6v3.5M9 12v-.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <!-- Error -->
      <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.15"/>
        <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="alert__body">
      <div class="alert__title text-label">{{ title }}</div>
      <div class="alert__message text-body-s color-text-secondary" v-if="message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
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
