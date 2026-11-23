<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener" class="app-store-badge">
    <img :src="src" :height="height" :alt="alt" class="app-store-badge__img" />
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { getDomains } from '../../scripts/core/domains.js'
import badgeBlack from '../../assets/landing/app-store-badge-blk.svg'
import badgeWhite from '../../assets/landing/app-store-badge-wht.svg'
import badgeGooglePlay from '../../assets/landing/google-play-badge.svg'

const props = defineProps({
  store: { type: String, default: 'app-store', validator: v => ['app-store', 'google-play'].includes(v) },
  // App Store only: Google Play has one badge for every background
  background: { type: String, default: 'dark', validator: v => ['light', 'dark'].includes(v) },
  height: { type: Number, default: 40, validator: v => [40, 48].includes(v) },
})

const isGooglePlay = props.store === 'google-play'
const domains = getDomains()
const url = isGooglePlay ? domains.google_play_url : domains.app_store_url
const alt = isGooglePlay ? 'Get it on Google Play' : 'Download on the App Store'
const src = computed(() => {
  if (isGooglePlay) return badgeGooglePlay
  return props.background === 'light' ? badgeBlack : badgeWhite
})
</script>

<style scoped>
.app-store-badge {
  display: inline-flex;
}

.app-store-badge__img {
  display: block;
  width: auto;
}
</style>
