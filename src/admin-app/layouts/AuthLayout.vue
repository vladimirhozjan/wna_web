<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-brand">
        <svg class="auth-logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="14" fill="url(#auth-grad)"/>
          <path d="M15 4L7 16h6.5L13 24 21 12h-6.5L15 4z" fill="#ffffff"/>
          <defs>
            <linearGradient id="auth-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#92400e"/>
              <stop offset="100%" stop-color="#d97706"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="text-body-l fw-semibold color-text-primary">WNA Admin</span>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-app-background);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: var(--shadow-auth);
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}

.auth-logo {
  width: 32px;
  height: 32px;
}

@media (max-width: 768px) {
  .auth-card {
    padding: 32px 20px;
  }
}
</style>
