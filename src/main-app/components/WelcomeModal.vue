<template>
  <Modal :visible="visible" max-width="520px" fullscreen-mobile>
    <div class="welcome" data-testid="welcome-modal">
      <span class="text-body-s welcome__step" data-testid="welcome-step">{{ step + 1 }} of {{ SLIDES.length }}</span>
      <div class="welcome__body">
        <div
          v-for="(s, i) in SLIDES"
          :key="s.title"
          class="welcome__slide"
          :class="{ 'welcome__slide--hidden': i !== step }"
          :aria-hidden="i !== step"
        >
          <EmptyState :icon="s.icon" :title="s.title" :text="s.text">
            <Inpt
              v-if="i === SLIDES.length - 1"
              :ref="setInputRef"
              v-model="title"
              v-model:error="error"
              type="text"
              placeholder="e.g. Call the dentist"
              :disabled="submitting"
              class="welcome__input"
              data-testid="welcome-capture-input"
              @enter="submit"
            />
          </EmptyState>
        </div>
      </div>
    </div>
    <template #actions>
      <Btn variant="link" size="md" class="welcome__btn welcome__skip" :disabled="submitting" data-testid="welcome-skip" @click="skip">
        {{ isLast ? 'Skip for now' : 'Skip' }}
      </Btn>
      <Btn v-if="step > 0" variant="secondary" size="md" class="welcome__btn" :disabled="submitting" data-testid="welcome-back" @click="step--">Back</Btn>
      <Btn v-if="!isLast" variant="primary" size="md" class="welcome__btn welcome__primary" data-testid="welcome-next" @click="step++">Next</Btn>
      <Btn v-else variant="primary" size="md" class="welcome__btn welcome__primary" :disabled="!title.trim()" :loading="submitting" data-testid="welcome-capture-submit" @click="submit">Add to Inbox</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import Modal from './Modal.vue'
import Btn from './Btn.vue'
import Inpt from './Inpt.vue'
import EmptyState from './EmptyState.vue'
import InboxIcon from '../assets/InboxIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import EngageIcon from '../assets/EngageIcon.vue'
import PlusIcon from '../assets/PlusIcon.vue'
import { stuffModel } from '../scripts/models/stuffModel.js'

const SLIDES = [
  {
    icon: InboxIcon,
    title: 'Capture everything',
    text: 'Whatever has your attention, drop it into your Inbox — with Quick Add, or + on your phone.',
  },
  {
    icon: NextIcon,
    title: 'Decide what it means',
    text: 'Clarify asks one question per item: is it actionable? Then it becomes an action, a project or a date — or goes.',
  },
  {
    icon: EngageIcon,
    title: 'Work from a list you trust',
    text: "Your Dashboard shows what's due and what's next. A Weekly Review keeps it current.",
  },
  {
    icon: PlusIcon,
    title: "What's on your mind?",
    text: "Add one thing you've been meaning to do. It lands in your Inbox, ready to clarify.",
  },
]

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'added'])

const { addStuff } = stuffModel()

const step = ref(0)
const title = ref('')
const error = ref('')
const submitting = ref(false)
const inputRef = ref(null)

const isLast = computed(() => step.value === SLIDES.length - 1)

function setInputRef(el) {
  inputRef.value = el
}

function skip() {
  if (submitting.value) return
  emit('close')
}

async function submit() {
  const t = title.value.trim()
  if (!t || submitting.value) return
  submitting.value = true
  try {
    await addStuff(t)
    emit('added')
  } catch {
    error.value = "Couldn't add it to your Inbox. Try again in a moment."
    nextTick(() => inputRef.value?.focus())
  } finally {
    submitting.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') skip()
}

watch(() => props.visible, (v) => {
  if (v) {
    step.value = 0
    title.value = ''
    error.value = ''
    window.addEventListener('keydown', onKeydown)
  } else {
    window.removeEventListener('keydown', onKeydown)
  }
}, { immediate: true })

watch(isLast, (v) => {
  if (v) nextTick(() => inputRef.value?.focus())
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.welcome__step {
  color: var(--color-text-tertiary);
}

/* All slides share one grid cell, so the body is as tall as the tallest slide and the actions never move */
.welcome__body {
  display: grid;
  flex: 1;
  padding-top: 16px;
  text-align: center;
}

.welcome__slide {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.welcome__slide--hidden {
  visibility: hidden;
}

.welcome__input {
  margin-top: 24px;
  max-width: 340px;
  text-align: left;
}

.welcome__skip {
  margin-right: auto;
}

@media (max-width: 768px) {
  .welcome__input :deep(input),
  .welcome__btn {
    min-height: var(--touch-target-min);
    box-sizing: border-box;
  }

  .welcome__primary {
    flex: 1;
  }
}
</style>
