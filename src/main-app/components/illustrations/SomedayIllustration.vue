<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-someday">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line soft" d="M46 126 H114 A16 16 0 0 0 116 94 A22 22 0 0 0 76 84 A18 18 0 0 0 46 98 A15 15 0 0 0 46 126 Z"/>
    <path class="string" d="M112 48 C106 56 118 60 110 68"/>
    <path class="line kite" d="M112 12 L124 30 L112 48 L100 30 Z"/>
    <path class="kite-frame" d="M112 12 V48 M100 30 H124"/>
  </svg>
</template>

<script setup>
</script>

<style scoped>
.ground {
  fill: var(--color-bg-secondary);
}

.line {
  stroke: var(--color-action);
  stroke-width: 4;
}

.soft {
  fill: var(--color-action-subtle);
}

.kite {
  fill: var(--color-highlight-amber);
}

.kite-frame {
  stroke: var(--color-action);
  stroke-width: 2;
}

.string {
  stroke: var(--color-border-medium);
  stroke-width: 2;
}
</style>
