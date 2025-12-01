<template>
  <div v-if="showDebug" class="debug-window">
    <p>isAuthenticated: {{ auth.isAuthenticated }}</p>
    <p>isLoading: {{ auth.loading}}</p>
    <p>size [w, h]: {{ width }} x {{ height }}</p>
    <p>version: {{ appVersion }}</p>
  </div>

  <RouterView />
  <ErrorToaster />
</template>

<script setup>
import {ref, onMounted, onUnmounted, computed} from "vue"
import {authModel} from "./scripts/authModel.js";
import ErrorToaster from "./components/ErrorToaster.vue";

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)
const auth = authModel()


const appVersion = computed(() =>  __APP_VERSION__ )

function updateSize() {
  width.value = window.innerWidth
  height.value = window.innerHeight
}

//todo: Daj spodnjo na false, ko gres v produkcijo
const showDebug = ref(true)
onMounted(() => {
  showDebug.value = localStorage.getItem("debug-window") !== null
  window.addEventListener("resize", updateSize)
})

onUnmounted(() => {
  window.removeEventListener("resize", updateSize)
})
</script>

<style>
.debug-window {
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

