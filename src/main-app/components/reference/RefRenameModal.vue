<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="rename.visible" class="overlay" @click.self="onCancel">
        <div class="dialog">
          <h3 class="title">{{ dialogTitle }}</h3>
          <Inpt
              ref="inputRef"
              v-model="nameValue"
              type="text"
              :placeholder="placeholder"
              @enter="onConfirm"
          />
          <div class="actions">
            <Btn variant="ghost" size="sm" @click="onCancel">Cancel</Btn>
            <Btn variant="primary" size="sm" @click="onConfirm" :disabled="!nameValue.trim()">
              {{ rename.type === 'new-folder' ? 'Create' : 'Rename' }}
            </Btn>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import Btn from '../Btn.vue'
import Inpt from '../Inpt.vue'

const props = defineProps({
  rename: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

const nameValue = ref('')
const inputRef = ref(null)

const dialogTitle = computed(() => {
  if (props.rename.type === 'new-folder') return 'New Folder'
  if (props.rename.type === 'folder') return 'Rename Folder'
  return 'Rename File'
})

const placeholder = computed(() => {
  if (props.rename.type === 'new-folder') return 'Folder name'
  return 'Enter name'
})

watch(() => props.rename.visible, (visible) => {
  if (visible) {
    nameValue.value = props.rename.currentName || ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function onConfirm() {
  const name = nameValue.value.trim()
  if (!name) return
  emit('confirm', name)
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  padding-bottom: 48px;
  justify-content: center;
  z-index: 99998;
}

.dialog {
  background: var(--color-bg-primary);
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.title {
  margin: 0 0 16px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  font-weight: 600;
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
