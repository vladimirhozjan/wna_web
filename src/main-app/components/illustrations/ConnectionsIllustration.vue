<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-connections">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line" d="M62 92 H98"/>
    <circle class="node" cx="80" cy="92" r="6"/>
    <circle class="line soft" cx="38" cy="92" r="24"/>
    <circle class="line soft" cx="122" cy="92" r="24"/>
    <path class="person" d="M38 86 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M26 106 a12 10 0 0 1 24 0 M122 86 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M110 106 a12 10 0 0 1 24 0"/>
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

.node {
  fill: var(--color-action);
}

.person {
  stroke: var(--color-action);
  stroke-width: 3;
}
</style>
