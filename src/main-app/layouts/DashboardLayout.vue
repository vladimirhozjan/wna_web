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
        <slot />
      </main>
    </div>

    <!-- Mobile FAB — quick add -->
    <div v-if="fabExpanded" class="fab-overlay" @click="fabCollapse" @touchmove.prevent @wheel.prevent></div>
    <div class="mobile-fab-area">
      <div v-if="fabExpanded" class="fab-input-bar">
        <div class="fab-input-wrap">
          <input
            ref="fabInputRef"
            v-model="fabTitle"
            class="fab-input"
            type="text"
            placeholder="Add new stuff"
            @keydown.enter="fabSubmit"
            @keydown.esc="fabCollapse"
          />
          <ActionBtn v-if="fabTitle" variant="default" class="fab-input-clear" @mousedown.prevent @click="fabClear" />
        </div>
        <Btn variant="primary" size="sm" @mousedown.prevent @click="fabSubmit">Add</Btn>
      </div>
      <button v-if="!fabExpanded" class="mobile-fab" @click="fabExpand">
        <PlusIcon width="20" height="20" style="pointer-events: none;" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import TopNav from "../components/TopNav.vue";
import Sidebar from "../components/Sidebar.vue";
import SidebarDrawer from "../components/SidebarDrawer.vue";
import Btn from "../components/Btn.vue";
import ActionBtn from "../components/ActionBtn.vue";
import { authModel } from "../scripts/core/authModel.js";
import PlusIcon from "../assets/PlusIcon.vue";
import { settingsModel } from "../scripts/models/settingsModel.js";
import { stuffModel } from "../scripts/models/stuffModel.js";
import { errorModel } from "../scripts/core/errorModel.js";
import router from "../router/router.js";

const auth = authModel();
const settings = settingsModel();
const { addStuff } = stuffModel();
const toaster = errorModel();
const isSidebarOpen = ref(false);

// Mobile FAB quick add
const fabExpanded = ref(false);
const fabTitle = ref("");
const fabInputRef = ref(null);

function fabExpand() {
  fabExpanded.value = true;
  document.documentElement.dataset.fabOpen = "";
  window.visualViewport?.addEventListener("resize", updateKeyboardOffset);
  window.visualViewport?.addEventListener("scroll", updateKeyboardOffset);
  window.addEventListener("scroll", resetWindowScroll);
  nextTick(() => {
    const input = fabInputRef.value;
    if (!input) return;
    // iOS scrolls the page to reveal a focused input near the bottom; focusing it while shifted off-screen prevents that.
    input.style.transform = "translateY(-2000px)";
    input.focus();
    requestAnimationFrame(() => { input.style.transform = ""; });
  });
}

function fabCollapse() {
  fabInputRef.value?.blur();
  fabExpanded.value = false;
  delete document.documentElement.dataset.fabOpen;
  window.visualViewport?.removeEventListener("resize", updateKeyboardOffset);
  window.visualViewport?.removeEventListener("scroll", updateKeyboardOffset);
  window.removeEventListener("scroll", resetWindowScroll);
  document.documentElement.style.removeProperty("--fab-kb-offset");
  document.documentElement.style.removeProperty("--fab-vv-height");
}

function fabClear() {
  fabTitle.value = "";
  fabInputRef.value?.focus();
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

async function fabSubmit() {
  const t = fabTitle.value.trim();
  if (!t) return;
  try {
    await addStuff(t);
    fabTitle.value = "";
    fabCollapse();
  } catch (e) {
    toaster.push(e.message || "Failed to add item");
  }
}

watch(
    () => auth.isAuthenticated.value,
    (v) => {
      if (!v) {
        isSidebarOpen.value = false;
        router.push({ name: "landing" });
      }
    }
);

// Auto-close sidebar on route change (mobile navigation)
watch(() => router.currentRoute.value.path, () => {
  isSidebarOpen.value = false;
});

onUnmounted(fabCollapse);

onMounted(() => {
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
    bottom: 18px;
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
    padding: 14px 20px 26px 16px;
  }

  .fab-input-wrap {
    flex: 1;
    display: flex;
    position: relative;
  }

  .fab-input {
    flex: 1;
    min-width: 0;
    padding: 10px 32px 10px 10px;
    border-radius: 6px;
    border: 1px solid var(--color-input-border);
    background: var(--color-input-background);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--font-size-body);
    outline: none;
  }

  .fab-input:focus {
    border-color: var(--color-input-border-focus);
    box-shadow: 0 0 0 1px var(--color-action-ring);
  }

  .fab-input-clear {
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
  }

  .fab-input::placeholder {
    color: var(--color-text-prefill);
  }
}
</style>
