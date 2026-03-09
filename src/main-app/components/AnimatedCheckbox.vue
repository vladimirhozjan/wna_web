<template>
  <label class="animated-checkbox" :class="{ 'animated-checkbox--checked': checked, 'animated-checkbox--disabled': disabled }">
    <input
        type="checkbox"
        class="animated-checkbox__input"
        :checked="checked"
        :disabled="disabled"
        @change="onChange"
    />
    <svg class="animated-checkbox__svg" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
          class="animated-checkbox__box"
          x="1" y="1" width="16" height="16" rx="3"
          stroke-width="1.5"
      />
      <polyline
          class="animated-checkbox__check"
          points="4.5,9.5 7.5,12.5 13.5,6"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
      />
    </svg>
  </label>
</template>

<script setup>
defineProps({
  checked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

function onChange(e) {
  emit('change', e.target.checked)
}
</script>

<style scoped>
.animated-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animated-checkbox--disabled {
  cursor: default;
  opacity: 0.5;
}

.animated-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.animated-checkbox__svg {
  width: 18px;
  height: 18px;
}

.animated-checkbox__box {
  fill: transparent;
  stroke: var(--color-border-medium);
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.animated-checkbox--checked .animated-checkbox__box {
  fill: var(--color-action);
  stroke: var(--color-action);
}

.animated-checkbox__check {
  fill: none;
  stroke: white;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animated-checkbox--checked .animated-checkbox__check {
  stroke-dashoffset: 0;
}

.animated-checkbox--checked {
  animation: checkbox-bounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkbox-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
</style>
