<template>
  <div class="theme-row" @click="theme.toggleTheme()">
    <span class="theme-icon">
      <ThemeIcon />
    </span>
    <span class="theme-label">Dark Theme</span>
    <span class="toggle-track" :class="{ on: theme.isDark.value }">
      <span class="toggle-thumb" />
    </span>
  </div>
</template>

<script setup>
import { themeModel } from '../scripts/models/themeModel.js'
import ThemeIcon from '../assets/ThemeIcon.vue'

const theme = themeModel()
</script>

<style scoped>
.theme-row {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 10px;
  cursor: pointer;
}

.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.theme-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.theme-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex: 1;
}

.toggle-track {
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  background: var(--color-border-medium);
  position: relative;
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}

.toggle-track.on {
  background: var(--color-action);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-track.on .toggle-thumb {
  left: 18px;
}
</style>
