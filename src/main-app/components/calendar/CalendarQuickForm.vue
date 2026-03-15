<template>
  <div class="quick-form" @click.stop>
    <input
        ref="inputRef"
        v-model="title"
        type="text"
        class="quick-form__input"
        placeholder="New action..."
        @keydown.enter="onSubmit"
        @keydown.esc="onCancel"
    />
    <div class="quick-form__options">
      <label class="text-footnote quick-form__radio">
        <input type="radio" v-model="deferType" value="scheduled" />
        <span>Scheduled</span>
      </label>
      <label class="text-footnote quick-form__radio">
        <input type="radio" v-model="deferType" value="start" />
        <span>Start after</span>
      </label>
      <input
          v-if="deferType === 'start'"
          type="date"
          v-model="dueDate"
          class="text-footnote quick-form__due-input"
          placeholder="Due date"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const title = ref('')
const deferType = ref('scheduled')
const dueDate = ref('')
const inputRef = ref(null)
const submitted = ref(false)

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})

function onSubmit() {
  if (submitted.value) return
  const trimmedTitle = title.value.trim()
  if (trimmedTitle) {
    submitted.value = true
    emit('submit', {
      title: trimmedTitle,
      date: props.date,
      time: props.time,
      deferType: deferType.value,
      dueDate: deferType.value === 'start' ? (dueDate.value || null) : null,
    })
  } else {
    emit('cancel')
  }
}

function onCancel() {
  if (submitted.value) return
  emit('cancel')
}
</script>

<style scoped>
.quick-form {
  padding: 2px;
  box-sizing: border-box;
  width: 100%;
}

.quick-form__input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--color-action);
  border-radius: 4px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  outline: none;
  box-sizing: border-box;
}

.quick-form__input::placeholder {
  color: var(--color-text-tertiary);
}

.quick-form__options {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.quick-form__radio {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.quick-form__radio input[type="radio"] {
  margin: 0;
}

.quick-form__due-input {
  padding: 2px 4px;
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  font-family: var(--font-family-default);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  outline: none;
}
</style>
