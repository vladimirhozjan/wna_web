<template>
  <div class="dropdown-menu">
    <!-- Authenticated: My Dashboard on top -->
    <template v-if="authenticated">
      <button class="text-body-s dropdown-item" @click="$emit('go-dashboard')">My Dashboard</button>
      <hr class="dropdown-divider" />
    </template>

    <!-- Nav links (guest: always, authenticated: mobile only) -->
    <a href="/#why-gtd" :class="['text-body-s', 'dropdown-item', { 'mobile-only': authenticated }]" @click="$emit('close')">Why GTD</a>
    <a href="/#features" :class="['text-body-s', 'dropdown-item', { 'mobile-only': authenticated }]" @click="$emit('close')">Features</a>
    <router-link to="/pricing" :class="['text-body-s', 'dropdown-item', { 'mobile-only': authenticated }]" @click="$emit('close')">Pricing</router-link>
    <router-link to="/help" :class="['text-body-s', 'dropdown-item', { 'mobile-only': authenticated }]" @click="$emit('close')">Help</router-link>
    <hr :class="['dropdown-divider', { 'mobile-only': authenticated }]" />

    <!-- Authenticated: Settings + Logout -->
    <template v-if="authenticated">
      <button class="text-body-s dropdown-item" @click="$emit('go-settings')">Settings</button>
      <button class="text-body-s dropdown-item" @click="$emit('logout')">Logout</button>
    </template>

    <!-- Guest: Start Here + Sign In -->
    <template v-else>
      <button class="text-body-s dropdown-item" @click="$emit('open-register')">Start Here</button>
      <button class="text-body-s dropdown-item" @click="$emit('open-login')">Sign In</button>
    </template>
  </div>
</template>

<script setup>
defineProps({
  authenticated: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'open-login', 'open-register', 'go-dashboard', 'go-settings', 'logout'])
</script>

<style scoped>
.dropdown-menu {
  position: absolute;
  top: 44px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  padding: 8px 0;
  border-radius: 6px;
  box-shadow: var(--shadow-popover);
  z-index: 1000;
  min-width: 160px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 18px;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  white-space: nowrap;
  text-decoration: none;
  color: var(--color-text-primary);
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dropdown-divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 4px 0;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
}
</style>
