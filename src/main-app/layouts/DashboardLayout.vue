<template>
  <div class="dashboard">
    <TopNav
      :authenticated="auth.isAuthenticated.value"
      :user="auth.currentUser.value"
      context="dashboard"
      :sidebar-open="isSidebarOpen"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @logout="auth.logoutWithConfirm()"
    />

    <div class="dashboard-body">
      <!-- Desktop sidebar -->
      <Sidebar class="dashboard-sidebar desktop-only" />

      <!-- Mobile sidebar drawer -->
      <SidebarDrawer :open="isSidebarOpen" @close="isSidebarOpen = false">
        <Sidebar />
      </SidebarDrawer>

      <!-- Dashboard content -->
      <main class="dashboard-content">
        <Alert
            v-if="isOffline && OFFLINE_BANNER_ROUTES.has(router.currentRoute.value.name)"
            type="info"
            title="You're offline"
            message="What you capture is saved and sent when you're back."
            class="offline-banner"
            data-testid="offline-banner"
        />
        <div class="dashboard-page">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile FAB — quick add -->
    <div v-if="fabExpanded" class="fab-overlay" @click="fabCollapse" @touchmove.prevent @wheel.prevent></div>
    <!-- Hidden on /share (the page is itself the capture) and on the canvas (it has its own +) -->
    <div v-show="!FAB_HIDDEN_ROUTES.has(router.currentRoute.value.name)" class="mobile-fab-area">
      <!-- Kept mounted while closed: an overlay tap closes the bar but keeps its text and files -->
      <div v-show="fabExpanded" class="fab-input-bar">
        <CaptureBar ref="fabBarRef" variant="fab" class="fab-capture" @saved="fabCollapse" @close="fabCollapse" />
      </div>
      <button v-if="!fabExpanded" class="mobile-fab" @click="fabExpand">
        <PlusIcon width="20" height="20" style="pointer-events: none;" />
      </button>
    </div>

    <CommandPalette />
    <ShortcutsDialog />
    <WelcomeModal :visible="welcomeOpen" @close="closeWelcome" @added="onWelcomeAdded" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import TopNav from "../components/TopNav.vue";
import Sidebar from "../components/Sidebar.vue";
import SidebarDrawer from "../components/SidebarDrawer.vue";
import CaptureBar from "../components/CaptureBar.vue";
import Alert from "../components/Alert.vue";
import CommandPalette from "../components/CommandPalette.vue";
import ShortcutsDialog from "../components/ShortcutsDialog.vue";
import WelcomeModal from "../components/WelcomeModal.vue";
import { authModel } from "../scripts/core/authModel.js";
import { shortcutModel } from "../scripts/core/shortcutModel.js";
import PlusIcon from "../assets/PlusIcon.vue";
import { settingsModel } from "../scripts/models/settingsModel.js";
import { errorModel } from "../scripts/core/errorModel.js";
import { offlineModel } from "../scripts/core/offlineModel.js";
import { statsModel } from "../scripts/models/statsModel.js";
import { connectionModel } from "../scripts/models/connectionModel.js";
import router from "../router/router.js";

const FAB_HIDDEN_ROUTES = new Set(["share", "project-canvas"]);
// Other pages show the offline EmptyState instead (App.vue)
const OFFLINE_BANNER_ROUTES = new Set(["inbox", "share"]);

const auth = authModel();
const settings = settingsModel();
const toaster = errorModel();
const shortcuts = shortcutModel();
const { isOffline } = offlineModel();
const isSidebarOpen = ref(false);
const welcomeOpen = ref(false);

// Mobile FAB quick add
const fabExpanded = ref(false);
const fabBarRef = ref(null);

function fabExpand() {
  fabExpanded.value = true;
  document.documentElement.dataset.fabOpen = "";
  window.visualViewport?.addEventListener("resize", updateKeyboardOffset);
  window.visualViewport?.addEventListener("scroll", updateKeyboardOffset);
  window.addEventListener("scroll", resetWindowScroll);
  nextTick(() => {
    const input = fabBarRef.value?.input();
    if (!input) return;
    // iOS scrolls the page to reveal a focused input near the bottom; focusing it while shifted off-screen prevents that.
    input.style.transform = "translateY(-2000px)";
    input.focus();
    requestAnimationFrame(() => { input.style.transform = ""; });
  });
}

function fabCollapse() {
  fabBarRef.value?.input()?.blur();
  fabBarRef.value?.stopRecording();
  fabExpanded.value = false;
  delete document.documentElement.dataset.fabOpen;
  window.visualViewport?.removeEventListener("resize", updateKeyboardOffset);
  window.visualViewport?.removeEventListener("scroll", updateKeyboardOffset);
  window.removeEventListener("scroll", resetWindowScroll);
  document.documentElement.style.removeProperty("--fab-kb-offset");
  document.documentElement.style.removeProperty("--fab-vv-height");
}

// The on-screen keyboard shrinks only the visual viewport; keep the bar pinned just above it.
function updateKeyboardOffset() {
  const vv = window.visualViewport;
  const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty("--fab-kb-offset", `${offset}px`);
  document.documentElement.style.setProperty("--fab-vv-height", `${vv.height}px`);
}

function resetWindowScroll() {
  if (window.scrollY) window.scrollTo(0, 0);
}

// These routes are mid-flow (checkout, OAuth callback, a share) — the first-run tour waits for the next dashboard route
function isWelcomeBlockedRoute(route) {
  if (route.name === "upgrade" || route.name === "google-connect" || route.name === "share") return true;
  return route.name === "settings" && !!route.query.status;
}
let welcomeWaitPath = null;

async function closeWelcome() {
  welcomeOpen.value = false;
  if (settings.state.onboardingCompleted) return;
  try {
    await settings.completeOnboarding();
  } catch {
    toaster.push("Couldn't save that you've seen the welcome tour, so it will open again next time — just skip it.", "error", { keepOffline: true });
  }
}

function onWelcomeAdded() {
  closeWelcome();
  router.push({ name: "inbox" });
}

watch(
    () => [router.currentRoute.value, settings.state.loaded, settings.state.onboardingCompleted],
    ([route, loaded, completed]) => {
      if (route.query.welcome === "1") {
        welcomeOpen.value = true;
        const { welcome, ...query } = route.query;
        router.replace({ query });
        return;
      }
      if (isWelcomeBlockedRoute(route)) welcomeWaitPath = route.path;
      if (route.path === welcomeWaitPath) return;
      if (loaded && !completed) welcomeOpen.value = true;
    },
    { immediate: true }
);

watch(
    () => auth.isAuthenticated.value,
    (v) => {
      if (!v) {
        isSidebarOpen.value = false;
        router.push({ name: "landing" });
      }
    }
);

// Start-up requests that failed offline run again once the connection is back
watch(isOffline, (offline) => {
  if (offline || !auth.isAuthenticated.value) return;
  statsModel().loadStats();
  if (!settings.state.loaded) settings.load().catch(() => {});
  const connections = connectionModel();
  if (!connections.loaded.value) connections.loadAll().catch(() => {});
});

// Auto-close sidebar on route change (mobile navigation). The layout stays mounted across pages (App.vue), so what
// used to happen on every page mount — fresh Sidebar counts, a closed FAB — happens here
watch(() => router.currentRoute.value.path, () => {
  isSidebarOpen.value = false;
  if (fabExpanded.value) fabCollapse();
  statsModel().loadStats();
});

onUnmounted(() => {
  offlineModel().setDashboardShown(false);
  fabCollapse();
  delete document.documentElement.dataset.fab;
  shortcuts.detach();
});

onMounted(() => {
  offlineModel().setDashboardShown(true);
  // Mobile toasts clear the bottom bar: the FAB, the canvas FAB in its place, or the /share action bar
  document.documentElement.dataset.fab = "";
  shortcuts.attach();
  if (auth.isAuthenticated.value && !settings.state.loaded) {
    settings.load().catch(() => {
      // Settings will fall back to localStorage, no need to show error
    });
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: var(--fab-vv-height, 100dvh);
}

.dashboard-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
}

.dashboard-sidebar {
  flex-shrink: 0;
  flex-grow: 0;
  width: 260px;
}

.dashboard-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 8px 8px 0;
  display: flex;
  flex-direction: column;
}

.offline-banner {
  flex-shrink: 0;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.offline-banner :deep(.alert__body) {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 8px;
}

.offline-banner :deep(.alert__message) {
  margin-top: 0;
}

.dashboard-page {
  flex: 1;
  min-height: 0;
}

@media (min-width: 769px) {
  .dashboard-content {
    padding: 30px 30px 0;
  }
}

.desktop-only {
  display: flex;
}

/* Mobile FAB quick add */
.fab-overlay {
  display: none;
}

.mobile-fab-area {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .offline-banner :deep(.alert__message) {
    display: none;
  }

  .fab-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 898;
    background: var(--color-popup-backdrop);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    opacity: 0.6;
    touch-action: none;
  }

  .mobile-fab-area {
    display: block;
    position: fixed;
    bottom: calc(18px + env(safe-area-inset-bottom));
    right: 16px;
    z-index: 899;
  }

  .mobile-fab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    border: none;
    background: var(--color-btn-primary-bg);
    color: var(--color-btn-primary-text);
    cursor: pointer;
    box-shadow: var(--shadow-fab);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-fab:active {
    transform: scale(0.94);
  }

  .fab-input-bar {
    display: flex;
    align-items: stretch;
    gap: 10px;
    position: fixed;
    bottom: var(--fab-kb-offset, 0px);
    left: 0;
    right: 0;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: var(--color-bg-primary);
    border-top: 1px solid var(--color-border-light);
    box-shadow: var(--shadow-dropdown);
  }

  .fab-capture {
    flex: 1;
    min-width: 0;
  }
}
</style>
