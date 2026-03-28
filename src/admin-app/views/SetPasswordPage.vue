<template>
  <AuthLayout>
    <h2 class="text-body-l fw-semibold color-text-primary page-heading">Set Password</h2>
    <p class="text-body-s color-text-secondary page-subtext">Create a secure password for your admin account.</p>

    <!-- Success state -->
    <div v-if="success" class="success-state">
      <svg class="success-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" stroke="var(--color-success)" stroke-width="3"/>
        <polyline points="15,25 21,31 33,19" stroke="var(--color-success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <p class="text-body-m fw-medium color-text-primary">Password set successfully.</p>
      <p class="text-body-s color-text-secondary">Redirecting to login...</p>
    </div>

    <!-- Missing token error -->
    <div v-else-if="!token" class="error-state">
      <p class="text-body-m color-text-danger">Invalid or missing reset link.</p>
      <p class="text-body-s color-text-secondary">Please use the link from your email, or contact a super admin.</p>
    </div>

    <!-- Password form -->
    <form v-else @submit.prevent="handleSubmit" class="form">
      <Inpt
          v-model="password"
          v-model:error="passwordError"
          type="password"
          title="New password"
          placeholder="Minimum 12 characters"
          :disabled="auth.loading.value"
          @enter="handleSubmit"
      />

      <!-- Strength indicator -->
      <div class="strength-bar-track">
        <div class="strength-bar-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
      </div>
      <div class="strength-row">
        <span class="text-caption" :class="strengthTextClass">{{ strengthLabel }}</span>
        <span class="text-caption color-text-tertiary">{{ strengthHint }}</span>
      </div>

      <Inpt
          v-model="confirmPassword"
          v-model:error="confirmError"
          type="password"
          title="Confirm password"
          placeholder="Re-enter your password"
          :disabled="auth.loading.value"
          @enter="handleSubmit"
      />

      <p v-if="formError" class="text-body-s form-error">{{ formError }}</p>

      <Btn
          type="submit"
          variant="primary"
          size="lg"
          :loading="auth.loading.value"
          :disabled="auth.loading.value"
          class="submit-btn"
      >
        Set Password
      </Btn>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import Inpt from '../components/Inpt.vue'
import Btn from '../components/Btn.vue'
import { authModel } from '../scripts/core/authModel.js'

const route = useRoute()
const router = useRouter()
const auth = authModel()

const token = computed(() => route.query.token || '')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmError = ref('')
const formError = ref('')
const success = ref(false)

// --- Password strength ---
const hasMinLength = computed(() => password.value.length >= 12)
const hasUppercase = computed(() => /[A-Z]/.test(password.value))
const hasLowercase = computed(() => /[a-z]/.test(password.value))
const hasDigit = computed(() => /\d/.test(password.value))
const hasSpecial = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password.value))

const strengthScore = computed(() => {
  let score = 0
  if (hasMinLength.value) score++
  if (hasUppercase.value) score++
  if (hasLowercase.value) score++
  if (hasDigit.value) score++
  if (hasSpecial.value) score++
  return score
})

const strengthPercent = computed(() => {
  if (!password.value) return 0
  return (strengthScore.value / 5) * 100
})

const strengthLabel = computed(() => {
  if (!password.value) return ''
  if (strengthScore.value <= 2) return 'Weak'
  if (strengthScore.value <= 3) return 'Fair'
  if (strengthScore.value <= 4) return 'Good'
  return 'Strong'
})

const strengthClass = computed(() => {
  if (strengthScore.value <= 2) return 'strength--weak'
  if (strengthScore.value <= 3) return 'strength--fair'
  if (strengthScore.value <= 4) return 'strength--good'
  return 'strength--strong'
})

const strengthTextClass = computed(() => {
  if (strengthScore.value <= 2) return 'color-text-danger'
  if (strengthScore.value <= 3) return 'color-text-secondary'
  if (strengthScore.value <= 4) return 'color-text-success'
  return 'color-text-success'
})

const strengthHint = computed(() => {
  if (!password.value) return ''
  const missing = []
  if (!hasMinLength.value) missing.push('12+ chars')
  if (!hasUppercase.value) missing.push('uppercase')
  if (!hasLowercase.value) missing.push('lowercase')
  if (!hasDigit.value) missing.push('number')
  if (!hasSpecial.value) missing.push('special char')
  return missing.length ? 'Need: ' + missing.join(', ') : ''
})

// --- Validation & submit ---
function validate() {
  let valid = true
  formError.value = ''

  if (!password.value) {
    passwordError.value = 'Password is required'
    valid = false
  } else if (strengthScore.value < 5) {
    passwordError.value = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character'
    valid = false
  }

  if (!confirmPassword.value) {
    confirmError.value = 'Please confirm your password'
    valid = false
  } else if (password.value !== confirmPassword.value) {
    confirmError.value = 'Passwords do not match'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  try {
    await auth.setPassword(token.value, password.value)
    success.value = true
    setTimeout(() => router.push({ name: 'login' }), 2000)
  } catch (err) {
    formError.value = err.message || 'Failed to set password. Please try again.'
  }
}
</script>

<style scoped>
.page-heading {
  text-align: center;
  margin-bottom: 4px;
}

.page-subtext {
  text-align: center;
  margin-bottom: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strength-bar-track {
  height: 4px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
  margin-top: -8px;
}

.strength-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.25s ease, background 0.25s ease;
}

.strength--weak { background: var(--color-danger); }
.strength--fair { background: var(--color-warning); }
.strength--good { background: var(--color-success); }
.strength--strong { background: var(--color-success); }

.strength-row {
  display: flex;
  justify-content: space-between;
  margin-top: -8px;
}

.form-error {
  color: var(--color-text-danger);
  text-align: center;
  margin: 0;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.success-icon {
  width: 48px;
  height: 48px;
}

.error-state {
  text-align: center;
  padding: 20px 0;
}

.error-state p {
  margin-bottom: 8px;
}
</style>
