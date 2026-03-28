<template>
  <div class="stat">
    <span class="text-caption color-text-secondary stat-label">{{ label }}</span>
    <span class="stat-value" :class="valueClass">{{ displayValue }}</span>
    <span v-if="trend" class="text-caption stat-trend" :class="trendClass">
      {{ trendIcon }} {{ trend }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    default: 0,
  },
  trend: {
    type: String,
    default: '',
  },
  trendDirection: {
    type: String,
    default: 'neutral',
  },
  size: {
    type: String,
    default: 'md',
  },
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const valueClass = computed(() => {
  if (props.size === 'lg') return 'text-h3'
  return 'text-body-l fw-bold'
})

const trendClass = computed(() => {
  if (props.trendDirection === 'up') return 'stat-trend--up'
  if (props.trendDirection === 'down') return 'stat-trend--down'
  return 'stat-trend--neutral'
})

const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return '\u2191'
  if (props.trendDirection === 'down') return '\u2193'
  return ''
})
</script>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  color: var(--color-text-primary);
}

.stat-trend {
  margin-top: 2px;
}

.stat-trend--up {
  color: var(--color-success);
}

.stat-trend--down {
  color: var(--color-danger);
}

.stat-trend--neutral {
  color: var(--color-text-tertiary);
}
</style>
