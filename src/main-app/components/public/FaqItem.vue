<template>
  <div :class="['faq-item', { 'faq-item--open': open }]">
    <button class="faq-question" @click="open = !open">
      <span class="text-body-m faq-question__text">{{ question }}</span>
      <ChevronDownIcon class="faq-chevron" />
    </button>
    <Transition name="faq-expand">
      <div v-if="open" class="faq-answer">
        <p class="text-body-s faq-answer__text">{{ answer }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChevronDownIcon from '../../assets/ChevronDownIcon.vue'

defineProps({
  question: { type: String, required: true },
  answer: { type: String, required: true },
})

const open = ref(false)
</script>

<style scoped>
.faq-item {
  border: var(--card-border);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
  font-family: var(--font-family-default), serif;
}

.faq-question__text {
  font-weight: var(--font-weight-semibold);
}

.faq-chevron {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
}

.faq-item--open .faq-chevron {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 20px 16px;
}

.faq-answer__text {
  color: var(--color-text-secondary);
  line-height: 160%;
}

/* Expand/collapse transition */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  max-height: 500px;
  overflow: hidden;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>