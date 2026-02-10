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
        @blur="onBlur"
    />
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
      time: props.time
    })
  } else {
    emit('cancel')
  }
}

function onCancel() {
  if (submitted.value) return
  emit('cancel')
}

function onBlur() {
  if (submitted.value) return
  const trimmedTitle = title.value.trim()
  if (trimmedTitle) {
    submitted.value = true
    emit('submit', {
      title: trimmedTitle,
      date: props.date,
      time: props.time
    })
  } else {
    emit('cancel')
  }
}
</script>

<style scoped>
.quick-form {
  padding: 2px;
}

.quick-form__input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--color-action);
  border-radius: 4px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-form__input::placeholder {
  color: var(--color-text-tertiary);
}
</style>
