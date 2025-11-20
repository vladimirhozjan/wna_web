<template>
  <button
      :class="[
      'base-btn',
      `base-btn--${variant}`,
      `base-btn--${size}`
    ]"
      v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, ghost, danger
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  }
})
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


.base-btn--danger {
  background: #ef4444;
  color: #FFFFFF;
  font-weight: 700;
}
.base-btn--danger:hover {
  background: #d41111;
}
</style>
