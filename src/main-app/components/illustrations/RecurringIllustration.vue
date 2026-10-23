<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-recurring">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="day" x="60" y="60" width="40" height="40" rx="6"/>
    <path class="day" d="M60 72 H100"/>
    <path class="line" d="M44.3 67 A38 38 0 0 1 115.7 67 M118.9 55.2 L115.7 67 L105.7 60"/>
    <path class="line" d="M115.7 93 A38 38 0 0 1 44.3 93 M41.1 104.8 L44.3 93 L54.3 100"/>
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

.day {
  fill: var(--color-bg-secondary);
  stroke: var(--color-border-medium);
  stroke-width: 3;
}
</style>
