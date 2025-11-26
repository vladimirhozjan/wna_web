<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">
    <UnderConstruction/>
  </LandingLayout>
  <AuthDialog
      v-model:mode="authMode"
      @logged-in="onSuccess"
      @registered="onSuccess"
      @password-reset-success="onSuccessPasswordReset"
  />
</template>

<script setup>
import {ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import LandingLayout from '../layouts/LandingLayout.vue'
import AuthDialog from '../components/AuthDialog.vue'
import UnderConstruction from "../components/UnderConstruction.vue";

const props = defineProps({
  mode: {
    type: String,
    default: null, // 'login' | 'register' | 'forgot' | 'reset' | null
  },
})

const router = useRouter()

const authMode = ref(null)

watch(
    () => props.mode,
    (m) => {
      authMode.value = m
    },
    {immediate: true}
)

function openAuth(mode) {
  authMode.value = mode
}

function closeAuth() {
  authMode.value = null
}

function onSuccess() {
  closeAuth()
  router.push({name: 'next'})
}

function onSuccessPasswordReset() {
  closeAuth()
  router.push({name: 'login'})
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
