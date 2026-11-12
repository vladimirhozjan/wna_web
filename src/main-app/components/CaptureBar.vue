<template>
  <div class="capture-bar" :class="`capture-bar--${variant}`" data-testid="capture-bar">
    <div class="capture-bar__main">
      <Btn
          variant="icon"
          size="sm"
          class="capture-bar__icon-btn capture-bar__file"
          title="Attach files"
          aria-label="Attach files"
          :disabled="saving || !!recState"
          data-testid="capture-file"
          @mousedown.prevent
          @click="pickFile"
      >
        <PlusCircleIcon class="capture-bar__icon capture-bar__file-icon" />
      </Btn>

      <div class="capture-bar__field">
        <Inpt
            v-if="variant === 'inbox'"
            ref="inptRef"
            v-model="text"
            class="capture-bar__inpt"
            :class="iconsClass"
            type="text"
            :placeholder="placeholder"
            :disabled="saving"
            @enter="submit"
            @keydown.esc="onEsc"
            @paste="onPaste"
        />
        <input
            v-else
            ref="inputRef"
            v-model="text"
            class="capture-bar__input"
            :class="[{ 'text-body-s': variant === 'quick' }, iconsClass]"
            type="text"
            :placeholder="placeholder"
            :disabled="saving"
            @keydown.enter="submit"
            @keydown.esc="onEsc"
            @paste="onPaste"
            @blur="onBlur"
        />
        <ActionBtn
            v-if="hasContent"
            variant="default"
            class="capture-bar__clear"
            :class="{ 'capture-bar__clear--beside': isMobile }"
            title="Clear"
            aria-label="Clear"
            :disabled="saving"
            data-testid="capture-clear"
            @mousedown.prevent
            @click="clearAll(); focus()"
        />
        <Btn
            v-if="isMobile"
            variant="icon"
            size="sm"
            class="capture-bar__icon-btn capture-bar__photo"
            title="Add photos"
            aria-label="Add photos"
            :disabled="saving || !!recState"
            data-testid="capture-photo"
            @mousedown.prevent
            @click="pickPhoto"
        >
          <CameraIcon class="capture-bar__icon" />
        </Btn>
      </div>

      <div class="capture-bar__slot">
        <Btn
            variant="icon"
            size="sm"
            class="capture-bar__icon-btn capture-bar__mic"
            v-show="!hasContent"
            title="Record a voice memo"
            aria-label="Record a voice memo"
            :disabled="saving"
            data-testid="capture-mic"
            @mousedown.prevent
            @click="startRecording"
        >
          <MicIcon class="capture-bar__icon" />
        </Btn>
        <Btn
            variant="primary"
            size="sm"
            class="capture-bar__add"
            v-show="hasContent"
            :disabled="!canAdd"
            :loading="saving"
            data-testid="capture-add"
            @mousedown.prevent
            @click="submit"
        >Add</Btn>
      </div>
    </div>

    <div v-if="hasExtras" class="capture-bar__extras">
      <div v-if="recState" class="text-body-s capture-bar__recording" data-testid="capture-recording">
        <template v-if="recState === 'waiting'">
          <span>Waiting for microphone access…</span>
          <Btn variant="ghost" size="sm" @mousedown.prevent @click="stopRecording(false)">Cancel</Btn>
        </template>
        <template v-else>
          <span class="capture-bar__dot"></span>
          <span>Recording</span>
          <span class="capture-bar__timer" :class="{ 'capture-bar__timer--ending': recRemaining <= VOICE_COUNTDOWN_SECONDS }">
            {{ recRemaining <= VOICE_COUNTDOWN_SECONDS ? `Stops in ${formatDuration(recRemaining)}` : formatDuration(recElapsed) }}
          </span>
          <Btn variant="secondary" size="sm" @mousedown.prevent @click="stopRecording()">Stop</Btn>
        </template>
      </div>

      <CaptureChips
          v-if="chips.length || pastedText"
          :chips="chips"
          :errors="chipErrors"
          :saving="saving"
          :pasted="!!pastedText"
          :playing-id="playingId"
          @remove="removeChip"
          @remove-pasted="pastedText = ''"
          @toggle-play="togglePlay"
      />
    </div>

    <input ref="photoInput" type="file" accept="image/*" multiple hidden @change="onPhotoPicked" @cancel="onPickCancel" />
    <input ref="fileInput" type="file" multiple hidden @change="onFilePicked" @cancel="onPickCancel" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Inpt from './Inpt.vue'
import Btn from './Btn.vue'
import ActionBtn from './ActionBtn.vue'
import CaptureChips from './CaptureChips.vue'
import PlusCircleIcon from '../assets/PlusCircleIcon.vue'
import CameraIcon from '../assets/CameraIcon.vue'
import MicIcon from '../assets/MicIcon.vue'
import { captureQueue } from '../scripts/core/captureQueue.js'
import { offlineModel } from '../scripts/core/offlineModel.js'
import { authModel } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import {
  createChip,
  formatDuration,
  stamp,
  showCaptureUpgrade,
  loadAttachmentLimits,
  chipErrors as limitErrors,
  resizePhoto,
  splitLines,
  inputType,
  buildCapture,
  lateUploadReason,
  audioPlayer,
} from '../scripts/core/captureRules.js'

const props = defineProps({
  variant: { type: String, default: 'inbox' }, // inbox, quick, fab
})

const emit = defineEmits(['saved', 'close'])

// contracts/limits.md §Voice memo
const VOICE_MAX_SECONDS = 5 * 60
const VOICE_COUNTDOWN_SECONDS = 30
const MOBILE_QUERY = '(max-width: 768px)'

const auth = authModel()
const queue = captureQueue()
const { isOffline } = offlineModel()
const { playingId, toggle: toggleAudio, stop: stopPlayback } = audioPlayer()
const toaster = errorModel()

const inptRef = ref(null)
const inputRef = ref(null)
const photoInput = ref(null)
const fileInput = ref(null)

const text = ref('')
const pastedText = ref('')
const chips = ref([])
const limits = ref(null)
const saving = ref(false)
const picking = ref(false)
const recState = ref(null) // null, waiting, recording
const recElapsed = ref(0)
const isMobile = ref(window.matchMedia(MOBILE_QUERY).matches)

let recorder = null
let recStream = null
let recTimer = null
let recStartedAt = 0
let recCancelled = false

const tier = computed(() => auth.currentUser.value?.subscription_tier)
const isProOrTeam = computed(() => tier.value === 'pro' || tier.value === 'team')

const recRemaining = computed(() => VOICE_MAX_SECONDS - recElapsed.value)
const hasExtras = computed(() => !!recState.value || chips.value.length > 0 || !!pastedText.value)
const hasContent = computed(() => !!text.value || hasExtras.value)
// Icons inside the field's right end: × and, on mobile, the camera
const iconsClass = computed(() => {
  const count = (hasContent.value ? 1 : 0) + (isMobile.value ? 1 : 0)
  return count ? `capture-bar__field--icons-${count}` : null
})
const placeholder = computed(() => chips.value.length || pastedText.value ? 'Add a title (optional)' : 'Add new stuff')

const chipErrors = computed(() => limitErrors(chips.value, limits.value, tier.value))

const addable = computed(() => chips.value.filter(c => !chipErrors.value[c.id]))
const canAdd = computed(() =>
    !saving.value && !recState.value && (!!text.value.trim() || !!pastedText.value.trim() || addable.value.length > 0)
)

function focus() {
  nextTick(() => (props.variant === 'inbox' ? inptRef.value : inputRef.value)?.focus())
}

// ── Chips ──

async function refreshLimits() {
  limits.value = await loadAttachmentLimits()
}

function pushChip(kind, file, extra = {}) {
  chips.value.push(createChip(kind, file, extra))
}

function releaseChip(chip) {
  if (playingId.value === chip.id) stopPlayback()
  if (chip.url) URL.revokeObjectURL(chip.url)
}

function removeChip(chip) {
  releaseChip(chip)
  chips.value = chips.value.filter(c => c.id !== chip.id)
}

// Pasted and dropped images are photos uploaded as they are; other files stay files
function addFiles(list) {
  const files = [...list]
  if (!files.length) return
  if (!isProOrTeam.value) {
    showCaptureUpgrade()
    return
  }
  for (const f of files) pushChip(f.type.startsWith('image/') ? 'photo' : 'file', f)
  refreshLimits()
  focus()
}

function pickPhoto() {
  if (!isProOrTeam.value) { showCaptureUpgrade(); return }
  picking.value = true
  photoInput.value?.click()
}

function pickFile() {
  if (!isProOrTeam.value) { showCaptureUpgrade(); return }
  picking.value = true
  fileInput.value?.click()
}

function onPickCancel() {
  picking.value = false
  focus()
}

async function onPhotoPicked(e) {
  const files = [...(e.target.files || [])]
  e.target.value = ''
  picking.value = false
  for (const f of files) pushChip('photo', await resizePhoto(f))
  if (files.length) refreshLimits()
  focus()
}

function onFilePicked(e) {
  const files = [...(e.target.files || [])]
  e.target.value = ''
  picking.value = false
  for (const f of files) pushChip(f.type.startsWith('image/') ? 'photo' : 'file', f)
  if (files.length) refreshLimits()
  focus()
}

// ── Paste ──

// The field is one line: a multi-line paste keeps its first line here and the rest goes to the description
function onPaste(e) {
  const data = e.clipboardData
  if (!data) return
  const pasted = data.getData('text/plain')

  if (!pasted) {
    const images = [...(data.items || [])]
        .filter(i => i.kind === 'file')
        .map(i => i.getAsFile())
        .filter(f => f?.type.startsWith('image/'))
    if (!images.length) return
    e.preventDefault()
    addFiles(images)
    return
  }

  const { first, rest } = splitLines(pasted)
  if (!rest) return
  e.preventDefault()
  const input = e.target
  input.setRangeText(first, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, 'end')
  text.value = input.value
  pastedText.value = pastedText.value ? `${pastedText.value}\n${rest}` : rest
}

// ── Voice ──

async function startRecording() {
  if (!isProOrTeam.value) { showCaptureUpgrade(); return }
  if (recState.value) return
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    toaster.push('This browser can\'t record audio. Attach a recording with + instead.', 'error', { keepOffline: true })
    return
  }

  recCancelled = false
  recState.value = 'waiting'
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (err) {
    recState.value = null
    if (recCancelled) return
    toaster.push(['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(err?.name)
        ? 'No microphone found. Connect one, then press the microphone again.'
        : 'Microphone access is blocked. Allow it for this site in your browser settings, then press the microphone again.', 'error', { keepOffline: true })
    return
  }
  if (recCancelled) {
    stream.getTracks().forEach(t => t.stop())
    return
  }

  const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
  const parts = []
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  recStream = stream
  recorder = rec
  rec.ondataavailable = (ev) => { if (ev.data.size) parts.push(ev.data) }
  rec.onstop = () => {
    const duration = (Date.now() - recStartedAt) / 1000
    const mp4 = (rec.mimeType || mimeType).includes('mp4')
    const keep = !recCancelled && parts.length > 0
    releaseRecorder()
    if (!keep) return
    const type = mp4 ? 'audio/mp4' : 'audio/webm'
    const file = new File(parts, `voice-${stamp()}.${mp4 ? 'm4a' : 'webm'}`, { type })
    pushChip('voice', file, { duration: Math.min(duration, VOICE_MAX_SECONDS) })
    refreshLimits()
  }
  rec.start()
  recStartedAt = Date.now()
  recElapsed.value = 0
  recState.value = 'recording'
  recTimer = setInterval(() => {
    recElapsed.value = Math.min(VOICE_MAX_SECONDS, Math.floor((Date.now() - recStartedAt) / 1000))
    if (recElapsed.value >= VOICE_MAX_SECONDS) stopRecording()
  }, 250)
}

function releaseRecorder() {
  clearInterval(recTimer)
  recTimer = null
  recStream?.getTracks().forEach(t => t.stop())
  recStream = null
  recorder = null
  recState.value = null
}

// keep = false drops the recording (discard)
function stopRecording(keep = true) {
  if (!recState.value) return
  // Still waiting for the permission prompt: nothing recorded yet, so nothing to keep
  recCancelled = !keep || recState.value === 'waiting'
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop()
  } else {
    releaseRecorder()
  }
  focus()
}


function togglePlay(chip) {
  if (!chip.url) chip.url = URL.createObjectURL(chip.file)
  toggleAudio(chip.id, chip.url)
}

// ── Add ──

async function submit() {
  if (!canAdd.value) return

  saving.value = true
  try {
    // Offline, files over the device cap turn red first, so the title is built only from the files that go
    const over = new Set(await queue.overCap(addable.value.map(c => c.file)))
    for (const chip of chips.value) if (over.has(chip.file)) chip.queueFull = true
    const files = addable.value
    const { title, description } = buildCapture(text.value, pastedText.value, files)
    if (!title) return

    const capture = { title, description, input_type: inputType(files), files: files.map(c => c.file) }
    try {
      const { rejected } = await queue.enqueue(capture)
      const left = new Set(rejected)
      for (const chip of chips.value) if (left.has(chip.file)) chip.queueFull = true
    } catch (e) {
      // Some browsers refuse to keep files on the device; online the capture goes straight to the server instead
      if (!e.deviceWrite || isOffline.value) throw e
      const { failures } = await queue.sendNow(capture)
      for (const chip of files) {
        if (failures.has(chip.file)) chip.lateError = lateUploadReason(failures.get(chip.file))
      }
      if (failures.size) toaster.push('Saved to Inbox. Files marked red were not attached — open the item to attach them.', 'error', { keepOffline: true })
    }
    for (const chip of chips.value) if (!chip.queueFull && !chip.lateError) releaseChip(chip)
    chips.value = chips.value.filter(c => c.queueFull || c.lateError)
    text.value = ''
    pastedText.value = ''
    if (!chips.value.length) emit('saved')
  } catch (e) {
    toaster.push(e.message || 'Failed to add item', 'error', { keepOffline: true })
  } finally {
    saving.value = false
  }
  focus()
}

function clearAll() {
  stopRecording(false)
  chips.value.forEach(releaseChip)
  chips.value = []
  text.value = ''
  pastedText.value = ''
}

// The FAB keeps what was captured when it closes, like an overlay tap
function onEsc() {
  if (props.variant !== 'fab') clearAll()
  emit('close')
}

// Quick Add closes on blur only while nothing but typed text would be lost
function onBlur() {
  if (props.variant !== 'quick') return
  if (hasExtras.value || picking.value || saving.value) return
  clearAll()
  emit('close')
}

// The device cap applies only offline; the limits switch between live and last known
watch(isOffline, (offline) => {
  if (!offline) chips.value.forEach(c => { c.queueFull = false })
  if (chips.value.length) refreshLimits()
})

function onMediaChange(e) {
  isMobile.value = e.matches
}

const mediaQuery = window.matchMedia(MOBILE_QUERY)

onMounted(() => mediaQuery.addEventListener('change', onMediaChange))

onUnmounted(() => {
  mediaQuery.removeEventListener('change', onMediaChange)
  stopRecording(false)
  stopPlayback()
  chips.value.forEach(releaseChip)
})

defineExpose({
  focus,
  addFiles,
  stopRecording,
  input: () => (props.variant === 'inbox' ? null : inputRef.value),
})
</script>

<style scoped>
.capture-bar {
  display: flex;
  flex-direction: column;
  position: relative;
}

.capture-bar__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* × and, on mobile, the camera sit inside the field's right end */
.capture-bar__field {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
}

.capture-bar__inpt {
  flex: 1;
  min-width: 0;
}

.capture-bar__inpt :deep(input) {
  margin: 0;
  text-overflow: ellipsis;
}

.capture-bar__input {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  text-overflow: ellipsis;
}

/* + · camera · mic: 1 px lines like the field's border */
.capture-bar .capture-bar__icon-btn,
.capture-bar .capture-bar__icon-btn:disabled {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--color-input-border-focus);
}

.capture-bar .capture-bar__icon-btn:disabled {
  opacity: 0.5;
}

.capture-bar__icon {
  display: block;
  width: 22px;
  height: 22px;
}

.capture-bar .capture-bar__file:hover:not(:disabled) {
  background: transparent;
}

.capture-bar__file-icon :deep(circle) {
  transition: 0.15s fill;
}

.capture-bar__file:hover:not(:disabled) .capture-bar__file-icon :deep(circle) {
  fill: var(--color-action-bg-light);
}

.capture-bar__field .capture-bar__photo {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}

.capture-bar__clear {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
}

.capture-bar__clear--beside {
  right: 38px;
}

/* The slot hugs the mic or Add; the field gives way on the swap */
.capture-bar__slot {
  display: flex;
  flex-shrink: 0;
  align-self: stretch;
  align-items: stretch;
}

.capture-bar .capture-bar__mic {
  align-self: center;
}

.capture-bar__extras {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Recording row */
.capture-bar__recording {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.capture-bar__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  flex-shrink: 0;
}

.capture-bar__timer {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.capture-bar__timer--ending {
  color: var(--color-danger);
}

/* Inbox: Inpt's 8px top / 4px bottom margins sit on the row, so the row is the field's height */
.capture-bar--inbox .capture-bar__main {
  margin: 8px 0 4px;
}

.capture-bar--inbox .capture-bar__extras {
  margin-top: 4px;
}

/* Desktop Quick Add: chips and the recording in a panel under the row */
.capture-bar--quick {
  margin-right: 8px;
}

.capture-bar--quick .capture-bar__main {
  width: 366px;
}

.capture-bar--quick .capture-bar__input {
  box-sizing: border-box;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-btn-secondary-border);
  background: var(--color-bg-accent-light);
}

.capture-bar--quick .capture-bar__input:focus {
  border-color: var(--color-action);
}

.capture-bar--quick .capture-bar__extras {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 320px;
  padding: 10px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-dropdown);
  z-index: 100;
  box-sizing: border-box;
}

/* Narrow desktop: the TopNav must not wrap */
@media (min-width: 769px) and (max-width: 1023px) {
  .capture-bar--quick .capture-bar__main {
    width: 316px;
  }
}

/* Mobile FAB bar: chips and recording sit above the field (the bar rests on the keyboard) */
.capture-bar--fab .capture-bar__extras {
  order: -1;
  margin-bottom: 10px;
}

.capture-bar--fab .capture-bar__input {
  box-sizing: border-box;
  min-height: var(--touch-target-min);
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  font-size: var(--font-size-body);
}

.capture-bar--fab .capture-bar__input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.capture-bar--fab .capture-bar__input::placeholder {
  color: var(--color-text-prefill);
}

/* Room for the icons inside the field's right end */
.capture-bar .capture-bar__input.capture-bar__field--icons-1,
.capture-bar__inpt.capture-bar__field--icons-1 :deep(input) {
  padding-right: 40px;
}

.capture-bar .capture-bar__input.capture-bar__field--icons-2,
.capture-bar__inpt.capture-bar__field--icons-2 :deep(input) {
  padding-right: 72px;
}
</style>
