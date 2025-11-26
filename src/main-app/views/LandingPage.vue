<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">
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
  router.push({name: 'my'})
}

function onSuccessPasswordReset() {
  closeAuth()
  router.push({name: 'login'})
}
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
