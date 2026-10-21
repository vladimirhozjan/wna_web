<template>
  <section class="section" id="faq" data-testid="landing-faq">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary heading">Frequently Asked Questions</h2>
      <div class="faq-list">
        <FaqItem
          v-for="item in entries"
          :key="item.question"
          :question="item.question"
          :answer="item.answer"
        />
      </div>
      <div class="show-more-wrap">
        <router-link to="/help/faq" class="text-body-s fw-medium show-more" data-testid="landing-faq-all">
          All questions
          <ArrowRightSmallIcon class="show-more__chevron" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import FaqItem from './FaqItem.vue'
import ArrowRightSmallIcon from '../../assets/ArrowRightSmallIcon.vue'
import { faq } from '../../content/help/faq.js'

const QUESTIONS = [
  'What plans are available?',
  'Can I use WhatsNextAction on my phone?',
  'Can I sign in with Google?',
  'How do I cancel my subscription?',
]

const entries = QUESTIONS.map(q => faq.find(item => item.question === q)).filter(Boolean)
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-subtle);
  scroll-margin-top: 64px;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.heading {
  text-align: center;
}

.faq-list {
  margin-top: 36px;
  text-align: left;
}

.show-more-wrap {
  text-align: center;
  margin-top: 20px;
}

.show-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: var(--color-action);
  min-height: 44px;
  text-decoration: none;
  white-space: nowrap;
}

.show-more:hover {
  color: var(--color-link-hover);
}

.show-more__chevron {
  width: 16px;
  height: 16px;
  padding: 1px;
  box-sizing: border-box;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }
}
</style>
