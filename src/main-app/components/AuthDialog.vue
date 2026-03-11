<template>
  <Transition name="auth-fade">
    <div v-if="isOpen" class="auth-backdrop" @click="closeAll">
      <Transition name="auth-section" mode="out-in">
        <div class="auth-dialog" @click.stop :key="props.mode || 'closed'">

          <section v-if="props.mode === 'register'">
            <div>
              <h2 class="text-h2 color-text-primary">Create Your Account</h2>
              <p class="subtitle text-body-s color-text-primary">
                Start your journey to better clarity and control.
              </p>
            </div>
            <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address"
                  v-model:error="emailError"/>
            <Inpt v-model="password" type="password" title="Password" placeholder="Enter your password"
                  footer="Use 8 or more characters with a mix of letters, numbers and symbols"
                  v-model:error="passwordError"/>
            <Inpt v-model="confirm" @enter="doRegister" type="password" title="Confirm password"
                  placeholder="Confirm your password" v-model:error="confirmError"/>
            <label class="agree-checkbox" :class="{ 'agree-checkbox--error': agreeError }">
              <input type="checkbox" v-model="agreeTerms" @change="agreeError = ''"/>
              <span class="text-body-s">
                I agree to the
                <a href="/legal/terms" target="_blank" rel="noopener" @click.stop>Terms of Service</a>
                and
                <a href="/legal/privacy" target="_blank" rel="noopener" @click.stop>Privacy Policy</a>
              </span>
            </label>
            <span v-if="agreeError" class="agree-error text-footnote">{{ agreeError }}</span>
            <Btn @click="doRegister" :disabled="disableRegister" :loading="auth.loading.value">Register</Btn>
            <Lnk text="Already have an account?" link="Sign In" @action="goToLogin"/>
            <div v-if="googleSsoEnabled" class="or-divider">
              <span class="or-divider__line"></span>
              <span class="or-divider__text text-body-s color-text-secondary">or</span>
              <span class="or-divider__line"></span>
            </div>
            <Btn v-if="googleSsoEnabled" variant="ghost" @click="redirectToGoogle" class="google-sso-btn">
              <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </Btn>
          </section>

          <section v-else-if="props.mode === 'login'">
            <div>
              <h2 class="text-h2 color-text-primary">Welcome Back</h2>
              <p class="subtitle text-body-s color-text-primary">
                Let's get you organized.
              </p>
            </div>
            <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address"
                  v-model:error="emailError"/>
            <Inpt v-model="password" @enter="doLogin" type="password" title="Password" placeholder="Enter your password"
                  footer="Use 8 or more characters with a mix of letters, numbers and symbols"
                  v-model:error="passwordError"/>
            <Btn @click="doLogin" :disabled="disableLogin" :loading="auth.loading.value">Sign In</Btn>
            <Lnk text="Forgot your password?" link="Reset it" @action="goToForgot"/>
            <div v-if="googleSsoEnabled" class="or-divider">
              <span class="or-divider__line"></span>
              <span class="or-divider__text text-body-s color-text-secondary">or</span>
              <span class="or-divider__line"></span>
            </div>
            <Btn v-if="googleSsoEnabled" variant="ghost" @click="redirectToGoogle" class="google-sso-btn">
              <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </Btn>
            <div class="separator"></div>
            <Btn class="btn-not-wide" variant="ghost" @click="goToRegister">Create new account</Btn>
          </section>

          <section v-else-if="props.mode === 'forgot'">
            <div>
              <h2 class="text-h2 color-text-primary">Forgot Your Password?</h2>
              <p class="subtitle text-body-s color-text-primary">
                No problem. Just enter your email address below and we’ll send you a link to reset it.
              </p>
            </div>
            <Inpt v-model="email" @enter="doForgot" type="email" title="Email"
                  placeholder="Enter your email address" v-model:error="emailError"/>
            <Btn @click="doForgot" :disabled="disableForgot" :loading="auth.loading.value">Send reset link</Btn>
            <Lnk text="Remember your password?" link="Back to login" @action="goToLogin"/>
          </section>

          <section v-else-if="props.mode === 'reset'">
            <div>
              <h2 class="text-h2 color-text-primary">Set a new password</h2>
              <p class="subtitle text-body-s color-text-primary">
                Create a new, strong password for your account.
              </p>
            </div>
            <Inpt v-model="password" type="password" title="Password" placeholder="Enter your password"
                  footer="Use 8 or more characters with a mix of letters, numbers and symbols"
                  v-model:error="passwordError"/>
            <Inpt v-model="confirm" @enter="doReset" type="password" title="Confirm password"
                  placeholder="Confirm your password" v-model:error="confirmError"/>
            <Btn @click="doReset" :disabled="disableReset" :loading="auth.loading.value">Update password</Btn>
            <Lnk text="Remember your password?" link="Back to login" @action="goToLogin"/>
          </section>

          <section v-else-if="props.mode === 'verify-sent'">
            <div>
              <h2 class="text-h2 color-text-primary">Check your inbox</h2>
              <p class="subtitle text-body-s color-text-primary">
                We've sent a verification link to <strong>{{ email }}</strong>.
                Click the link to activate your account.
              </p>
            </div>
            <Btn @click="doResend" :disabled="resendCooldown > 0" :loading="resending">
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email' }}
            </Btn>
            <Lnk text="Already verified?" link="Back to login" @action="goToLogin"/>
          </section>

          <section v-else-if="props.mode === 'unverified'">
            <div>
              <h2 class="text-h2 color-text-primary">Email not verified</h2>
              <p class="subtitle text-body-s color-text-primary">
                Please check your inbox for the verification link.
              </p>
            </div>
            <Btn @click="doResend" :disabled="resendCooldown > 0" :loading="resending">
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email' }}
            </Btn>
            <Lnk text="Back to login" link="Sign In" @action="goToLogin"/>
          </section>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import {computed, ref, watch} from 'vue'
import Inpt from './Inpt.vue'
import Btn from './Btn.vue'
import Lnk from './Lnk.vue'
import {isValidEmail, isValidPassword} from '../scripts/core/authTools.js'
import {authModel} from '../scripts/core/authModel.js'
import {errorModel} from '../scripts/core/errorModel.js'
import {mapApiError, ErrorScenario} from '../scripts/core/errorMapper.js'
import {isGoogleSsoEnabled, redirectToGoogle} from '../scripts/core/googleSso.js'

const auth = authModel()
const error = errorModel()

const googleSsoEnabled = isGoogleSsoEnabled()

const props = defineProps({
  mode: {
    type: String,
    default: null, // 'login' | 'register' | 'forgot' | 'reset' | 'verify-sent' | 'unverified' | null
  },
})

const emit = defineEmits([
  'update:mode',
  'logged-in',
  'registered'
])

const email = ref('')
const password = ref('')
const confirm = ref('')

const emailError = ref('')
const passwordError = ref('')
const confirmError = ref('')
const agreeTerms = ref(false)
const agreeError = ref('')

const reset_token = ref('')

const resending = ref(false)
const resendCooldown = ref(0)
let cooldownTimer = null

const isOpen = computed(() => !!props.mode)

watch(isOpen, (open) => {
  if (!open) {
    clearForm()
    stopCooldown()
  }
})

function clearForm() {
  email.value = ''
  password.value = ''
  confirm.value = ''
  agreeTerms.value = false

  emailError.value = ''
  passwordError.value = ''
  confirmError.value = ''
  agreeError.value = ''
}

function closeAll() {
  emit('update:mode', null)
}

function goToLogin() {
  password.value = ''
  confirm.value = ''
  clearErrors()
  emit('update:mode', 'login')
}

function goToRegister() {
  clearErrors()
  emit('update:mode', 'register')
}

function goToForgot() {
  clearErrors()
  emit('update:mode', 'forgot')
}

function goToReset() {
  clearErrors()
  emit('update:mode', 'reset')
}

function clearErrors() {
  emailError.value = ''
  passwordError.value = ''
  confirmError.value = ''
  agreeError.value = ''
}

function startCooldown() {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      stopCooldown()
    }
  }, 1000)
}

function stopCooldown() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  resendCooldown.value = 0
}

async function doResend() {
  if (resendCooldown.value > 0 || !email.value) return
  resending.value = true
  try {
    await auth.resendVerification(email.value)
    error.success('If this email is registered, a new verification link has been sent.')
    startCooldown()
  } catch (err) {
    error.push('Failed to resend verification email.')
  } finally {
    resending.value = false
  }
}

async function doLogin() {
  clearErrors()

  if (!isValidEmail(email.value)) {
    emailError.value = 'Invalid email'
  }

  if (!isValidPassword(password.value)) {
    passwordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (emailError.value || passwordError.value) {
    return
  }

  try {
    await auth.loginUser(email.value, password.value)
    await auth.loadUser()

    emit('logged-in')
    closeAll()
  } catch (err) {
    if (err.status === 403) {
      emit('update:mode', 'unverified')
      return
    }
    console.log(err)
    error.push('Login failed with error: ' + mapApiError(err, ErrorScenario.LOGIN))
  }
}

async function doRegister() {
  clearErrors()

  if (!isValidEmail(email.value)) {
    emailError.value = 'Invalid email'
  }

  if (!isValidPassword(password.value)) {
    passwordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (password.value !== confirm.value) {
    confirmError.value = 'Passwords do not match'
  }

  if (!agreeTerms.value) {
    agreeError.value = 'You must agree to the Terms and Privacy Policy'
  }

  if (emailError.value || passwordError.value || confirmError.value || agreeError.value) {
    return
  }

  try {
    await auth.registerUser(email.value, password.value)
    emit('update:mode', 'verify-sent')
  } catch (err) {
    console.log(err)
    error.push('Registration failed with error: ' + mapApiError(err, ErrorScenario.REGISTER)
    )
  }
}

async function doForgot() {
  clearErrors()

  if (!isValidEmail(email.value)) {
    emailError.value = 'Invalid email'
  }

  if (emailError.value) {
    return
  }

  try {
    reset_token.value = ''
    const data = await auth.forgotPassword(email.value)
    reset_token.value = data.reset_token
    goToReset()
  } catch (err) {
    console.log(err)
    error.push('Forgot password failed with error: ' + mapApiError(err))
  }
}

async function doReset() {
  clearErrors()

  if (!isValidPassword(password.value)) {
    passwordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (password.value !== confirm.value) {
    confirmError.value = 'Passwords do not match'
  }

  if (passwordError.value || confirmError.value) {
    return
  }

  try {
    await auth.resetPassword(password.value, reset_token.value)
    goToLogin()
  } catch (err) {
    console.log(err)
    error.push('Update password failed with error: ' + mapApiError(err))
  }
}

const disableLogin = computed(() => !email.value || !password.value)
const disableRegister = computed(() => !email.value || !password.value || !confirm.value || !agreeTerms.value)
const disableForgot = computed(() => !email.value)
const disableReset = computed(() => !password.value || !confirm.value)
</script>

<style scoped>
.auth-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(3px);
  background: var(--color-popup-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.auth-dialog {
  margin: 0 20px;
  background: var(--color-popup-background);
  padding: 30px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-auth);
}

section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h2 {
  text-align: center;
}

.btn-not-wide {
  margin: 0 auto;
}

.separator {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  margin: 10px 20px 0 20px;
}

.agree-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  margin-top: -8px;
}

.agree-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  cursor: pointer;
  accent-color: var(--color-action);
  flex-shrink: 0;
}

.agree-checkbox span {
  color: var(--color-text-secondary);
}

.agree-checkbox a {
  color: var(--color-link-text);
  text-decoration: underline;
}

.agree-checkbox a:hover {
  color: var(--color-link-hover);
}

.agree-checkbox--error input[type="checkbox"] {
  outline: 2px solid var(--color-danger);
  outline-offset: 1px;
}

.agree-error {
  color: var(--color-text-error);
  margin-top: -14px;
}

.or-divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.or-divider__line {
  flex: 1;
  height: 1px;
  background: var(--color-border-light);
}

.or-divider__text {
  flex-shrink: 0;
}

.google-sso-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.google-icon {
  flex-shrink: 0;
}

.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}

.auth-section-enter-active,
.auth-section-leave-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.auth-section-enter-from,
.auth-section-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

</style>
