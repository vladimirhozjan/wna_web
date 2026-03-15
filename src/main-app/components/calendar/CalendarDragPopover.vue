<template>
  <Teleport to="body">
    <div class="drag-popover-backdrop" @click="onCancel"></div>
    <div class="drag-popover" :style="positionStyle" ref="popoverRef">
      <button class="text-body-s drag-popover__option drag-popover__option--scheduled" @click="onSelect('scheduled')">
        Scheduled for {{ formattedDate }}
      </button>
      <button class="text-body-s drag-popover__option drag-popover__option--start" @click="onSelect('start')">
        Start after {{ formattedDate }}
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { formatShortDate } from '../../scripts/core/dateUtils.js'

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['select', 'cancel'])

const popoverRef = ref(null)

const formattedDate = computed(() => formatShortDate(props.date))

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))

onMounted(() => {
  nextTick(() => {
    if (!popoverRef.value) return
    const rect = popoverRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Adjust if overflowing right or bottom
    if (rect.right > vw) {
      popoverRef.value.style.left = `${vw - rect.width - 8}px`
    }
    if (rect.bottom > vh) {
      popoverRef.value.style.top = `${vh - rect.height - 8}px`
    }
  })
})

function onSelect(type) {
  emit('select', type)
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.drag-popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.drag-popover {
  position: fixed;
  z-index: 1000;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-dropdown);
  padding: 4px;
  min-width: 180px;
}

.drag-popover__option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  color: var(--color-text-primary);
  font-family: var(--font-family-default);
  transition: background 0.15s;
}

.drag-popover__option:hover {
  background: var(--color-bg-hover);
}

.drag-popover__option--scheduled:hover {
  color: var(--color-calendar-scheduled-text);
}

.drag-popover__option--start:hover {
  color: var(--color-calendar-start-text);
}
</style>
