<template>
  <nav class="topnav">
    <router-link to="/" class="topnav-left">
      <AppIcon />
      <span class="topnav-title" :class="{ 'dashboard-title': context === 'dashboard' }"><span class="topnav-title-primary">WhatsNext</span><span class="topnav-title-accent">Action</span></span>
      <span v-if="isBeta" class="topnav-beta">BETA</span>
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
      <QuickAddBtn @add="onQuickAdd" />

      <div class="avatar-container" ref="avatarContainerRef">
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Btn from "./Btn.vue";
import UserAvatar from "./UserAvatar.vue";
import QuickAddBtn from "./QuickAddBtn.vue";
import TopNavDropdown from "./TopNavDropdown.vue";
import AppIcon from "../assets/AppIcon.vue";
import { stuffModel } from "../scripts/models/stuffModel.js";
import { errorModel } from "../scripts/core/errorModel.js";
import { flagsModel } from "../scripts/core/flagsModel.js";

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
});

const { isBeta } = flagsModel()

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

function onAvatarClick() {
  if (props.context === "dashboard" && window.innerWidth <= 768) {
    emit("open-sidebar");
  } else {
    showDropdown.value = !showDropdown.value;
  }
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
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
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

.topnav-beta {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  color: var(--color-action);
  border: 1px solid var(--color-action);
  border-radius: 4px;
  vertical-align: middle;
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
    margin-right: -4px;
  }

  .topnav {
    padding: 0 10px;
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
