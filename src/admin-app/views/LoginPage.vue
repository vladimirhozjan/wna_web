<template>
  <AuthLayout>
    <h2 class="text-body-l fw-semibold color-text-primary page-heading">Sign in</h2>
    <p class="text-body-s color-text-secondary page-subtext">Admin panel access</p>

    <form @submit.prevent="handleSubmit" class="login-form">
      <Inpt
          v-model="email"
          v-model:error="emailError"
          type="email"
          title="Email"
          placeholder="Enter your email"
          :disabled="auth.loading.value"
          @enter="handleSubmit"
      />

      <Inpt
          v-model="password"
          v-model:error="passwordError"
          type="password"
          title="Password"
          placeholder="Enter your password"
          :disabled="auth.loading.value"
          @enter="handleSubmit"
      />

      <Transition name="slide">
        <Inpt
            v-if="showOtpField"
            ref="otpRef"
            v-model="otpCode"
            v-model:error="otpError"
            type="text"
            title="Authenticator code"
            placeholder="6-digit code"
            :disabled="auth.loading.value"
            @enter="handleSubmit"
        />
      </Transition>

      <p v-if="formError" class="text-body-s form-error">{{ formError }}</p>

      <Btn
          type="submit"
          variant="primary"
          size="lg"
          :loading="auth.loading.value"
          :disabled="auth.loading.value"
          class="submit-btn"
      >
        {{ showOtpField ? 'Verify & Sign in' : 'Sign in' }}
      </Btn>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import Inpt from '../components/Inpt.vue'
import Btn from '../components/Btn.vue'
import { authModel } from '../scripts/core/authModel.js'

const router = useRouter()
const auth = authModel()

const email = ref('')
const password = ref('')
const otpCode = ref('')
const emailError = ref('')
const passwordError = ref('')
const otpError = ref('')
const formError = ref('')
const showOtpField = ref(false)
const otpRef = ref(null)

function validate() {
  let valid = true
  formError.value = ''

  if (!email.value.trim()) {
    emailError.value = 'Email is required'
    valid = false
  }

  if (!password.value) {
    passwordError.value = 'Password is required'
    valid = false
  }

  if (showOtpField.value && !otpCode.value.trim()) {
    otpError.value = 'Enter the 6-digit code from your authenticator app'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  try {
    const data = await auth.login(
        email.value.trim(),
        password.value,
        showOtpField.value ? otpCode.value.trim() : undefined
    )

    if (data.status === 'pending_otp_setup') {
      router.push({ name: 'otp-setup' })
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (err) {
    // Backend returns 400 "OTP code required" when active admin logs in without code
    if (err.status === 400 && err.message && err.message.toLowerCase().includes('otp code required')) {
      showOtpField.value = true
      otpCode.value = ''
      formError.value = ''
      nextTick(() => otpRef.value?.focus())
      return
    }

    formError.value = err.message || 'Login failed. Please try again.'
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* OTP field slide transition */
.slide-enter-active {
  transition: all 0.2s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
