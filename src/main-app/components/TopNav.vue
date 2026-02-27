<template>
  <nav class="topnav">
    <div class="topnav-left">
      <img src="../assets/AppIcon.svg" alt="logo" class="topnav-logo" />
      <span class="text-h3 color-text-primary">WhatsNextAction</span>
    </div>

    <!-- Center nav links (landing/public context, desktop only) -->
    <nav v-if="context === 'landing'" class="topnav-center desktop-only">
      <a href="/#why-gtd" class="nav-link text-body-s">Why GTD</a>
      <a href="/#features" class="nav-link text-body-s">Features</a>
      <router-link to="/pricing" class="nav-link text-body-s">Pricing</router-link>
      <router-link to="/help" class="nav-link text-body-s">Help</router-link>
    </nav>

    <!-- GUEST (not authenticated) -->
    <div v-if="!authenticated">
      <div class="topnav-right desktop-only">
        <Btn size="md" variant="primary" @click="$emit('open-register')">Start Here</Btn>
        <Btn size="md" variant="ghost" @click="$emit('open-login')">Sign In</Btn>
      </div>

      <div class="mobile-only">
        <Btn class="hamburger" variant="ghost" size="sm" @click="toggleMobile">☰</Btn>
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
      <QuickAddBtn @add="onQuickAdd" />

      <!-- Dashboard mobile: hamburger opens sidebar -->
      <Btn
        v-if="context === 'dashboard'"
        class="hamburger mobile-only"
        variant="ghost"
        size="sm"
        @click="$emit('open-sidebar')"
      >
        ☰
      </Btn>

      <div class="avatar-container" :class="{ 'desktop-only': context === 'dashboard' }" ref="avatarContainerRef">
        <UserAvatar
          :email="user?.email"
          :avatar-url="user?.avatarUrl"
          @toggle-menu="showDropdown = !showDropdown"
        />
        <TopNavDropdown
          v-if="showDropdown"
          :authenticated="true"
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Btn from "./Btn.vue";
import UserAvatar from "./UserAvatar.vue";
import QuickAddBtn from "./QuickAddBtn.vue";
import TopNavDropdown from "./TopNavDropdown.vue";
import { stuffModel } from "../scripts/models/stuffModel.js";
import { errorModel } from "../scripts/core/errorModel.js";

defineProps({
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
});

const router = useRouter();
const showMobile = ref(false);
const showDropdown = ref(false);
const avatarContainerRef = ref(null);

const toggleMobile = () => {
  showMobile.value = !showMobile.value;
};

const emit = defineEmits(["open-login", "open-register", "logout", "open-sidebar"]);

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

const { addStuff } = stuffModel();
const toaster = errorModel();

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title;
  return title.slice(0, maxLen).trim() + "…";
}

async function onQuickAdd(title) {
  try {
    await addStuff(title);
    toaster.success(`"${truncateTitle(title)}" added to inbox`);
  } catch (e) {
    toaster.push(e.message || "Failed to add item");
  }
}

function onClickOutside(e) {
  if (avatarContainerRef.value && !avatarContainerRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
});
</script>

<style scoped>
.topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0 4px;
}

.topnav-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.topnav-logo {
  height: 48px;
  width: 48px;
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
  gap: 8px;
}

.avatar-container {
  position: relative;
  margin-right: 2px;
}

.desktop-only {
  display: flex;
  gap: 16px;
}

.mobile-only {
  display: none;
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
    margin-right: 4px;
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
