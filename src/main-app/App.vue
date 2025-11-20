<template>
  <div class="window-size">
    Width: {{ width }}px — Height: {{ height }}px
  </div>

  <router-view />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

function updateSize() {
  width.value = window.innerWidth
  height.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener("resize", updateSize)
})

onUnmounted(() => {
  window.removeEventListener("resize", updateSize)
})
</script>

<style>
.window-size {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 9999;
}
</style>

