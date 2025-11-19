<template>
  <div class="landing-layout">
    <TopNav
      :authenticated="false"
      @open-login="$emit('open-login')"
      @open-register="$emit('open-register')"
    />

    <main class="landing-container">
      <slot />
    </main>
  </div>
</template>

<script setup>
import TopNav from '../components/TopNav.vue'

defineEmits(['open-login', 'open-register'])

</script>

<style scoped>
.landing-container {
  max-width: 900px;
  margin: 80px auto;
  text-align: center;
  padding: 0 16px;
}
</style>
