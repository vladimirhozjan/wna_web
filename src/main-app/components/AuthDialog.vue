<template>
  <div v-if="anyOpen" class="auth-backdrop" @click="closeAll">
    <div class="auth-dialog" @click.stop>

      <!-- REGISTER -->
      <section v-if="register">
        <h2 class="text-h2 color-text-primary">Create Your Account</h2>
        <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address" v-model:error="emailError" />
        <Inpt v-model="password" type="password" title="Password" placeholder="Enter your password" footer="Use 8 or more characters with a mix of letters, numbers and symbols" v-model:error="passwordError"/>
        <Inpt v-model="confirm" type="password" title="Confirm password" placeholder="Confirm your password" v-model:error="confirmError" />
        <Btn @click="doRegister" :disabled="disableRegister">Register</Btn>
        <Lnk text="Already have an account?" link="Sign In" @action="$emit('switch-to-login')"/>
      </section>


      <!-- LOGIN -->
      <section v-if="login">
        <h2 class="text-h2 color-text-primary">Welcome Back</h2>
        <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address" v-model:error="emailError" />
        <Inpt v-model="password" type="password" title="Password" placeholder="Enter your password" footer="Use 8 or more characters with a mix of letters, numbers and symbols" v-model:error="passwordError"/>
        <Btn @click="doLogin" :disabled="disableLogin">Sign In</Btn>
        <Lnk text="Forgot your password?" link="Reset it" @action="$emit('switch-to-forgot')"/>
        <div class="separator"></div>
        <Btn class="btn-not-wide" variant="ghost" @click="$emit('switch-to-register')">Create new account</Btn>
      </section>

      <!-- FORGOT -->
      <section v-if="forgot">
        <div>
          <h2 class="text-h2 color-text-primary">Forgot your password?</h2>
          <p class="subtitle text-body-s color-text-primary">No problem. Just enter your email address below and we’ll send you a link to reset it.</p>
        </div>
        <Inpt v-model="email" type="email" title="Email" placeholder="Enter your email address" v-model:error="emailError"/>
        <Btn @click="doForgot" :disabled="disableForgot">Send reset link</Btn>
        <Lnk text="Remember your password?" link="Back to login" @action="$emit('switch-to-login')"/>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Inpt from "./Inpt.vue";
import Btn from "./Btn.vue";
import Lnk from "./Lnk.vue";
import {isValidEmail, isValidPassword} from "../scripts/auth.js";

const props = defineProps({
  login: {
    type: Boolean,
    default: false,
  },
  register: {
    type: Boolean,
    default: false,
  },
  forgot: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:login',
  'update:register',
  'update:forgot',
  'switch-to-login',
  'switch-to-register',
  'switch-to-forgot',
  'logged-in',
  'registered',
  'password-reset-sent',
])

const email = ref('')
const password = ref('')
const confirm = ref('')

const emailError = ref("")
const passwordError = ref("")
const confirmError = ref("")

const anyOpen = computed(() => props.login || props.register || props.forgot)

watch(anyOpen, (open) => {
  if (!open) {
    email.value = ''
    password.value = ''
    confirm.value = ''
  }
})

function closeAll() {
  emit('update:login', false)
  emit('update:register', false)
  emit('update:forgot', false)
}

function doLogin() {
  if (!isValidEmail(email.value)) {
    emailError.value = "Invalid email"
  }

  if (!isValidPassword(password.value)) {
    passwordError.value = "Password must contain letters, numbers and symbols"
  }

  if (emailError.value || passwordError.value) {
    return
  }
  // TODO: call your real login API here
  emit('logged-in', { email: email.value })
  closeAll()
}

function doRegister() {
  if (!isValidEmail(email.value)) {
    emailError.value = "Invalid email"
  }

  if (!isValidPassword(password.value)) {
    passwordError.value = "Password must contain letters, numbers and symbols"
  }

  if (password.value !== confirm.value) {
    confirmError.value = "Passwords do not match"
  }

  if (emailError.value || passwordError.value || confirmError.value) {
    return
  }

  // TODO: call your real registration API here

  emit('registered', { email: email.value })
  closeAll()
}

function doForgot() {
  if (!isValidEmail(email.value)) {
    emailError.value = "Invalid email"
  }

  if (emailError.value || passwordError.value) {
    return
  }

  // TODO: call your real forgot-password API here

  emit('password-reset-sent', { email: email.value })
  closeAll()
}

const disableLogin = computed(() => !email.value || !password.value)
const disableRegister = computed(() => !email.value || !password.value || !confirm.value)
const disableForgot = computed(() => !email.value)

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
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.20);
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

</style>
