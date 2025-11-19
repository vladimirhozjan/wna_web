<template>
  <div class="dashboard">
    <TopNav
      :authenticated="true"
      @logout="logout"
    />

    <div class="dashboard-body">
      <Sidebar class="dashboard-sidebar" />
      <main class="dashboard-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import TopNav from '../components/TopNav.vue'
import Sidebar from '../components/Sidebar.vue'

function logout() {
  // TODO: clear auth tokens and redirect to landing
  window.location.href = '/'
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dashboard-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.dashboard-sidebar {
  flex-shrink: 0;
}

.dashboard-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}
</style>
