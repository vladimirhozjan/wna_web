<template>
  <section class="section" id="why-us">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">Designed for Clarity and Focus</h2>
      <div class="items-row">
        <div v-for="item in items" :key="item.title" class="item">
          <div class="icon-circle">
            <svg v-html="item.svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" class="item-icon" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </div>
          <h3 class="text-h4 item-title">{{ item.title }}</h3>
          <p class="text-caption item-desc">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const items = [
  {
    title: 'Methodology-Driven',
    description: 'Built around a proven five-step system for capturing, clarifying, and organizing your work. No compromises, no shortcuts.',
    svg: '<path d="M45.8337 23.0834V25C45.8311 29.4926 44.3764 33.8639 41.6864 37.4622C38.9965 41.0604 35.2155 43.6927 30.9073 44.9665C26.5991 46.2403 21.9946 46.0873 17.7805 44.5304C13.5663 42.9735 9.96836 40.0961 7.52316 36.3273C5.07796 32.5584 3.91656 28.1002 4.21215 23.6174C4.50775 19.1346 6.24451 14.8674 9.16341 11.4523C12.0823 8.03717 16.027 5.65709 20.4091 4.66701C24.7911 3.67694 29.3759 4.12991 33.4795 5.95838" stroke="white" stroke-width="1.5"/><path d="M45.8333 8.33337L25 29.1875L18.75 22.9375" stroke="white" stroke-width="1.5"/>',
  },
  {
    title: 'Minimalist Design',
    description: 'A clean, distraction-free interface that helps you focus on what truly matters.',
    svg: '<path d="M20.8333 6.25H6.25V20.8333H20.8333V6.25Z" stroke="white" stroke-width="1.5"/><path d="M43.7503 6.25H29.167V20.8333H43.7503V6.25Z" stroke="white" stroke-width="1.5"/><path d="M20.8333 29.1666H6.25V43.75H20.8333V29.1666Z" stroke="white" stroke-width="1.5"/><path d="M43.7503 29.1666H29.167V43.75H43.7503V29.1666Z" stroke="white" stroke-width="1.5"/>',
  },
  {
    title: 'Cross-Platform',
    description: 'Access your system from any device. Your lists stay in sync everywhere you go.',
    svg: '<path d="M25.0003 45.8333C36.5063 45.8333 45.8337 36.5059 45.8337 25C45.8337 13.494 36.5063 4.16663 25.0003 4.16663C13.4944 4.16663 4.16699 13.494 4.16699 25C4.16699 36.5059 13.4944 45.8333 25.0003 45.8333Z" stroke="white" stroke-width="1.5"/><path d="M4.16699 25H45.8337" stroke="white" stroke-width="1.5"/><path d="M25.0003 4.16663C30.2113 9.87153 33.1727 17.275 33.3337 25C33.1727 32.7249 30.2113 40.1284 25.0003 45.8333C19.7893 40.1284 16.8279 32.7249 16.667 25C16.8279 17.275 19.7893 9.87153 25.0003 4.16663Z" stroke="white" stroke-width="1.5"/>',
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
  gap: 40px;
  margin-top: 48px;
  align-items: center;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 280px;
}

.icon-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #164E63 0%, #0E7490 60%, #22D3EE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 50px;
  height: 50px;
  color: var(--color-text-inverse);
}

.item-title {
  margin-top: 16px;
  color: var(--color-text-primary-dark);
}

.item-desc {
  color: var(--color-text-secondary-light);
  margin-top: 12px;
  line-height: var(--lh-loose);
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
