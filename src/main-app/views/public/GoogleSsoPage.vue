<template>
  <LandingLayout>
    <div class="sso-page">
      <div class="sso-card">

        <!-- Loading -->
        <div v-if="status === 'loading'" class="sso-state">
          <Spinner :size="40" />
          <h2 class="text-h2 color-text-primary">Signing you in...</h2>
        </div>

        <!-- Error -->
        <div v-else-if="status === 'error'" class="sso-state">
          <span class="sso-icon sso-icon--error">
            <CrossIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Sign-in failed</h2>
          <p class="text-body-s color-text-secondary">{{ errorMessage }}</p>
          <Btn @click="goToLogin">Back to login</Btn>
        </div>

        <!-- Invalid (no code or state mismatch) -->
        <div v-else-if="status === 'invalid'" class="sso-state">
          <span class="sso-icon sso-icon--warning">
            <ExclamationIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Invalid sign-in link</h2>
          <p class="text-body-s color-text-secondary">
            This sign-in link is invalid or has expired. Please try signing in again.
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
import Spinner from '../../components/Spinner.vue'
import {authModel} from '../../scripts/core/authModel.js'
import {takeGoogleSsoVerifier} from '../../scripts/core/googleSso.js'
import {mapApiError, ErrorScenario} from '../../scripts/core/errorMapper.js'
import ExclamationIcon from '../../assets/ExclamationIcon.vue'
import CrossIcon from '../../assets/CrossIcon.vue'

const route = useRoute()
const router = useRouter()
const auth = authModel()

const status = ref('loading')
const errorMessage = ref('')

onMounted(() => {
  const code = route.query.code
  const verifier = takeGoogleSsoVerifier(route.query.state)
  if (!code || !verifier) {
    status.value = 'invalid'
    return
  }
  exchangeCode(code, verifier)
})

async function exchangeCode(code, verifier) {
  status.value = 'loading'
  try {
    await auth.googleSsoLogin(code, verifier)
    await auth.loadUser()
    router.push({name: 'engage'})
  } catch (err) {
    const mapped = mapApiError(err, ErrorScenario.GOOGLE_LOGIN)
    status.value = 'error'
    errorMessage.value = mapped
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


.sso-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sso-icon--error {
  background: var(--color-danger-bg-subtle);
  color: var(--color-danger);
}

.sso-icon--warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}
</style>
