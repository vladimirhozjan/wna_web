<template>
  <div class="quick-add">
    <button v-if="!expanded" class="text-body-s quick-add-btn" @click="expand">
      <span class="quick-add-icon">+</span>
      <span class="quick-add-label">Quick Add</span>
    </button>
    <input
      v-else
      ref="inputRef"
      v-model="title"
      class="text-body-s quick-add-input"
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
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--color-btn-ghost-border);
  background: var(--color-bg-accent-light);
  color: var(--color-action);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
}

.quick-add-btn:hover {
  opacity: 0.85;
}

.quick-add-icon {
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  color: var(--color-action);
}

.quick-add-input {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--color-btn-ghost-border);
  background: var(--color-bg-accent-light);
  color: var(--color-text-primary);
  outline: none;
  width: 200px;
  font-size: 13px;
  font-family: inherit;
}

.quick-add-input:focus {
  border-color: var(--color-action);
}

@media (max-width: 768px) {
  .quick-add-label {
    display: none;
  }

  .quick-add-btn {
    padding: 6px 10px;
  }

  .quick-add {
    position: static;
  }

  .quick-add-input {
    position: fixed;
    top: 12px;
    left: 58px;
    right: 50px;
    width: auto;
    z-index: 10;
    background: var(--color-bg-primary);
  }
}
</style>
