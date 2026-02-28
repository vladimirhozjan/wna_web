<template>
  <div class="under-construction-page">
    <div class="under-construction">
      <div class="top-segment">
        <h1 class="text-h2 title">Under Construction</h1>
        <p class="text-subtitle subtitle">
          We're building a GTD-inspired productivity platform. Please come back later to check the progress.
        </p>
      </div>

      <img
          class="image"
          src="../assets/UnderConstruction.svg"
          alt="Under construction"
      />
    </div>
  </div>
</template>

<script setup>
// No script needed – fully presentational component
</script>

<style scoped>
.under-construction-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin: auto;
}

.under-construction {
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
  text-align: center;
  max-width: 600px;
}

.top-segment {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-primary);
}

.image {
  max-width: 240px;
  width: 100%;
  height: auto;
}
</style>
