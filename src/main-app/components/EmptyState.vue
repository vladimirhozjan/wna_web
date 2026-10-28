<template>
  <div class="empty-state__art">
    <svg class="empty-state__rings" viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <circle class="empty-state__orbit" cx="80" cy="80" r="76.5" />
      <circle class="empty-state__orbit empty-state__orbit--inner" cx="80" cy="80" r="61" />
      <circle class="empty-state__halo" cx="80" cy="80" r="47" />
      <circle class="empty-state__dot" cx="129.2" cy="21.4" r="3" />
      <circle class="empty-state__dot empty-state__dot--soft" cx="21.4" cy="129.2" r="2" />
      <circle class="empty-state__dot empty-state__dot--faint" cx="23.7" cy="59.1" r="2" />
    </svg>
    <div class="empty-state__coin">
      <component :is="icon" class="empty-state__icon" />
    </div>
  </div>
  <h2 class="text-h3-italic empty-state__title">{{ title }}</h2>
  <p class="text-body-s empty-state__text">{{ text }}</p>
  <Btn v-if="buttonText" variant="primary" size="md" class="empty-state__btn" :disabled="buttonDisabled" :data-testid="buttonTestid" @click="$emit('action')">{{ buttonText }}</Btn>
  <slot />
</template>

<script setup>
import Btn from './Btn.vue'

defineProps({
  icon: { type: Object, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  buttonText: { type: String, default: '' },
  buttonDisabled: { type: Boolean, default: false },
  buttonTestid: { type: String, default: undefined },
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state__art {
  position: relative;
  width: 160px;
  height: 160px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.empty-state__rings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.empty-state__orbit {
  stroke: var(--color-border-light);
  stroke-width: 1;
}

.empty-state__orbit--inner {
  stroke: var(--color-border-medium);
  stroke-dasharray: 1 5;
  stroke-linecap: round;
}

.empty-state__halo {
  fill: var(--color-action-subtle);
}

.empty-state__dot {
  fill: var(--color-action);
}

.empty-state__dot--soft {
  fill: var(--color-action-medium);
  opacity: 0.6;
}

.empty-state__dot--faint {
  fill: var(--color-border-medium);
}

.empty-state__coin {
  position: absolute;
  inset: 26.25%;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 8px 24px var(--color-action-shadow-md), 0 1px 2px var(--color-action-shadow);
}

.empty-state__icon {
  width: 50%;
  height: 50%;
  color: var(--color-action);
  stroke-width: 1.5;
}

.empty-state__title {
  color: var(--color-text-primary-dark);
  margin: 0 0 12px 0;
}

.empty-state__text {
  color: var(--color-text-secondary-light);
  margin: 0;
  max-width: 340px;
  line-height: var(--lh-relaxed);
}

.empty-state__btn {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .empty-state__art {
    width: 120px;
    height: 120px;
  }
}
</style>
