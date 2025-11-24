<template>
  <div class="dashboard">
    <TopNav :authenticated="auth.isAuthenticated.value" />

    <div class="dashboard-body">
      <Sidebar class="dashboard-sidebar" @logout="$emit('logout')"/>
      <main class="dashboard-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import TopNav from '../components/TopNav.vue'
import Sidebar from '../components/Sidebar.vue'
import router from "../router/router.js";
import {authModel} from "../scripts/authModel.js";

const auth = authModel()

onMounted(async () => {
  if (!auth.isAuthenticated.value) {
    return router.push({name: 'landing'})
  }
})

defineEmits(['logout'])
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
