<template>
  <LandingLayout @open-login="openLogin" @open-register="openRegister">
    <section class="section">
      <div class="section-inner">
        <h1 class="text-h1 color-text-primary">Help &amp; Resources</h1>
        <p class="text-body-m" style="color: var(--color-text-secondary); margin-top: 12px;">Coming soon.</p>
      </div>
    </section>
  </LandingLayout>
</template>

<script setup>
import LandingLayout from '../../layouts/LandingLayout.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function openLogin() {
  router.push({ name: 'login' })
}

function openRegister() {
  router.push({ name: 'register' })
}
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  text-align: center;
}
.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}
@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}
</style>