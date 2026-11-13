<template>
  <section v-if="appStoreUrl" class="section" id="capture" data-testid="landing-capture">
    <div class="section-inner">
      <h2 class="text-h1 capture-title" data-testid="landing-capture-title">Capture Everywhere</h2>
      <p class="text-body-m capture-subtitle">Get it out of your head the moment it shows up — on iPhone, Apple Watch and the web.</p>
      <div class="capture-body">
        <img
            v-if="!shotFailed"
            :src="captureShot"
            alt="WhatsNextAction on iPhone: the capture sheet with a photo and a voice memo"
            class="capture-shot"
            loading="lazy"
            data-testid="landing-capture-shot"
            @error="shotFailed = true"
        />
        <div class="capture-main">
          <div class="capture-items">
            <div v-for="item in items" :key="item.key" class="capture-item" :data-testid="`landing-capture-item-${item.key}`">
              <div class="icon-circle">
                <svg v-html="item.svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="item-icon" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </div>
              <div class="item-text">
                <h3 class="text-h4 item-title">{{ item.title }}</h3>
                <p class="text-caption item-desc">{{ item.description }}</p>
              </div>
            </div>
          </div>
          <AppStoreBadge background="dark" :height="48" class="capture-badge" data-testid="landing-appstore-capture" />
          <p class="text-caption capture-android" data-testid="landing-capture-android">On Android? Install the web app from Chrome — it captures offline too.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import AppStoreBadge from './AppStoreBadge.vue'
import { getDomains } from '../../scripts/core/domains.js'
import captureShot from '../../assets/landing/landing-iphone-capture.png'

const appStoreUrl = getDomains().app_store_url
const shotFailed = ref(false)

const items = [
  {
    key: 'media',
    title: 'Photo, Voice or File',
    description: 'Snap a whiteboard, record a voice memo or attach a file. It lands in your Inbox.',
    svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  },
  {
    key: 'share',
    title: 'Share From Any App',
    description: 'Send a link, photo or document from any iPhone app straight to your Inbox.',
    svg: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',
  },
  {
    key: 'offline',
    title: 'Works Offline',
    description: 'No signal? Capture anyway. Everything syncs when you\'re back online.',
    svg: '<path d="M2 2l20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"/>',
  },
  {
    key: 'watch',
    title: 'Widgets, Siri and Apple Watch',
    description: 'Add from your Home Screen, Lock Screen, Siri or your wrist.',
    svg: '<circle cx="12" cy="12" r="6"/><path d="M12 10v2l1 1"/><path d="M16.13 7.66l-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="M7.88 16.36l.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/>',
  },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-action-dark);
  text-align: center;
  scroll-margin-top: 64px;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.capture-title {
  color: var(--color-text-on-dark);
}

.capture-subtitle {
  color: var(--color-on-dark-muted);
  margin-top: 12px;
}

.capture-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  margin-top: 40px;
}

.capture-shot {
  display: block;
  width: 220px;
  height: auto;
  border-radius: 32px;
  box-shadow: var(--shadow-elevated);
}

.capture-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 400px;
  text-align: left;
}

.capture-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
}

.capture-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.icon-circle {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #164E63 0%, #0E7490 60%, #22D3EE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 28px;
  height: 28px;
  color: var(--color-text-on-dark);
}

.item-title {
  color: var(--color-text-on-dark);
}

.item-desc {
  color: var(--color-on-dark-muted);
  margin-top: 6px;
  line-height: var(--lh-loose);
}

.capture-badge {
  margin-top: 32px;
}

.capture-android {
  color: var(--color-on-dark-muted);
  margin-top: 12px;
}

@media (max-width: 768px) {
  .capture-badge :deep(img) {
    height: 40px;
  }
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .capture-body {
    flex-direction: row;
    align-items: center;
    gap: 48px;
  }

  .capture-shot {
    width: 280px;
    flex-shrink: 0;
  }

  .capture-main {
    max-width: none;
    flex: 1;
  }

  .capture-items {
    grid-template-columns: 1fr 1fr;
    gap: 32px 24px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .capture-shot {
    width: 240px;
  }

  .capture-items {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
