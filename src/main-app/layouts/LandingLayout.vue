<template>
  <div class="landing-layout">
    <TopNav
      :authenticated="auth.isAuthenticated.value"
      :user="auth.currentUser.value"
      context="landing"
      @open-login="$emit('open-login')"
      @open-register="$emit('open-register')"
      @logout="auth.logoutWithConfirm()"
    />

    <main class="landing-main">
      <slot />
    </main>

    <PublicFooter />
  </div>
</template>

<script setup>
import TopNav from '../components/TopNav.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import {authModel} from "../scripts/authModel.js";
defineEmits(['open-login', 'open-register'])
const auth = authModel()
</script>

<style scoped>
.landing-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.landing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
