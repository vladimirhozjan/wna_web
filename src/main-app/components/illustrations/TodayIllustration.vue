<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-today">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="sun" d="M84 130 A26 26 0 0 1 136 130 Z"/>
    <path class="ray" d="M110 98 V88 M126 102.3 L131 93.6 M94 102.3 L89 93.6"/>
    <rect class="line soft" x="28" y="58" width="54" height="72" rx="6"/>
    <path class="line" d="M40 74 H70 M40 88 H70 M40 102 H60"/>
    <path class="line" d="M22 130 H138"/>
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

.sun {
  fill: var(--color-highlight-amber);
}

.ray {
  stroke: var(--color-highlight-amber);
  stroke-width: 4;
}
</style>
