<template>
    <div class="connect-state">
      <Spinner :size="16" />
      <span>Connecting Google...</span>
    </div>
</template>

<script setup>
import {onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import Spinner from '../../components/Spinner.vue'
import {errorModel} from '../../scripts/core/errorModel.js'
import {authModel} from '../../scripts/core/authModel.js'
import {completeGoogleConnect} from '../../scripts/core/apiClient.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const auth = authModel()

async function finish() {
  const {code, state} = route.query
  if (!code || !state) {
    toaster.push('Google connection was cancelled or the link is invalid.')
    return false
  }
  try {
    const data = await completeGoogleConnect(route.params.feature, code, state)
    const dropped = data.dropped_features || []
    if (dropped.length) {
      toaster.push(`Google access for ${dropped.join(', ')} was removed. Reconnect it in Settings.`, 'warning')
    }
    try { await auth.refreshToken() } catch { /* the JWT catches up on the next rotation */ }
    return true
  } catch (err) {
    if (err.status !== 403) toaster.push(err.message)
    return false
  }
}

function takeReturnPath() {
  let saved = null
  try {
    saved = JSON.parse(sessionStorage.getItem('google_connect_return') || 'null')
  } catch { /* ignore a malformed value */ }
  sessionStorage.removeItem('google_connect_return')
  return saved?.feature === route.params.feature ? saved.path : null
}

onMounted(async () => {
  const connected = await finish()
  const returnPath = takeReturnPath()
  if (returnPath) {
    router.replace(returnPath)
  } else {
    const drive = route.params.feature === 'drive'
    router.replace({name: 'settings', query: {
      section: drive ? 'storage' : 'calendarSync',
      ...(connected && !drive ? {calendar: 'connected'} : {}),
    }})
  }
})
</script>

<style scoped>
.connect-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--color-text-secondary);
}
</style>
