<template>
  <DashboardLayout @logout="logout">
    <section class="dashboard-home">
      <h1>Dashboard</h1>
      <p>Welcome to your WhatsNextAction dashboard.</p>
      <p>This is a placeholder – plug your real components here.</p>
    </section>
  </DashboardLayout>
</template>

<script setup>
import {useRouter} from "vue-router";
import {authModel} from "../scripts/authModel.js";
import DashboardLayout from '../layouts/DashboardLayout.vue'
import {watch} from "vue";

const auth = authModel()
const router = useRouter()
function logout() {
  auth.logout()
  router.push({name: 'landing'})
}

watch(() => auth.isAuthenticated.value, () => {
  if (auth.isAuthenticated.value === false) {
    router.push({name: 'landing'})
  }
})

</script>

<style scoped>
.dashboard-home h1 {
  font-size: 24px;
  margin-bottom: 12px;
}

.dashboard-home p {
  margin-bottom: 6px;
}
</style>
