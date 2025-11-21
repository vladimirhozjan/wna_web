<template>
  <label>
    <span class="text-label color-text-primary" v-if="props.title">{{ props.title }}</span>
    <input
        v-model="model_value"
        :placeholder="props.placeholder"
        :type="props.type"
        class="text-body-m color-text-primary"
        :class="{ 'input-error': props.error }"
    />
    <span class="text-footnote color-text-primary" v-if="props.footer">{{ props.footer }}</span>
    <span class="text-footnote color-error-text" v-if="props.error">{{ props.error }}</span>
  </label>
</template>

<script setup>
const model_value = defineModel()

const props = defineProps({
  title: String,
  placeholder: String,
  footer: String,
  type: {
    type: String,
    required: true,
  },
  error: String
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