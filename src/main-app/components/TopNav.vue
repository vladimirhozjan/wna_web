<template>
  <nav class="topnav">
    <div class="topnav-left">
      <img src="../assets/Icon.svg" alt="logo" class="topnav-logo" />
      <span class="text-h3 color-text-primary">WhatsNextAction</span>
    </div>

    <div class="topnav-right desktop-only" v-if="!authenticated">
      <Btn size="md" variant="primary"  @click="$emit('open-register')">Start Here</Btn>
      <Btn size="md" variant="ghost" @click="$emit('open-login')">Sign In</Btn>
    </div>

    <div class="topnav-right desktop-only" v-else>
      <span class="topnav-user-placeholder">User</span>
<!--      <button class="" @click="$emit('logout')">Logout</button>-->
    </div>

    <div class="mobile-only">
      <Btn class="hamburger" variant="ghost" size="sm" @click="toggleMobile">☰</Btn>
    </div>

    <div v-if="showMobile" class="mobile-menu">
      <Btn size="lg" variant="primary" @click="$emit('open-register')">Start Here</Btn>
      <Btn size="lg" variant="ghost" @click="$emit('open-login')">Sign In</Btn>
    </div>
  </nav>

</template>

<script setup>
import { ref } from "vue"
import Btn from './Btn.vue'
defineProps({
  authenticated: {
    type: Boolean,
    default: false,
  },
})

const showMobile = ref(false)
const toggleMobile = () => {
  showMobile.value = !showMobile.value
}

defineEmits(['open-login', 'open-register', 'logout'])
</script>

<style scoped>

.topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-light);
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

.topnav-user-placeholder {
  margin-right: 12px;
  font-size: 14px;
  color: #666;
}

.mobile-menu {
  position: absolute;
  top: 70px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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

</style>
