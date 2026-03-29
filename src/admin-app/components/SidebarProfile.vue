<template>
  <div class="sidebar-profile">
    <Dropdown align="left" title="Account">
      <template #trigger>
        <button type="button" class="profile-trigger">
          <div class="profile-info">
            <StatusDot :color="statusColor" :title="auth.currentAdmin.value?.status" />
            <span class="text-body-s fw-medium profile-email">{{ auth.currentAdmin.value?.email }}</span>
          </div>
          <Badge type="role" :value="auth.currentAdmin.value?.role || 'viewer'" />
        </button>
      </template>

      <template #default="{ close }">
        <button class="dropdown-item" @click="goSettings(close)">
          <svg class="dropdown-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="3"/><path d="M10 1v3m0 12v3m-9-9h3m12 0h3m-2.4-6.4l-2.1 2.1m-8.5 8.5l-2.1 2.1m0-12.6l2.1 2.1m8.5 8.5l2.1 2.1"/></svg>
          Settings
        </button>
        <button class="dropdown-item dropdown-item--danger" @click="handleLogout(close)">
          <svg class="dropdown-item-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17H3V3h4"/><path d="M10 10h8m0 0l-3-3m3 3l-3 3"/></svg>
          Logout
        </button>
      </template>
    </Dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authModel } from '../scripts/core/authModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import Dropdown from './Dropdown.vue'
import Badge from './Badge.vue'
import StatusDot from './StatusDot.vue'

defineEmits(['navigate'])

const router = useRouter()
const auth = authModel()
const confirm = confirmModel()

const statusColor = computed(() => {
  const status = auth.currentAdmin.value?.status
  if (status === 'active') return 'green'
  if (status === 'disabled') return 'red'
  return 'yellow'
})

function goSettings(close) {
  close()
  router.push({ name: 'settings' })
}

async function handleLogout(close) {
  close()
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
}

.profile-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.profile-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.profile-email {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-item-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-right: 8px;
}
</style>
