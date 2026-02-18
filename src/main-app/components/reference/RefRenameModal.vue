<template>
  <Modal :visible="rename.visible" :title="dialogTitle" max-width="400px" @close="onCancel">
    <Inpt
        ref="inputRef"
        v-model="nameValue"
        type="text"
        :placeholder="placeholder"
        @enter="onConfirm"
    />
    <template #actions>
      <Btn variant="ghost" size="sm" @click="onCancel">Cancel</Btn>
      <Btn variant="primary" size="sm" @click="onConfirm" :disabled="!nameValue.trim()">
        {{ rename.type === 'new-folder' ? 'Create' : 'Rename' }}
      </Btn>
    </template>
  </Modal>
</template>

<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import Modal from '../Modal.vue'
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
