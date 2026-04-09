<template>
  <component :is="icon" class="empty-state__icon" />
  <h2 class="text-h3-italic empty-state__title">{{ title }}</h2>
  <p class="text-body-s empty-state__text">{{ text }}</p>
  <Btn v-if="buttonText" variant="primary" size="md" class="empty-state__btn" @click="$emit('action')">{{ buttonText }}</Btn>
  <slot />
</template>

<script setup>
import Btn from './Btn.vue'

defineProps({
  icon: { type: Object, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  buttonText: { type: String, default: '' },
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state__icon {
  width: 50px;
  height: 50px;
  color: var(--color-action);
  margin-bottom: 36px;
  stroke-width: 1;
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
</style>
