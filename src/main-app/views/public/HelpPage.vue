<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">

    <!-- Header + Search -->
    <section class="section section--white">
      <div class="section-inner">
        <h1 class="text-h1 heading">Help &amp; Resources</h1>
        <div class="search-wrap">
          <div class="search-field">
            <SearchIcon class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input text-body-m"
              placeholder="Search help topics"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Getting Started -->
    <section v-if="!isSearching || filteredStarted.length" class="section section--gray">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="text-h2 section-heading">
            <RocketIcon class="section-heading__icon" />
            Getting Started
          </h2>
          <router-link v-if="!isSearching && gettingStarted.length > STARTED_LIMIT" to="/help/getting-started" class="show-more show-more--desktop text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
        <div class="card-grid">
          <div v-for="item in (isSearching ? filteredStarted : visibleStarted)" :key="item.title" class="card">
            <h3 class="text-h4">{{ item.title }}</h3>
            <p class="text-body-s card-desc">{{ item.description }}</p>
          </div>
        </div>
        <div v-if="!isSearching && gettingStarted.length > STARTED_LIMIT" class="show-more-wrap show-more-wrap--mobile">
          <router-link to="/help/getting-started" class="show-more text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section v-if="!isSearching || filteredFaq.length" class="section section--white">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="text-h2 section-heading">
            <QuizIcon class="section-heading__icon" />
            Frequently Asked Questions
          </h2>
          <router-link v-if="!isSearching && faq.length > FAQ_LIMIT" to="/help/faq" class="show-more show-more--desktop text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
        <div class="faq-list">
          <FaqItem
            v-for="item in (isSearching ? filteredFaq : visibleFaq)"
            :key="item.question"
            :question="item.question"
            :answer="item.answer"
          />
        </div>
        <div v-if="!isSearching && faq.length > FAQ_LIMIT" class="show-more-wrap show-more-wrap--mobile">
          <router-link to="/help/faq" class="show-more text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- GTD Best Practices -->
    <section v-if="!isSearching || filteredPractices.length" class="section section--gray">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="text-h2 section-heading">
            <ThumbUpIcon class="section-heading__icon" />
            GTD Best Practices
          </h2>
          <router-link v-if="!isSearching && bestPractices.length > PRACTICES_LIMIT" to="/help/best-practices" class="show-more show-more--desktop text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
        <div class="card-grid">
          <div v-for="item in (isSearching ? filteredPractices : visiblePractices)" :key="item.title" class="card">
            <h3 class="text-h4">{{ item.title }}</h3>
            <p class="text-body-s card-desc">{{ item.description }}</p>
          </div>
        </div>
        <div v-if="!isSearching && bestPractices.length > PRACTICES_LIMIT" class="show-more-wrap show-more-wrap--mobile">
          <router-link to="/help/best-practices" class="show-more text-body-s">
            Show all
            <ArrowRightSmallIcon class="show-more__chevron" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- No results -->
    <section v-if="isSearching && !filteredStarted.length && !filteredFaq.length && !filteredPractices.length" class="section section--white">
      <div class="section-inner no-results">
        <p class="text-body-m" style="color: var(--color-text-secondary);">No results found for "{{ searchQuery.trim() }}"</p>
      </div>
    </section>

    <!-- Contact / Support -->
    <section class="section section--white">
      <div class="section-inner contact-section">
        <p class="text-body-m contact-text">Can't find what you're looking for?</p>
        <Btn variant="link" size="md" @click="contactSupport">Contact Support</Btn>
      </div>
    </section>

  </LandingLayout>

  <AuthDialog
    v-model:mode="authMode"
    @logged-in="onSuccess"
    @registered="onSuccess"
    @password-reset-success="onSuccessPasswordReset"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import Btn from '../../components/Btn.vue'
import FaqItem from '../../components/public/FaqItem.vue'
import SearchIcon from '../../assets/SearchIcon.vue'
import RocketIcon from '../../assets/RocketIcon.vue'
import QuizIcon from '../../assets/QuizIcon.vue'
import ThumbUpIcon from '../../assets/ThumbUpIcon.vue'
import ArrowRightSmallIcon from '../../assets/ArrowRightSmallIcon.vue'
import { gettingStarted } from '../../content/help/gettingStarted.js'
import { bestPractices } from '../../content/help/bestPractices.js'
import { faq } from '../../content/help/faq.js'

const STARTED_LIMIT = 3
const FAQ_LIMIT = 5
const PRACTICES_LIMIT = 3

const router = useRouter()
const authMode = ref(null)
const searchQuery = ref('')

const isSearching = computed(() => searchQuery.value.trim().length > 0)

function matchesSearch(text) {
  return text.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
}

const visibleStarted = computed(() => gettingStarted.slice(0, STARTED_LIMIT))
const visibleFaq = computed(() => faq.slice(0, FAQ_LIMIT))
const visiblePractices = computed(() => bestPractices.slice(0, PRACTICES_LIMIT))

const filteredStarted = computed(() =>
  gettingStarted.filter(i => matchesSearch(i.title) || matchesSearch(i.description))
)
const filteredFaq = computed(() =>
  faq.filter(i => matchesSearch(i.question) || matchesSearch(i.answer))
)
const filteredPractices = computed(() =>
  bestPractices.filter(i => matchesSearch(i.title) || matchesSearch(i.description))
)

function openAuth(mode) {
  authMode.value = mode
}

function closeAuth() {
  authMode.value = null
}

function onSuccess() {
  closeAuth()
  router.push({ name: 'engage' })
}

function onSuccessPasswordReset() {
  closeAuth()
  router.push({ name: 'login' })
}

function contactSupport() {
  window.location.href = 'mailto:support@whatsnextaction.com'
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Sections */
.section {
  padding: var(--section-py-mobile) var(--section-px);
}
.section--white { background: var(--color-bg-primary); }
.section--gray  { background: var(--color-bg-secondary); }

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}

/* Headings */
.heading {
  text-align: center;
  color: var(--color-text-primary);
}

/* Search */
.search-wrap {
  margin-top: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.search-field {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-primary);
  padding: 0 16px;
  height: 48px;
  transition: border-color 0.15s;
}

.search-field:focus-within {
  border-color: var(--color-action);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  padding: 0 12px;
  color: var(--color-text-primary);
  font-family: var(--font-family-default), serif;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

/* Section header row */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* Section headings with icons */
.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-primary);
}

.section-heading__icon {
  width: 28px;
  height: 28px;
  color: var(--color-action);
  flex-shrink: 0;
}

/* Card grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 20px;
}

.card {
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  background: var(--color-bg-primary);
  text-align: left;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
}

.card-desc {
  color: var(--color-text-secondary);
  margin-top: 18px;
}

@media (min-width: 520px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 769px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* FAQ list */
.faq-list {
  margin-top: 20px;
  text-align: left;
}

/* Show more toggle */
.show-more-wrap {
  text-align: center;
  margin-top: 20px;
}

.show-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-action);
  font-family: var(--font-family-default), serif;
  font-weight: 500;
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
}

/* Desktop: show in header row, hide bottom link */
.show-more--desktop {
  display: none;
}

@media (min-width: 769px) {
  .show-more--desktop {
    display: inline-flex;
  }
  .show-more-wrap--mobile {
    display: none;
  }
}

/* No results */
.no-results {
  text-align: center;
  padding: 20px 0;
}

/* Contact section */
.contact-section {
  text-align: center;
  padding-top: 32px;
  border-top: 1px solid var(--color-border-light);
}

.contact-text {
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}
</style>