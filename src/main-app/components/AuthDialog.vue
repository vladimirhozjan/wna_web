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

const auth = authModel()
const error = errorModel()

const props = defineProps({
  mode: {
    type: String,
    default: null, // 'login' | 'register' | 'forgot' | 'reset' | null
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

const isOpen = computed(() => !!props.mode)

watch(isOpen, (open) => {
  if (!open) {
    clearForm()
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
    await auth.loadUser()

    emit('registered')
    closeAll()
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
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.2);
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
  line-height: 150%;
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
