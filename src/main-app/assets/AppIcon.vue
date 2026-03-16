<template>
  <div class="app-icon-wrap">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="14" fill="url(#logo-grad)"/>
      <path d="M15 4L7 16h6.5L13 24 21 12h-6.5L15 4z" fill="#ffffff"/>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" :stop-color="darkColor"/>
          <stop offset="100%" :stop-color="mainColor"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup>
const mainColor = '#0e7490'
const darkColor = '#164e63'
</script>

<style scoped>
.app-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-accent-light);
  border: 2px solid var(--color-btn-ghost-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
