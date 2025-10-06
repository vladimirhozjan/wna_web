<template>
  <div class="auth-container">
    <h2>Register</h2>
    <form @submit.prevent="register">
      <input v-model="email" placeholder="Email" type="email" required />
      <input v-model="password" placeholder="Password" type="password" required />
      <input v-model="confirm" placeholder="Confirm Password" type="password" required />
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const confirm = ref('')

const register = async () => {
  console.log('Registering:', email.value)
  // tukaj bo kasneje klic na C++ backend (POST /auth/register)
}
</script>

<style scoped>
.auth-container { max-width: 300px; margin: 60px auto; text-align: center; }
input, button { display: block; width: 100%; margin: 10px 0; padding: 8px; }
</style>