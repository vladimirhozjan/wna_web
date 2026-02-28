<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">Do it now</h3>
    <p class="clarify-step-hint">{{ title }}</p>

    <div class="stopwatch">
      <span class="stopwatch-time">{{ formattedTime }}</span>
    </div>

    <div class="clarify-form-actions">
      <Btn
          variant="primary"
          size="md"
          :loading="loading"
          :disabled="loading"
          @click="$emit('done')"
      >
        Done
      </Btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Btn from '../Btn.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['done'])

const elapsed = ref(0)
let timer = null

const formattedTime = computed(() => {
  const mins = Math.floor(elapsed.value / 60)
  const secs = elapsed.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

onMounted(() => {
  timer = setInterval(() => {
    elapsed.value++
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.clarify-step {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}

.clarify-step-question {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
}

.clarify-step-hint {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0 0 32px 0;
}

.stopwatch {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.stopwatch-time {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-icon-jumbo);
  font-weight: var(--font-weight-light);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.clarify-form-actions {
  display: flex;
  justify-content: center;
}
</style>
