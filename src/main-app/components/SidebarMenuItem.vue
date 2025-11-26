<template>
  <router-link
      :to="props.to"
      custom
      v-slot="{ navigate, isActive }"
  >
    <button
        type="button"
        class="menu-item text-body-m"
        :class="{ active: isActive }"
        @click="navigate"
    >
      <span class="icon">
        <slot name="icon" />
      </span>
      <span class="label">{{ props.label }}</span>
    </button>
  </router-link>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  to: { type: [String, Object], required: true }
});
</script>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: 0.15s ease;
  padding: 0;
  color: var(--color-menu-item-default-text);
}

.menu-item:hover {
  background: var(--color-menu-item-hover-bg);
  color: var(--color-menu-item-hover-txt);
}

.menu-item.active {
  background: var(--color-menu-item-active-bg);
  color: var(--color-menu-item-active-txt);
  font-weight: 600;
}

.icon {
  display: flex;
}
</style>
