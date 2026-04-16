<template>
  <LandingLayout>
    <div class="sso-page">
      <div class="sso-card">

        <!-- Loading -->
        <div v-if="status === 'loading'" class="sso-state">
          <Spinner :size="40" />
          <h2 class="text-h2 color-text-primary">Signing you in...</h2>
        </div>

        <!-- Beta closed -->
        <div v-else-if="status === 'beta'" class="sso-state">
          <span class="sso-icon sso-icon--warning">
            <ExclamationIcon width="24" height="24" />
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
            <CrossIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Sign-in failed</h2>
          <p class="text-body-s color-text-secondary">{{ errorMessage }}</p>
          <Btn @click="goToLogin">Back to login</Btn>
        </div>

        <!-- Invalid (no code) -->
        <div v-else-if="status === 'invalid'" class="sso-state">
          <span class="sso-icon sso-icon--warning">
            <ExclamationIcon width="24" height="24" />
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
import Spinner from '../../components/Spinner.vue'
import {authModel} from '../../scripts/core/authModel.js'
import {mapApiError, ErrorScenario} from '../../scripts/core/errorMapper.js'
import {flagsModel} from '../../scripts/core/flagsModel.js'
import ExclamationIcon from '../../assets/ExclamationIcon.vue'
import CrossIcon from '../../assets/CrossIcon.vue'

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
