<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener" class="app-store-badge">
    <img :src="src" :height="height" alt="Download on the App Store" class="app-store-badge__img" />
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { getDomains } from '../../scripts/core/domains.js'
import badgeBlack from '../../assets/landing/app-store-badge-blk.svg'
import badgeWhite from '../../assets/landing/app-store-badge-wht.svg'

const props = defineProps({
  background: { type: String, default: 'dark', validator: v => ['light', 'dark'].includes(v) },
  height: { type: Number, default: 40, validator: v => [40, 48].includes(v) },
})

const url = getDomains().app_store_url
const src = computed(() => (props.background === 'light' ? badgeBlack : badgeWhite))
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
