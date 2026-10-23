<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-search">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="line" x="32" y="30" width="68" height="90" rx="6"/>
    <path class="dots" d="M46 50 H86 M46 64 H86 M46 78 H86 M46 92 H78 M46 106 H70"/>
    <circle class="line soft" cx="100" cy="88" r="24"/>
    <path class="handle" d="M117 105 L132 120"/>
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

.dots {
  stroke: var(--color-border-medium);
  stroke-width: 4;
  stroke-dasharray: 0 8;
}

.handle {
  stroke: var(--color-action);
  stroke-width: 8;
}
</style>
