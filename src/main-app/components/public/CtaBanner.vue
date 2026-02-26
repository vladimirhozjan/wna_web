<template>
  <section class="cta-banner">
    <div class="cta-inner">
      <h2 class="text-h2 cta-heading">Ready to Get Things Done?</h2>
      <p class="text-body-m cta-subtitle">Start organizing your life for free today.</p>
      <button class="cta-btn" @click="$emit('open-register')">Start Free</button>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-register'])
</script>

<style scoped>
.cta-banner {
  padding: 48px var(--section-px);
  background: var(--color-action);
  text-align: center;
}

.cta-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.cta-heading {
  color: #ffffff;
}

.cta-subtitle {
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  padding: 14px 28px;
  background: #ffffff;
  color: var(--color-action);
  font-family: var(--font-family-default), serif;
  font-size: var(--font-size-body-m);
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}

.cta-btn:hover {
  opacity: 0.92;
  transform: scale(1.02);
}

.cta-btn:active {
  transform: scale(0.98);
}
</style>
