<template>
  <div v-if="images.length || audios.length" class="preview-strip" :class="`preview-strip--${layout}`" data-testid="attachment-preview-strip">
    <div v-if="images.length" class="preview-strip__images">
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

    <div v-for="att in audios" :key="att.id" class="preview-strip__audio">
      <span class="text-footnote preview-strip__name">{{ att.file_name }}</span>
      <Spinner v-if="blobState(att).loading" :size="16" />
      <audio v-else-if="blobState(att).url" :src="blobState(att).url" controls preload="metadata" class="preview-strip__player"></audio>
      <button v-else type="button" class="text-footnote preview-strip__failed preview-strip__failed--audio" @click="load(att)">
        Couldn't load — tap to retry
      </button>
    </div>

    <RefPreviewModal :preview="preview" @close="preview.visible = false" @download="downloadPreview" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import Spinner from './Spinner.vue'
import RefPreviewModal from './reference/RefPreviewModal.vue'
import { listAttachments, downloadAttachment } from '../scripts/core/apiClient.js'

const props = defineProps({
  itemId: { type: String, required: true },
  // The host's own list (Stuff detail); null → the strip loads the list itself (Clarify)
  attachments: { type: Array, default: null },
  layout: { type: String, default: 'wrap' }, // wrap, row
})

const ownList = ref([])
const blobs = reactive({})
const preview = reactive({
  visible: false,
  file: null,
  url: null,
  text: null,
  loading: false,
})

const list = computed(() => props.attachments ?? ownList.value)
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
    ownList.value = data.attachments || []
  } catch {
    ownList.value = []
  }
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
  if (props.attachments === null) loadList()
  else sync()
})

onMounted(() => {
  if (props.attachments === null) loadList()
  else sync()
})

onUnmounted(() => {
  for (const id of Object.keys(blobs)) release(id)
})
</script>

<style scoped>
.preview-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}

.preview-strip__images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-strip--row .preview-strip__images {
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  border: 1px dashed var(--color-border-light);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  padding: 10px;
}

.preview-strip__audio {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.preview-strip__name {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-strip__player {
  width: 100%;
  max-width: 420px;
}
</style>
