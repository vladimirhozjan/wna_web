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

    <!-- AUTHENTICATED (dashboard) -->
    <div v-else>
      <div class="topnav-right desktop-only">
        <!--todo: po želji kasneje dodaš user info / avatar / logout -->
      </div>

      <div class="mobile-only">
        <Btn
            class="hamburger"
            variant="ghost"
            size="sm"
            @click="$emit('open-sidebar')"
        >
          ☰
        </Btn>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import Btn from "./Btn.vue";

defineProps({
  authenticated: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({
      email: "",
      avatarUrl: "",
    }),
  },
});

const showMobile = ref(false);

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

.user-menu {
  position: absolute;
  top: 70px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
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
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
