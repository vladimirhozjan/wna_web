<template>
  <LandingLayout
    @open-login="showLogin = true"
    @open-register="showRegister = true"
  >
    <section class="hero">
      <h1>WhatsNextAction</h1>
      <p class="hero-subtitle">
        Under construction – we're building a GTD-inspired productivity platform.
      </p>
      <p class="hero-note">
        Sign up to be one of the first users when we launch.
      </p>
      <div class="hero-actions">
        <button class="btn primary" @click="showRegister = true">Get early access</button>
        <button class="btn ghost" @click="showLogin = true">I already have an account</button>
      </div>
    </section>
  </LandingLayout>

  <AuthDialog
    v-model:login="showLogin"
    v-model:register="showRegister"
    v-model:forgot="showForgot"
    @switch-to-register="switchTo('register')"
    @switch-to-login="switchTo('login')"
    @switch-to-forgot="switchTo('forgot')"
    @logged-in="onSuccess"
    @registered="onSuccess"
    @update:login="onPopupChange"
    @update:register="onPopupChange"
    @update:forgot="onPopupChange"
  />
</template>

<script setup>
import {ref, watch} from 'vue'
import { useRouter } from 'vue-router'
import LandingLayout from '../layouts/LandingLayout.vue'
import AuthDialog from '../components/AuthDialog.vue'

const props = defineProps({
  mode: {
    type: String,
    default: null
  }
})

const router = useRouter()

const showLogin = ref(false)
const showRegister = ref(false)
const showForgot = ref(false)

function switchTo(mode) {

  if (mode == null) {
    closeAuth()
  } else {
    switch (mode) {
      case 'login':
        showLoginAuth()
        break
      case 'forgot':
        showForgotAuth()
        break
      case 'register':
        showRegisterAuth()
        break
    }
  }
}

function showLoginAuth() {
  showLogin.value = true
  showRegister.value = false
  showForgot.value = false
}

function showRegisterAuth() {
  showLogin.value = false
  showRegister.value = true
  showForgot.value = false
}

function showForgotAuth() {
  showLogin.value = false
  showRegister.value = false
  showForgot.value = true
}

function closeAuth() {
  showLogin.value = false
  showRegister.value = false
  showForgot.value = false
}

function onSuccess() {
  closeAuth()
  router.push({name:'my'})
}

function onPopupChange(val) {
  if (!val) close()
}

watch(() => props.mode, (m) => switchTo(m), { immediate: true })

</script>

<style scoped>
.hero {
  padding: 40px 0;
}

h1 {
  font-size: clamp(32px, 5vw, 44px);
  margin-bottom: 12px;
}

.hero-subtitle {
  font-size: 16px;
  margin-bottom: 8px;
}

.hero-note {
  font-size: 14px;
  margin-bottom: 24px;
  color: #555;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.hero-actions .btn {
  min-width: 180px;
}
</style>
