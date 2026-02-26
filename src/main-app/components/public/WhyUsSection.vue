<template>
  <section class="section">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">Designed for Clarity and Focus</h2>
      <div class="items-row">
        <div v-for="item in items" :key="item.title" class="item">
          <div class="icon-circle">
            <svg v-html="item.svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="item-icon" />
          </div>
          <h3 class="text-h4">{{ item.title }}</h3>
          <p class="text-body-s item-desc">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const items = [
  {
    title: 'Pure GTD',
    description: 'Built with strict adherence to the Getting Things Done methodology. No compromises, no shortcuts.',
    svg: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  },
  {
    title: 'Minimalist Design',
    description: 'A clean, distraction-free interface that helps you focus on what truly matters.',
    svg: '<path fill="currentColor" d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5z"/><path fill="currentColor" d="M13 13h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z"/>',
  },
  {
    title: 'Cross-Platform',
    description: 'Access your system from any device. Your lists stay in sync everywhere you go.',
    svg: '<path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>',
  },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-primary);
  text-align: center;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.items-row {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 32px;
  align-items: center;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 280px;
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(65, 133, 222, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 24px;
  height: 24px;
  color: var(--color-action);
}

.item .text-h4 {
  margin-top: 16px;
}

.item-desc {
  color: var(--color-text-secondary);
  margin-top: 8px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .items-row {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
