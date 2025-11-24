<template>
  <div class="landing-layout">
    <TopNav :authenticated="auth.isAuthenticated.value"
      @open-login="$emit('open-login')"
      @open-register="$emit('open-register')"
    />

    <main class="landing-container">
      <slot />
    </main>
  </div>
</template>

<script setup>
import TopNav from '../components/TopNav.vue'
import {authModel} from "../scripts/authModel.js";
defineEmits(['open-login', 'open-register'])
const auth = authModel()
</script>

<style scoped>
.landing-container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  padding: 0 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
