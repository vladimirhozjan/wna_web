<template>
  <div class="sidebar-profile">
    <button type="button" class="profile-trigger" @click="goSettings">
      <div class="profile-top">
        <StatusDot :color="statusColor" :title="auth.currentAdmin.value?.status" />
        <span class="text-body-s fw-medium profile-email">{{ auth.currentAdmin.value?.email }}</span>
      </div>
      <Badge type="role" :value="auth.currentAdmin.value?.role || 'viewer'" />
    </button>
    <button type="button" class="logout-btn text-body-s" @click="handleLogout">
      <svg class="logout-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17H3V3h4"/><path d="M10 10h8m0 0l-3-3m3 3l-3 3"/></svg>
      Logout
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authModel } from '../scripts/core/authModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import Badge from './Badge.vue'
import StatusDot from './StatusDot.vue'

const emit = defineEmits(['navigate'])

const router = useRouter()
const auth = authModel()
const confirm = confirmModel()

const statusColor = computed(() => {
  const status = auth.currentAdmin.value?.status
  if (status === 'active') return 'green'
  if (status === 'disabled') return 'red'
  return 'yellow'
})

function goSettings() {
  emit('navigate')
  router.push({ name: 'settings' })
}

async function handleLogout() {
  const confirmed = await confirm.show({
    title: 'Log out',
    message: 'Are you sure you want to log out?',
    confirmText: 'Log out',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.sidebar-profile {
  padding: 16px 12px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-trigger {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.profile-trigger:hover {
  background: var(--color-bg-secondary);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.profile-email {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: background 0.15s, color 0.15s;
}

.logout-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-danger);
}

.logout-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
