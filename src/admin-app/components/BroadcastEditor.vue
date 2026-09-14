<template>
  <div class="editor">
    <div class="editor-bar">
      <div class="tabs">
        <button
            type="button"
            class="tab text-body-s"
            :class="{ 'tab--active': tab === 'wysiwyg' }"
            @click="switchTab('wysiwyg')"
        >
          Editor
        </button>
        <button
            type="button"
            class="tab text-body-s"
            :class="{ 'tab--active': tab === 'raw' }"
            @click="switchTab('raw')"
        >
          Raw HTML
        </button>
      </div>

      <div v-if="tab === 'wysiwyg' && !disabled" class="toolbar">
        <Btn v-for="tool in TOOLS" :key="tool.cmd" variant="ghost" size="sm" :title="tool.title" @mousedown.prevent @click="runTool(tool.cmd)">
          <span v-html="tool.icon"></span>
        </Btn>
      </div>
    </div>

    <div v-if="urlPrompt" class="url-prompt">
      <Inpt
          ref="urlInputRef"
          v-model="urlPrompt.value"
          type="url"
          :placeholder="urlPrompt.type === 'link' ? 'https://… link address' : 'https://… image address'"
          @enter="insertUrl"
      />
      <Btn variant="primary" size="sm" @click="insertUrl">Insert</Btn>
      <Btn variant="ghost" size="sm" @click="urlPrompt = null">Cancel</Btn>
    </div>

    <div
        v-show="tab === 'wysiwyg'"
        ref="surfaceRef"
        class="surface"
        :class="{ 'surface--disabled': disabled }"
        :contenteditable="!disabled"
        spellcheck="true"
        @input="syncFromSurface"
        @paste="handlePaste"
    ></div>

    <textarea
        v-if="tab === 'raw'"
        v-model="rawText"
        class="raw text-body-s"
        :readonly="disabled"
        spellcheck="false"
        @input="syncFromRaw"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import Btn from './Btn.vue'
import Inpt from './Inpt.vue'
import logoUrl from '../assets/logo-email.png'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

// Inline styles mirror the backend email template constants
const TEMPLATE_STYLES = {
  h2: "font-family:'Montserrat',Arial,sans-serif;font-size:22px;font-weight:bold;color:#1f2937;margin:0 0 8px;",
  p: 'margin:0 0 16px;color:#1f2937;',
  a: 'color:#0e7490;word-wrap:break-word;',
  ul: 'margin:0 0 16px;padding-left:24px;color:#1f2937;',
  ol: 'margin:0 0 16px;padding-left:24px;color:#1f2937;',
  img: 'max-width:100%;height:auto;display:block;margin:0 0 16px;',
}

const ALLOWED_TAGS = new Set([
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'div', 'span', 'p', 'h1', 'h2', 'h3',
  'a', 'ul', 'ol', 'li', 'img', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u',
])
const DROP_TAGS = new Set([
  'script', 'style', 'link', 'meta', 'title', 'head', 'iframe', 'object', 'embed',
  'form', 'input', 'textarea', 'button', 'select', 'svg', 'video', 'audio',
])
const ALLOWED_ATTRS = new Set([
  'style', 'href', 'src', 'alt', 'width', 'height', 'cellpadding', 'cellspacing',
  'border', 'align', 'valign', 'colspan', 'rowspan', 'target',
])

const TOOLS = [
  { cmd: 'heading', title: 'Heading', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4v12M12 4v12M4 10h8"/><path d="M15 12l2 2v-6"/></svg>' },
  { cmd: 'bold', title: 'Bold', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h5a3 3 0 0 1 0 6H6zM6 10h6a3 3 0 0 1 0 6H6z"/></svg>' },
  { cmd: 'italic', title: 'Italic', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4h6M6 16h6M12 4l-4 12"/></svg>' },
  { cmd: 'link', title: 'Link', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8.5 11.5l3-3"/><path d="M7 13l-1.5 1.5a2.5 2.5 0 0 1-3.5-3.5L4.5 8.5a2.5 2.5 0 0 1 3.5 0"/><path d="M13 7l1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L15.5 11.5a2.5 2.5 0 0 1-3.5 0"/></svg>' },
  { cmd: 'list', title: 'Bulleted list', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="4" cy="5" r="0.8" fill="currentColor"/><circle cx="4" cy="10" r="0.8" fill="currentColor"/><circle cx="4" cy="15" r="0.8" fill="currentColor"/><path d="M8 5h8M8 10h8M8 15h8"/></svg>' },
  { cmd: 'image', title: 'Image by URL', icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="14" height="12" rx="1.5"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M17 13l-4-4-6 6"/></svg>' },
]

const tab = ref('wysiwyg')
const surfaceRef = ref(null)
const urlInputRef = ref(null)
const rawText = ref('')
const urlPrompt = ref(null)
let savedRange = null
let lastEmitted = null

function splitDocument(html) {
  const m = html.match(/^([\s\S]*?<body[^>]*>)([\s\S]*?)(<\/body>[\s\S]*)$/i)
  return m ? { head: m[1], inner: m[2], foot: m[3] } : { head: '', inner: html, foot: '' }
}

function stripWrapper(html) {
  return html.replace(/<(script|style|link|meta)\b[^>]*>[\s\S]*?<\/\1>|<(script|style|link|meta)\b[^>]*\/?>/gi, '')
}

function safeUrl(name, value) {
  const v = value.trim()
  if (name === 'src' && (v === 'cid:logo' || v === logoUrl)) return true
  return /^(https?:\/\/|mailto:)/i.test(v)
}

function sanitizeChildren(node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) { child.remove(); continue }
    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const tag = child.tagName.toLowerCase()
    if (DROP_TAGS.has(tag)) { child.remove(); continue }
    if (!ALLOWED_TAGS.has(tag)) {
      sanitizeChildren(child)
      while (child.firstChild) node.insertBefore(child.firstChild, child)
      child.remove()
      continue
    }

    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase()
      if (!ALLOWED_ATTRS.has(name)) { child.removeAttribute(attr.name); continue }
      if ((name === 'href' || name === 'src') && !safeUrl(name, attr.value)) child.removeAttribute(attr.name)
      if (name === 'style' && /url\s*\(|expression\s*\(|@import/i.test(attr.value)) child.removeAttribute('style')
    }
    sanitizeChildren(child)
  }
}

function applyTemplateStyles(root) {
  for (const [tag, style] of Object.entries(TEMPLATE_STYLES)) {
    root.querySelectorAll(`${tag}:not([style])`).forEach(el => el.setAttribute('style', style))
  }
}

function sanitizeInner(inner) {
  const doc = new DOMParser().parseFromString(inner, 'text/html')
  sanitizeChildren(doc.body)
  applyTemplateStyles(doc.body)
  return doc.body.innerHTML
}

function sanitizeDocument(html) {
  const { head, inner, foot } = splitDocument(html)
  return stripWrapper(head) + sanitizeInner(inner) + stripWrapper(foot)
}

function toPreview(inner) {
  return inner.replaceAll('src="cid:logo"', `src="${logoUrl}"`)
}

function fromPreview(inner) {
  return inner.replaceAll(`src="${logoUrl}"`, 'src="cid:logo"')
}

function emitValue(value) {
  lastEmitted = value
  emit('update:modelValue', value)
}

function renderSurface() {
  if (!surfaceRef.value) return
  surfaceRef.value.innerHTML = toPreview(splitDocument(props.modelValue).inner)
}

function syncFromSurface() {
  const { head, foot } = splitDocument(props.modelValue)
  applyTemplateStyles(surfaceRef.value)
  emitValue(head + fromPreview(sanitizeInner(surfaceRef.value.innerHTML)) + foot)
}

function syncFromRaw() {
  emitValue(sanitizeDocument(rawText.value))
}

function switchTab(next) {
  if (next === tab.value) return
  urlPrompt.value = null
  tab.value = next
  if (next === 'raw') {
    rawText.value = props.modelValue
  } else {
    nextTick(renderSurface)
  }
}

function exec(command, value = null) {
  surfaceRef.value.focus()
  document.execCommand(command, false, value)
  syncFromSurface()
}

function captureSelection() {
  const sel = window.getSelection()
  if (sel.rangeCount && surfaceRef.value.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange()
  } else {
    savedRange = null
  }
}

function restoreSelection() {
  surfaceRef.value.focus()
  if (!savedRange) return
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(savedRange)
}

function runTool(cmd) {
  captureSelection()
  if (cmd === 'heading') {
    const inHeading = document.queryCommandValue('formatBlock').toLowerCase() === 'h2'
    exec('formatBlock', inHeading ? '<p>' : '<h2>')
  } else if (cmd === 'bold') {
    exec('bold')
  } else if (cmd === 'italic') {
    exec('italic')
  } else if (cmd === 'list') {
    exec('insertUnorderedList')
  } else if (cmd === 'link' || cmd === 'image') {
    urlPrompt.value = { type: cmd, value: '' }
    nextTick(() => urlInputRef.value?.focus())
  }
}

function insertUrl() {
  const prompt = urlPrompt.value
  if (!prompt) return
  const url = prompt.value.trim()
  urlPrompt.value = null
  if (!safeUrl(prompt.type === 'link' ? 'href' : 'src', url)) return

  restoreSelection()
  if (prompt.type === 'link') {
    exec('createLink', url)
  } else {
    exec('insertImage', url)
  }
}

function handlePaste(event) {
  if (props.disabled) return
  event.preventDefault()
  const html = event.clipboardData.getData('text/html')
  if (html) {
    exec('insertHTML', sanitizeInner(splitDocument(html).inner))
  } else {
    exec('insertText', event.clipboardData.getData('text/plain'))
  }
}

watch(() => props.modelValue, (value) => {
  if (value === lastEmitted) return
  if (tab.value === 'raw') rawText.value = value
  else renderSurface()
})

onMounted(() => {
  document.execCommand('defaultParagraphSeparator', false, 'p')
  renderSurface()
})
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tab:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.tab--active {
  background: var(--color-action-bg-light);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}

.toolbar {
  display: flex;
  gap: 2px;
}

.toolbar :deep(svg) {
  width: 18px;
  height: 18px;
  display: block;
}

.url-prompt {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.url-prompt :deep(label) {
  flex: 1;
}

.url-prompt :deep(input) {
  margin-bottom: 0;
}

.surface,
.raw {
  min-height: 480px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.surface {
  overflow: auto;
}

.surface:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.surface--disabled {
  opacity: 0.85;
  cursor: default;
}

.surface :deep(table) {
  border-collapse: separate;
}

.raw {
  width: 100%;
  padding: 12px;
  resize: vertical;
  font-family: var(--font-family-mono);
  line-height: var(--lh-relaxed);
  white-space: pre;
}

.raw:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.raw:read-only {
  opacity: 0.7;
}
</style>
