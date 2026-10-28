<template>
  <Transition name="auth-fade">
    <div v-if="isOpen" ref="backdropEl" class="auth-backdrop" data-testid="auth-backdrop" :style="backdropStyle"
         @click="closeAll">
      <div class="auth-scroll">
        <Transition name="auth-section" mode="out-in">
          <div ref="cardEl" class="auth-dialog" data-testid="auth-dialog" @click.stop @focusin="onCardFocusIn"
               :key="props.mode || 'closed'">
            <Btn variant="icon" size="sm" class="auth-close" data-testid="auth-dialog-close" title="Close"
                 aria-label="Close" @click="closeAll">
              <CloseIcon class="auth-close-icon" />
            </Btn>

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
              <template v-if="ssoEnabled">
                <div class="or-divider">
                  <span class="or-divider__line"></span>
                  <span class="or-divider__text text-body-s color-text-secondary">or</span>
                  <span class="or-divider__line"></span>
                </div>
                <Btn v-for="provider in ssoProviders" :key="provider.id" variant="outline" class="sso-btn"
                     :data-testid="`${provider.id}-sso-btn`" :loading="ssoLoading === provider.id"
                     @click="startSso(provider)">
                  <component :is="provider.icon" class="sso-icon" width="18" height="18" />
                  Sign up with {{ provider.name }}
                </Btn>
                <p class="text-footnote sso-terms">
                  By continuing with {{ ssoNames }}, you agree to the
                  <a href="/legal/terms" target="_blank" rel="noopener">Terms of Service</a>
                  and acknowledge the
                  <a href="/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
                </p>
              </template>
            </section>

            <section v-else-if="props.mode === 'login'">
              <div>
                <h2 class="text-h2 color-text-primary">Welcome Back</h2>
                <p class="subtitle text-body-s color-text-primary" data-testid="login-subtitle">
                  {{ shareWaiting ? 'Sign in to add what you shared to your Inbox.' : 'Let\'s get you organized.' }}
                </p>
              </div>
              <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address"
                    v-model:error="emailError"/>
              <Inpt v-model="password" @enter="doLogin" type="password" title="Password" placeholder="Enter your password"
                    v-model:error="passwordError"/>
              <Btn @click="doLogin" :disabled="disableLogin" :loading="auth.loading.value">Sign In</Btn>
              <Lnk text="Forgot your password?" link="Reset it" @action="goToForgot"/>
              <template v-if="ssoEnabled">
                <div class="or-divider">
                  <span class="or-divider__line"></span>
                  <span class="or-divider__text text-body-s color-text-secondary">or</span>
                  <span class="or-divider__line"></span>
                </div>
                <Btn v-for="provider in ssoProviders" :key="provider.id" variant="outline" class="sso-btn"
                     :data-testid="`${provider.id}-sso-btn`" :loading="ssoLoading === provider.id"
                     @click="startSso(provider)">
                  <component :is="provider.icon" class="sso-icon" width="18" height="18" />
                  Sign in with {{ provider.name }}
                </Btn>
                <p class="text-footnote sso-terms">
                  By continuing with {{ ssoNames }}, you agree to the
                  <a href="/legal/terms" target="_blank" rel="noopener">Terms of Service</a>
                  and acknowledge the
                  <a href="/legal/privacy" target="_blank" rel="noopener">Privacy Policy</a>.
                </p>
              </template>
              <div class="separator"></div>
              <Btn class="btn-not-wide" variant="secondary" @click="goToRegister">Create new account</Btn>
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

            <section v-else-if="props.mode === 'forgot-sent'">
              <div>
                <h2 class="text-h2 color-text-primary">Check your inbox</h2>
                <p class="subtitle text-body-s color-text-primary">
                  If an account exists for this email, we sent a link to reset your password. It may take a few minutes to arrive.
                </p>
              </div>
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
    </div>
  </Transition>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import Inpt from './Inpt.vue'
import Btn from './Btn.vue'
import Lnk from './Lnk.vue'
import CloseIcon from '../assets/CloseIcon.vue'
import {isMobileViewport} from '../scripts/core/swipe.js'
import {isValidEmail, isValidPassword} from '../scripts/core/authTools.js'
import {authModel} from '../scripts/core/authModel.js'
import {errorModel} from '../scripts/core/errorModel.js'
import {mapApiError, ErrorScenario} from '../scripts/core/errorMapper.js'
import {isGoogleSsoEnabled, redirectToGoogle} from '../scripts/core/googleSso.js'
import {pendingShare} from '../scripts/core/pendingShare.js'
import {isAppleSsoEnabled, redirectToApple} from '../scripts/core/appleSso.js'
import GoogleIcon from '../assets/GoogleIcon.vue'
import AppleIcon from '../assets/AppleIcon.vue'

const auth = authModel()
const error = errorModel()

const ssoProviders = [
  {id: 'google', name: 'Google', icon: GoogleIcon, enabled: isGoogleSsoEnabled(), redirect: redirectToGoogle},
  {id: 'apple', name: 'Apple', icon: AppleIcon, enabled: isAppleSsoEnabled(), redirect: redirectToApple},
].filter(provider => provider.enabled)
const ssoEnabled = ssoProviders.length > 0
const ssoNames = ssoProviders.map(provider => provider.name).join(' or ')
const ssoLoading = ref(null)

const props = defineProps({
  mode: {
    type: String,
    default: null, // 'login' | 'register' | 'forgot' | 'forgot-sent' | 'reset' | 'verify-sent' | 'unverified' | null
  },
  token: {
    type: String,
    default: '',
  },
  prefillEmail: {
    type: String,
    default: '',
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

const resetToken = ref(props.token || '')
const userId = ref(null)
const shareWaiting = ref(false)

watch(() => props.mode, async (m) => {
  if (m === 'login') shareWaiting.value = await pendingShare().exists()
}, { immediate: true })

watch(() => props.token, (t) => {
  if (t) resetToken.value = t
})

watch(
    [() => props.mode, () => props.prefillEmail],
    ([m, e]) => {
      if ((m === 'register' || m === 'login' || m === 'forgot') && e && !email.value) {
        email.value = e
      }
    },
    { immediate: true }
)

const resending = ref(false)
const resendCooldown = ref(0)
let cooldownTimer = null

const isOpen = computed(() => !!props.mode)

watch(isOpen, (open) => {
  if (!open) {
    clearForm()
    stopCooldown()
    stopVerificationPolling()
    userId.value = null
  }
})

const REVEAL_MARGIN = 20

const backdropEl = ref(null)
const cardEl = ref(null)
const viewport = reactive({ top: null, height: null })
const backdropStyle = computed(() => viewport.height === null
    ? null
    : { top: `${viewport.top}px`, height: `${viewport.height}px` })
let pageLocked = false
let lockedY = 0
let trackingViewport = false

watch(isOpen, (open) => {
  if (open) lockPage()
  else unlockPage({ restore: true })
}, { immediate: true })

watch(() => props.mode, (m, old) => {
  if (m && old && m !== old) nextTick(() => { if (backdropEl.value) backdropEl.value.scrollTop = 0 })
})

// overflow: hidden stops wheel/touch scroll; holdScroll undoes the iOS keyboard-reveal jump it does not stop
function lockPage() {
  if (pageLocked) return
  pageLocked = true
  lockedY = window.scrollY
  const html = document.documentElement
  if (window.innerWidth - html.clientWidth > 0) html.style.scrollbarGutter = 'stable'
  html.style.overflow = 'hidden'
  window.addEventListener('scroll', holdScroll)
  if (!isMobileViewport()) return
  trackingViewport = true
  syncViewport()
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  window.addEventListener('resize', syncViewport)
}

function unlockPage({ restore }) {
  if (!pageLocked) return
  pageLocked = false
  window.removeEventListener('scroll', holdScroll)
  const html = document.documentElement
  html.style.removeProperty('overflow')
  html.style.removeProperty('scrollbar-gutter')
  if (restore) window.scrollTo(0, lockedY)
  if (!trackingViewport) return
  trackingViewport = false
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  window.removeEventListener('resize', syncViewport)
  viewport.top = null
  viewport.height = null
}

function holdScroll() {
  if (window.scrollY !== lockedY) window.scrollTo(0, lockedY)
}

function syncViewport() {
  const vv = window.visualViewport
  viewport.height = vv ? vv.height : window.innerHeight
  viewport.top = vv ? vv.offsetTop : 0
  nextTick(revealFocused)
}

function onCardFocusIn() {
  if (trackingViewport) revealFocused()
}

// Inpt's root <label> holds label, input, footer and error, so the whole field is revealed
function revealFocused() {
  const field = document.activeElement?.closest('label')
  if (field && cardEl.value?.contains(field)) revealInBackdrop(field)
}

function revealInBackdrop(el) {
  const backdrop = backdropEl.value
  if (!el || !backdrop) return
  const b = backdrop.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (r.bottom > b.bottom - REVEAL_MARGIN) backdrop.scrollTop += r.bottom - (b.bottom - REVEAL_MARGIN)
  else if (r.top < b.top + REVEAL_MARGIN) backdrop.scrollTop -= (b.top + REVEAL_MARGIN) - r.top
}

// Mobile: close the keyboard first so the result and the bottom toasts are visible
function blurOnMobile() {
  if (isMobileViewport()) document.activeElement?.blur()
}

function revealFirstError() {
  if (!isMobileViewport()) return
  nextTick(() => revealInBackdrop(
      cardEl.value?.querySelector('.input-error, .agree-checkbox--error')?.closest('label')))
}

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

let verifyPollTimer = null

function onStorageEvent(event) {
  if (event.key === 'auth_token' && event.newValue) {
    auth.isAuthenticated.value = true
    auth.loadUser()
    stopVerificationPolling()
    emit('logged-in')
    closeAll()
  }
}

function startVerificationPolling() {
  stopVerificationPolling()
  if (!userId.value) return

  console.log('[AuthDialog] Verification polling started for user:', userId.value)

  verifyPollTimer = setInterval(async () => {
    try {
      console.log('[AuthDialog] Polling verification status...')
      const data = await auth.checkVerificationStatus(userId.value)
      console.log('[AuthDialog] Verification status:', data.verified)
      if (data.verified) {
        await autoLogin()
      }
    } catch (err) {
      console.log('[AuthDialog] Polling error (will retry):', err.message || err)
    }
  }, 3000)

  window.addEventListener('storage', onStorageEvent)
}

function stopVerificationPolling() {
  if (verifyPollTimer) {
    clearInterval(verifyPollTimer)
    verifyPollTimer = null
  }
  window.removeEventListener('storage', onStorageEvent)
}

async function autoLogin() {
  stopVerificationPolling()
  try {
    await auth.loginUser(email.value, password.value)
    await auth.loadUser()
    emit('logged-in')
    closeAll()
  } catch {
    // Login failed — user can retry manually
  }
}

function startSso(provider) {
  ssoLoading.value = provider.id
  provider.redirect()
}

// Back from the provider restores the page from bfcache with the spinner still on
function onPageShow(event) {
  if (event.persisted) ssoLoading.value = null
}

onMounted(() => {
  window.addEventListener('pageshow', onPageShow)
})

onUnmounted(() => {
  stopVerificationPolling()
  window.removeEventListener('pageshow', onPageShow)
})

onBeforeUnmount(() => {
  unlockPage({ restore: false })
})

async function doResend() {
  if (resendCooldown.value > 0 || !email.value) return
  resending.value = true
  try {
    await auth.resendVerification(email.value)
    error.success('If this email is registered, a new verification link has been sent.')
    startCooldown()
  } catch (err) {
    error.push(err.message || 'Failed to resend verification email.')
  } finally {
    resending.value = false
  }
}

async function doLogin() {
  blurOnMobile()
  clearErrors()

  if (!isValidEmail(email.value)) {
    emailError.value = 'Invalid email'
  }

  if (!isValidPassword(password.value)) {
    passwordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (emailError.value || passwordError.value) {
    revealFirstError()
    return
  }

  try {
    await auth.loginUser(email.value, password.value)
    await auth.loadUser()

    emit('logged-in')
    closeAll()
  } catch (err) {
    if (err.status === 403) {
      userId.value = err.user_id || null
      emit('update:mode', 'unverified')
      startVerificationPolling()
      return
    }
    console.log(err)
    error.push('Login failed with error: ' + mapApiError(err, ErrorScenario.LOGIN))
  }
}

async function doRegister() {
  blurOnMobile()
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
    revealFirstError()
    return
  }

  try {
    const data = await auth.registerUser(email.value, password.value)
    userId.value = data.user_id || null
    emit('update:mode', 'verify-sent')
    startVerificationPolling()
  } catch (err) {
    console.log(err)
    const mapped = mapApiError(err, ErrorScenario.REGISTER)
    error.push('Registration failed with error: ' + mapped)
  }
}

async function doForgot() {
  blurOnMobile()
  clearErrors()

  if (!isValidEmail(email.value)) {
    emailError.value = 'Invalid email'
  }

  if (emailError.value) {
    revealFirstError()
    return
  }

  try {
    await auth.forgotPassword(email.value)
    emit('update:mode', 'forgot-sent')
  } catch (err) {
    console.log(err)
    error.push('Forgot password failed with error: ' + mapApiError(err))
  }
}

async function doReset() {
  blurOnMobile()
  clearErrors()

  if (!isValidPassword(password.value)) {
    passwordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (password.value !== confirm.value) {
    confirmError.value = 'Passwords do not match'
  }

  if (passwordError.value || confirmError.value) {
    revealFirstError()
    return
  }

  try {
    await auth.resetPassword(password.value, resetToken.value)
    goToLogin()
  } catch (err) {
    console.log(err)
    if (err.status === 401) {
      error.push(mapApiError(err, ErrorScenario.RESET_PASSWORD))
      goToForgot()
      return
    }
    error.push('Update password failed with error: ' + mapApiError(err, ErrorScenario.RESET_PASSWORD))
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
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: 40;
}

/* Grows with a card taller than the backdrop, so the card top-aligns and the backdrop scrolls */
.auth-scroll {
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-dialog {
  position: relative;
  margin: 0;
  background: var(--color-popup-background);
  padding: 30px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-auth);
}

.auth-dialog .auth-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--color-text-secondary);
}

.auth-dialog .auth-close:hover:not(:disabled) {
  background: transparent;
  color: var(--color-text-primary);
}

.auth-close-icon {
  width: 18px;
  height: 18px;
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

.agree-checkbox a,
.sso-terms a {
  color: var(--color-link-text);
  text-decoration: underline;
}

.agree-checkbox a:hover,
.sso-terms a:hover {
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

.auth-dialog .sso-btn {
  display: flex;
  background: var(--color-popup-background);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.auth-dialog .sso-btn + .sso-btn {
  margin-top: -8px;
}

.auth-dialog .sso-btn:hover:not(:disabled) {
  background: var(--color-bg-row-hover);
}

.auth-dialog .sso-btn:active {
  background: var(--color-bg-hover);
}

.sso-btn :deep(.base-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sso-icon {
  flex-shrink: 0;
}

.sso-terms {
  margin: -8px 0 0;
  color: var(--color-text-secondary);
  text-align: center;
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

@media (max-width: 768px) {
  .auth-backdrop {
    z-index: 99998;
  }

  /* Close reaches 10px into the content box; equal padding keeps the title centred and clear of it */
  h2 {
    padding: 0 20px;
  }
}

@media (min-width: 769px) {
  /* Desktop header stays above the backdrop: its height (TopNav.vue:404) + 20px */
  .auth-scroll {
    padding-top: calc(64px + 20px);
    padding-bottom: calc(64px + 20px);
  }

  .auth-dialog .auth-close {
    display: none;
  }
}

</style>
