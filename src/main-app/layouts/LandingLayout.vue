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
import { onMounted, onUnmounted } from 'vue'
import TopNav from '../components/TopNav.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import { authModel } from '../scripts/core/authModel.js'
import { themeModel } from '../scripts/models/themeModel.js'

defineEmits(['open-login', 'open-register'])
const auth = authModel()
const theme = themeModel()

let savedMode = null

onMounted(() => {
  savedMode = theme.mode.value
  document.documentElement.setAttribute('data-theme', 'light')
})

onUnmounted(() => {
  if (savedMode) theme.setMode(savedMode)
})
</script>

<style scoped>
.landing-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
}

.landing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
