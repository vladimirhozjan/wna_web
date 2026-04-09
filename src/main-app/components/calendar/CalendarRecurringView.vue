<template>
  <div class="recurring-view">
    <div class="recurring-view__header">
      <div class="recurring-view__header-actions" v-if="items.length > 0">
        <Btn variant="secondary" size="sm" @click="showAdd ? showAdd = false : openAdd()">{{ showAdd ? '−' : '+' }}</Btn>
      </div>
    </div>
    <div class="recurring-view__add" v-if="showAdd">
      <Inpt
          ref="add_input"
          v-model="newTitle"
          type="text"
          placeholder="New recurring template"
          @keyup.enter="onAdd"
          :disabled="adding"
      />
      <Btn @click="onAdd"
           :disabled="adding || !newTitle.trim()"
           :loading="adding"
           class="recurring-view__add-btn"
           variant="primary"
           size="sm">
        Add
      </Btn>
    </div>

    <div class="recurring-view__content">
      <ItemList
          v-model="items"
          :loading="loading"
          :has-more="false"
          :loading-ids="loadingIds"
          no-checkbox
          source-type="recurring"
          @click="onItemClick"
          @delete="onDelete"
          @move="onMove"
      >
        <template #subtitle="{ item }">
          <MetadataRow :item="item" entity-type="recurring" />
        </template>
        <template #actions="{ item }">
          <ActionBtn @click="onDelete(item.id)" />
        </template>
        <template #empty>
          <EmptyState
            :icon="RecurringIcon"
            title="No recurring templates"
            text="Create recurring templates to automatically schedule actions on a repeating basis."
            buttonText="Add Template"
            @action="openAdd"
          />
        </template>
      </ItemList>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ItemList from '../ItemList.vue'
import ActionBtn from '../ActionBtn.vue'
import Btn from '../Btn.vue'
import Inpt from '../Inpt.vue'
import MetadataRow from '../MetadataRow.vue'
import EmptyState from '../EmptyState.vue'
import RecurringIcon from '../../assets/RecurringIcon.vue'
import { recurringModel } from '../../scripts/models/recurringModel.js'
import { authModel } from '../../scripts/core/authModel.js'
import { upgradeModel } from '../../scripts/core/upgradeModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'

const router = useRouter()
const auth = authModel()
const upgrade = upgradeModel()
const toaster = errorModel()
const confirm = confirmModel()

const {
  items,
  loading,
  error,
  loadRecurring,
  createRecurring,
  deleteRecurring,
  moveRecurring,
} = recurringModel()

const showAdd = ref(false)
const newTitle = ref('')
const add_input = ref(null)
const adding = ref(false)
const deletingId = ref(null)
const movingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (deletingId.value) ids.push(deletingId.value)
  if (movingId.value) ids.push(movingId.value)
  return ids
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  items.value = []
  loadRecurring().catch(() => {})
})

function openAdd() {
  const tier = auth.currentUser.value?.subscription_tier || 'free'
  if (tier === 'free') {
    upgrade.show({ message: 'Recurring templates let you automate repeating actions. This feature is available on Pro and Team plans.' })
    return
  }
  showAdd.value = true
  nextTick(() => add_input.value?.focus())
}

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t || adding.value) return

  adding.value = true
  try {
    const todayDay = ['SU','MO','TU','WE','TH','FR','SA'][new Date().getDay()]
    const created = await createRecurring({ title: t, recurrence_rule: `FREQ=WEEKLY;BYDAY=${todayDay}` })
    newTitle.value = ''
    nextTick(() => add_input.value?.focus())
    router.push({ name: 'recurring-detail', params: { id: created.id } })
  } catch (err) {
    toaster.push(err.message || 'Failed to create template')
  } finally {
    adding.value = false
  }
}

function onItemClick(item) {
  router.push({ name: 'recurring-detail', params: { id: item.id } })
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveRecurring(id, newIndex)
  } catch (e) {
    await loadRecurring().catch(() => {})
  } finally {
    movingId.value = null
  }
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onDelete(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  const confirmed = await confirm.show({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${item?.title || 'this template'}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  deletingId.value = id
  try {
    await deleteRecurring(id)
    toaster.success(`"${title}" deleted`)
  } catch (err) {
    toaster.push(err.message || 'Failed to delete template')
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.recurring-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recurring-view__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 10px;
}

.recurring-view__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.recurring-view__add {
  display: flex;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 5px;
}

.recurring-view__add-btn {
  margin-top: 8px;
  margin-bottom: 4px;
}

.recurring-view__content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

</style>
