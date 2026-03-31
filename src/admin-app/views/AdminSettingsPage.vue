<template>
  <div class="page">
    <h1 class="page-title">Settings</h1>

    <!-- Change Password -->
    <div class="settings-card card">
      <h3 class="text-label color-text-secondary section-title">Change Password</h3>
      <form @submit.prevent="handleChangePassword" class="settings-form">
        <Inpt
            v-model="currentPassword"
            v-model:error="currentPasswordError"
            type="password"
            title="Current Password"
            placeholder="Enter current password"
            :disabled="passwordLoading"
        />
        <Inpt
            v-model="newPassword"
            v-model:error="newPasswordError"
            type="password"
            title="New Password"
            placeholder="Min 12 chars, upper, lower, number, special"
            :disabled="passwordLoading"
        />
        <Inpt
            v-model="confirmPassword"
            v-model:error="confirmPasswordError"
            type="password"
            title="Confirm New Password"
            placeholder="Re-enter new password"
            :disabled="passwordLoading"
            @enter="handleChangePassword"
        />

        <!-- Password strength indicator -->
        <div v-if="newPassword" class="strength-bar">
          <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
        </div>
        <span v-if="newPassword" class="text-caption" :class="strengthTextClass">{{ strengthLabel }}</span>

        <p v-if="passwordFormError" class="text-body-s color-text-danger form-error">{{ passwordFormError }}</p>

        <Btn variant="primary" size="sm" type="submit" :loading="passwordLoading" :disabled="passwordLoading">
          Change Password
        </Btn>
      </form>
    </div>

    <!-- Re-configure OTP -->
    <div class="settings-card card">
      <h3 class="text-label color-text-secondary section-title">Re-configure OTP</h3>
      <p class="text-body-s color-text-secondary otp-desc">
        Enter your current OTP code to verify your identity. After verification, your OTP will be reset and you'll need to set up a new authenticator.
      </p>
      <form @submit.prevent="handleResetOtp" class="settings-form">
        <Inpt
            v-model="otpCode"
            v-model:error="otpCodeError"
            type="text"
            title="Current OTP Code"
            placeholder="6-digit code"
            :disabled="otpLoading"
            @enter="handleResetOtp"
        />
        <p v-if="otpFormError" class="text-body-s color-text-danger form-error">{{ otpFormError }}</p>
        <Btn variant="ghost-danger" size="sm" type="submit" :loading="otpLoading" :disabled="otpLoading">
          Reset OTP
        </Btn>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { authModel } from '../scripts/core/authModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const auth = authModel()

// --- Change Password ---
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const currentPasswordError = ref('')
const newPasswordError = ref('')
const confirmPasswordError = ref('')
const passwordFormError = ref('')
const passwordLoading = ref(false)

const PASSWORD_RULES = [
  { test: v => v.length >= 12, label: 'At least 12 characters' },
  { test: v => /[A-Z]/.test(v), label: 'Uppercase letter' },
  { test: v => /[a-z]/.test(v), label: 'Lowercase letter' },
  { test: v => /[0-9]/.test(v), label: 'Number' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Special character' },
]

const passedRules = computed(() => PASSWORD_RULES.filter(r => r.test(newPassword.value)).length)

const strengthPercent = computed(() => (passedRules.value / PASSWORD_RULES.length) * 100)

const strengthClass = computed(() => {
  if (passedRules.value <= 2) return 'strength--weak'
  if (passedRules.value <= 3) return 'strength--fair'
  if (passedRules.value <= 4) return 'strength--good'
  return 'strength--strong'
})

const strengthTextClass = computed(() => {
  if (passedRules.value <= 2) return 'color-text-danger'
  if (passedRules.value <= 3) return 'color-text-warning'
  return 'color-text-success'
})

const strengthLabel = computed(() => {
  if (passedRules.value <= 2) return 'Weak'
  if (passedRules.value <= 3) return 'Fair'
  if (passedRules.value <= 4) return 'Good'
  return 'Strong'
})

async function handleChangePassword() {
  currentPasswordError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''
  passwordFormError.value = ''

  if (!currentPassword.value) {
    currentPasswordError.value = 'Required'
    return
  }
  if (passedRules.value < PASSWORD_RULES.length) {
    newPasswordError.value = 'Must include uppercase, lowercase, number, special char, and be 12+ chars'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return
  }

  passwordLoading.value = true
  try {
    await apiClient.changePassword(currentPassword.value, newPassword.value)
    toaster.success('Password changed successfully')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    passwordFormError.value = err.message || 'Failed to change password'
  } finally {
    passwordLoading.value = false
  }
}

// --- Re-configure OTP ---
const otpCode = ref('')
const otpCodeError = ref('')
const otpFormError = ref('')
const otpLoading = ref(false)

async function handleResetOtp() {
  otpCodeError.value = ''
  otpFormError.value = ''

  if (!otpCode.value.trim() || otpCode.value.trim().length !== 6) {
    otpCodeError.value = 'Enter a 6-digit code'
    return
  }

  const confirmed = await confirm.show({
    title: 'Re-configure OTP',
    message: 'Your current OTP will be cleared and you will be redirected to set up a new authenticator. Continue?',
    confirmText: 'Reset OTP',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  otpLoading.value = true
  try {
    await apiClient.resetOtp(otpCode.value.trim())
    toaster.success('OTP reset — redirecting to setup')
    // Status transitions to pending_otp_setup, update auth state
    if (auth.currentAdmin.value) {
      auth.currentAdmin.value = { ...auth.currentAdmin.value, status: 'pending_otp_setup' }
      localStorage.setItem('admin_current_user', JSON.stringify(auth.currentAdmin.value))
    }
    router.push({ name: 'otp-setup' })
  } catch (err) {
    otpFormError.value = err.message || 'Failed to reset OTP'
  } finally {
    otpLoading.value = false
  }
}
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 600px;
}

.page-title {
  margin-bottom: 24px;
}

.settings-card {
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.otp-desc {
  margin: 0 0 12px;
}

.form-error {
  margin: 0;
}

/* Strength bar */
.strength-bar {
  height: 4px;
  background: var(--color-border-light);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s ease, background 0.2s ease;
}

.strength--weak {
  background: var(--color-danger);
}

.strength--fair {
  background: var(--color-warning);
}

.strength--good {
  background: var(--color-success);
}

.strength--strong {
  background: var(--color-success);
}
</style>