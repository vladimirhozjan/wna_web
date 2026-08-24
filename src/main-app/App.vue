<template>
  <RouterView />
  <div v-if="navPending" class="nav-loading">
    <Spinner :size="32" />
  </div>
  <ErrorToaster />
  <ConfirmDialog />
  <MoveModal />
  <UpgradeModal />
  <FeedbackBtn />
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ErrorToaster from "./components/ErrorToaster.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import MoveModal from "./components/MoveModal.vue";
import UpgradeModal from "./components/UpgradeModal.vue";
import FeedbackBtn from "./components/FeedbackBtn.vue";
import Spinner from "./components/Spinner.vue";

const router = useRouter();

// Lazy-route chunks resolve inside the navigation pipeline — without this the old
// view stays up with zero feedback until the import settles
const navPending = ref(false);

// One-shot reload on a stale-chunk failure (post-deploy hashed chunk names gone);
// the sessionStorage flag keeps a persistent failure from reload-looping
const CHUNK_RELOAD_FLAG = "chunk_reload";

function recoverStaleChunk() {
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return;
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
  location.reload();
}

const isChunkLoadError = (err) =>
  /dynamically imported module|Importing a module script failed/i.test(err?.message || "");

router.beforeEach(() => {
  navPending.value = true;
});

router.afterEach(() => {
  navPending.value = false;
  sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
});

router.onError((err) => {
  navPending.value = false;
  if (isChunkLoadError(err)) recoverStaleChunk();
});

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverStaleChunk();
});
</script>

<style scoped>
.nav-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
  z-index: 99997;
}
</style>
