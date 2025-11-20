<template>
  <nav class="topnav">
    <div class="topnav-left">
      <img src="../assets/Icon.svg" alt="logo" class="topnav-logo" />
      <span class="text-h3 color-text-primary">WhatsNextAction</span>
    </div>

    <div class="topnav-right" v-if="!authenticated">
      <BaseButton size="md" variant="primary"  @click="$emit('open-register')">Start Here</BaseButton>
      <BaseButton size="md" variant="ghost" @click="$emit('open-login')">Sign In</BaseButton>
    </div>

    <div class="topnav-right" v-else>
      <span class="topnav-user-placeholder">User</span>
<!--      <button class="" @click="$emit('logout')">Logout</button>-->
    </div>
  </nav>
</template>

<script setup>
import BaseButton from '../components/BaseButton.vue'
defineProps({
  authenticated: {
    type: Boolean,
    default: false,
  },
})

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
</style>
