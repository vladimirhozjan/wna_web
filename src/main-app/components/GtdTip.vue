<template>
  <transition name="gtd-tip">
    <div v-if="visible" class="gtd-tip" :class="`gtd-tip--${variant}`">
      <div class="gtd-tip__icon" v-if="$slots.icon">
        <slot name="icon" />
      </div>
      <div class="text-body-m gtd-tip__content">
        <slot />
      </div>
      <button v-if="dismissible" class="gtd-tip__close" @click="dismiss" aria-label="Dismiss tip">
        &times;
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { settingsModel } from '../scripts/models/settingsModel.js'

const props = defineProps({
  storageKey: { type: String, required: true },
  dismissible: { type: Boolean, default: true },
  variant: { type: String, default: 'info' },
})

const settings = settingsModel()
const hidden = ref(false)

const visible = computed(() => !hidden.value && !settings.isTipDismissed(props.storageKey))

function dismiss() {
  hidden.value = true
  settings.dismissTip(props.storageKey)
}

defineExpose({ dismiss, visible })
</script>

<style scoped>
.gtd-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg-secondary);
  border-left: 3px solid var(--color-action);
  border-radius: 6px;
  margin: 0 0 16px 0;
}

.gtd-tip--quote {
  border-left-color: var(--color-text-tertiary);
  font-style: italic;
}

.gtd-tip__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--color-action);
}

.gtd-tip--quote .gtd-tip__icon {
  color: var(--color-text-tertiary);
}

.gtd-tip__content {
  flex: 1;
  color: var(--color-text-primary);
  line-height: var(--lh-relaxed);
}

.gtd-tip__close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  line-height: var(--lh-none);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0 2px;
}

.gtd-tip__close:hover {
  color: var(--color-text-primary);
}

.gtd-tip-enter-active,
.gtd-tip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.gtd-tip-enter-from,
.gtd-tip-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
