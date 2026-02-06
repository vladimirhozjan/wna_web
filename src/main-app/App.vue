<template>
  <div v-if="showDebug" class="debug-window">
    <p>Version: {{ appVersion }}</p>
    <p>Base url: {{ base_url }}</p>
    <p>IsAuthenticated: {{ auth.isAuthenticated }}</p>
    <p>Size [w, h]: {{ width }} x {{ height }}</p>
  </div>

  <RouterView />
  <ErrorToaster />
  <ConfirmDialog />
</template>

<script setup>
import {ref, onMounted, onUnmounted, computed} from "vue"
import {authModel} from "./scripts/authModel.js";
import ErrorToaster from "./components/ErrorToaster.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import {getDomains}  from "./scripts/domains.js";

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)
const auth = authModel()
const { base_url } = getDomains()


const appVersion = computed(() =>  __APP_VERSION__ )

function updateSize() {
  width.value = window.innerWidth
  height.value = window.innerHeight
}

//todo: Daj spodnjo na false, ko gres v produkcijo
const showDebug = ref(true)

function onDebugModeChanged(e) {
  showDebug.value = e.detail
}

onMounted(() => {
  showDebug.value = localStorage.getItem("debug-window") !== null
  window.addEventListener("resize", updateSize)
  window.addEventListener("debug-mode-changed", onDebugModeChanged)
})

onUnmounted(() => {
  window.removeEventListener("resize", updateSize)
  window.removeEventListener("debug-mode-changed", onDebugModeChanged)
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

