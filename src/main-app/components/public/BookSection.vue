<template>
  <section class="section">
    <div class="section-inner">
      <div class="book-card">
        <div class="book-image-wrap">
          <img
            src="https://images3.penguinrandomhouse.com/cover/9780143126560"
            alt="Getting Things Done by David Allen"
            class="book-image"
          />
        </div>
        <div class="book-text">
          <h2 class="text-h3 book-title">Want to Know More About GTD?</h2>
          <p class="text-body-s book-desc">
            Getting Things Done by David Allen is the definitive guide to stress-free productivity.
            Learn the complete methodology that inspired this app.
          </p>
          <Btn
            variant="primary"
            size="md"
            class="book-btn"
            @click="openBook"
          >Get the Book on Amazon</Btn>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Btn from '../Btn.vue'

function openBook() {
  window.open('https://www.amazon.com/Getting-Things-Done-Stress-Free-Productivity/dp/0143126563', '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-primary);
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.book-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  border: var(--card-border);
  border-radius: 24px;
  padding: 32px;
  background: var(--color-bg-primary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.book-image-wrap {
  flex-shrink: 0;
}

.book-image {
  width: 140px;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.book-text {
  text-align: center;
}

.book-title {
  color: var(--color-text-primary-dark);
}

.book-desc {
  color: var(--color-text-secondary-light);
  margin-top: 16px;
  line-height: var(--lh-legal);
}

.book-btn {
  margin-top: 24px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .book-card {
    flex-direction: row;
    align-items: flex-start;
    gap: 32px;
    padding: 40px 48px;
  }

  .book-text {
    text-align: left;
  }
}
</style>
