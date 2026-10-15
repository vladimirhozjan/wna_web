<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-brand">
        <img class="auth-logo" src="/favicon.svg?v=4" alt="" />
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
