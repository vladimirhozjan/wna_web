<template>
  <div v-if="anyOpen" class="auth-backdrop" @click="closeAll">
    <div class="auth-dialog" @click.stop>
      <!-- LOGIN -->
      <section v-if="login">
        <h2>Login</h2>
        <label>
          <span>Email</span>
          <input v-model="email" placeholder="you@example.com" type="email" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" placeholder="••••••••" type="password" />
        </label>
        <button class="btn primary" @click="doLogin">Login</button>
        <button class="btn ghost" @click="closeAll">Cancel</button>
        <p class="auth-links">
          <a href="#" @click.prevent="$emit('switch-to-forgot')">Forgot password?</a>
        </p>
        <p class="auth-links">
          <a href="#" @click.prevent="$emit('switch-to-register')">Create an account</a>
        </p>
      </section>

      <!-- REGISTER -->
      <section v-if="register">
        <h2>Sign up</h2>
        <label>
          <span>Email</span>
          <input v-model="email" placeholder="you@example.com" type="email" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" placeholder="Choose a strong password" type="password" />
        </label>
        <button class="btn primary" @click="doRegister">Register</button>
        <button class="btn ghost" @click="closeAll">Cancel</button>
        <p class="auth-links">
          <a href="#" @click.prevent="$emit('switch-to-login')">Already have an account?</a>
        </p>
      </section>

      <!-- FORGOT -->
      <section v-if="forgot">
        <h2>Reset password</h2>
        <label>
          <span>Email</span>
          <input v-model="email" placeholder="you@example.com" type="email" />
        </label>
        <button class="btn primary" @click="doForgot">Send reset link</button>
        <button class="btn ghost" @click="closeAll">Cancel</button>
        <p class="auth-links">
          <a href="#" @click.prevent="$emit('switch-to-login')">Back to login</a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const anyOpen = computed(() => props.login || props.register || props.forgot)

watch(anyOpen, (open) => {
  if (!open) {
    email.value = ''
    password.value = ''
  }
})

function closeAll() {
  emit('update:login', false)
  emit('update:register', false)
  emit('update:forgot', false)
}

function doLogin() {
  // TODO: call your real login API here
  emit('logged-in', { email: email.value })
  closeAll()
}

function doRegister() {
  // TODO: call your real registration API here
  emit('registered', { email: email.value })
  closeAll()
}

function doForgot() {
  // TODO: call your real forgot-password API here
  emit('password-reset-sent', { email: email.value })
  closeAll()
}
</script>

<style scoped>
.auth-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-popup-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.auth-dialog {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.25);
}

h2 {
  margin-bottom: 16px;
  font-size: 20px;
}

label {
  display: block;
  text-align: left;
  margin-bottom: 12px;
}

label span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #555;
}

input {
  width: 100%;
  padding: 9px 10px;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.auth-links {
  margin-top: 10px;
  font-size: 13px;
}

.auth-links a {
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;
}

.auth-links a:hover {
  text-decoration: underline;
}
</style>
