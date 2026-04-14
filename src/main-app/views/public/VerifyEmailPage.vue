<template>
  <LandingLayout>
    <div class="verify-page">
      <div class="verify-card">

        <!-- Loading -->
        <div v-if="status === 'loading'" class="verify-state">
          <span class="verify-spinner"></span>
          <h2 class="text-h2 color-text-primary">Verifying your email...</h2>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="verify-state">
          <span class="verify-icon verify-icon--success">
            <CheckmarkIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Email verified!</h2>
          <p class="text-body-s color-text-secondary">
            Redirecting in {{ countdown }}s...
          </p>
        </div>

        <!-- Invalid (no token) -->
        <div v-else-if="status === 'invalid'" class="verify-state">
          <span class="verify-icon verify-icon--warning">
            <ExclamationIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Invalid verification link</h2>
          <p class="text-body-s color-text-secondary">
            This link is missing a verification token. Please check your email and try again.
          </p>
        </div>

        <!-- Expired / bad token -->
        <div v-else-if="status === 'expired'" class="verify-state">
          <span class="verify-icon verify-icon--warning">
            <ExclamationIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Link invalid or expired</h2>
          <p class="text-body-s color-text-secondary">
            Enter your email to receive a new verification link.
          </p>
          <Inpt v-model="resendEmail" type="email" title="Email" placeholder="Enter your email address" />
          <Btn @click="doResend" :disabled="resendCooldown > 0 || !resendEmail" :loading="resending">
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email' }}
          </Btn>
        </div>

        <!-- Network error -->
        <div v-else-if="status === 'error'" class="verify-state">
          <span class="verify-icon verify-icon--error">
            <CrossIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">Something went wrong</h2>
          <p class="text-body-s color-text-secondary">
            We couldn't verify your email. Please try again.
          </p>
          <Btn @click="doVerify">Retry</Btn>
        </div>

      </div>
    </div>
  </LandingLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import { authModel } from '../../scripts/core/authModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import CheckmarkIcon from '../../assets/CheckmarkIcon.vue'
import ExclamationIcon from '../../assets/ExclamationIcon.vue'
import CrossIcon from '../../assets/CrossIcon.vue'

const route = useRoute()
const router = useRouter()
const auth = authModel()
const toaster = errorModel()

const status = ref('loading') // 'loading' | 'success' | 'expired' | 'invalid' | 'error'
const countdown = ref(3)
const resendEmail = ref('')
const resending = ref(false)
const resendCooldown = ref(0)

let redirectTimer = null
let cooldownTimer = null

onMounted(() => {
  const token = route.query.token
  if (!token) {
    status.value = 'invalid'
    return
  }
  doVerify()
})

onUnmounted(() => {
  if (redirectTimer) clearInterval(redirectTimer)
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function doVerify() {
  const token = route.query.token
  if (!token) {
    status.value = 'invalid'
    return
  }

  status.value = 'loading'

  try {
    await auth.verifyEmail(token)
    await auth.loadUser()
    status.value = 'success'
    countdown.value = 3
    redirectTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(redirectTimer)
        router.push({ name: 'engage' })
      }
    }, 1000)
  } catch (err) {
    if (err.status === 400 || err.status === 401) {
      status.value = 'expired'
    } else {
      status.value = 'error'
    }
  }
}

async function doResend() {
  if (resendCooldown.value > 0 || !resendEmail.value) return
  resending.value = true
  try {
    await auth.resendVerification(resendEmail.value)
    toaster.success('If this email is registered, a new verification link has been sent.')
    resendCooldown.value = 60
    cooldownTimer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }, 1000)
  } catch {
    toaster.push('Failed to resend verification email.')
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
.verify-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}

.verify-card {
  background: var(--color-popup-background);
  padding: 40px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-auth);
}

.verify-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.verify-state h2 {
  margin: 0;
}

.verify-state p {
  margin: 0;
}

.verify-spinner {
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

.verify-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-icon--success {
  background: var(--color-action-subtle);
  color: var(--color-action);
}

.verify-icon--warning {
  background: var(--color-warning-subtle, #fff3cd);
  color: var(--color-warning, #856404);
}

.verify-icon--error {
  background: var(--color-danger-subtle, #f8d7da);
  color: var(--color-danger);
}
</style>
