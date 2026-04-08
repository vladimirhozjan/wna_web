<template>
  <div class="dashboard">
    <TopNav
      :authenticated="auth.isAuthenticated.value"
      :user="auth.currentUser.value"
      context="dashboard"
      :sidebar-open="isSidebarOpen"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @logout="auth.logoutWithConfirm()"
    />

    <div class="dashboard-body">
      <!-- Desktop sidebar -->
      <Sidebar class="dashboard-sidebar desktop-only" />

      <!-- Mobile sidebar drawer -->
      <SidebarDrawer :open="isSidebarOpen" @close="isSidebarOpen = false">
        <Sidebar />
      </SidebarDrawer>

      <!-- Dashboard content -->
      <main class="dashboard-content">
        <slot />
      </main>
    </div>

    <!-- Mobile FAB — quick add -->
    <div v-if="fabExpanded" class="fab-overlay" @click="fabCollapse"></div>
    <div class="mobile-fab-area">
      <div v-if="fabExpanded" class="fab-input-bar">
        <input
          ref="fabInputRef"
          v-model="fabTitle"
          class="fab-input"
          type="text"
          placeholder="Add new stuff"
          @keydown.enter="fabSubmit"
          @keydown.escape="fabCollapse"
        />
        <Btn variant="primary" size="sm" @click="fabSubmit">Add</Btn>
      </div>
      <button v-if="!fabExpanded" class="mobile-fab" @click="fabExpand">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="10" y="4" width="2" height="14" rx="1" fill="currentColor"/>
          <rect x="4" y="10" width="14" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import TopNav from "../components/TopNav.vue";
import Sidebar from "../components/Sidebar.vue";
import SidebarDrawer from "../components/SidebarDrawer.vue";
import Btn from "../components/Btn.vue";
import { authModel } from "../scripts/core/authModel.js";
import { settingsModel } from "../scripts/models/settingsModel.js";
import { stuffModel } from "../scripts/models/stuffModel.js";
import { errorModel } from "../scripts/core/errorModel.js";
import router from "../router/router.js";

const auth = authModel();
const settings = settingsModel();
const { addStuff } = stuffModel();
const toaster = errorModel();
const isSidebarOpen = ref(false);

// Mobile FAB quick add
const fabExpanded = ref(false);
const fabTitle = ref("");
const fabInputRef = ref(null);

function fabExpand() {
  fabExpanded.value = true;
  document.documentElement.dataset.fabOpen = "";
  nextTick(() => fabInputRef.value?.focus());
}

function fabCollapse() {
  fabExpanded.value = false;
  fabTitle.value = "";
  delete document.documentElement.dataset.fabOpen;
}

async function fabSubmit() {
  const t = fabTitle.value.trim();
  if (!t) return;
  try {
    await addStuff(t);
    fabTitle.value = "";
    fabInputRef.value?.focus();
  } catch (e) {
    toaster.push(e.message || "Failed to add item");
  }
}

watch(
    () => auth.isAuthenticated.value,
    (v) => {
      if (!v) {
        isSidebarOpen.value = false;
        router.push({ name: "landing" });
      }
    }
);

// Auto-close sidebar on route change (mobile navigation)
watch(() => router.currentRoute.value.path, () => {
  isSidebarOpen.value = false;
});

onMounted(() => {
  if (!auth.isAuthenticated.value) {
    router.push({ name: "landing" });
  } else {
    // Load user settings from API when entering dashboard
    if (!settings.state.loaded) {
      settings.load().catch(() => {
        // Settings will fall back to localStorage, no need to show error
      });
    }
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.dashboard-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
}

.dashboard-sidebar {
  flex-shrink: 0;
  flex-grow: 0;
  width: 260px;
}

.dashboard-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 8px;
}

@media (min-width: 769px) {
  .dashboard-content {
    padding: 30px 30px 0;
  }
}

.desktop-only {
  display: flex;
}

/* Mobile FAB quick add */
.fab-overlay {
  display: none;
}

.mobile-fab-area {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .fab-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 898;
  }

  .mobile-fab-area {
    display: block;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 899;
  }

  .mobile-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: var(--color-btn-primary-bg);
    color: var(--color-btn-primary-text);
    cursor: pointer;
    box-shadow: var(--shadow-elevated);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .mobile-fab:active {
    transform: scale(0.94);
  }

  .fab-input-bar {
    display: flex;
    align-items: stretch;
    gap: 10px;
    position: fixed;
    bottom: 26px;
    left: 16px;
    right: 20px;
  }

  .fab-input {
    flex: 1;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--color-input-border);
    background: var(--color-input-background);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--font-size-body);
    outline: none;
  }

  .fab-input:focus {
    border-color: var(--color-input-border-focus);
    box-shadow: 0 0 0 1px var(--color-action-ring);
  }

  .fab-input::placeholder {
    color: var(--color-text-prefill);
  }
}
</style>
