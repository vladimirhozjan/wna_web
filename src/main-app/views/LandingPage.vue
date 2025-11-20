<template>
  <LandingLayout class="page" @open-login="showLogin = true" @open-register="showRegister = true">
    <section class="under-construction">
      <div class="top-segment">
        <h1 class="text-display color-text-primary">WhatsNextAction</h1>
        <p class="text-subtitle color-text-primary">
          Under construction – we're building a GTD-inspired productivity platform.
        </p>
      </div>
      <div>
        <img src="../assets/UnderConstruction.svg" alt="Under construction"/>
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
  if (!val) closeAuth()
}
watch(() => props.mode, (m) => switchTo(m), { immediate: true })

</script>

<style scoped>
.under-construction {
  display: flex;
  flex-direction: column;
  gap: 30px;
  justify-content: center;
  flex: 1;
}

.top-segment {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

</style>
