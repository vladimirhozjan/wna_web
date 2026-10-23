<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-projects">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="block" x="78" y="56" width="40" height="16" rx="3"/>
    <rect class="block" x="84" y="42" width="28" height="14" rx="3"/>
    <rect class="block" x="90" y="30" width="16" height="12" rx="3"/>
    <path class="line" d="M98 30 V12"/>
    <path class="flag" d="M98 12 L114 17 L98 22 Z"/>
    <path class="line soft" d="M34 64 H64 L72 72 H126 a6 6 0 0 1 6 6 V124 a6 6 0 0 1 -6 6 H34 a6 6 0 0 1 -6 -6 V70 a6 6 0 0 1 6 -6 Z"/>
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

.block {
  fill: var(--color-action-subtle);
  stroke: var(--color-action);
  stroke-width: 3;
}

.flag {
  fill: var(--color-project);
}
</style>
