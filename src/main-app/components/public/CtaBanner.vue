<template>
  <section class="cta-banner">
    <div class="cta-inner">
      <h2 class="text-h1 cta-heading">Ready to Take Control?</h2>
      <p class="text-body-m cta-subtitle">Start organizing your life for free today.</p>
      <button class="text-body-m fw-semibold cta-btn" @click="$emit('open-register')">Start Free</button>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-register'])
</script>

<style scoped>
.cta-banner {
  padding: 64px var(--section-px);
  background: linear-gradient(135deg, #164E63 0%, #0E7490 55%, #22D3EE 110%);
  text-align: center;
}

.cta-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.cta-heading {
  color: var(--color-text-inverse);
}

.cta-subtitle {
  color: var(--color-text-on-dark-secondary);
  margin-top: 12px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  padding: 14px 32px;
  background: var(--color-text-inverse);
  color: var(--color-action-dark);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.cta-btn:hover {
  opacity: 0.92;
}

.cta-btn:active {
  transform: scale(0.98);
}

@media (min-width: 769px) {
  .cta-banner {
    padding: 80px var(--section-px);
  }
}
</style>
