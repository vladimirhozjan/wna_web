<template>
  <div>
    <div class="overlay" v-if="open" @click="$emit('close')"></div>
    <aside ref="drawerRef" class="drawer" :class="{ open, scrolling }">
      <slot />
    </aside>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

defineProps({
  open: { type: Boolean, required: true },
});

defineEmits(["close"]);

const drawerRef = ref(null)
const scrolling = ref(false)
let scrollTimer = null

function onScroll() {
  scrolling.value = true
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    scrolling.value = false
  }, 1000)
}

watch(drawerRef, (el, oldEl) => {
  if (oldEl) oldEl.removeEventListener('scroll', onScroll)
  if (el) el.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(scrollTimer)
  drawerRef.value?.removeEventListener('scroll', onScroll)
})
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
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.drawer.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.drawer::-webkit-scrollbar {
  width: 4px;
}

.drawer::-webkit-scrollbar-track {
  background: transparent;
}

.drawer::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.drawer.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

/* odprt drawer */
.drawer.open {
  transform: translateX(0);
}
</style>
