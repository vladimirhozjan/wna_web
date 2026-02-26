<template>
  <div class="dashboard">
    <TopNav
      :authenticated="auth.isAuthenticated.value"
      :user="auth.currentUser.value"
      context="dashboard"
      @open-sidebar="isSidebarOpen = true"
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import TopNav from "../components/TopNav.vue";
import Sidebar from "../components/Sidebar.vue";
import SidebarDrawer from "../components/SidebarDrawer.vue";
import { authModel } from "../scripts/core/authModel.js";
import { settingsModel } from "../scripts/models/settingsModel.js";
import router from "../router/router.js";

const auth = authModel();
const settings = settingsModel();
const isSidebarOpen = ref(false);

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

watch(
    () => auth.isAuthenticated.value,
    (v) => {
      if (!v) {
        isSidebarOpen.value = false;
        router.push({ name: "landing" });
      }
    }
);
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
}

.desktop-only {
  display: flex;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
</style>
