<template>
  <AuthLayout>
    <h2 class="text-body-l fw-semibold color-text-primary page-heading">Set Up Two-Factor Authentication</h2>
    <p class="text-body-s color-text-secondary page-subtext">Scan the QR code with your authenticator app to continue.</p>
  </AuthLayout>
</template>

<script setup>
import AuthLayout from '../layouts/AuthLayout.vue'
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
</style>
