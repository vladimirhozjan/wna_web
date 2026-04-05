<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">

    <!-- Pricing Hero -->
    <section class="section section--white">
      <div class="section-inner">
        <h1 class="text-h1 hero-heading">Find Your Focus, Achieve Your Goals</h1>
        <p class="text-body-m hero-subtitle">Choose the plan that's right for you.</p>

        <!-- Billing toggle -->
        <div class="toggle-wrap">
          <button
              :class="['text-body-m fw-semibold toggle-btn', { 'toggle-btn--active': !yearly }]"
              @click="yearly = false"
          >
            Monthly
          </button>
          <button
              :class="['text-body-m fw-semibold toggle-btn toggle-btn--yearly', { 'toggle-btn--active': yearly }]"
              @click="yearly = true"
          >
            Yearly
            <span class="save-badge text-footnote">3 months free</span>
          </button>
        </div>

        <!-- Tier grid -->
        <div class="tier-grid">
          <PricingTier
              v-for="tier in tiers"
              :key="tier.name"
              :name="tier.name"
              :price="yearly ? tier.yearlyPrice : tier.monthlyPrice"
              :period="yearly ? 'year' : 'month'"
              :description="tier.description"
              :features="tier.features"
              :featured="tier.featured"
              :cta-text="isBeta ? 'Coming soon' : tier.ctaText"
              :per-user="tier.perUser || false"
              :yearly-total="tier.yearlyTotal || 0"
              :disabled="isBeta"
              @cta-click="tier.action"
          />
        </div>
      </div>
    </section>

    <!-- Feature Comparison Table -->
    <section class="section section--gray">
      <div class="section-inner section-inner--wide">
        <h2 class="text-h2 table-heading">Compare Features</h2>

        <!-- Desktop table -->
        <table class="compare-table">
          <thead>
            <tr>
              <th class="text-body-s">Feature</th>
              <th class="text-body-s">Free</th>
              <th class="text-body-s">Pro</th>
              <th class="text-body-s">Team</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in comparisonRows" :key="row.group || row.feature">
              <tr v-if="row.group" class="compare-group-row">
                <td colspan="4" class="text-body-s fw-semibold compare-group">{{ row.group }}</td>
              </tr>
              <tr v-else>
                <td class="text-body-s compare-feature">{{ row.feature }}</td>
                <td class="text-body-s compare-value" v-for="val in [row.free, row.pro, row.team]" :key="val">
                  <CheckIcon v-if="val === true" class="icon-check" />
                  <span v-else-if="val === false" class="icon-dash">—</span>
                  <span v-else>{{ val }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Mobile cards -->
        <div class="compare-cards">
          <template v-for="row in comparisonRows" :key="row.group || row.feature">
            <div v-if="row.group" class="compare-cards__group text-body-s fw-semibold">{{ row.group }}</div>
            <div v-else class="compare-card">
              <span class="text-body-s compare-card__feature">{{ row.feature }}</span>
              <div class="compare-card__values">
                <div v-for="(val, plan) in { Free: row.free, Pro: row.pro, Team: row.team }" :key="plan" class="compare-card__cell">
                  <span class="text-footnote compare-card__plan">{{ plan }}</span>
                  <CheckIcon v-if="val === true" class="icon-check" />
                  <span v-else-if="val === false" class="icon-dash">—</span>
                  <span v-else class="text-body-s">{{ val }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <CtaBanner @open-register="openAuth('register')" />

  </LandingLayout>

  <AuthDialog
      v-model:mode="authMode"
      @logged-in="onSuccess"
      @registered="onSuccess"
      @password-reset-success="onSuccessPasswordReset"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import PricingTier from '../../components/public/PricingTier.vue'
import CtaBanner from '../../components/public/CtaBanner.vue'
import CheckIcon from '../../assets/CheckIcon.vue'

const router = useRouter()
const { isBeta } = flagsModel()
const authMode = ref(null)
const yearly = ref(true)

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

const tiers = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Get started with GTD for free.',
    featured: false,
    ctaText: 'Start for Free',
    features: [
      'Unlimited stuff & actions',
      'Up to 7 projects',
      'Up to 10 tags',
      'View-only reference files',
      '50 MB storage',
      'Community support',
    ],
    action: () => openAuth('register'),
  },
  {
    name: 'Pro',
    monthlyPrice: 11,
    yearlyPrice: 8,
    yearlyTotal: 96,
    description: 'For the individual power user.',
    featured: true,
    ctaText: 'Contact Us',
    features: [
      'Unlimited stuff & actions',
      'Unlimited projects & tags',
      'Recurring actions',
      'Full reference files',
      '250 MB storage',
      'Priority support',
    ],
    action: () => { window.location.href = 'mailto:support@whatsnextaction.com' },
  },
  {
    name: 'Team',
    monthlyPrice: 18,
    yearlyPrice: 13,
    yearlyTotal: 156,
    perUser: true,
    description: 'For teams that delegate work together.',
    featured: false,
    ctaText: 'Contact Us',
    features: [
      'Unlimited stuff & actions',
      'Unlimited projects & tags',
      'Recurring actions',
      'Full reference files',
      '1 GB/user storage',
      'Dedicated support',
    ],
    action: () => { window.location.href = 'mailto:support@whatsnextaction.com' },
  },
]

const comparisonRows = [
  { group: 'Core' },
  { feature: 'Stuff & Actions',     free: 'Unlimited',  pro: 'Unlimited',  team: 'Unlimited' },
  { feature: 'Projects',            free: '7',           pro: 'Unlimited',  team: 'Unlimited' },
  { feature: 'Tags',                free: '10',          pro: 'Unlimited',  team: 'Unlimited' },
  { feature: 'Recurring actions',   free: false,         pro: true,         team: true },
  { feature: 'Reference files',     free: 'View only',   pro: 'Full',       team: 'Full' },
  { group: 'Storage' },
  { feature: 'WNA hosted storage',  free: '50 MB',       pro: '250 MB',     team: '1 GB/user' },
  { feature: 'Max attachment size', free: '5 MB',        pro: '20 MB',      team: '50 MB' },
  { group: 'Support' },
{ feature: 'Support',             free: 'Community',   pro: 'Priority',   team: 'Dedicated' },
]
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
.section-inner--wide {
  max-width: 1100px;
}

@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}

/* Hero */
.hero-heading {
  text-align: center;
  color: var(--color-text-primary);
}
.hero-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

/* Billing toggle */
.toggle-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
}

.toggle-btn {
  min-width: 130px;
  padding: 12px 28px;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: center;
  transition: 0.15s background, 0.15s color, 0.15s border-color;
}

.toggle-btn:first-child {
  border-radius: 8px 0 0 8px;
  border-right: none;
}

.toggle-btn--yearly {
  position: relative;
  border-radius: 0 8px 8px 0;
}

.toggle-btn--active {
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-color: var(--color-action);
}

.toggle-btn:first-child.toggle-btn--active + .toggle-btn {
  border-left-color: var(--color-action);
}

.save-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: var(--color-bg-primary);
  background-image: linear-gradient(var(--color-success-light), var(--color-success-light));
  color: var(--color-success);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  line-height: var(--lh-normal);
}

/* Tier grid */
.tier-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 36px;
}

@media (min-width: 769px) {
  .tier-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Comparison table heading */
.table-heading {
  text-align: center;
  color: var(--color-text-primary);
  margin-bottom: 28px;
}

/* Desktop table — hidden on mobile */
.compare-table {
  display: none;
  width: 100%;
  border-collapse: collapse;
}

.compare-table th,
.compare-table td {
  padding: 10px 14px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
}

.compare-table th {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
}

.compare-table th:first-child,
.compare-table td:first-child {
  text-align: left;
}

.compare-group-row td {
  border-bottom: none;
}

.compare-group {
  color: var(--color-text-tertiary);
  text-align: left;
  padding: 20px 14px 6px;
  font-weight: var(--font-weight-semibold);
}

.compare-feature {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.compare-value {
  color: var(--color-text-secondary);
}

/* Mobile cards — hidden on desktop, shown on mobile */
.compare-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 769px) {
  .compare-table { display: table; }
}

@media (max-width: 768px) {
  .compare-cards { display: flex; }
}

.compare-cards__group {
  color: var(--color-text-primary);
  padding: 8px 0 4px;
}

.compare-card {
  background: var(--color-bg-primary);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: 14px 16px;
}

.compare-card__feature {
  display: block;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 10px;
}

.compare-card__values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.compare-card__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.compare-card__plan {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Shared icons */
.icon-check {
  width: 18px;
  height: 18px;
  padding: 2px;
  box-sizing: border-box;
  color: var(--color-success);
  display: inline-block;
  vertical-align: middle;
}

.icon-dash {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
}
</style>
