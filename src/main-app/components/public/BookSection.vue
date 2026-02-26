<template>
  <section class="section">
    <div class="section-inner">
      <div class="book-layout">
        <div class="book-image-wrap">
          <img
            src="https://images3.penguinrandomhouse.com/cover/9780143126560"
            alt="Getting Things Done by David Allen"
            class="book-image"
          />
        </div>
        <div class="book-text">
          <h2 class="text-h2 color-text-primary">Want to Know More About GTD?</h2>
          <p class="text-body-m book-desc">
            Getting Things Done by David Allen is the definitive guide to stress-free productivity.
            Learn the complete methodology that inspired this app.
          </p>
          <Btn
            variant="ghost"
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

.book-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.book-image-wrap {
  flex-shrink: 0;
}

.book-image {
  width: 180px;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.book-text {
  text-align: center;
}

.book-desc {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.book-btn {
  margin-top: 20px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .book-layout {
    flex-direction: row;
    align-items: center;
  }

  .book-image {
    width: 200px;
  }

  .book-text {
    text-align: left;
  }
}
</style>
