<template>
  <Teleport to="body">
    <Transition name="assistant-panel">
      <aside
          v-if="assistant.enabled.value && state.panelOpen"
          class="assistant-panel"
          :style="panelStyle"
          data-testid="assistant-panel"
          @keydown.esc="close"
      >
        <header class="assistant-panel__header">
          <BoltIcon class="assistant-panel__bolt" />
          <h2 class="text-h4 assistant-panel__title">AI assistant</h2>
          <Dropdown title="AI assistant" align="right">
            <template #trigger>
              <Btn variant="icon" size="sm" class="assistant-panel__icon-btn" aria-label="More" title="More">
                <MoreIcon class="assistant-panel__icon" />
              </Btn>
            </template>
            <template #default="{ close: closeMenu }">
              <button class="dropdown-item" data-testid="assistant-new-conversation" @click="closeMenu(); onNewConversation()">
                <RecurringIcon class="dropdown-item-icon" /> New conversation
              </button>
              <button class="dropdown-item" @click="closeMenu(); openSettings()">
                <SettingsIcon class="dropdown-item-icon" /> Assistant settings
              </button>
            </template>
          </Dropdown>
          <Btn variant="icon" size="sm" class="assistant-panel__icon-btn" aria-label="Close" title="Close" @click="close">
            <CloseIcon class="assistant-panel__icon" />
          </Btn>
        </header>

        <div ref="listRef" class="assistant-panel__list" :class="{ scrolling }" data-testid="assistant-messages" @scroll.passive="onScroll">
          <div v-if="state.conversationLoading && !state.messages.length" class="assistant-panel__center">
            <Spinner :size="24" />
          </div>

          <div v-else-if="state.conversationError && !state.messages.length" class="assistant-panel__center assistant-panel__load-error">
            <span class="text-body-s color-text-secondary">Couldn't load your conversation.</span>
            <Btn variant="secondary" size="sm" @click="assistant.loadConversation()">Retry</Btn>
          </div>

          <div v-else-if="showEmpty" class="assistant-panel__center assistant-panel__empty">
            <EmptyState
                :icon="BoltIcon"
                title="Tell me what to do"
                text="I can sort your lists, plan a project, clear your calendar or think a goal through with you — on your WhatsNextAction data."
            />
          </div>

          <template v-for="m in state.messages" :key="m.id">
            <div v-if="m.role === 'user'" class="text-body-s assistant-msg assistant-msg--user">{{ m.text }}</div>

            <div v-else class="assistant-msg assistant-msg--assistant" :data-testid="`assistant-message-${m.status}`">
              <div v-if="m.status === 'working'" class="assistant-msg__working">
                <Spinner :size="16" />
                <span class="text-body-s color-text-secondary">Working on it…</span>
              </div>

              <template v-else>
                <p v-if="errorLine(m)" class="text-body-s color-text-error assistant-msg__error">{{ errorLine(m) }}</p>
                <div v-else-if="m.text" class="text-body-s assistant-msg__text" v-html="renderMarkdown(m.text)"></div>

                <div v-if="m.changes?.length" class="assistant-changes" data-testid="assistant-changes">
                  <div class="text-overline assistant-changes__title">Changes</div>
                  <a
                      v-for="(c, i) in visibleChanges(m)"
                      :key="`${c.item_id}-${i}`"
                      :href="changeHref(c)"
                      class="assistant-changes__row"
                      data-testid="assistant-change-row"
                      @click.prevent="openChange(c)"
                  >
                    <ItemTypeIcon :type="iconType(c.item_type)" class="assistant-changes__icon" />
                    <span class="text-body-s assistant-changes__item">{{ c.title }}</span>
                    <span class="text-caption color-text-secondary assistant-changes__label">{{ c.label }}</span>
                  </a>
                  <Lnk
                      v-if="m.changes.length > CHANGES_SHOWN && !expanded.has(m.id)"
                      text=""
                      :link="`Show all ${m.changes_total} changes`"
                      class="assistant-changes__more"
                      @action="expanded.add(m.id)"
                  />
                </div>

                <div v-if="isOpenQuestion(m)" class="assistant-msg__chips">
                  <Btn
                      v-for="choice in m.choices"
                      :key="choice"
                      :variant="isConfirm(m) && choice === 'Go ahead' ? 'primary' : 'secondary'"
                      size="sm"
                      :disabled="composerDisabled"
                      @click="assistant.send(choice)"
                  >{{ choice }}</Btn>
                </div>

                <div v-if="m.upgrade_hint" class="assistant-msg__chips">
                  <Btn v-if="paymentsEnabled" variant="secondary" size="sm" @click="goTo({ name: 'upgrade' })">View plans</Btn>
                  <Btn v-else variant="secondary" size="sm" @click="contactSupport">Contact Us</Btn>
                </div>
              </template>
            </div>
          </template>

          <div v-if="state.creditCard" class="card assistant-credits" data-testid="assistant-out-of-credits">
            <template v-if="state.creditCard.code === 'not_enough_for_model'">
              <span class="text-body-s fw-semibold">Not enough credits for {{ state.creditCard.modelName }}</span>
              <span class="text-body-s color-text-secondary">Switch to a model that uses fewer credits, or buy a pack.</span>
            </template>
            <template v-else>
              <span class="text-body-s fw-semibold">You're out of credits</span>
              <span class="text-body-s color-text-secondary">
                Your monthly credits refill on {{ formatDay(state.creditCard.resetsAt) }}.{{ paymentsEnabled ? ' Buy a pack to keep going now.' : '' }}
              </span>
            </template>
            <div v-if="paymentsEnabled || state.creditCard.code === 'not_enough_for_model'" class="assistant-credits__actions">
              <Btn v-if="paymentsEnabled" variant="primary" size="sm" @click="goTo({ name: 'buy-credits' })">Buy credits</Btn>
              <Lnk v-if="state.creditCard.code === 'not_enough_for_model'" text="" link="Change model" @action="openSettings" />
            </div>
          </div>

          <p v-if="state.disabled" class="text-body-s color-text-secondary assistant-panel__disabled">The AI assistant is turned off right now.</p>
        </div>

        <div class="assistant-composer">
          <div class="assistant-composer__row">
            <textarea
                ref="composerRef"
                v-model="state.draft"
                rows="1"
                class="text-body-s assistant-composer__input"
                :placeholder="awaitingAnswer ? 'Answer here' : 'Reply, or tell AI what to do next'"
                :disabled="composerDisabled"
                data-testid="assistant-composer"
                @keydown.enter="onEnter"
            ></textarea>
            <Btn
                v-if="assistant.working.value"
                variant="secondary"
                size="sm"
                class="assistant-composer__btn"
                :loading="state.stopping"
                :disabled="state.stopping"
                data-testid="assistant-stop"
                @click="assistant.stop()"
            >Stop</Btn>
            <Btn
                v-else
                variant="primary"
                size="sm"
                class="assistant-composer__btn"
                :disabled="!canSend"
                :loading="state.sending"
                data-testid="assistant-send"
                @click="submit"
            >Send</Btn>
          </div>
          <div class="assistant-composer__foot">
            <span v-if="isOffline" class="text-footnote color-text-tertiary">You're offline. The assistant works when you're back.</span>
            <span v-else-if="lowCredits" class="text-footnote color-text-tertiary" data-testid="assistant-low-credits">
              You're running low on credits.
              <a v-if="paymentsEnabled" href="/buy-credits" class="assistant-composer__link" @click.prevent="goTo({ name: 'buy-credits' })">Buy credits</a>
            </span>
            <span v-else class="text-footnote color-text-tertiary">AI can make mistakes. Check the changes.</span>
            <span v-if="overCap" class="text-caption color-text-error assistant-composer__count">{{ draftCount.toLocaleString('en-US') }} / {{ ASSISTANT_TEXT_MAX.toLocaleString('en-US') }} characters</span>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Marked } from 'marked'
import { format, parseISO } from 'date-fns'
import Btn from './Btn.vue'
import Lnk from './Lnk.vue'
import Spinner from './Spinner.vue'
import Dropdown from './Dropdown.vue'
import EmptyState from './EmptyState.vue'
import ItemTypeIcon from './ItemTypeIcon.vue'
import BoltIcon from '../assets/BoltIcon.vue'
import MoreIcon from '../assets/MoreIcon.vue'
import CloseIcon from '../assets/CloseIcon.vue'
import RecurringIcon from '../assets/RecurringIcon.vue'
import SettingsIcon from '../assets/SettingsIcon.vue'
import { assistantModel, charCount, ASSISTANT_TEXT_MAX } from '../scripts/models/assistantModel.js'
import { flagsModel } from '../scripts/core/flagsModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { contactSupport } from '../scripts/core/captureRules.js'
import { useAutoGrow } from '../scripts/core/useAutoGrow.js'
import { useVisualViewport } from '../scripts/core/visualViewport.js'

const CHANGES_SHOWN = 5
const MOBILE_QUERY = '(max-width: 768px)'

const router = useRouter()
const assistant = assistantModel()
const { state, isOffline } = assistant
const { paymentsEnabled } = flagsModel()
const confirm = confirmModel()
const toaster = errorModel()

const listRef = ref(null)
const composerRef = ref(null)
const scrolling = ref(false)
const isMobile = ref(window.matchMedia(MOBILE_QUERY).matches)
const expanded = reactive(new Set())
let scrollTimer = null

useAutoGrow(composerRef)
const viewport = useVisualViewport(() => state.panelOpen && isMobile.value)

const panelStyle = computed(() => isMobile.value ? { top: `${viewport.top}px`, height: `${viewport.height}px` } : null)

const lastAssistant = computed(() => [...state.messages].reverse().find(m => m.role === 'assistant') || null)
const awaitingAnswer = computed(() => lastAssistant.value?.status === 'awaiting_answer')
const showEmpty = computed(() =>
    state.conversationLoaded && !state.messages.length && !state.creditCard && !state.disabled)
const lowCredits = computed(() => !!state.account?.low || !!lastAssistant.value?.low_credits)

const draftCount = computed(() => charCount(state.draft))
const overCap = computed(() => draftCount.value > ASSISTANT_TEXT_MAX)
const composerDisabled = computed(() => isOffline.value || assistant.working.value || state.sending || state.disabled)
const canSend = computed(() => !composerDisabled.value && !!state.draft.trim() && !overCap.value)

// Links open only http(s); raw HTML is shown as text
const markdown = new Marked({
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text)
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens)
      if (!/^https?:\/\//i.test(href || '')) return label
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    },
    image({ text }) {
      return escapeHtml(text || '')
    },
  },
})

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderMarkdown(text) {
  return markdown.parse(escapeHtml(text))
}

function errorLine(m) {
  if (m.status !== 'error') return ''
  if (m.error === 'interrupted') return 'This request was interrupted. The changes made so far are kept — send it again to finish.'
  return m.credits_charged > 0
      ? 'The AI assistant stopped working on this. The changes made so far are kept — try again in a few minutes.'
      : 'The AI assistant isn\'t available right now. No credits were used — try again in a few minutes.'
}

function isOpenQuestion(m) {
  return m === lastAssistant.value && m.status === 'awaiting_answer' && m.choices?.length
}

function isConfirm(m) {
  return m.choices?.length === 2 && m.choices.includes('Go ahead') && m.choices.includes('Cancel')
}

function visibleChanges(m) {
  return expanded.has(m.id) ? m.changes : m.changes.slice(0, CHANGES_SHOWN)
}

const ICON_TYPES = { stuff: 'STUFF', action: 'ACTION', project: 'PROJECT', recurring: 'RECURRING', canvas_idea: 'PROJECT', project_template: 'PROJECT' }

function iconType(itemType) {
  return ICON_TYPES[itemType] || ''
}

function changeRoute(c) {
  switch (c.item_type) {
    case 'stuff': return { name: 'stuff-detail', params: { id: c.item_id } }
    case 'action': return { name: 'action-detail', params: { id: c.item_id } }
    case 'project': return { name: 'project-detail', params: { id: c.item_id } }
    case 'recurring': return { name: 'recurring-detail', params: { id: c.item_id } }
    case 'horizon': return { name: 'horizons' }
    case 'canvas_idea': return { name: 'project-canvas', params: { id: c.project_id } }
    case 'project_template': return { name: 'project-template-detail', params: { id: c.item_id } }
    case 'connection': return { name: 'connections' }
    default: return null
  }
}

function changeHref(c) {
  const to = changeRoute(c)
  return to ? router.resolve(to).href : undefined
}

function openChange(c) {
  const to = changeRoute(c)
  if (to) goTo(to)
}

// Mobile: the panel covers the page, so it steps aside; desktop keeps it docked beside the page
function goTo(to) {
  if (isMobile.value) assistant.closePanel()
  router.push(to)
}

function openSettings() {
  goTo('/settings/assistant')
}

function formatDay(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d, yyyy') } catch { return iso }
}

function close() {
  assistant.closePanel()
}

function onEnter(e) {
  if (e.shiftKey || e.isComposing) return
  e.preventDefault()
  submit()
}

function submit() {
  if (!canSend.value) return
  const text = state.draft
  state.draft = ''
  assistant.send(text)
}

async function onNewConversation() {
  const ok = await confirm.show({
    title: 'Start a new conversation?',
    message: 'This conversation will be deleted. The assistant\'s memory stays.',
    confirmText: 'New conversation',
    cancelText: 'Cancel',
  })
  if (!ok) return
  try {
    await assistant.newConversation()
  } catch {
    toaster.push('Couldn\'t reach the AI assistant. Check your connection and try again.', 'error', { keepOffline: true })
  }
}

function onScroll() {
  scrolling.value = true
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => { scrolling.value = false }, 1000)
}

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function focusComposer() {
  if (isMobile.value) return
  nextTick(() => composerRef.value?.focus())
}

function onMediaChange(e) {
  isMobile.value = e.matches
}

const mediaQuery = window.matchMedia(MOBILE_QUERY)
mediaQuery.addEventListener('change', onMediaChange)

watch(() => state.panelOpen, (open) => {
  if (!open) return
  scrollToBottom()
  focusComposer()
})

watch(() => [state.messages.length, lastAssistant.value?.status, !!state.creditCard], () => {
  if (state.panelOpen) scrollToBottom()
})

watch(() => assistant.working.value, (working) => {
  if (!working && state.panelOpen) focusComposer()
})

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', onMediaChange)
  clearTimeout(scrollTimer)
})
</script>

<style scoped>
.assistant-panel {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  z-index: 900;
  display: flex;
  flex-direction: column;
  width: 480px;
  max-width: 100%;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-dropdown);
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: transform 0.25s ease;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  transform: translateX(100%);
}

.assistant-panel__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 12px 0 20px;
  border-bottom: 1px solid var(--color-border-light);
  box-sizing: border-box;
}

.assistant-panel__bolt {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--color-action);
}

.assistant-panel__title {
  flex: 1;
  margin: 0;
  color: var(--color-text-primary);
}

.assistant-panel__icon-btn {
  color: var(--color-text-secondary);
}

.assistant-panel__icon {
  width: 18px;
  height: 18px;
}

/* Auto-hiding thin scrollbar, as on detail pages */
.assistant-panel__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.assistant-panel__list.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.assistant-panel__list::-webkit-scrollbar {
  width: 4px;
}

.assistant-panel__list::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.assistant-panel__list.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.assistant-panel__center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.assistant-panel__load-error {
  gap: 12px;
}

.assistant-panel__empty {
  padding: 0 12px;
}

.assistant-panel__disabled {
  margin: 0;
}

/* Messages */
.assistant-msg--user {
  align-self: flex-end;
  max-width: 85%;
  padding: 10px 14px;
  border-radius: var(--card-radius);
  background: var(--color-bg-accent-light);
  color: var(--color-text-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.assistant-msg--assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--color-text-primary);
}

.assistant-msg__working {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-msg__error {
  margin: 0;
}

.assistant-msg__text {
  overflow-wrap: anywhere;
  line-height: var(--lh-relaxed);
}

.assistant-msg__text :deep(p),
.assistant-msg__text :deep(ul),
.assistant-msg__text :deep(ol) {
  margin: 0 0 8px;
}

.assistant-msg__text :deep(:last-child) {
  margin-bottom: 0;
}

.assistant-msg__text :deep(ul),
.assistant-msg__text :deep(ol) {
  padding-left: 20px;
}

.assistant-msg__text :deep(a),
.assistant-composer__link {
  color: var(--color-link-text);
  text-decoration: underline;
}

.assistant-msg__text :deep(a:hover),
.assistant-composer__link:hover {
  color: var(--color-link-hover);
}

.assistant-msg__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Changes */
.assistant-changes {
  display: flex;
  flex-direction: column;
}

.assistant-changes__title {
  margin-bottom: 4px;
  color: var(--color-text-tertiary);
}

.assistant-changes__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  margin: 0 -8px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: background 0.15s;
}

.assistant-changes__row:hover {
  background: var(--color-bg-row-hover);
}

.assistant-changes__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.assistant-changes__item {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.assistant-changes__label {
  flex-shrink: 0;
  max-width: 45%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.assistant-changes__more {
  margin-top: 4px;
}

/* Out of credits */
.assistant-credits {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px;
  color: var(--color-text-primary);
}

.assistant-credits__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

/* Composer */
.assistant-composer {
  flex-shrink: 0;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border-light);
}

.assistant-composer__row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.assistant-composer__input {
  flex: 1;
  min-width: 0;
  max-height: calc(6lh + 18px);
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  outline: none;
  resize: none;
  overflow-y: auto;
  field-sizing: content;
  box-sizing: border-box;
  font-family: inherit;
  line-height: var(--lh-relaxed);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

.assistant-composer__input::placeholder {
  color: var(--color-text-tertiary);
}

.assistant-composer__input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.assistant-composer__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.assistant-composer__foot {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 6px;
}

.assistant-composer__count {
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .assistant-panel {
    top: 0;
    width: 100%;
    z-index: 1000;
    border-left: none;
    box-shadow: none;
  }

  .assistant-panel__header {
    padding: 0 8px 0 16px;
  }

  .assistant-panel__icon-btn {
    width: var(--touch-target-min);
    height: var(--touch-target-min);
  }

  .assistant-panel__list {
    padding: 16px;
  }

  .assistant-changes__row {
    min-height: var(--touch-target-min);
  }

  .assistant-composer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  }

  /* One line = the FAB bar: field and Send / Stop at the touch target height */
  .assistant-composer__input {
    min-height: var(--touch-target-min);
    font-size: var(--font-size-body);
  }

  .assistant-composer__btn {
    min-height: var(--touch-target-min);
  }
}
</style>
