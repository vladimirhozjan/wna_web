<template>
  <button
      :class="classes"
      :disabled="disabled"
      v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, ghost, danger
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})

const classes = computed(() => ([
  'base-btn',
  `base-btn--${props.variant}`,
  `base-btn--${props.size}`,
  { 'base-btn--disabled': props.disabled }
]))

</script>

<style scoped>
.base-btn {
  font-family: var(--font-family-default),serif;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  transition: 0.15s background, 0.15s color, 0.15s border;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* SIZES */
.base-btn--sm {
  padding: 6px 12px;
  font-size: var(--font-size-body-s);
}

.base-btn--md {
  padding: 10px 16px;
  font-size: var(--font-size-body-s);
}

.base-btn--lg {
  padding: 14px 20px;
  font-size: var(--font-size-body-m);
}

/* VARIANTS */
.base-btn--primary {
  background: #4185DE;
  font-weight: 600;
  color: #FFFFFF;
}
.base-btn--primary:hover {
  background: #236ac7;
}
.base-btn--primary:active {
  background: #1c539c;
}
.base-btn--primary:disabled {
  background: #acbfd7;
  color: #f2f2f2;
}

.base-btn--ghost {
  background: #ecf3fc;
  border: 1px solid #c6daf6;
  color: #356dc0;
  font-weight: 600;
}
.base-btn--ghost:hover {
  background: #c1d8f5;
}
.base-btn--ghost:active {
  background: #95bcee;
}
.base-btn--ghost:disabled {
  background: #f1f4f8;
  color: #95a9c6;
  border: 1px solid #d2dce9;
}

.base-btn--danger {
  background: #ef4444;
  color: #FFFFFF;
  font-weight: 700;
}
.base-btn--danger:hover {
  background: #eb1414;
}
.base-btn--danger:active {
  background: #bc1010;
}
.base-btn--danger:disabled {
  background: #e1b7b7;
  color: #f2f2f2;
}


.base-btn--disabled,
.base-btn:disabled {
  cursor: not-allowed;
  pointer-events: none;
}

</style>
