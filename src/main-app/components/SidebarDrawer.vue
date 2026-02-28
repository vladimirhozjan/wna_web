<template>
  <div>
    <div class="overlay" v-if="open" @click="$emit('close')"></div>
    <aside class="drawer" :class="{ open }">
      <slot />
    </aside>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, required: true },
});

defineEmits(["close"]);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-light);
  backdrop-filter: blur(2px);
  z-index: 900;
}

.drawer {
  width: 260px;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  border-right: 1px solid #ddd;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  z-index: 901;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--color-sidebar-background);
}

/* odprt drawer */
.drawer.open {
  transform: translateX(0);
}
</style>
