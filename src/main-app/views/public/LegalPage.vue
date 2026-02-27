<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">
    <section class="section">
      <div class="section-inner legal-layout">
        <LegalSidebar :doc="doc" />
        <article class="legal-content prose" v-html="renderedContent"></article>
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
import { marked } from 'marked'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import LegalSidebar from '../../components/public/LegalSidebar.vue'
import termsRaw from '../../content/legal/terms.md?raw'
import privacyRaw from '../../content/legal/privacy.md?raw'

const props = defineProps({
  doc: {
    type: String,
    default: 'terms',
  },
})

const router = useRouter()
const authMode = ref(null)

const renderedContent = computed(() => {
  const raw = props.doc === 'privacy' ? privacyRaw : termsRaw
  return marked(raw)
})

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
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.section {
  padding: var(--section-py-mobile) var(--section-px);
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.legal-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .legal-layout {
    flex-direction: row;
    gap: 40px;
  }

  .legal-content {
    flex: 1;
    min-width: 0;
  }
}

/* Prose styles for rendered markdown */
.prose {
  text-align: left;
  color: var(--color-text-secondary);
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  line-height: 170%;
}

.prose :deep(h1) {
  font-size: var(--font-size-h1);
  font-weight: 700;
  line-height: var(--lh-h1);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.prose :deep(h2) {
  font-size: var(--font-size-h3);
  font-weight: 600;
  line-height: var(--lh-h3);
  color: var(--color-text-primary);
  margin: 40px 0 12px;
}

.prose :deep(h3) {
  font-size: var(--font-size-h4);
  font-weight: 500;
  line-height: var(--lh-h4);
  color: var(--color-text-primary);
  margin: 28px 0 8px;
}

.prose :deep(p) {
  margin: 12px 0;
}

.prose :deep(p:first-child) {
  margin-top: 0;
}

/* "Last updated" bold line right after h1 */
.prose :deep(h1 + p) {
  margin-top: 8px;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.prose :deep(li) {
  margin-bottom: 6px;
}

.prose :deep(li + li) {
  margin-top: 4px;
}

.prose :deep(a) {
  color: var(--color-link-text);
  text-decoration: underline;
  transition: color 0.15s;
}

.prose :deep(a:hover) {
  color: var(--color-link-hover);
}

.prose :deep(strong) {
  font-weight: 600;
  color: var(--color-text-primary);
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: var(--font-size-body-s);
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.prose :deep(thead) {
  background: var(--color-bg-secondary);
}

.prose :deep(th),
.prose :deep(td) {
  padding: 10px 14px;
  text-align: left;
  border: 1px solid var(--color-border-light);
}

.prose :deep(th) {
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 32px 0;
}

.prose :deep(blockquote) {
  border-left: 3px solid var(--color-action);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--color-text-secondary);
}
</style>