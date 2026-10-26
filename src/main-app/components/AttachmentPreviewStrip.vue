<template>
  <div v-if="images.length || audios.length" class="preview-strip" data-testid="attachment-preview-strip">
    <div v-if="images.length" class="preview-strip__images">
      <div class="preview-strip__track">
        <button
            v-for="att in images"
            :key="att.id"
            type="button"
            class="preview-strip__tile"
            :title="att.file_name"
            @click="onTile(att)"
        >
          <Spinner v-if="blobState(att).loading" :size="16" />
          <img v-else-if="blobState(att).url" :src="blobState(att).url" :alt="att.file_name" class="preview-strip__img" />
          <span v-else class="text-footnote preview-strip__failed">Couldn't load — tap to retry</span>
        </button>
      </div>
    </div>

    <div v-for="att in audios" :key="att.id" class="preview-strip__audio">
      <Spinner v-if="blobState(att).loading" :size="16" />
      <Btn
          v-else-if="blobState(att).url"
          variant="icon"
          size="sm"
          :aria-label="playingId === att.id ? 'Stop' : 'Play'"
          @click="togglePlay(att)"
      >
        <StopIcon v-if="playingId === att.id" class="preview-strip__play-icon" />
        <TriangleRightIcon v-else class="preview-strip__play-icon" />
      </Btn>
      <button v-else type="button" class="text-footnote preview-strip__failed preview-strip__failed--audio" @click="load(att)">
        Couldn't load — tap to retry
      </button>
      <span class="text-body-s preview-strip__name">{{ att.file_name }}</span>
    </div>

    <RefPreviewModal :preview="preview" @close="preview.visible = false" @download="downloadPreview" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import Btn from './Btn.vue'
import Spinner from './Spinner.vue'
import RefPreviewModal from './reference/RefPreviewModal.vue'
import StopIcon from '../assets/StopIcon.vue'
import TriangleRightIcon from '../assets/TriangleRightIcon.vue'
import { listAttachments, downloadAttachment } from '../scripts/core/apiClient.js'
import { audioPlayer } from '../scripts/core/captureRules.js'

const props = defineProps({
  itemId: { type: String, required: true },
})

const list = ref([])
const { playingId, toggle: toggleAudio, stop: stopPlayback } = audioPlayer()
const blobs = reactive({})
const preview = reactive({
  visible: false,
  file: null,
  url: null,
  text: null,
  loading: false,
})


const images = computed(() => list.value.filter(a => a.mime_type?.startsWith('image/')))
const audios = computed(() => list.value.filter(a => a.mime_type?.startsWith('audio/')))

function blobState(att) {
  return blobs[att.id] ?? { loading: true }
}

// The download needs the JWT header, so the bytes come as a blob behind an object URL
async function load(att) {
  blobs[att.id] = { loading: true, url: null }
  try {
    const res = await downloadAttachment('stuff', props.itemId, att.id)
    if (!blobs[att.id]) return
    blobs[att.id] = { loading: false, url: URL.createObjectURL(res.data) }
  } catch {
    if (blobs[att.id]) blobs[att.id] = { loading: false, url: null }
  }
}

function release(id) {
  if (playingId.value === id) stopPlayback()
  if (blobs[id]?.url) URL.revokeObjectURL(blobs[id].url)
  delete blobs[id]
}

function sync() {
  const media = [...images.value, ...audios.value]
  const ids = new Set(media.map(a => a.id))
  for (const id of Object.keys(blobs)) {
    if (!ids.has(id)) release(id)
  }
  for (const att of media) {
    if (!blobs[att.id]) load(att)
  }
}

async function loadList() {
  try {
    const data = await listAttachments('stuff', props.itemId)
    list.value = data.attachments || []
  } catch {
    list.value = []
  }
}


function togglePlay(att) {
  toggleAudio(att.id, blobs[att.id].url)
}

function onTile(att) {
  const state = blobState(att)
  if (state.loading) return
  if (!state.url) {
    load(att)
    return
  }
  preview.file = { name: att.file_name, mime_type: att.mime_type }
  preview.url = state.url
  preview.visible = true
}

function downloadPreview() {
  if (!preview.url) return
  const a = document.createElement('a')
  a.href = preview.url
  a.download = preview.file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

watch(() => [...images.value, ...audios.value].map(a => a.id).join(), sync)

watch(() => props.itemId, () => {
  preview.visible = false
  for (const id of Object.keys(blobs)) release(id)
  loadList()
})

onMounted(loadList)

onUnmounted(() => {
  for (const id of Object.keys(blobs)) release(id)
})
</script>

<style scoped>
.preview-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  min-width: 0;
}

/* One centred row; when it overflows it scrolls and starts from the left */
.preview-strip__images {
  align-self: stretch;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.preview-strip__track {
  display: flex;
  gap: 8px;
  width: max-content;
  margin: 0 auto;
}

.preview-strip__tile {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  padding: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-strip__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-strip__failed {
  color: var(--color-text-tertiary);
  padding: 4px;
  text-align: center;
}

.preview-strip__failed--audio {
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.preview-strip__audio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}

.preview-strip__play-icon {
  width: 18px;
  height: 18px;
}

.preview-strip__name {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

@media (max-width: 768px) {
  .preview-strip__tile {
    width: 64px;
    height: 64px;
  }
}
</style>
