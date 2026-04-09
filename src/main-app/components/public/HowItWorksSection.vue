<template>
  <section class="section" id="how-it-works">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">How It Works</h2>
      <p class="text-body-m section-subtitle">Five simple steps to a clear mind.</p>
      <div class="steps">
        <div v-for="(step, i) in steps" :key="step.title" class="step">
          <div class="step-left">
            <div class="step-number">{{ i + 1 }}</div>
            <div v-if="i < steps.length - 1" class="step-line"></div>
          </div>
          <div class="step-body">
            <h3 class="text-h2 color-text-primary">{{ step.title }}</h3>
            <p class="text-body-s step-desc">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const steps = [
  {
    title: 'Capture',
    description: 'Dump everything on your mind into the Inbox. Don\'t filter, just get it out of your head.',
  },
  {
    title: 'Clarify',
    description: 'Process each item: Is it actionable? Our guided wizard walks you through it.',
  },
  {
    title: 'Organize',
    description: 'Place each item where it belongs — Next Actions, Projects, Calendar, Waiting For, Someday, or Reference.',
  },
  {
    title: 'Reflect',
    description: 'Do a Weekly Review to keep your system current, complete, and trustworthy.',
  },
  {
    title: 'Engage',
    description: 'Work from your Next Actions list with confidence, knowing nothing is falling through.',
  },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-primary);
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
  text-align: center;
}

.section-subtitle {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.steps {
  display: flex;
  flex-direction: column;
  margin-top: 40px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}

.step {
  display: flex;
  align-items: stretch;
  text-align: left;
}

.step-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 100px;
  margin-right: 20px;
}

.step-number {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #164E63 0%, #0E7490 60%, #22D3EE 100%);
  color: var(--color-text-inverse);
  font-size: var(--font-size-icon-jumbo);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-line {
  width: 3px;
  flex: 1;
  background: linear-gradient(180deg, #22D3EE 0%, #0E7490 60%, #164E63 100%);
}

.step-body {
  padding-bottom: 64px;
  padding-top: 14px;
}

.step:last-child .step-body {
  padding-bottom: 0;
}

.step-desc {
  color: var(--color-text-secondary-light);
  margin-top: 6px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }
}
</style>
