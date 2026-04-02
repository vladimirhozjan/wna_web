<template>
  <LandingLayout>
    <div class="sso-page">
      <div class="sso-card">

        <!-- Loading -->
        <div v-if="status === 'loading'" class="sso-state">
          <span class="sso-spinner"></span>
          <h2 class="text-h2 color-text-primary">Signing you in...</h2>
        </div>

        <!-- Beta closed -->
        <div v-else-if="status === 'beta'" class="sso-state">
          <span class="sso-icon sso-icon--warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <h2 class="text-h2 color-text-primary">Closed Beta</h2>
          <p class="text-body-s color-text-secondary">
            WhatsNextAction is currently in closed beta. New accounts cannot be created via Google Sign-In.
          </p>
          <p class="text-body-s color-text-secondary">
            Want to join? Contact <a href="mailto:info@whatsnextaction.com">info@whatsnextaction.com</a>
          </p>
          <Btn @click="goToLogin">Back to login</Btn>
        </div>

        <!-- Error -->
        <div v-else-if="status === 'error'" class="sso-state">
          <span class="sso-icon sso-icon--error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
          <h2 class="text-h2 color-text-primary">Sign-in failed</h2>
          <p class="text-body-s color-text-secondary">{{ errorMessage }}</p>
          <Btn @click="goToLogin">Back to login</Btn>
        </div>

        <!-- Invalid (no code) -->
        <div v-else-if="status === 'invalid'" class="sso-state">
          <span class="sso-icon sso-icon--warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <h2 class="text-h2 color-text-primary">Invalid sign-in link</h2>
          <p class="text-body-s color-text-secondary">
            This link is missing an authorization code. Please try signing in again.
          </p>
          <Btn @click="goToLogin">Back to login</Btn>
        </div>

      </div>
    </div>
  </LandingLayout>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import Btn from '../../components/Btn.vue'
import {authModel} from '../../scripts/core/authModel.js'
import {mapApiError, ErrorScenario} from '../../scripts/core/errorMapper.js'
import {flagsModel} from '../../scripts/core/flagsModel.js'

const route = useRoute()
const router = useRouter()
const auth = authModel()

const status = ref('loading')
const errorMessage = ref('')

onMounted(() => {
  const code = route.query.code
  if (!code) {
    status.value = 'invalid'
    return
  }
  exchangeCode(code)
})

async function exchangeCode(code) {
  status.value = 'loading'
  try {
    await auth.googleSsoLogin(code)
    await auth.loadUser()
    router.push({name: 'engage'})
  } catch (err) {
    const mapped = mapApiError(err, ErrorScenario.GOOGLE_LOGIN)
    if (mapped === 'registration_disabled') {
      status.value = 'beta'
    } else {
      status.value = 'error'
      errorMessage.value = mapped
    }
  }
}

function goToLogin() {
  router.push({name: 'login'})
}
</script>

<style scoped>
.sso-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}

.sso-card {
  background: var(--color-popup-background);
  padding: 40px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-auth);
}

.sso-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.sso-state h2 {
  margin: 0;
}

.sso-state p {
  margin: 0;
}

.sso-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sso-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sso-icon--error {
  background: var(--color-danger-subtle, #f8d7da);
  color: var(--color-danger);
}

.sso-icon--warning {
  background: var(--color-warning-subtle, #fff3cd);
  color: var(--color-warning, #856404);
}
</style>
