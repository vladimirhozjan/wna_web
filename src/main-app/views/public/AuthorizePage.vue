<template>
  <LandingLayout>
    <div class="authorize-page">
      <div class="authorize-card">

        <!-- Loading -->
        <div v-if="status === 'loading'" class="authorize-state">
          <Spinner :size="40" />
          <h2 class="text-h2 color-text-primary">Loading...</h2>
        </div>

        <!-- Invalid, expired or already used request -->
        <div v-else-if="status === 'invalid'" class="authorize-state">
          <span class="authorize-icon">
            <ExclamationIcon width="24" height="24" />
          </span>
          <h2 class="text-h2 color-text-primary">This link doesn't work anymore</h2>
          <p class="text-body-s color-text-secondary">
            It has expired or was already used. Start connecting again from your AI app.
          </p>
          <Btn @click="goToDashboard">Go to Dashboard</Btn>
        </div>

        <!-- Ready -->
        <div v-else class="authorize-state">
          <AppIcon />
          <h2 class="text-h2 color-text-primary authorize-wrap">
            {{ request.client_name }} wants to access your WhatsNextAction account
          </h2>
          <Lnk class="authorize-wrap authorize-account" :text="`Signed in as ${email}.`" link="Switch account" @action="switchAccount" />

          <div class="authorize-scope">
            <p class="text-body-s fw-semibold color-text-primary authorize-wrap">{{ request.client_name }} will be able to:</p>
            <div v-for="item in CAN" :key="item" class="authorize-row text-body-s color-text-primary">
              <CheckIcon class="authorize-row-icon authorize-row-icon--can" />
              <span>{{ item }}</span>
            </div>
            <div class="authorize-row text-body-s color-text-secondary">
              <CrossIcon class="authorize-row-icon authorize-row-icon--cannot" />
              <span>It can't open Reference, empty the Trash, or change your settings, account or billing</span>
            </div>
          </div>

          <p class="text-footnote color-text-tertiary authorize-wrap">
            After you allow access, you'll return to <strong>{{ request.redirect_host }}</strong>.
            You can remove access anytime in Settings.
          </p>

          <div class="authorize-actions">
            <Btn variant="secondary" :loading="busy === 'cancel'" :disabled="busy === 'allow'" @click="decide('cancel')">
              Cancel
            </Btn>
            <Btn :loading="busy === 'allow'" :disabled="busy === 'cancel'" @click="decide('allow')">Allow access</Btn>
          </div>
        </div>

      </div>
    </div>
  </LandingLayout>
</template>

<script setup>
import {computed, ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import Btn from '../../components/Btn.vue'
import Lnk from '../../components/Lnk.vue'
import Spinner from '../../components/Spinner.vue'
import apiClient from '../../scripts/core/apiClient.js'
import {authModel} from '../../scripts/core/authModel.js'
import {errorModel} from '../../scripts/core/errorModel.js'
import AppIcon from '../../assets/AppIcon.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import CrossIcon from '../../assets/CrossIcon.vue'
import ExclamationIcon from '../../assets/ExclamationIcon.vue'

const CAN = [
  'See and change your Inbox, actions, projects, calendar, Horizons and the rest of your GTD lists',
  'Delegate actions, share projects, and invite or remove people — just as you can',
  'Move items to Trash and restore them, and delete things that have no Trash: Horizons items, brainstorm ideas, recurring actions and project templates',
]
const NETWORK_ERROR = "Couldn't reach WhatsNextAction. Check your connection and try again."

const route = useRoute()
const router = useRouter()
const auth = authModel()
const toaster = errorModel()

const status = ref('loading')
const request = ref(null)
const busy = ref(null)

const email = computed(() => auth.currentUser.value?.email || '')

function loginHere() {
  return {name: 'login', query: {redirect: route.fullPath}}
}

async function load() {
  const handle = route.query.request
  if (route.query.error || typeof handle !== 'string' || !handle) {
    status.value = 'invalid'
    return
  }
  if (!auth.isAuthenticated.value) {
    router.replace(loginHere())
    return
  }
  try {
    request.value = await apiClient.getOauthRequest(handle)
    status.value = 'ready'
  } catch (err) {
    if (err.status !== 410) toaster.push(NETWORK_ERROR)
    status.value = 'invalid'
  }
}

// On success the browser leaves for the AI app, so the spinner stays on until it does
async function decide(choice) {
  if (busy.value) return
  busy.value = choice
  try {
    const decision = choice === 'allow' ? apiClient.approveOauthRequest : apiClient.denyOauthRequest
    const {redirect_url} = await decision(route.query.request)
    window.location.href = redirect_url
  } catch (err) {
    busy.value = null
    if (err.status === 410) status.value = 'invalid'
    else toaster.push(NETWORK_ERROR)
  }
}

async function switchAccount() {
  await auth.logoutUser()
  router.replace(loginHere())
}

function goToDashboard() {
  router.push({name: 'engage'})
}

onMounted(load)
</script>

<style scoped>
.authorize-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}

.authorize-card {
  background: var(--color-popup-background);
  padding: 40px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-auth);
}

.authorize-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.authorize-state h2,
.authorize-state p {
  margin: 0;
}

.authorize-wrap {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.authorize-account :deep(a) {
  white-space: nowrap;
}

.authorize-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.authorize-scope {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  text-align: left;
}

.authorize-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.authorize-row-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.authorize-row-icon--can {
  color: var(--color-success);
}

.authorize-row-icon--cannot {
  color: var(--color-text-tertiary);
}

.authorize-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}
</style>
