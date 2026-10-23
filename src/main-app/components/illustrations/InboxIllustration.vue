<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-inbox">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line soft" d="M28 80 L44 52 H116 L132 80 V114 a6 6 0 0 1 -6 6 H34 a6 6 0 0 1 -6 -6 Z"/>
    <path class="line" d="M28 80 H58 L64 92 H96 L102 80 H132"/>
    <ellipse class="ripple" cx="80" cy="68" rx="8" ry="2.5"/>
    <ellipse class="ripple" cx="80" cy="68" rx="18" ry="5"/>
    <ellipse class="ripple" cx="80" cy="68" rx="28" ry="7.5"/>
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

.ripple {
  stroke: var(--color-action-medium);
  stroke-width: 2.5;
}
</style>
