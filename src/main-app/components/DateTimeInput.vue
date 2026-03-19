<template>
  <div class="dti">
    <DateInput
        v-if="withDate"
        ref="dateInputRef"
        :modelValue="date"
        @update:modelValue="$emit('update:date', $event)"
        class="text-body-m dti-field"
        :disabled="disabled"
    />
    <span v-if="!hasTime" class="text-body-m dti-placeholder" @click="onAddTime">Add time...</span>
    <template v-if="hasTime">
      <TimeInput
          :modelValue="time"
          @update:modelValue="$emit('update:time', $event)"
          :disabled="disabled"
      />
      <DurationInput
          v-if="withDuration"
          :modelValue="duration"
          @update:modelValue="$emit('update:duration', $event)"
          :disabled="disabled"
      />
      <button v-if="clearable" type="button" class="text-body-s dti-clear" @click="onClearTime">Clear</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DateInput from './DateInput.vue'
import TimeInput from './TimeInput.vue'
import DurationInput from './DurationInput.vue'

const props = defineProps({
  date: { type: String, default: '' },
  time: { type: [String, null], default: null },
  duration: { type: [Number, null], default: null },
  withDate: { type: Boolean, default: true },
  withDuration: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:date', 'update:time', 'update:duration'])

const dateInputRef = ref(null)
const hasTime = computed(() => !!props.time)

// Auto-set duration when withDuration becomes true and time is set
watch([() => props.withDuration, () => props.time], ([wd, t]) => {
  if (wd && t && !props.duration) {
    emit('update:duration', 30)
  } else if (!wd && props.duration) {
    emit('update:duration', null)
  }
})

function onAddTime() {
  emit('update:time', '09:00')
  if (props.withDuration) {
    emit('update:duration', 30)
  }
}

function onClearTime() {
  emit('update:time', null)
  if (props.withDuration) {
    emit('update:duration', null)
  }
}

function focus() {
  dateInputRef.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.dti {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dti-field {
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
}

.dti-field:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.dti-placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
}

.dti-placeholder:hover {
  background: var(--color-bg-secondary);
}

.dti-clear {
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.dti-clear:hover {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .dti {
    flex-direction: column;
    align-items: stretch;
  }

  .dti-field {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
