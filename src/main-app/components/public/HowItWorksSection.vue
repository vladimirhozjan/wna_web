<template>
  <section class="section" id="how-it-works">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">How It Works</h2>
      <div class="steps">
        <div v-for="(step, i) in steps" :key="step.title" class="step">
          <div class="step-number">{{ i + 1 }}</div>
          <h3 class="text-h4">{{ step.title }}</h3>
          <p class="text-body-s step-desc">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const steps = [
  {
    title: 'Capture',
    description: 'Dump everything on your mind into the inbox. Don\'t filter, don\'t organize — just get it out of your head.',
  },
  {
    title: 'Clarify',
    description: 'Process each item: Is it actionable? What\'s the next step? Our guided wizard walks you through it.',
  },
  {
    title: 'Engage',
    description: 'Work from your Next Actions list with confidence, knowing nothing is falling through the cracks.',
  },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-primary);
  text-align: center;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 40px;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-action);
  color: #ffffff;
  font-family: var(--font-family-default), serif;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step .text-h4 {
  margin-top: 16px;
}

.step-desc {
  color: var(--color-text-secondary);
  margin-top: 8px;
  max-width: 280px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .steps {
    flex-direction: row;
    justify-content: center;
    gap: 0;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
  }

  .step {
    flex: 1;
  }

  /* Connector line behind the circles */
  .steps::before {
    content: '';
    position: absolute;
    top: 24px;
    left: calc(100% / 6);
    right: calc(100% / 6);
    height: 2px;
    background: var(--color-border-light);
    z-index: 0;
  }
}
</style>
