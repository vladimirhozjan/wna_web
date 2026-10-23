<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-reference">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="line soft" x="36" y="40" width="88" height="92" rx="6"/>
    <rect class="line" x="44" y="46" width="72" height="24" rx="2"/>
    <path class="tab" d="M60 70 V56 H70 L74 51 H86 V70 Z"/>
    <rect class="line" x="40" y="70" width="80" height="22" rx="3"/>
    <path class="line" d="M70 81 H90"/>
    <rect class="line" x="44" y="100" width="72" height="24" rx="3"/>
    <path class="line" d="M70 112 H90"/>
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

.tab {
  fill: var(--color-file-blue);
}
</style>
