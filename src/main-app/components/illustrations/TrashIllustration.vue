<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-trash">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line soft" d="M50 66 L56 128 a4 4 0 0 0 4 4 H100 a4 4 0 0 0 4 -4 L110 66 Z"/>
    <path class="line" d="M70 80 L72 116 M80 80 V116 M90 80 L88 116"/>
    <g transform="rotate(-14 44 60)">
      <path class="line" d="M44 60 H116 M70 60 V54 H90 V60"/>
    </g>
    <path class="sparkle" d="M126 18 V34 M118 26 H134 M140 45 V55 M135 50 H145"/>
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

.sparkle {
  stroke: var(--color-text-tertiary);
  stroke-width: 3;
}
</style>
