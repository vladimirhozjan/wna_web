<template>
  <div class="share-page" data-testid="share-page">
    <div v-if="loading" class="share-loading" data-testid="share-loading">
      <Spinner />
    </div>

    <template v-else>
      <h1 class="page-title">Add to Inbox</h1>

      <Inpt
          v-model="title"
          title="Title"
          type="text"
          :placeholder="titlePlaceholder"
          :disabled="saving"
          data-testid="share-title"
          @enter="submit"
      />

      <div class="share-field">
        <label class="text-body-s fw-semibold share-label" for="share-description">Description</label>
        <textarea
            id="share-description"
            v-model="description"
            class="text-body-m share-textarea"
            rows="4"
            :disabled="saving"
            data-testid="share-description"
        ></textarea>
      </div>

      <div v-if="chips.length" class="share-field" data-testid="share-attachments">
        <span class="text-body-s fw-semibold share-label">Attachments</span>
        <CaptureChips :chips="chips" :errors="chipErrors" :saving="saving" :locked="!isProOrTeam" @remove="removeChip" />
      </div>

      <div v-if="chips.length && !isProOrTeam" class="share-locked" data-testid="share-locked">
        <span class="text-body-s color-text-secondary">{{ LOCKED_LINE }}</span>
        <Btn variant="primary" size="sm" data-testid="share-upgrade" @click="paymentsEnabled ? showCaptureUpgrade() : contactSupport()">
          {{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}
        </Btn>
      </div>

      <div class="share-actions">
        <Btn variant="secondary" size="sm" :disabled="saving" data-testid="share-cancel" @click="cancel">Cancel</Btn>
        <Btn variant="primary" size="sm" :disabled="!canAdd" :loading="saving" data-testid="share-add" @click="submit">Add to Inbox</Btn>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Inpt from '../../components/Inpt.vue'
import Btn from '../../components/Btn.vue'
import Spinner from '../../components/Spinner.vue'
import CaptureChips from '../../components/CaptureChips.vue'
import { pendingShare } from '../../scripts/core/pendingShare.js'
import { captureQueue } from '../../scripts/core/captureQueue.js'
import { offlineModel } from '../../scripts/core/offlineModel.js'
import { authModel } from '../../scripts/core/authModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { errorModel, SUCCESS_TOAST_MS } from '../../scripts/core/errorModel.js'
import {
  createChip,
  showCaptureUpgrade,
  contactSupport,
  loadAttachmentLimits,
  chipErrors as limitErrors,
  resizePhoto,
  splitLines,
  splitTitle,
  inputType,
  autoTitle,
} from '../../scripts/core/captureRules.js'

const CAPTURED_LINE = 'Captured by share'
const LOCKED_LINE = '🔒 Files are available on Pro and Team plans. This item is added without them.'

const router = useRouter()
const auth = authModel()
const queue = captureQueue()
const { isOffline } = offlineModel()
const { paymentsEnabled } = flagsModel()
const toaster = errorModel()

const loading = ref(true)
const title = ref('')
const description = ref('')
const chips = ref([])
const limits = ref(null)
const saving = ref(false)

let leaveTimer = null
let capCheck = 0

const tier = computed(() => auth.currentUser.value?.subscription_tier)
const isProOrTeam = computed(() => tier.value === 'pro' || tier.value === 'team')

// Free files are locked: never checked, counted or sent
const chipErrors = computed(() => (isProOrTeam.value ? limitErrors(chips.value, limits.value, tier.value) : {}))
const addable = computed(() => (isProOrTeam.value ? chips.value.filter(c => !chipErrors.value[c.id]) : []))

const titlePlaceholder = computed(() => fallbackTitle(addable.value) || 'Add a title')
const canAdd = computed(() => !saving.value && !!(title.value.trim() || fallbackTitle(addable.value)))

// An empty title is filled in only for files or links; other description text needs a typed title
function fallbackTitle(files) {
  const { typed, urls } = splitTitle(description.value)
  return typed ? '' : autoTitle(files, urls, [])
}

// The shared title, else the first line without its links; the rest of the text, then the link, is the description
function prefill(share) {
  const text = share.text?.trim() ?? ''
  const lines = []
  let t = share.title?.trim() ?? ''
  if (t) {
    if (text) lines.push(text)
  } else if (text) {
    const { first, rest } = splitLines(text)
    const { typed, urls } = splitTitle(first)
    t = typed
    lines.push(...urls)
    if (rest) lines.push(rest)
  }
  if (share.url && !text.includes(share.url)) lines.push(share.url)
  title.value = t
  description.value = lines.join('\n')
}

async function refreshLimits() {
  limits.value = await loadAttachmentLimits()
}

// Offline, the files that don't fit in the device cap are red before Add; online none are. Every check starts over,
// since a removed chip or a sent capture frees room
async function checkCap() {
  const run = ++capCheck
  const fresh = chips.value.map(c => ({ ...c, queueFull: false }))
  const errors = isProOrTeam.value ? limitErrors(fresh, limits.value, tier.value) : null
  const files = errors ? fresh.filter(c => !errors[c.id]).map(c => c.file) : []
  const over = new Set(await queue.overCap(files))
  if (run !== capCheck) return
  for (const chip of chips.value) chip.queueFull = over.has(chip.file)
}

function removeChip(chip) {
  if (chip.url) URL.revokeObjectURL(chip.url)
  chips.value = chips.value.filter(c => c.id !== chip.id)
  checkCap()
}

// A launch from the Share sheet is a window of its own: closing it returns to the app the share came from
function leave() {
  if (history.length !== 1) {
    router.replace({ name: 'inbox' })
    return
  }
  leaveTimer = setTimeout(() => {
    window.close()
    router.replace({ name: 'inbox' })
  }, SUCCESS_TOAST_MS)
}

async function submit() {
  if (!canAdd.value) return

  saving.value = true
  try {
    // A file that no longer fits turns red here and stops the Add, so it is seen before anything is sent
    const wasRed = new Set(chips.value.filter(c => c.queueFull).map(c => c.id))
    await checkCap()
    if (chips.value.some(c => c.queueFull && !wasRed.has(c.id))) {
      saving.value = false
      return
    }
    const files = addable.value
    const itemTitle = title.value.trim() || fallbackTitle(files)
    if (!itemTitle) {
      saving.value = false
      return
    }

    const note = description.value.trim()
    const { rejected, outcome } = await queue.enqueue({
      title: itemTitle,
      description: note ? `${note}\n\n${CAPTURED_LINE}` : CAPTURED_LINE,
      input_type: inputType(files),
      files: files.map(c => c.file),
      notifyWaiting: true,
    })
    await pendingShare().remove()

    // Files the device refused at the write stay red on the page, as in the capture bar; the rest was added
    if (rejected.length) {
      const left = new Set(rejected)
      for (const chip of chips.value) {
        if (left.has(chip.file)) chip.queueFull = true
        else if (chip.url) URL.revokeObjectURL(chip.url)
      }
      chips.value = chips.value.filter(c => left.has(c.file))
      title.value = ''
      description.value = ''
      saving.value = false
      return
    }

    // The queue toasts sent and waiting once each; a rejected item waits on Inbox with Retry / Discard
    if (await outcome === 'failed') router.replace({ name: 'inbox' })
    else leave()
  } catch (e) {
    toaster.push(e.message || 'Failed to add item')
    saving.value = false
  }
}

async function cancel() {
  await pendingShare().remove()
  router.replace({ name: 'inbox' })
}

// The device cap applies only offline; the limits switch between live and last known
watch(isOffline, async () => {
  if (!chips.value.length) return
  await refreshLimits()
  checkCap()
})

onMounted(async () => {
  const share = await pendingShare().read()
  if (!share) {
    router.replace({ name: 'inbox' })
    toaster.push('The share didn\'t come through. Share it again from the other app.')
    return
  }

  prefill(share)
  for (const f of share.files ?? []) {
    const file = new File([f.blob], f.name, { type: f.type })
    chips.value.push(file.type.startsWith('image/') ? createChip('photo', await resizePhoto(file)) : createChip('file', file))
  }
  if (chips.value.length) {
    await refreshLimits()
    await checkCap()
  }
  loading.value = false
})

onUnmounted(() => {
  clearTimeout(leaveTimer)
  chips.value.forEach(c => c.url && URL.revokeObjectURL(c.url))
})
</script>

<style scoped>
.share-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
  box-sizing: border-box;
}

.share-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.share-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.share-label {
  color: var(--color-text-primary);
}

.share-textarea {
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
  resize: vertical;
  min-height: 80px;
}

.share-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.share-locked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
