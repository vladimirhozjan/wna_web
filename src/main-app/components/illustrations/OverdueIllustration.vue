<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-overdue">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <rect class="line soft" x="34" y="40" width="84" height="88" rx="6"/>
    <path class="line" d="M34 60 H118 M54 32 V46 M98 32 V46"/>
    <path class="tick" d="M52 92 L68 108 L98 76"/>
    <circle class="line clock" cx="120" cy="112" r="18"/>
    <path class="line" d="M120 102 V112 L127 117"/>
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

.clock {
  fill: var(--color-bg-secondary);
}

.tick {
  stroke: var(--color-success);
  stroke-width: 6;
}
</style>
