<template>
  <DashboardLayout>
    <div class="connect-state">
      <Spinner :size="16" />
      <span>Connecting Google...</span>
    </div>
  </DashboardLayout>
</template>

<script setup>
import {onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Spinner from '../../components/Spinner.vue'
import {errorModel} from '../../scripts/core/errorModel.js'
import {completeGoogleConnect} from '../../scripts/core/apiClient.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()

async function finish() {
  const {code, state} = route.query
  if (!code || !state) {
    toaster.push('Google connection was cancelled or the link is invalid.')
    return
  }
  try {
    const data = await completeGoogleConnect(route.params.feature, code, state)
    const dropped = data.dropped_features || []
    if (dropped.length) {
      toaster.push(`Google access for ${dropped.join(', ')} was removed. Reconnect it in Settings.`, 'warning')
    }
  } catch (err) {
    if (err.status !== 403) toaster.push(err.message)
  }
}

onMounted(async () => {
  await finish()
  router.replace({name: 'settings'})
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
