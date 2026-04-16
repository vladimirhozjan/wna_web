<template>
  <button
      v-if="!loading"
      :class="classes"
      @click="$emit('click', $event)"
  >
    <slot>
      <CloseIcon width="14" height="14" />
    </slot>
  </button>
  <Spinner v-else :size="14" />
</template>

<script setup>
import { computed } from 'vue'
import CloseIcon from '../assets/CloseIcon.vue'
import Spinner from './Spinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'danger' // danger, primary, default
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const classes = computed(() => [
  'action-btn',
  props.variant === 'danger' ? 'action-btn--danger' : '',
  props.variant === 'primary' ? 'action-btn--primary' : ''
])
</script>

<style scoped>
.action-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-size-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger-soft);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
}

.action-btn--primary {
  color: var(--color-action);
}

.action-btn--primary:hover {
  background: var(--color-action-bg-light);
}

</style>
