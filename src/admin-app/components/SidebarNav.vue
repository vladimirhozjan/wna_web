<template>
  <nav class="sidebar-nav">
    <RouterLink
        v-for="item in visibleItems"
        :key="item.route"
        :to="item.route"
        class="nav-item text-body-s"
        :class="{ 'nav-item--active': isActive(item.route) }"
        @click="$emit('navigate')"
    >
      <span class="nav-icon" v-html="item.icon"></span>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'

defineEmits(['navigate'])

const route = useRoute()
const auth = authModel()

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    minRole: 'viewer',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>'
  },
  {
    label: 'Users',
    route: '/users',
    minRole: 'support',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="6" r="3"/><path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="14" cy="5" r="2.5"/><path d="M19 16c0-2.5-2-4.5-4.5-4.5"/></svg>'
  },
  {
    label: 'Content & Data',
    route: '/content',
    minRole: 'support',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h5l2 2h7v12H3V3z"/></svg>'
  },
  {
    label: 'GDPR Requests',
    route: '/gdpr',
    minRole: 'admin',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 2l7 4v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-4z"/></svg>'
  },
  {
    label: 'System Health',
    route: '/health',
    minRole: 'viewer',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10h4l2-5 3 10 2-5h5"/></svg>'
  },
  {
    label: 'Analytics',
    route: '/analytics',
    minRole: 'viewer',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="10" width="3" height="8" rx="0.5"/><rect x="8.5" y="5" width="3" height="13" rx="0.5"/><rect x="15" y="2" width="3" height="16" rx="0.5"/></svg>'
  },
  {
    label: 'Audit Log',
    route: '/audit',
    minRole: 'admin',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2h10v16H5z"/><line x1="7.5" y1="6" x2="12.5" y2="6"/><line x1="7.5" y1="9" x2="12.5" y2="9"/><line x1="7.5" y1="12" x2="10" y2="12"/></svg>'
  },
  {
    label: 'Feature Flags',
    route: '/feature-flags',
    minRole: 'admin',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v16"/><path d="M3 3h11l-3 4 3 4H3"/></svg>'
  },
  {
    label: 'Admin Users',
    route: '/admins',
    minRole: 'super_admin',
    icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="6" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M14.5 3.5l1.5 1.5-3 3-1.5-1.5"/></svg>'
  },
]

const visibleItems = computed(() => {
  const role = auth.currentAdmin.value?.role
  if (!role) return []
  return NAV_ITEMS.filter(item => hasMinRole(role, item.minRole))
})

function isActive(itemRoute) {
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}
</script>

<style scoped>
.sidebar-nav {
  flex: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.nav-item--active {
  background: var(--color-action-bg-light);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}

.nav-item--active:hover {
  background: var(--color-action-bg-light);
  color: var(--color-action);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.nav-label {
  white-space: nowrap;
}
</style>
