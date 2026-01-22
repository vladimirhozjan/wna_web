<template>
  <label>
    <span class="text-label color-text-primary" v-if="props.title">{{ props.title }}</span>
    <input
        ref="input_ref"
        v-model="model_value"
        :placeholder="props.placeholder"
        :type="props.type"
        class="text-body-m color-text-primary"
        :class="{ 'input-error': error }"
        @input="handleInput"
        @keydown.enter="$emit('enter')"
    />
    <span class="text-footnote color-text-primary" v-if="props.footer">{{ props.footer }}</span>
    <span class="text-footnote color-text-error" v-if="error">{{ error }}</span>
  </label>
</template>

<script setup>
import {ref, defineExpose} from "vue";

const model_value = defineModel()
const error = defineModel('error', {default: ''})
const input_ref = ref()

const props = defineProps({
  title: String,
  placeholder: String,
  footer: String,
  type: {
    type: String,
    required: true,
  }
})

function handleInput() {
  error.value = ''
}

defineEmits(['enter'])

defineExpose({
  focus() {
    input_ref.value && input_ref.value.focus()
  }
})

</script>

<style scoped>
label {
  display: flex;
  flex-direction: column;
  width: 100%;
}

span {
  margin: 0;
}

input {
  margin-top: 8px;
  margin-bottom: 4px;
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
}

input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

input::placeholder {
  color: var(--color-text-prefill);
}

input.input-error {
  border-color: var(--color-input-border-error);
  background: var(--color-input-background-error);
}

</style>