<template>
  <section class="hero">
    <div class="hero-bg-overlay">
      <div class="hero-inner">
        <BoltIcon class="hero-bolt" />
        <h1 class="text-display hero-heading">You Decide. AI Does the Busywork.</h1>
        <p class="text-body-m hero-subtitle">The Getting Things Done app with a built-in AI assistant. Say what you want — it captures, sorts and schedules in your lists.</p>
        <div class="hero-actions">
          <Btn variant="primary" size="lg" @click="$emit('open-register')">Start Free</Btn>
          <button class="text-body-m fw-semibold hero-ghost-btn" @click="scrollToFeatures">Learn More</button>
        </div>
        <p class="text-footnote hero-trust" data-testid="landing-trust-line">Made in the EU · Hosted in the EU · GDPR-compliant</p>
        <div v-if="!shotFailed" class="hero-shot" data-testid="landing-hero-shot">
          <video
              v-if="heroVideo && heroPoster"
              :src="heroVideo"
              :poster="heroPoster"
              class="hero-shot-img"
              muted
              autoplay
              loop
              playsinline
              preload="metadata"
              data-testid="landing-hero-video"
          />
          <img v-else :src="engageShot" alt="WhatsNextAction dashboard with today's actions, next actions and waiting-for items" class="hero-shot-img" @error="shotFailed = true" />
        </div>
        <router-link to="/help/connect-ai" class="text-body-s fw-medium hero-own-ai" data-testid="landing-hero-own-ai">
          Prefer your own AI? <span class="hero-own-ai__cta">Connect Claude, ChatGPT or any MCP <span class="hero-own-ai__end">app<ArrowRightSmallIcon class="hero-own-ai__chevron" /></span></span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import Btn from '../Btn.vue'
import BoltIcon from '../../assets/BoltIcon.vue'
import ArrowRightSmallIcon from '../../assets/ArrowRightSmallIcon.vue'
import engageShot from '../../assets/landing/landing-engage.png'

defineEmits(['open-register'])

// Owner drop-in: both files present in assets/landing → video, else the image
const heroAssets = import.meta.glob('../../assets/landing/landing-hero{.mp4,-poster.jpg}', { eager: true, query: '?url', import: 'default' })
const heroVideo = heroAssets['../../assets/landing/landing-hero.mp4']
const heroPoster = heroAssets['../../assets/landing/landing-hero-poster.jpg']

const shotFailed = ref(false)

if (heroVideo && heroPoster) {
  const posterProbe = new Image()
  posterProbe.onerror = () => { shotFailed.value = true }
  posterProbe.src = heroPoster
}

function scrollToFeatures() {
  const el = document.getElementById('features')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.hero {
  background: url('../../assets/hero-bg.png') center / cover no-repeat;
  background-color: var(--color-action-dark);
  text-align: center;
}

.hero-bg-overlay {
  padding: 80px var(--section-px) 64px;
  min-height: 350px;
  background-color: rgba(22, 78, 99, 0.75);
}

.hero-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.hero-bolt {
  width: 64px;
  height: 64px;
  color: var(--color-text-on-dark);
  margin-bottom: 36px;
}

.hero-heading {
  color: var(--color-text-on-dark);
}

.hero-subtitle {
  color: var(--color-text-on-dark);
  margin-top: 16px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 40px;
  align-items: center;
}

.hero-actions {
  --color-btn-primary-bg: #0891B2;
  --color-btn-primary-hover: #0e7490;
  --color-btn-primary-active: #155e75;
}

.hero-actions :deep(.base-btn) {
  width: 100%;
  max-width: 320px;
}

.hero-ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 20px;
  color: var(--color-text-on-dark);
  background: transparent;
  border: 1px solid var(--color-text-on-dark);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.15s background, 0.15s border-color;
  width: 100%;
  max-width: 320px;
}

.hero-ghost-btn:hover {
  background: var(--color-on-dark-glass);
}

.hero-trust {
  color: var(--color-text-on-dark-secondary);
  margin-top: 24px;
}

.hero-shot {
  aspect-ratio: 16 / 10;
  margin-top: 40px;
  border: var(--card-border);
  border-radius: var(--card-radius);
  background: var(--color-bg-subtle);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
}

.hero-shot-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-own-ai {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  min-height: 44px;
  color: var(--color-text-on-dark);
  text-decoration: none;
}

.hero-own-ai:hover {
  text-decoration: underline;
}

.hero-own-ai__cta {
  display: inline-block;
}

.hero-own-ai__end {
  white-space: nowrap;
}

.hero-own-ai__chevron {
  width: 16px;
  height: 16px;
  padding: 1px;
  box-sizing: border-box;
  margin-left: 6px;
  vertical-align: -3px;
}

@media (min-width: 769px) {
  .hero-bg-overlay {
    padding: 100px var(--section-px) 80px;
  }

  .hero-actions {
    flex-direction: row;
    justify-content: center;
  }

  .hero-actions :deep(.base-btn),
  .hero-ghost-btn {
    width: auto;
    max-width: none;
  }
}
</style>
