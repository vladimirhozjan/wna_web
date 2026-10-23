<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-filter">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line soft" d="M36 30 H124 L92 72 V96 L68 108 V72 Z"/>
    <path class="tag" d="M66 126 L76 118 H106 a3 3 0 0 1 3 3 V131 a3 3 0 0 1 -3 3 H76 Z"/>
    <circle class="tag-hole" cx="78" cy="126" r="2"/>
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

.tag {
  stroke: var(--color-border-medium);
  stroke-width: 3;
}

.tag-hole {
  fill: var(--color-border-medium);
}
</style>
