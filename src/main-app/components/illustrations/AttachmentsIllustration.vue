<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-attachments">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="sheet" x="40" y="40" width="60" height="76" rx="4" transform="rotate(-6 70 78)"/>
    <rect class="sheet" x="56" y="52" width="60" height="76" rx="4"/>
    <path class="sheet-line" d="M70 78 H104 M70 90 H104 M70 102 H92"/>
    <path class="line" d="M64 72 V40 a8 8 0 0 1 16 0 V80 a12 12 0 0 1 -24 0 V48"/>
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

.sheet {
  fill: var(--color-bg-subtle);
  stroke: var(--color-border-medium);
  stroke-width: 3;
}

.sheet-line {
  stroke: var(--color-border-medium);
  stroke-width: 3;
}
</style>
