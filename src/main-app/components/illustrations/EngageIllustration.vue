<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-engage">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <path class="line soft" d="M80 58 C66 50 46 50 32 54 V120 C46 116 66 116 80 124 Z M80 58 C94 50 114 50 128 54 V120 C114 116 94 116 80 124 Z"/>
    <g transform="rotate(-28 92 88)">
      <rect class="base" x="66" y="82" width="52" height="12" rx="2"/>
      <rect class="pencil" x="66" y="82" width="52" height="12" rx="2"/>
      <path class="pencil-line" d="M66 82 L54 88 L66 94 M110 82 V94"/>
    </g>
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

.base {
  fill: var(--color-bg-secondary);
}

.pencil {
  fill: var(--color-highlight-amber);
  stroke: var(--color-action);
  stroke-width: 3;
}

.pencil-line {
  stroke: var(--color-action);
  stroke-width: 3;
}
</style>
