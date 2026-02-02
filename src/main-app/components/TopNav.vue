<template>
  <nav class="topnav">
    <div class="topnav-left">
      <img src="../assets/AppIcon.svg" alt="logo" class="topnav-logo" />
      <span class="text-h3 color-text-primary">WhatsNextAction</span>
    </div>

    <!-- GUEST (not authenticated) -->
    <div v-if="!authenticated">
      <div class="topnav-right desktop-only">
        <Btn size="md" variant="primary" @click="$emit('open-register')">Start Here</Btn>
        <Btn size="md" variant="ghost" @click="$emit('open-login')">Sign In</Btn>
      </div>

      <div class="mobile-only">
        <Btn class="hamburger" variant="ghost" size="sm" @click="toggleMobile">☰</Btn>
      </div>

      <div v-if="showMobile" class="user-menu">
        <button class="dropdown-item" @click="clickRegister">Start Here</button>
        <button class="dropdown-item" @click="clickLogin">Sign In</button>
      </div>
    </div>

    <!-- AUTHENTICATED -->
    <div v-else class="topnav-auth-right">
      <!-- Dashboard mobile: hamburger + avatar -->
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
        <div v-if="showDropdown" class="user-menu">
          <button v-if="context === 'landing'" class="dropdown-item" @click="goToDashboard">My Dashboard</button>
          <button class="dropdown-item" @click="goToSettings">Settings</button>
          <button class="dropdown-item" @click="handleLogout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Btn from "./Btn.vue";
import UserAvatar from "./UserAvatar.vue";

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
  router.push("/next");
}

function goToSettings() {
  showDropdown.value = false;
  router.push("/settings");
}

function handleLogout() {
  showDropdown.value = false;
  emit("logout");
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
  padding: 0 12px;
}

.topnav-left {
  display: flex;
  align-items: center;
  gap: 10px;
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
}

.user-menu {
  position: absolute;
  top: 44px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  padding: 8px 0;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
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
    display: none;
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

.dropdown-item {
  width: 100%;
  padding: 10px 18px;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
