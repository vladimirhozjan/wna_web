<template>
  <component :is="illustration" class="empty-state__illustration" :class="'empty-state__illustration--' + size" />
  <h2 class="text-h3-italic empty-state__title">{{ title }}</h2>
  <p class="text-body-s empty-state__text">{{ text }}</p>
  <Btn v-if="buttonText" variant="primary" size="md" class="empty-state__btn" :disabled="buttonDisabled" @click="$emit('action')">{{ buttonText }}</Btn>
  <slot />
</template>

<script setup>
import Btn from './Btn.vue'

defineProps({
  illustration: { type: Object, required: true },
  size: { type: String, default: 'md' },
  title: { type: String, required: true },
  text: { type: String, required: true },
  buttonText: { type: String, default: '' },
  buttonDisabled: { type: Boolean, default: false },
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state__illustration {
  flex-shrink: 0;
  margin-bottom: 24px;
}

.empty-state__illustration--md {
  width: 160px;
  height: 160px;
}

.empty-state__illustration--sm {
  width: 80px;
  height: 80px;
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
  .empty-state__illustration--md {
    width: 120px;
    height: 120px;
  }
}
</style>
