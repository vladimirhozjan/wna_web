<template>
  <div class="detail-section-area comment-section">
    <div class="comment-header">
      <label class="detail-section-label">Comments</label>
      <span v-if="!loading && comments.length > 0" class="comment-count">{{ comments.length }} / 50</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="comment-loading">
      <span class="detail-spinner-sm"></span>
    </div>

    <!-- Comment list -->
    <template v-else>
      <!-- Empty state: clickable placeholder like Description -->
      <div v-if="comments.length === 0 && !editing" class="detail-section-wrapper">
        <p class="detail-section-content detail-section-content--empty" @click="startEditing">Add a comment...</p>
      </div>

      <!-- Add comment (always first, above comment list) -->
      <div v-if="!atLimit && (comments.length > 0 || editing)" class="comment-add">
        <textarea
            ref="textareaRef"
            v-model="newMessage"
            class="comment-textarea"
            :rows="focused ? 3 : 1"
            placeholder="Add a comment..."
            :disabled="posting"
            @focus="focused = true"
            @blur="onBlur"
            @keyup.esc="onCancel"
        ></textarea>
        <div v-if="focused" class="comment-add-footer">
          <span class="comment-char-count" :class="{ 'comment-char-count--warn': newMessage.length > 1800, 'comment-char-count--error': newMessage.length > 2000 }">
            {{ newMessage.length }} / 2000
          </span>
          <div class="comment-add-actions">
            <Btn
                variant="ghost"
                size="sm"
                :disabled="posting"
                @mousedown.prevent
                @click="onCancel"
            >Cancel</Btn>
            <Btn
                variant="primary"
                size="sm"
                :disabled="posting || !newMessage.trim() || newMessage.length > 2000"
                :loading="posting"
                @mousedown.prevent
                @click="onPost"
            >Save</Btn>
          </div>
        </div>
      </div>

      <!-- Limit reached notice -->
      <div v-if="atLimit" class="comment-limit-notice">
        Comment limit reached (50 / 50)
      </div>

      <!-- Comment list -->
      <div v-if="comments.length > 0" class="comment-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-avatar-wrap">
            <UserAvatar :email="userEmail" :size="28" />
          </div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-timestamp">{{ formatRelativeTime(comment.created_at) }}</span>
            </div>
            <p class="comment-message">{{ comment.message }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import Btn from './Btn.vue'
import UserAvatar from './UserAvatar.vue'
import { listComments, createComment } from '../scripts/core/apiClient.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { authModel } from '../scripts/core/authModel.js'

const props = defineProps({
  entityType: { type: String, required: true },
  itemId: { type: String, required: true },
})

const toaster = errorModel()
const { currentUser } = authModel()

const userEmail = ref('')
const comments = ref([])
const loading = ref(true)
const newMessage = ref('')
const focused = ref(false)
const editing = ref(false)
const posting = ref(false)
const textareaRef = ref(null)

const atLimit = computed(() => comments.value.length >= 50)

onMounted(async () => {
  userEmail.value = currentUser.value?.email || ''
  await loadComments()
})

watch(() => props.itemId, () => {
  newMessage.value = ''
  focused.value = false
  editing.value = false
  loadComments()
})

async function loadComments() {
  loading.value = true
  try {
    const data = await listComments(props.entityType, props.itemId)
    comments.value = data.comments || []
  } catch {
    toaster.push('Failed to load comments')
  } finally {
    loading.value = false
  }
}

async function onPost() {
  const message = newMessage.value.trim()
  if (!message || message.length > 2000) return

  posting.value = true
  try {
    const comment = await createComment(props.entityType, props.itemId, message)
    comments.value.unshift(comment)
    newMessage.value = ''
    focused.value = false
    toaster.success('Comment added')
  } catch {
    toaster.push('Failed to add comment')
  } finally {
    posting.value = false
  }
}

function startEditing() {
  editing.value = true
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function onCancel() {
  newMessage.value = ''
  focused.value = false
  editing.value = false
  textareaRef.value?.blur()
}

function onBlur() {
  onCancel()
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.comment-section {
  border-bottom: 1px solid var(--color-border-light);
}

/* ── Reuse detail-section styles (scoped in parent, so redeclare here) ── */
.detail-section-label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--lh-relaxed);
  min-height: 32px;
  box-sizing: border-box;
}

.detail-section-content:hover {
  background: var(--color-bg-secondary);
}

.detail-section-content--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-header .detail-section-label {
  margin-bottom: 0;
}

.comment-count {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
}

.comment-limit-notice {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 8px 0;
}

.comment-loading {
  padding: 12px 0;
}

.detail-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.comment-avatar-wrap {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
}

.comment-avatar-wrap :deep(.avatar-wrapper) {
  width: 28px;
  height: 28px;
}

.comment-avatar-wrap :deep(.avatar-fallback) {
  font-size: var(--font-size-footnote);
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  margin-bottom: 2px;
}

.comment-timestamp {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
}

.comment-message {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--lh-relaxed);
  background: var(--color-bg-secondary);
  border-radius: 6px;
  padding: 8px 12px;
}

.comment-add {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.comment-textarea {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 8px;
  outline: none;
  width: 100%;
  resize: none;
  background: var(--color-bg-primary);
  box-sizing: border-box;
  line-height: var(--lh-relaxed);
}

.comment-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.comment-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-add-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-add-actions {
  display: flex;
  gap: 8px;
}

.comment-char-count {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
}

.comment-char-count--warn {
  color: var(--color-text-secondary);
}

.comment-char-count--error {
  color: var(--color-danger);
}
</style>
