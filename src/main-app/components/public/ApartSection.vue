<template>
  <section class="section" id="features" data-testid="landing-apart">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">What Sets Us Apart</h2>
      <p class="text-body-m section-subtitle">Built on Getting Things Done, connected to the tools you already use.</p>
      <div class="apart-grid">
        <div v-for="card in cards" :key="card.key" class="apart-card" :data-testid="`landing-apart-card-${card.key}`">
          <div v-if="!failed[card.key]" class="shot-box">
            <img :src="card.image" :alt="card.alt" class="shot-img" loading="lazy" @error="failed[card.key] = true" />
          </div>
          <Badge type="primary" class="plan-chip" data-testid="landing-plan-chip">{{ card.plan }}</Badge>
          <h3 class="text-h3-italic card-title">{{ card.title }}</h3>
          <p class="text-body-s card-desc">{{ card.description }}</p>
        </div>
      </div>
      <p class="text-body-m pricing-pointer" data-testid="landing-pricing-pointer">
        Start free — upgrade when you need more → <router-link to="/pricing" class="pricing-link">See pricing</router-link>
      </p>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import Badge from '../Badge.vue'
import calendarShot from '../../assets/landing/landing-calendar.png'
import driveShot from '../../assets/landing/landing-drive.png'
import emailShot from '../../assets/landing/landing-email.png'
import teamShot from '../../assets/landing/landing-team.png'

const cards = [
  {
    key: 'calendar',
    image: calendarShot,
    alt: 'Calendar week view with scheduled actions',
    plan: 'Pro & Team',
    title: 'Google Calendar Sync',
    description: 'Your scheduled actions sync both ways with Google Calendar.',
  },
  {
    key: 'drive',
    image: driveShot,
    alt: 'Reference files on the Google Drive side',
    plan: 'All plans',
    title: 'Google Drive Storage',
    description: 'Keep your reference files in your own Google Drive, organized right here.',
  },
  {
    key: 'email',
    image: emailShot,
    alt: 'Inbox with items captured from forwarded emails',
    plan: 'Pro & Team',
    title: 'Email to Inbox',
    description: 'Forward any email to your private address and it lands in your Inbox.',
  },
  {
    key: 'team',
    image: teamShot,
    alt: 'Shared project with members and assigned actions',
    plan: 'Team',
    title: 'Team Collaboration',
    description: 'Connect with colleagues, delegate actions and share projects.',
  },
]

const failed = reactive({})
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-subtle);
  text-align: center;
  scroll-margin-top: 64px;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.section-subtitle {
  color: var(--color-text-secondary-light);
  margin-top: 12px;
}

.apart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 36px;
}

.apart-card {
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  background: var(--color-bg-primary);
  text-align: center;
  transition: box-shadow 0.2s;
}

.apart-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.shot-box {
  aspect-ratio: 16 / 10;
  border: var(--card-border);
  border-radius: var(--card-radius);
  background: var(--color-bg-subtle);
  overflow: hidden;
  margin-bottom: 20px;
}

.shot-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-title {
  margin-top: 16px;
  color: var(--color-text-primary-dark);
}

.card-desc {
  color: var(--color-text-secondary-light);
  margin-top: 12px;
}

.pricing-pointer {
  color: var(--color-text-secondary);
  margin-top: 36px;
}

.pricing-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.pricing-link:hover {
  color: var(--color-link-hover);
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .apart-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
