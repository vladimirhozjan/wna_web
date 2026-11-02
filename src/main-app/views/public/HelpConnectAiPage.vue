<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">

    <section class="section">
      <div class="section-inner">
        <router-link to="/help" class="text-body-s fw-medium back-link">
          <ChevronLeftIcon class="back-link__icon" />
          Back to Help
        </router-link>

        <h1 class="text-h1 heading">Connect Your Own AI</h1>
        <p class="text-body-m intro">
          Let Claude, ChatGPT or another AI app you already use work with your WhatsNextAction lists on your
          instructions — on every plan. You can remove it any time in Settings → AI Apps.
        </p>

        <div class="card-list">
          <div v-if="mcpConfigured" class="card">
            <span class="text-body-s fw-semibold address-label">Your connector address</span>
            <div class="address-row">
              <span class="text-body-s address" data-testid="help-connect-ai-address">{{ mcpUrl }}</span>
              <Btn variant="secondary" size="sm" data-testid="help-connect-ai-copy" @click="copyAddress">{{ copied ? 'Copied!' : 'Copy' }}</Btn>
            </div>
            <p class="text-footnote address-hint">You'll paste it in the steps below. It's the same address as in Settings → AI Apps.</p>
          </div>

          <div
            v-for="vendor in connectAi.vendors"
            :id="vendor.id"
            :key="vendor.id"
            class="card"
            :data-testid="`help-connect-ai-card-${vendor.id}`"
          >
            <h2 class="text-h3">{{ vendor.name }}</h2>
            <p class="text-body-s card-desc">{{ vendor.plan }}</p>
            <p class="text-footnote last-checked" :data-testid="`help-connect-ai-last-checked-${vendor.id}`">Last checked: {{ lastChecked }}</p>
            <ol class="steps">
              <li v-for="(step, i) in vendor.steps" :key="i" class="text-body-s">
                {{ i === 0 && !mcpConfigured ? 'Copy the address from Settings → AI Apps.' : step }}
              </li>
            </ol>
          </div>

          <div id="other-ai-apps" class="card" data-testid="help-connect-ai-card-other-ai-apps">
            <h2 class="text-h3">Other AI apps</h2>
            <p class="text-body-s card-desc">
              Any AI app that supports remote MCP connectors with sign-in works the same way: add the address above as a
              connector, sign in and tap Allow access.
            </p>
            <router-link to="/help/getting-started#connecting-an-ai-app" class="text-body-s fw-medium card-link">
              What a connected AI app can and can't do
            </router-link>
          </div>
        </div>

        <div class="contact">
          <p class="text-body-m contact-text">Something not working?</p>
          <Btn variant="link" size="md" @click="contactSupport">Contact Support</Btn>
        </div>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import Btn from '../../components/Btn.vue'
import ChevronLeftIcon from '../../assets/ChevronLeftIcon.vue'
import { connectAi } from '../../content/help/connectAi.js'
import { getDomains } from '../../scripts/core/domains.js'
import { copyText } from '../../scripts/core/clipboardUtils.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { pendingShare } from '../../scripts/core/pendingShare.js'

const router = useRouter()
const toaster = errorModel()
const authMode = ref(null)
const { mcp_url: mcpUrl, mcp_url_configured: mcpConfigured } = getDomains()
const lastChecked = format(parseISO(connectAi.lastChecked), 'd MMMM yyyy')
const copied = ref(false)
let copiedTimer = null

async function copyAddress() {
  if (!(await copyText(mcpUrl))) {
    toaster.push('Could not copy to clipboard')
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copied.value = false }, 2000)
}

function contactSupport() { window.location.href = 'mailto:support@whatsnextaction.com' }
function openAuth(mode) { authMode.value = mode }
async function onSuccess() { authMode.value = null; router.push(await pendingShare().afterLogin({ name: 'engage' })) }
function onSuccessPasswordReset() { authMode.value = null; router.push({ name: 'login' }) }
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-secondary);
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-action);
  text-decoration: none;
  min-height: 44px;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.back-link__icon {
  width: 16px;
  height: 16px;
  padding: 1px;
  box-sizing: border-box;
}

.heading {
  color: var(--color-text-primary);
  margin-top: 16px;
}

.intro {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.card {
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  background: var(--color-bg-primary);
  text-align: left;
  scroll-margin-top: 80px;
}

.address-label {
  display: block;
  color: var(--color-text-primary);
}

.address-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.address {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
  word-break: break-all;
  user-select: all;
}

.address-hint {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.card-desc {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.last-checked {
  color: var(--color-text-tertiary);
  margin-top: 8px;
}

.steps {
  margin: 16px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-primary);
}

.card-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--color-link-text);
  text-decoration: none;
}

.card-link:hover {
  color: var(--color-link-hover);
}

.contact {
  text-align: center;
  margin-top: 40px;
}

.contact-text {
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}
</style>
