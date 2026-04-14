<template>
  <section class="hero">
    <div class="hero-bg-overlay">
      <div class="hero-inner">
        <BoltIcon class="hero-bolt" />
        <h1 class="text-display hero-heading">Stress-Free Productivity</h1>
        <p class="text-body-m hero-subtitle">With a system you can trust.</p>
        <div class="hero-actions">
          <Btn variant="primary" size="lg" @click="$emit('open-register')">Start Free</Btn>
          <button class="text-body-m fw-semibold hero-ghost-btn" @click="scrollToFeatures">Learn More</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Btn from '../Btn.vue'
import BoltIcon from '../../assets/BoltIcon.vue'

defineEmits(['open-register'])

function scrollToFeatures() {
  const el = document.getElementById('how-it-works')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.hero {
  background: url('../../assets/hero-bg.png') center / cover no-repeat;
  background-color: var(--color-action-dark);
  text-align: center;
}

.hero-bg-overlay {
  padding: 80px var(--section-px) 64px;
  min-height: 350px;
  background-color: rgba(22, 78, 99, 0.75);
}

.hero-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.hero-bolt {
  width: 64px;
  height: 64px;
  color: var(--color-text-on-dark);
  margin-bottom: 36px;
}

.hero-heading {
  color: var(--color-text-on-dark);
}

.hero-subtitle {
  color: var(--color-text-on-dark);
  margin-top: 16px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
  align-items: center;
}

.hero-actions {
  --color-btn-primary-bg: #0891B2;
  --color-btn-primary-hover: #0e7490;
  --color-btn-primary-active: #155e75;
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
  border: 1px solid var(--color-text-on-dark);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.15s background, 0.15s border-color;
  width: 100%;
  max-width: 320px;
}

.hero-ghost-btn:hover {
  background: var(--color-on-dark-glass);
}

@media (min-width: 769px) {
  .hero-bg-overlay {
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
