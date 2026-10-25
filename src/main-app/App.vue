<template>
  <RouterView v-slot="{ Component, route }">
    <DashboardLayout v-if="isDashboardRoute(route)">
      <div v-if="isOffline && route.name !== 'inbox' && route.name !== 'share'" class="card offline-state" data-testid="offline-state">
        <EmptyState
            :icon="InboxIcon"
            title="Offline for now"
            text="This page loads when you're back online. Your Inbox and Quick Add work offline."
            button-text="Go to Inbox"
            @action="router.push({ name: 'inbox' })"
        />
      </div>
      <component :is="Component" v-else />
    </DashboardLayout>
    <component :is="Component" v-else />
  </RouterView>
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
import DashboardLayout from "./layouts/DashboardLayout.vue";
import EmptyState from "./components/EmptyState.vue";
import InboxIcon from "./assets/InboxIcon.vue";
import { PUBLIC_ROUTE_NAMES } from "./router/router.js";
import { offlineModel } from "./scripts/core/offlineModel.js";

const router = useRouter();
const { isOffline } = offlineModel();

// One layout instance for every dashboard page, so TopNav, Sidebar, Quick Add and the FAB keep their state while the
// page inside changes. Offline only Inbox works; any other page is not mounted until the connection is back, then it
// mounts and loads itself
function isDashboardRoute(route) {
  return route.matched.length > 0 && !PUBLIC_ROUTE_NAMES.has(route.name);
}

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
.offline-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

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
