<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-waiting">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="soft" d="M36 54 Q36 82 50 92 Q64 82 64 54 Z M36 130 Q36 102 50 92 Q64 102 64 130 Z"/>
    <path class="sand" d="M42 68 Q50 74 58 68 Q56 82 50 88 Q44 82 42 68 Z M40 130 Q50 108 60 130 Z"/>
    <path class="line" d="M36 54 Q36 82 50 92 Q36 102 36 130 M64 54 Q64 82 50 92 Q64 102 64 130 M30 54 H70 M30 130 H70"/>
    <path class="arc" d="M74 100 C92 98 102 80 110 60"/>
    <path class="line soft" d="M138 30 L104 46 L118 52 L124 66 Z M138 30 L118 52"/>
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

.sand {
  fill: var(--color-highlight-amber);
}

.arc {
  stroke: var(--color-border-medium);
  stroke-width: 3;
  stroke-dasharray: 4 8;
}
</style>
