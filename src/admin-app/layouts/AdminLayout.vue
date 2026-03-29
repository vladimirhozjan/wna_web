<template>
  <div class="admin-layout">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    </Transition>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <SidebarProfile @navigate="sidebarOpen = false" />
      <SidebarNav @navigate="sidebarOpen = false" />
    </aside>

    <!-- Main content -->
    <div class="main">
      <header class="topnav">
        <button type="button" class="hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h1 class="text-body-l fw-semibold topnav-title">{{ pageTitle }}</h1>
      </header>
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarProfile from '../components/SidebarProfile.vue'
import SidebarNav from '../components/SidebarNav.vue'

const route = useRoute()
const sidebarOpen = ref(false)

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  users: 'Users',
  'user-detail': 'User Detail',
  admins: 'Admin Users',
  'admin-detail': 'Admin Detail',
  'content-browser': 'Content Browser',
  gdpr: 'GDPR Requests',
  health: 'System Health',
  analytics: 'Analytics',
  audit: 'Audit Log',
  'feature-flags': 'Feature Flags',
  settings: 'Settings',
}

const pageTitle = computed(() => PAGE_TITLES[route.name] || 'Admin')
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-sidebar-background);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}

/* Main content */
.main {
  margin-left: var(--sidebar-width);
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* TopNav */
.topnav {
  position: sticky;
  top: 0;
  height: var(--topnav-height);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 50;
}

.topnav-title {
  color: var(--color-text-primary);
  margin: 0;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  margin-right: 12px;
  color: var(--color-text-secondary);
  border-radius: 6px;
}

.hamburger:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.hamburger svg {
  width: 22px;
  height: 22px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
}

/* Sidebar overlay (mobile) */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 99;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
  }

  .main {
    margin-left: 0;
  }

  .hamburger {
    display: flex;
  }
}
</style>
