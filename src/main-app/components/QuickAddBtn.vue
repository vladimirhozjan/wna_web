<template>
  <div class="quick-add">
    <button v-if="!expanded" class="text-body-s quick-add-btn" @click="expand">
      <span class="quick-add-icon">+</span>
      <span class="quick-add-label">Quick Add</span>
    </button>
    <CaptureBar v-else ref="barRef" variant="quick" @close="collapse" />
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import CaptureBar from "./CaptureBar.vue";

const expanded = ref(false);
const barRef = ref(null);

function expand() {
  expanded.value = true;
  nextTick(() => barRef.value?.focus());
}

function collapse() {
  expanded.value = false;
}

defineExpose({ expand });
</script>

<style scoped>
.quick-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-btn-secondary-border);
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
}
</style>
