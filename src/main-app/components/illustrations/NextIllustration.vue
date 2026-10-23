<template>
  <svg viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-testid="empty-illustration-next">
    <ellipse class="ground" cx="80" cy="136" rx="56" ry="7"/>
    <ellipse class="stone" cx="46" cy="122" rx="20" ry="8"/>
    <ellipse class="stone" cx="82" cy="98" rx="17" ry="7"/>
    <ellipse class="stone stone--last" cx="114" cy="72" rx="14" ry="6"/>
  </svg>
</template>

<script setup>
</script>

<style scoped>
.ground {
  fill: var(--color-bg-secondary);
}

.stone {
  fill: var(--color-bg-secondary);
  stroke: var(--color-border-medium);
  stroke-width: 3;
}

.stone--last {
  fill: var(--color-action);
  stroke: var(--color-action);
}
</style>
