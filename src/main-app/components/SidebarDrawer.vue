<template>
  <div>
    <div class="overlay" v-if="open" @click="$emit('close')"></div>
    <aside ref="drawerRef" class="drawer auto-scrollbar" :class="{ open, scrolling }">
      <slot />
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAutoHideScrollbar } from '../scripts/core/useAutoHideScrollbar.js'

defineProps({
  open: { type: Boolean, required: true },
});

defineEmits(["close"]);

const drawerRef = ref(null)
const { scrolling } = useAutoHideScrollbar(drawerRef)
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-light);
  backdrop-filter: blur(2px);
  z-index: 900;
}

.drawer {
  width: 260px;
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  border-right: 1px solid var(--color-border-light);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  z-index: 901;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--color-sidebar-background);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.drawer.open {
  transform: translateX(0);
}
</style>
