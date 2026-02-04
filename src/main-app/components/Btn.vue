<template>
  <button
      :class="classes"
      :disabled="disabled"
      v-bind="$attrs"
  >
    <!-- Loader -->
    <span v-if="loading" class="base-btn__loader"></span>

    <!-- Button content -->
    <span class="base-btn__content">
      <slot />
    </span>
  </button>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, ghost, danger, ghost-danger, icon, link
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  }
})

const classes = computed(() => ([
  'base-btn',
  `base-btn--${props.variant}`,
  `base-btn--${props.size}`,
  {
    'base-btn--disabled': props.disabled,
    'base-btn--loading': props.loading
  }
]))

</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.base-btn {
  position: relative;
  font-family: var(--font-family-default),serif;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: 0.15s background, 0.15s color, 0.15s border;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.base-btn__loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-btn-loader-fade-1);
  border-top-color: var(--color-btn-loader-top);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
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
  background: var(--color-btn-primary-bg);
  font-weight: 600;
  color: var(--color-btn-primary-text);
}
.base-btn--primary:hover:not(:disabled) {
  background: var(--color-btn-primary-hover);
}
.base-btn--primary:active {
  background: var(--color-btn-primary-active);
}
.base-btn--primary:disabled {
  background: var(--color-btn-primary-dis-bg);
  color: var(--color-btn-primary-dis-txt);
}

.base-btn--ghost {
  background: var(--color-btn-ghost-bg);
  color: var(--color-btn-ghost-text);
  border: 1px solid var(--color-btn-ghost-border);
  font-weight: 600;
}
.base-btn--ghost:hover:not(:disabled) {
  background: var(--color-btn-ghost-hover);
}
.base-btn--ghost:active {
  background: var(--color-btn-ghost-active);
}
.base-btn--ghost:disabled {
  background: var(--color-btn-ghost-dis-bg);
  color: var(--color-btn-ghost-dis-txt);
  border: 1px solid var(--color-btn-ghost-dis-brd);
}

.base-btn--danger {
  background: var(--color-btn-danger-bg);
  color: var(--color-btn-danger-text);
  font-weight: 700;
}
.base-btn--danger:hover:not(:disabled) {
  background: var(--color-btn-danger-hover);
}
.base-btn--danger:active {
  background: var(--color-btn-danger-active);
}
.base-btn--danger:disabled {
  background: var(--color-btn-danger-dis-bg);
  color: var(--color-btn-danger-dis-txt);
}

.base-btn--ghost-danger {
  background: var(--color-btn-ghost-danger-bg);
  color: var(--color-btn-ghost-danger-text);
  border: 1px solid var(--color-btn-ghost-danger-border);
  font-weight: 600;
}
.base-btn--ghost-danger:hover:not(:disabled) {
  background: var(--color-btn-ghost-danger-hover);
}
.base-btn--ghost-danger:active {
  background: var(--color-btn-ghost-danger-active);
}
.base-btn--ghost-danger:disabled {
  background: var(--color-btn-ghost-danger-dis-bg);
  color: var(--color-btn-ghost-danger-dis-txt);
  border: 1px solid var(--color-btn-ghost-danger-dis-brd);
}

.base-btn--icon {
  background: transparent;
  color: var(--color-action);
  padding: 4px 6px;
  min-width: unset;
  user-select: none;
}
.base-btn--icon:hover:not(:disabled) {
  background: var(--color-btn-ghost-bg);
  color: var(--color-action);
}
.base-btn--icon:active {
  background: var(--color-btn-ghost-hover);
}
.base-btn--icon:disabled {
  color: var(--color-text-tertiary);
}

.base-btn--link {
  background: transparent;
  color: var(--color-link-text);
  font-weight: 500;
  padding: 4px 8px;
}
.base-btn--link:hover:not(:disabled) {
  background: var(--color-btn-ghost-bg);
  color: var(--color-link-hover);
}
.base-btn--link:active {
  background: var(--color-btn-ghost-hover);
}
.base-btn--link:disabled {
  color: var(--color-text-tertiary);
}

.base-btn--disabled,
.base-btn:disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.base-btn--loading {
  cursor: wait;
  pointer-events: none;
  opacity: 0.8;
}

</style>
