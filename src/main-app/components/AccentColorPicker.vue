<template>
  <div class="color-panel">
    <div class="color-label">Accent Color</div>
    <div class="swatches">
      <button
          v-for="color in theme.accents"
          :key="color"
          class="swatch"
          :class="{ active: theme.accent.value === color }"
          :style="{ backgroundColor: swatchColors[color] }"
          :title="swatchTitles[color]"
          @click="theme.setAccent(color)"
      />
    </div>
  </div>
</template>

<script setup>
import { themeModel } from '../scripts/models/themeModel.js'

const theme = themeModel()

const swatchColors = {
  sky: '#4185DE',
  blue: '#3730a3',
  teal: '#14b8a6',
  ocean: '#06b6d4',
}

const swatchTitles = {
  sky: 'Sky Blue',
  blue: 'Royal Blue',
  teal: 'Teal',
  ocean: 'Ocean',
}
</script>

<style scoped>
.color-panel {
  margin: 8px 12px 4px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 10px 12px;
}

.color-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.swatches {
  display: flex;
  gap: 8px;
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  padding: 0;
  transition: all 0.2s ease;
  outline: 2px solid transparent;
  outline-offset: 1.5px;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch.active {
  outline-color: var(--color-text-secondary);
}
</style>
