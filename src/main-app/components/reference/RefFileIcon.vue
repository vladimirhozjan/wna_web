<template>
  <component :is="iconComponent" :style="{ color: iconColor }" />
</template>

<script setup>
import {computed} from 'vue'
import FileIcon from '../../assets/FileIcon.vue'
import ImageFileIcon from '../../assets/ImageFileIcon.vue'
import PdfFileIcon from '../../assets/PdfFileIcon.vue'
import TextFileIcon from '../../assets/TextFileIcon.vue'
import CodeFileIcon from '../../assets/CodeFileIcon.vue'

const props = defineProps({
  mimeType: {
    type: String,
    default: '',
  },
})

const iconComponent = computed(() => {
  const mime = props.mimeType || ''
  if (mime.startsWith('image/')) return ImageFileIcon
  if (mime === 'application/pdf') return PdfFileIcon
  if (mime === 'application/json') return CodeFileIcon
  if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('xml')) return TextFileIcon
  return FileIcon
})

const iconColor = computed(() => {
  const mime = props.mimeType || ''
  if (mime.startsWith('image/')) return '#059669'
  if (mime === 'application/pdf') return '#dc2626'
  if (mime === 'application/json') return '#d97706'
  if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('xml')) return '#2563eb'
  if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel')) return '#16a34a'
  if (mime.includes('document') || mime.includes('word') || mime.includes('rtf')) return '#2563eb'
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('compress') || mime.includes('archive')) return '#6B7280'
  return '#6B7280'
})
</script>
