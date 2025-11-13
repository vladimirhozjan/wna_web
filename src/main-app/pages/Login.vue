<template>
  <div class="auth-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input v-model="email" placeholder="Email" type="email" required />
      <input v-model="password" placeholder="Password" type="password" required />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const login = async () => {
  console.log('Logging in:', email.value)
}
</script>

<style scoped>
.auth-container { max-width: 300px; margin: 60px auto; text-align: center; }
input, button { display: block; width: 100%; margin: 10px 0; padding: 8px; }
</style>