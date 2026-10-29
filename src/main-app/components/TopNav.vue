<template>
  <nav class="topnav">
    <router-link to="/" class="topnav-left">
      <AppIcon />
      <span class="topnav-title" :class="{ 'dashboard-title': context === 'dashboard' }"><span class="topnav-title-primary">WhatsNext</span><span class="topnav-title-accent">Action</span></span>
    </router-link>

    <!-- Center nav links (landing/public context, desktop only) -->
    <nav v-if="context === 'landing'" class="topnav-center desktop-only">
      <a href="/#why-us" class="nav-link text-body-s">Why Us</a>
      <a href="/#features" class="nav-link text-body-s">Features</a>
      <router-link to="/pricing" class="nav-link text-body-s">Pricing</router-link>
      <router-link to="/help" class="nav-link text-body-s">Help</router-link>
    </nav>

    <!-- GUEST (not authenticated) -->
    <div v-if="!authenticated">
      <div class="topnav-right desktop-only">
        <Btn size="md" variant="primary" @click="$emit('open-register')">Start Here</Btn>
        <Btn size="md" variant="secondary" @click="$emit('open-login')">Sign In</Btn>
      </div>

      <div class="mobile-only">
        <Btn class="hamburger" variant="secondary" size="sm" @click="toggleMobile">☰</Btn>
      </div>

      <TopNavDropdown
        v-if="showMobile"
        :authenticated="false"
        @close="showMobile = false"
        @open-register="clickRegister"
        @open-login="clickLogin"
      />
    </div>

    <!-- AUTHENTICATED -->
    <div v-else class="topnav-auth-right">
      <QuickAddBtn ref="quickAddRef" class="quick-add-desktop" />

      <button
        v-if="context === 'dashboard' && assistant.enabled.value"
        type="button"
        class="ai-btn"
        :class="{ 'ai-btn--open': assistant.state.panelOpen }"
        :aria-pressed="assistant.state.panelOpen"
        :aria-label="aiBtnLabel"
        :title="aiBtnLabel"
        data-testid="topnav-ai-btn"
        @click="onAiClick"
      >
        <Spinner v-if="aiWorking" :size="16" />
        <AiIcon v-else class="ai-btn__icon" />
      </button>

      <!-- Notification bell + dropdown -->
      <Dropdown v-model="notifDropdownOpen" align="right" title="Notifications" class="notifications-dropdown">
        <template #trigger>
          <button
            type="button"
            class="notifications-btn"
            :aria-label="`Notifications${notifUnread > 0 ? ' (' + notifUnread + ' unread)' : ''}`"
          >
            <svg class="notifications-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span v-if="notifUnread > 0" class="notifications-badge">{{ notifUnread > 99 ? '99+' : notifUnread }}</span>
          </button>
        </template>
        <template #default="{ close }">
          <div class="notifications-panel">
            <div class="notifications-header">
              <span class="fw-semibold">Notifications</span>
              <span v-if="notifUnread > 0" class="text-body-s notifications-header-count">{{ notifUnread }} unread</span>
            </div>

            <div v-if="notifLoading && notifList.length === 0" class="notifications-state">
              <Spinner :size="16" />
            </div>

            <div v-else-if="notifList.length === 0" class="notifications-state notifications-empty">
              You're all caught up.
            </div>

            <ul v-else ref="notifListRef" class="notifications-list" @scroll="onNotifScroll">
              <li
                v-for="n in notifList"
                :key="n.id"
                :data-notif-id="n.id"
                class="notifications-item"
                :class="{ 'notifications-item--unread': !n.read }"
                @click="onNotifClick(n, close)"
              >
                <span v-if="!n.read" class="notifications-dot" aria-hidden="true"></span>
                <div class="notifications-item-body">
                  <span class="notifications-message">{{ n.message }}</span>
                  <span class="text-footnote notifications-time">{{ formatNotifTime(n.created_at) }}</span>
                </div>
              </li>
              <li v-if="notifLoading" class="notifications-state">
                <Spinner :size="16" />
              </li>
            </ul>
          </div>
        </template>
      </Dropdown>

      <!-- Search: desktop expands in place, mobile opens /search -->
      <template v-if="context === 'dashboard' && route.name !== 'search'">
        <SearchBox v-if="searchExpanded" ref="searchBoxRef" @collapse="searchExpanded = false" />
        <button
            v-else
            type="button"
            class="search-btn"
            aria-label="Search"
            data-testid="topnav-search-btn"
            @click="onSearchClick"
        >
          <SearchIcon class="search-btn__icon" />
        </button>
      </template>

      <!-- Mobile hamburger (dashboard only) -->
      <button
        v-if="context === 'dashboard'"
        class="hamburger-menu"
        :class="{ open: sidebarOpen }"
        @click="$emit('toggle-sidebar')"
      >
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <!-- Avatar + dropdown (hidden in dashboard context) -->
      <div v-if="context !== 'dashboard'" class="avatar-container" ref="avatarContainerRef">
        <UserAvatar
          :email="user?.email"
          @toggle-menu="onAvatarClick"
        />
        <TopNavDropdown
          v-if="showDropdown"
          :authenticated="true"
          :context="context"
          @close="showDropdown = false"
          @go-dashboard="goToDashboard"
          @go-settings="goToSettings"
          @logout="handleLogout"
        />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import Btn from "./Btn.vue";
import UserAvatar from "./UserAvatar.vue";
import QuickAddBtn from "./QuickAddBtn.vue";
import TopNavDropdown from "./TopNavDropdown.vue";
import Dropdown from "./Dropdown.vue";
import Spinner from "./Spinner.vue";
import SearchBox from "./SearchBox.vue";
import SearchIcon from "../assets/SearchIcon.vue";
import AppIcon from "../assets/AppIcon.vue";
import AiIcon from "../assets/AiIcon.vue";
import { notificationInAppModel } from "../scripts/models/notificationInAppModel.js";
import { assistantModel } from "../scripts/models/assistantModel.js";
import { shortcutModel } from "../scripts/core/shortcutModel.js";

const props = defineProps({
  authenticated: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({ email: "", avatarUrl: "" }),
  },
  context: {
    type: String,
    default: "dashboard",
  },
  sidebarOpen: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();
const showMobile = ref(false);
const showDropdown = ref(false);
const avatarContainerRef = ref(null);

const toggleMobile = () => {
  showMobile.value = !showMobile.value;
};

const emit = defineEmits(["open-login", "open-register", "logout", "toggle-sidebar"]);

function clickRegister() {
  showMobile.value = false;
  emit("open-register");
}

function clickLogin() {
  showMobile.value = false;
  emit("open-login");
}

function goToDashboard() {
  showDropdown.value = false;
  router.push("/engage");
}

function goToSettings() {
  showDropdown.value = false;
  router.push("/settings");
}

function handleLogout() {
  showDropdown.value = false;
  emit("logout");
}

function onAvatarClick() {
  showDropdown.value = !showDropdown.value;
}


// Notifications
const notifModel = notificationInAppModel();
const notifList = notifModel.notifications;
const notifUnread = computed(() => notifModel.unreadCount.value);
const notifLoading = computed(() => notifModel.loading.value);
const notifDropdownOpen = ref(false);
const notifListRef = ref(null);
const NOTIF_LOAD_MORE_OFFSET_PX = 40;
let notifObserver = null;
let unreadAtOpen = 0;

watch(notifDropdownOpen, async (open) => {
  if (open) {
    unreadAtOpen = notifModel.unreadCount.value;
    try {
      await notifModel.loadList({ reset: true });
      unreadAtOpen = notifModel.unreadCount.value;
    } catch {
      // Silent — badge reflects last known state
    }
    return;
  }
  await notifModel.flushRead();
  if (notifModel.unreadCount.value !== unreadAtOpen) notifModel.loadUnreadCount();
});

// Viewport root so the sheet's clipping on mobile counts too, not just the list's scroll
watch([notifListRef, () => notifList.value, () => notifList.value.length], ([el]) => {
  notifObserver?.disconnect();
  notifObserver = null;
  if (!el) return;
  notifObserver = new IntersectionObserver(onNotifIntersect, { threshold: 1.0 });
  el.querySelectorAll("[data-notif-id]").forEach((row) => notifObserver.observe(row));
}, { flush: "post" });

function onNotifIntersect(entries) {
  entries.forEach((e) => {
    if (e.isIntersecting && e.intersectionRatio >= 1) notifModel.markSeen(e.target.dataset.notifId);
  });
}

async function onNotifScroll(e) {
  const el = e.target;
  if (notifLoading.value || !notifModel.hasMore.value) return;
  if (el.scrollTop + el.clientHeight < el.scrollHeight - NOTIF_LOAD_MORE_OFFSET_PX) return;
  try {
    await notifModel.loadList();
  } catch {
    // Silent — next scroll retries
  }
}

async function onNotifClick(n, close) {
  if (!n.read) {
    try {
      await notifModel.markRead(n.id);
    } catch {
      // ignore — optimistic update already rolled back
    }
  }
  close();
  routeForNotification(n);
}

const SHARED_PROJECT_EVENT_TYPES = new Set([
  "project_shared",
  "project_unshared",
  "member_added",
  "member_removed",
  "member_role_changed",
  "action_assigned",
  "action_unassigned",
]);

const CONNECTION_EVENT_TYPES = new Set([
  "connection_invite",
  "connection_invite_registration",
  "connection_accepted",
  "connection_declined",
]);

function routeForNotification(n) {
  if (!n) return;
  if (n.entity_type === "stuff" && n.entity_id) {
    router.push({ name: "stuff-detail", params: { id: n.entity_id } });
  } else if (n.entity_type === "action" && n.entity_id) {
    router.push({ name: "action-detail", params: { id: n.entity_id } });
  } else if (n.entity_type === "project" && n.entity_id) {
    router.push({ name: "project-detail", params: { id: n.entity_id } });
  } else if (SHARED_PROJECT_EVENT_TYPES.has(n.type)) {
    // Shared-project event without a usable entity_id falls back to projects list
    router.push({ name: "projects" });
  } else if (CONNECTION_EVENT_TYPES.has(n.type)) {
    router.push({ name: "connections" });
  } else if (n.type === "daily_digest") {
    router.push({ name: "engage" });
  }
}

function formatNotifTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

watch(
    () => props.authenticated,
    (v) => {
      if (v) {
        notifModel.startPolling();
      } else {
        notifModel.stopPolling();
        notifModel.reset();
      }
    },
    { immediate: false }
);

// Search
const MOBILE_QUERY = "(max-width: 768px)";
const searchExpanded = ref(false);
const searchBoxRef = ref(null);

function onSearchClick() {
  if (window.matchMedia(MOBILE_QUERY).matches) {
    router.push({ name: "search" });
    return;
  }
  expandSearch();
}

async function expandSearch() {
  searchExpanded.value = true;
  await nextTick();
  searchBoxRef.value?.focus();
}

// Any navigation collapses to the icon; SearchBox clears the term on unmount
watch(() => route.fullPath, () => {
  searchExpanded.value = false;
});

// AI assistant
const assistant = assistantModel();
const aiWorking = computed(() => assistant.working.value && !assistant.state.panelOpen);
const aiBtnLabel = computed(() => {
  if (assistant.state.panelOpen) return "Close AI assistant";
  return aiWorking.value ? "AI assistant is working" : "AI assistant";
});

function onAiClick() {
  if (assistant.state.panelOpen) assistant.closePanel();
  else assistant.openPanel();
}

// C shortcut
const shortcuts = shortcutModel();
const quickAddRef = ref(null);

watch(() => shortcuts.state.captureRequest, () => {
  quickAddRef.value?.expand();
});

function onClickOutside(e) {
  if (avatarContainerRef.value && !avatarContainerRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
  if (props.authenticated) {
    notifModel.startPolling();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  notifObserver?.disconnect();
  notifModel.flushRead();
  notifModel.stopPolling();
});
</script>

<style scoped>
.topnav {
  position: sticky;
  top: 0;
  z-index: 902;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0 20px;
  gap: 12px;
  background: var(--color-bg-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.topnav-left {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.topnav-left:active {
  opacity: 0.6;
}

.topnav-title {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.02em;
  line-height: 18px;
}

.topnav-title-primary {
  color: var(--color-text-primary);
}

.topnav-title-accent {
  color: var(--color-action);
}

.topnav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 10px;
}

.topnav-auth-right {
  display: flex;
  align-items: center;
  column-gap: 8px;
}

.avatar-container {
  position: relative;
}

/* Notifications bell (the search and AI buttons share its look) */
.notifications-btn,
.search-btn,
.ai-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.notifications-btn:hover,
.search-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.ai-btn {
  color: var(--color-action);
}

.ai-btn:hover,
.ai-btn--open {
  background: var(--color-bg-hover);
}

.notifications-icon {
  display: block;
}

.search-btn__icon {
  display: block;
  width: 18px;
  height: 18px;
}

.ai-btn__icon {
  display: block;
  width: 20px;
  height: 20px;
}

.notifications-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-action);
  color: var(--color-btn-primary-text);
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

/* Notifications panel (teleported — scoped styles still apply via data-v attrs) */
.notifications-panel {
  width: 320px;
  max-width: calc(100vw - 32px);
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 10px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.notifications-header-count {
  color: var(--color-text-tertiary);
}

.notifications-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  color: var(--color-text-tertiary);
}

.notifications-empty {
  font-size: var(--font-size-body-s);
}

.notifications-list {
  list-style: none;
  padding: 4px 0;
  margin: 0;
  overflow-y: auto;
}

.notifications-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.notifications-item:hover {
  background: var(--color-bg-secondary);
}

.notifications-item--unread {
  background: var(--color-bg-accent-light, var(--color-bg-secondary));
}

.notifications-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-action);
  margin-top: 6px;
  flex-shrink: 0;
}

.notifications-item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.notifications-message {
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notifications-time {
  color: var(--color-text-tertiary);
}

.notifications-dropdown {
  display: inline-flex;
}

.desktop-only {
  display: flex;
  gap: 16px;
}

.mobile-only {
  display: none;
}

/* Hamburger menu button (mobile dashboard only) */
.hamburger-menu {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 34px;
  height: 34px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.hamburger-menu:active {
  opacity: 0.5;
}

.hamburger-bar {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text-muted);
  border-radius: 1px;
  transition: transform 0.25s ease, opacity 0.15s ease;
}

.hamburger-menu.open .hamburger-bar:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-menu.open .hamburger-bar:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-menu.open .hamburger-bar:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block;
  }

  .hamburger {
    font-size: var(--font-size-h3);
    background: none;
    border: none;
    margin-right: -4px;
  }

  .hamburger-menu {
    display: flex;
  }

  .quick-add-desktop {
    display: none !important;
  }

  .topnav {
    padding: 0 10px;
  }

  .dashboard .hamburger-menu {
    position: relative;
  }

  .dashboard .search-btn::after,
  .dashboard .ai-btn::after,
  .dashboard .notifications-btn::after,
  .dashboard .hamburger-menu::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    transform: translate(-50%, -50%);
  }

}

/* Below this the wordmark and the four icon buttons no longer fit in one row */
@media (max-width: 371px) {
  .dashboard .topnav-title {
    display: none;
  }
}

.topnav-center {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 24px);
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.nav-link:hover {
  color: var(--color-action);
}
</style>
