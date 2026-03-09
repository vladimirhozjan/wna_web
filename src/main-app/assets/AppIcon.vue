<template>
  <div class="app-icon-wrap">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="14" fill="url(#logo-grad)"/>
      <path d="M15.4 4.4L6.8 16.4h7.8L12.6 23.6 21.2 11.6h-7.8L15.4 4.4z" fill="#ffffff"/>
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
import { computed } from 'vue'
import { themeModel } from '../scripts/models/themeModel.js'

const theme = themeModel()

const colorMap = {
  sky:   { main: '#4185DE', dark: '#1a56a8' },
  blue:  { main: '#3730a3', dark: '#1e1b6e' },
  teal:  { main: '#14b8a6', dark: '#134e4a' },
  ocean: { main: '#0e7490', dark: '#164e63' },
}

const mainColor = computed(() => colorMap[theme.accent.value]?.main || '#4185DE')
const darkColor = computed(() => colorMap[theme.accent.value]?.dark || '#1a56a8')
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
