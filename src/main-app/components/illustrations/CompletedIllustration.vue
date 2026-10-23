<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-completed">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <circle class="soft" cx="80" cy="80" r="40"/>
    <path class="check" d="M60 82 L74 96 L102 66"/>
    <circle class="dot" cx="30" cy="46" r="3"/>
    <circle class="dot" cx="128" cy="40" r="3"/>
    <circle class="dot" cx="136" cy="92" r="2.5"/>
    <circle class="dot" cx="24" cy="100" r="2.5"/>
    <circle class="dot" cx="116" cy="124" r="2"/>
    <circle class="dot" cx="50" cy="20" r="2"/>
  </svg>
</template>

<script setup>
</script>

<style scoped>
.ground {
  fill: var(--color-bg-secondary);
}

.soft {
  fill: var(--color-action-subtle);
}

.check {
  stroke: var(--color-success);
  stroke-width: 8;
}

.dot {
  fill: var(--color-action-medium);
}
</style>
