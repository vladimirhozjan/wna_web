<template>
  <Modal :visible="visible" fullscreen-mobile>
    <div class="welcome" data-testid="welcome-modal">
      <div class="welcome__header">
        <span class="text-body-s welcome__step" data-testid="welcome-step">{{ step + 1 }}/{{ SLIDES.length }}</span>
        <ActionBtn variant="default" class="welcome__close" title="Close" data-testid="welcome-close" @click="skip" />
      </div>
      <div class="welcome__body">
        <EmptyState :icon="slide.icon" :title="slide.title" :text="slide.text">
          <Inpt
            v-if="isLast"
            ref="inputRef"
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
    <template #actions>
      <Btn variant="link" size="md" class="welcome__btn welcome__skip" :disabled="submitting" data-testid="welcome-skip" @click="skip">
        {{ isLast ? 'Skip for now' : 'Skip' }}
      </Btn>
      <Btn v-if="step > 0" variant="secondary" size="md" class="welcome__btn" :disabled="submitting" data-testid="welcome-back" @click="step--">Back</Btn>
      <Btn v-if="!isLast" variant="primary" size="md" class="welcome__btn" data-testid="welcome-next" @click="step++">Next</Btn>
      <Btn v-else variant="primary" size="md" class="welcome__btn" :disabled="!title.trim()" :loading="submitting" data-testid="welcome-capture-submit" @click="submit">Add to Inbox</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import Modal from './Modal.vue'
import ActionBtn from './ActionBtn.vue'
import Btn from './Btn.vue'
import Inpt from './Inpt.vue'
import EmptyState from './EmptyState.vue'
import InboxIcon from '../assets/InboxIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import EngageIcon from '../assets/EngageIcon.vue'
import { stuffModel } from '../scripts/models/stuffModel.js'

const SLIDES = [
  {
    icon: InboxIcon,
    title: 'Capture everything',
    text: 'Your mind is for having ideas, not holding them. Whatever has your attention — a task, an idea, an errand — drop it into your Inbox with the + button, from any page.',
  },
  {
    icon: NextIcon,
    title: 'Decide what it means',
    text: 'Clarify asks one question per Inbox item: is it actionable? If it takes less than two minutes, do it now. Otherwise it becomes a next action, a project or a date on your calendar — or goes to Someday, Reference or Trash.',
  },
  {
    icon: EngageIcon,
    title: 'Work from a list you trust',
    text: "Your Dashboard shows what's due, what's next and what you're waiting for, so you can choose your next action with confidence. A Weekly Review keeps it all current.",
  },
  {
    icon: InboxIcon,
    title: "What's on your mind?",
    text: "Start with one thing you've been meaning to do. It lands in your Inbox, ready to clarify whenever you are.",
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

const slide = computed(() => SLIDES[step.value])
const isLast = computed(() => step.value === SLIDES.length - 1)

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

.welcome__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome__step {
  color: var(--color-text-tertiary);
}

.welcome__close {
  color: var(--color-text-tertiary);
}

.welcome__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding-top: 16px;
  text-align: center;
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
  .welcome__close {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }

  .welcome__input :deep(input),
  .welcome__btn {
    min-height: var(--touch-target-min);
    box-sizing: border-box;
  }
}
</style>
