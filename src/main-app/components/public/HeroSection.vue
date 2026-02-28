<template>
  <section class="hero">
    <div class="hero-inner">
      <h1 class="text-display hero-heading">Capture. Clarify. Organize.<br>Reflect. Engage.</h1>
      <p class="text-subtitle hero-subtitle">Achieve stress-free productivity with the GTD methodology.</p>
      <div class="hero-actions">
        <Btn variant="primary" size="lg" @click="$emit('open-register')">Start Free</Btn>
        <button class="text-body-m fw-semibold hero-ghost-btn" @click="scrollToFeatures">Learn More</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import Btn from '../Btn.vue'

defineEmits(['open-register'])

function scrollToFeatures() {
  const el = document.getElementById('how-it-works')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.hero {
  padding: 60px var(--section-px) 48px;
  background: var(--color-bg-dark);
  text-align: center;
}

.hero-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.hero-heading {
  color: var(--color-text-on-dark);
}

.hero-subtitle {
  color: var(--color-text-on-dark-secondary);
  margin-top: 16px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
  align-items: center;
}

.hero-actions :deep(.base-btn) {
  width: 100%;
  max-width: 320px;
}

.hero-ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 20px;
  color: var(--color-text-on-dark);
  background: transparent;
  border: 1px solid var(--color-text-on-dark-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: 0.15s background, 0.15s border-color;
  width: 100%;
  max-width: 320px;
}

.hero-ghost-btn:hover {
  background: var(--color-on-dark-glass);
  border-color: var(--color-text-on-dark);
}

@media (min-width: 769px) {
  .hero {
    padding: 100px var(--section-px) 80px;
  }

  .hero-actions {
    flex-direction: row;
    justify-content: center;
  }

  .hero-actions :deep(.base-btn),
  .hero-ghost-btn {
    width: auto;
    max-width: none;
  }
}
</style>
