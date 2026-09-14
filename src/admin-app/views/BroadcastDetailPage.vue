<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/broadcasts" class="text-body-s back-link">&larr; Broadcasts</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!isNew && !broadcast" class="empty-state">
      <p class="text-body-m color-text-secondary">Broadcast not found.</p>
    </div>

    <div v-else class="detail">
      <div class="detail-header">
        <div class="detail-title">
          <h1 class="page-title">{{ isNew ? 'New broadcast' : (form.subject || '(no subject)') }}</h1>
          <Badge v-if="broadcast" :type="STATUS_BADGE[broadcast.status] || 'draft'" :value="broadcast.status" />
        </div>
        <div v-if="canWrite" class="detail-actions">
          <template v-if="isDraft">
            <Btn variant="secondary" size="sm" :loading="saving" :disabled="busy" @click="handleSave">
              Save draft
            </Btn>
            <Btn variant="secondary" size="sm" :loading="testing" :disabled="busy" @click="handleSendTest">
              Send test to me
            </Btn>
            <Btn variant="primary" size="sm" :loading="sending" :disabled="busy" @click="handleSendAll">
              Send to all
            </Btn>
          </template>
          <Btn
              v-else-if="broadcast.status === 'failed'"
              variant="primary" size="sm" :loading="sending" :disabled="busy"
              @click="handleSendAll"
          >
            Resume send
          </Btn>
          <Btn
              v-else-if="broadcast.status === 'sent' && broadcast.failed_count > 0"
              variant="secondary" size="sm" :loading="retrying" :disabled="busy"
              @click="handleRetryFailed"
          >
            Retry failed
          </Btn>
        </div>
      </div>

      <!-- Delivery -->
      <div v-if="broadcast && broadcast.status !== 'draft'" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Delivery</h3>
        <div class="info-grid">
          <div class="info-row">
            <span class="text-label color-text-secondary">Sent by</span>
            <span class="text-body-s">{{ broadcast.sent_by || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Started</span>
            <span class="text-body-s">{{ formatDate(broadcast.send_started_at) }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Finished</span>
            <span class="text-body-s">{{ formatDate(broadcast.send_finished_at) }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Recipients</span>
            <span class="text-body-s">{{ broadcast.recipient_count }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Sent</span>
            <span class="text-body-s color-text-success">{{ broadcast.sent_count }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Skipped</span>
            <span class="text-body-s">{{ broadcast.skipped_count }}</span>
          </div>
          <div class="info-row">
            <span class="text-label color-text-secondary">Failed</span>
            <span class="text-body-s" :class="broadcast.failed_count ? 'color-text-danger' : ''">{{ broadcast.failed_count }}</span>
          </div>
        </div>
        <p v-if="broadcast.error_detail" class="text-caption color-text-danger error-detail">{{ broadcast.error_detail }}</p>
        <p v-if="broadcast.status === 'sending'" class="text-caption color-text-tertiary">Sending in progress — this page refreshes every 30 seconds.</p>
      </div>

      <!-- Content -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Content</h3>
        <div class="form-row">
          <label class="field">
            <span class="text-label color-text-primary">Kind</span>
            <select v-model="form.kind" class="text-body-m kind-select" :disabled="!editable">
              <option v-for="(label, value) in KIND_LABELS" :key="value" :value="value">{{ label }}</option>
            </select>
            <span class="text-footnote color-text-secondary">{{ KIND_HINTS[form.kind] }}</span>
          </label>
          <Inpt
              v-model="form.subject"
              title="Subject"
              type="text"
              placeholder="Email subject"
              :disabled="!editable"
          />
        </div>
        <div v-if="!isNew || !canWrite" class="meta text-caption color-text-tertiary">
          Created by {{ broadcast?.created_by || '—' }} · {{ formatDate(broadcast?.created_at) }}
          <template v-if="broadcast?.updated_by"> · updated by {{ broadcast.updated_by }} · {{ formatDate(broadcast.updated_at) }}</template>
        </div>
        <BroadcastEditor v-model="form.bodyHtml" :disabled="!editable" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Spinner from '../components/Spinner.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import BroadcastEditor from '../components/BroadcastEditor.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { broadcastModel, KIND_LABELS, STATUS_BADGE } from '../scripts/models/broadcastModel.js'

const KIND_HINTS = {
  announcement: 'Product news. Users can opt out in Settings → Notifications.',
  service_notice: 'Terms, maintenance, security. Reaches every user — cannot be disabled.',
}

const route = useRoute()
const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const broadcasts = broadcastModel()

const isNew = computed(() => route.name === 'broadcast-new')
const canWrite = computed(() => hasMinRole(auth.currentAdmin.value?.role, 'admin'))

const loading = ref(true)
const broadcast = ref(null)
const form = reactive({ kind: 'announcement', subject: '', bodyHtml: '' })
const saved = reactive({ kind: '', subject: '', bodyHtml: '' })

const saving = ref(false)
const testing = ref(false)
const sending = ref(false)
const retrying = ref(false)
let pollTimer = null

const isDraft = computed(() => isNew.value || broadcast.value?.status === 'draft')
const editable = computed(() => canWrite.value && isDraft.value)
const busy = computed(() => saving.value || testing.value || sending.value || retrying.value)
const dirty = computed(() =>
    form.kind !== saved.kind || form.subject !== saved.subject || form.bodyHtml !== saved.bodyHtml
)

function applyRow(row) {
  broadcast.value = row
  form.kind = row.kind
  form.subject = row.subject || ''
  form.bodyHtml = row.body_html || ''
  Object.assign(saved, form)
}

async function load() {
  loading.value = true
  try {
    if (isNew.value) {
      const shell = await broadcasts.loadShell()
      form.bodyHtml = shell.body_html || ''
    } else {
      applyRow(await broadcasts.get(route.params.id))
    }
  } catch (err) {
    if (err.status !== 404) toaster.push(err.message || 'Failed to load broadcast')
  } finally {
    loading.value = false
  }
}

async function reload() {
  if (isNew.value) return
  try {
    applyRow(await broadcasts.get(route.params.id))
  } catch {
    // keep the last known state; the next poll or navigation retries
  }
}

function payload() {
  return { kind: form.kind, subject: form.subject, body_html: form.bodyHtml }
}

async function save() {
  if (isNew.value) {
    const row = await broadcasts.create(payload())
    applyRow(row)
    router.replace(`/broadcasts/${row.id}`)
    return row
  }
  const row = await broadcasts.update(route.params.id, payload())
  applyRow(row)
  return row
}

async function handleSave() {
  saving.value = true
  try {
    await save()
    toaster.success('Draft saved')
  } catch (err) {
    toaster.push(err.message || 'Failed to save draft')
  } finally {
    saving.value = false
  }
}

async function ensureSaved() {
  if (isNew.value || dirty.value) return save()
  return broadcast.value
}

async function handleSendTest() {
  testing.value = true
  try {
    const row = await ensureSaved()
    const res = await broadcasts.sendTest(row.id)
    toaster.success(`Test email sent to ${res.sent_to}`)
  } catch (err) {
    toaster.push(err.message || 'Failed to send test email')
  } finally {
    testing.value = false
  }
}

async function handleSendAll() {
  sending.value = true
  try {
    const row = await ensureSaved()
    const { recipient_count } = await broadcasts.loadRecipientCount()
    const kindLabel = KIND_LABELS[row.kind] || row.kind
    const confirmed = await confirm.show({
      title: 'Send to all users',
      message: `Send this ${kindLabel.toLowerCase()} "${row.subject}" to ${recipient_count} recipient${recipient_count === 1 ? '' : 's'}? `
          + (row.kind === 'service_notice'
              ? 'Service notices reach every user, including those who opted out of announcements. '
              : 'Users who opted out of announcements are skipped. ')
          + 'This cannot be undone.',
      confirmText: 'Send to all',
      cancelText: 'Cancel',
    })
    if (!confirmed) return

    const res = await broadcasts.send(row.id)
    toaster.success(`Sending to ${res.recipient_count} recipient${res.recipient_count === 1 ? '' : 's'}`)
    await reload()
  } catch (err) {
    toaster.push(err.message || 'Failed to send broadcast')
  } finally {
    sending.value = false
  }
}

async function handleRetryFailed() {
  retrying.value = true
  try {
    const res = await broadcasts.retryFailed(broadcast.value.id)
    toaster.success(`Retrying ${res.retry_count} failed recipient${res.retry_count === 1 ? '' : 's'}`)
    await reload()
  } catch (err) {
    toaster.push(err.message || 'Failed to retry')
  } finally {
    retrying.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

onMounted(() => {
  load()
  pollTimer = setInterval(() => { if (broadcast.value?.status === 'sending') reload() }, 30000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}

.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-text-primary);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.detail-title .page-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-card {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-detail {
  margin: 16px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
}

.kind-select {
  margin-top: 8px;
  margin-bottom: 4px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.kind-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

.kind-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.meta {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
