<template>
  <div class="celebration" :class="{ 'celebration--fading': fading }" @click="dismiss">
    <div class="celebration__check">
      <CompletedIcon class="celebration__icon" />
    </div>
    <h2 class="text-h3 celebration__title">{{ title }}</h2>
    <p class="text-body-m celebration__subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
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
  cursor: pointer;
}

.celebration--fading {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.celebration__check {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-success-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  animation: check-bloom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.celebration__icon {
  width: 32px;
  height: 32px;
  color: var(--color-success);
  animation: check-draw 0.4s ease 0.2s both;
}

.celebration__title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
  animation: celebration-text-in 0.4s ease 0.3s both;
}

.celebration__subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  animation: celebration-text-in 0.4s ease 0.45s both;
}

@keyframes check-bloom {
  0% { transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes check-draw {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes celebration-text-in {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>
