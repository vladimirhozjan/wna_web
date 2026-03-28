<template>
  <span class="badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'role',
  },
  value: {
    type: String,
    required: true,
  },
})

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Support',
  viewer: 'Viewer',
}

const STATUS_LABELS = {
  active: 'Active',
  pending_otp_setup: 'Pending OTP',
  pending_reset: 'Pending Reset',
  disabled: 'Disabled',
}

const label = computed(() => {
  if (props.type === 'role') return ROLE_LABELS[props.value] || props.value
  if (props.type === 'status') return STATUS_LABELS[props.value] || props.value
  return props.value
})

const badgeClass = computed(() => {
  if (props.type === 'role') return `badge--role-${props.value}`
  if (props.type === 'status') {
    if (props.value === 'active') return 'badge--status-active'
    if (props.value === 'disabled') return 'badge--status-disabled'
    return 'badge--status-pending'
  }
  return ''
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--lh-snug);
  white-space: nowrap;
}

.badge--role-super_admin {
  color: var(--color-role-super-admin);
  background: var(--color-role-super-admin-bg);
}

.badge--role-admin {
  color: var(--color-role-admin);
  background: var(--color-role-admin-bg);
}

.badge--role-support {
  color: var(--color-role-support);
  background: var(--color-role-support-bg);
}

.badge--role-viewer {
  color: var(--color-role-viewer);
  background: var(--color-role-viewer-bg);
}

.badge--status-active {
  color: var(--color-status-active);
  background: var(--color-status-active-bg);
}

.badge--status-pending {
  color: var(--color-status-pending);
  background: var(--color-status-pending-bg);
}

.badge--status-disabled {
  color: var(--color-status-disabled);
  background: var(--color-status-disabled-bg);
}
</style>
