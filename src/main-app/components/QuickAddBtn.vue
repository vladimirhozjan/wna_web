<template>
  <div class="quick-add">
    <button v-if="!expanded" class="quick-add-btn" @click="expand">
      <span class="quick-add-icon">+</span>
      <span class="quick-add-label">Quick Add</span>
    </button>
    <input
      v-else
      ref="inputRef"
      v-model="title"
      class="quick-add-input"
      type="text"
      placeholder="Add new stuff"
      @keydown.enter="submit"
      @keydown.escape="collapse"
      @blur="collapse"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";

const emit = defineEmits(["add"]);

const expanded = ref(false);
const title = ref("");
const inputRef = ref(null);

function expand() {
  expanded.value = true;
  nextTick(() => inputRef.value?.focus());
}

function collapse() {
  expanded.value = false;
  title.value = "";
}

function submit() {
  const t = title.value.trim();
  if (!t) return;
  emit("add", t);
  title.value = "";
}
</script>

<style scoped>
.quick-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
  background: var(--color-btn-ghost-bg);
  color: var(--color-btn-ghost-text);
  font-size: var(--font-size-body-s);
  font-family: var(--font-family-default);
  cursor: text;
  white-space: nowrap;
  transition: background 0.15s;
  min-width: 200px;
}

.quick-add-btn:hover {
  background: var(--color-btn-ghost-hover);
}

.quick-add-icon {
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  color: var(--color-btn-ghost-text);
}

.quick-add-input {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
  background: var(--color-btn-ghost-bg);
  color: var(--color-text-primary);
  font-size: var(--font-size-body-s);
  font-family: var(--font-family-default);
  outline: none;
  width: 200px;
}

.quick-add-input:focus {
  border-color: var(--color-input-border-focus);
}

@media (max-width: 768px) {
  .quick-add-label {
    display: none;
  }

  .quick-add-btn {
    padding: 8px 10px;
    min-width: unset;
  }

  .quick-add {
    position: static;
  }

  .quick-add-input {
    position: fixed;
    top: 6px;
    left: 60px;
    right: 48px;
    width: auto;
    z-index: 10;
  }
}
</style>
