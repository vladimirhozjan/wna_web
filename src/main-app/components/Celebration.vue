<template>
  <div class="celebration" :class="{ 'celebration--fading': fading }" @click="dismiss">
    <EmptyState :icon="CompletedIcon" :title="title" :text="subtitle" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import EmptyState from './EmptyState.vue'
import CompletedIcon from '../assets/CompletedIcon.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const emit = defineEmits(['dismiss'])

const fading = ref(false)
let celebrationTimer = null
let fadeTimer = null

function dismiss() {
  if (fading.value) return
  clearTimeout(celebrationTimer)
  fading.value = true
  fadeTimer = setTimeout(() => emit('dismiss'), 300)
}

onMounted(() => {
  celebrationTimer = setTimeout(dismiss, 3000)
})

onUnmounted(() => {
  clearTimeout(celebrationTimer)
  clearTimeout(fadeTimer)
})
</script>

<style scoped>
.celebration {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
}

.celebration--fading {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.celebration :deep(.empty-state__art) {
  animation: celebration-bloom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.celebration :deep(.empty-state__title) {
  animation: celebration-text-in 0.4s ease 0.3s both;
}

.celebration :deep(.empty-state__text) {
  animation: celebration-text-in 0.4s ease 0.45s both;
}

@keyframes celebration-bloom {
  0% { transform: scale(0); }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes celebration-text-in {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>
