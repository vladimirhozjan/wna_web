<template>
  <AuthLayout>
    <h2 class="text-body-l fw-semibold color-text-primary page-heading">Set Up Two-Factor Authentication</h2>
    <p class="text-body-s color-text-secondary page-subtext">
      Scan this QR code with Google Authenticator or similar TOTP app.
    </p>

    <!-- Loading -->
    <div v-if="loadingSetup" class="loading-state">
      <Spinner />
      <p class="text-body-s color-text-tertiary">Generating your secret key...</p>
    </div>

    <!-- Setup error -->
    <div v-else-if="setupError" class="error-state">
      <p class="text-body-s color-text-danger">{{ setupError }}</p>
      <Btn variant="secondary" size="sm" @click="loadSetup">Retry</Btn>
    </div>

    <!-- QR code + confirm form -->
    <div v-else class="otp-content">
      <!-- QR code -->
      <div class="qr-wrapper">
        <canvas ref="qrCanvas"></canvas>
      </div>

      <!-- Manual entry secret -->
      <div class="secret-section">
        <p class="text-caption color-text-tertiary">Or enter the key manually:</p>
        <div class="secret-row">
          <code class="text-body-s fw-medium secret-text">{{ secret }}</code>
          <button type="button" class="copy-btn text-caption" @click="copySecret" :title="copied ? 'Copied!' : 'Copy'">
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Confirm form -->
      <form @submit.prevent="handleConfirm" class="confirm-form">
        <Inpt
            ref="codeRef"
            v-model="code"
            v-model:error="codeError"
            type="text"
            title="Verification code"
            placeholder="Enter 6-digit code"
            :disabled="auth.loading.value"
            @enter="handleConfirm"
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
          Verify & Activate
        </Btn>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import AuthLayout from '../layouts/AuthLayout.vue'
import Inpt from '../components/Inpt.vue'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import { authModel } from '../scripts/core/authModel.js'

const router = useRouter()
const auth = authModel()

const qrCanvas = ref(null)
const codeRef = ref(null)
const secret = ref('')
const otpauthUri = ref('')
const code = ref('')
const codeError = ref('')
const formError = ref('')
const loadingSetup = ref(true)
const setupError = ref('')
const copied = ref(false)

async function loadSetup() {
  loadingSetup.value = true
  setupError.value = ''

  try {
    const data = await auth.getOtpSetup()
    secret.value = data.secret
    otpauthUri.value = data.otpauth_uri
    loadingSetup.value = false
    await nextTick()
    if (qrCanvas.value && otpauthUri.value) {
      await QRCode.toCanvas(qrCanvas.value, otpauthUri.value, {
        width: 200,
        margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' }
      })
    }
  } catch (err) {
    setupError.value = err.message || 'Failed to load OTP setup.'
    loadingSetup.value = false
  }
}

async function copySecret() {
  try {
    await navigator.clipboard.writeText(secret.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard not available */ }
}

async function handleConfirm() {
  formError.value = ''
  codeError.value = ''

  const trimmed = code.value.trim()
  if (!trimmed) {
    codeError.value = 'Enter the 6-digit code from your authenticator app'
    return
  }
  if (!/^\d{6}$/.test(trimmed)) {
    codeError.value = 'Code must be exactly 6 digits'
    return
  }

  try {
    await auth.confirmOtp(trimmed)
    router.push({ name: 'dashboard' })
  } catch (err) {
    formError.value = err.message || 'Invalid code. Please try again.'
  }
}

onMounted(loadSetup)
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.otp-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qr-wrapper {
  display: flex;
  justify-content: center;
}

.qr-wrapper canvas {
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

.secret-section {
  text-align: center;
}

.secret-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

.secret-text {
  color: var(--color-text-primary);
  letter-spacing: 0.05em;
  word-break: break-all;
}

.copy-btn {
  background: none;
  border: none;
  color: var(--color-link-text);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
}

.copy-btn:hover {
  color: var(--color-link-hover);
  background: var(--color-bg-hover);
}

.confirm-form {
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
}
</style>
