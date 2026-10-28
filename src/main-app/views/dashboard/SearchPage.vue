<template>
    <div class="search-page">
      <div class="search-header">
        <h1 class="page-title">Search</h1>
      </div>

      <div class="search-controls">
        <Inpt
            ref="inputRef"
            v-model="value"
            type="text"
            placeholder="Search everything..."
            data-testid="search-page-input"
            @enter="search.input(value, { debounce: false })"
        />
        <div v-if="hasQuery" class="search-chips">
          <SegmentSwitch :options="CHIPS" :model-value="chip" data-testid="search-chips" @update:model-value="onChip" />
        </div>
        <p v-if="hasQuery && search.items.value.length > 0" class="text-body-s search-count" data-testid="search-count">
          {{ search.totalCount.value === 1 ? '1 result' : `${search.totalCount.value} results` }}
        </p>
      </div>

      <div class="search-content">
        <div v-if="!hasQuery" class="search-empty">
          <EmptyState :icon="SearchIcon" title="Find anything you've captured" text="Type a word from a title, description, project outcome or file name." />
        </div>

        <div v-else-if="search.error.value" class="search-empty">
          <EmptyState
              :icon="SearchIcon"
              title="Search didn't go through"
              :text="search.error.value.status === 429 ? 'Too many searches in a row. Wait a moment, then try again.' : 'Check your connection, then try again.'"
              button-text="Try again"
              @action="search.retry()"
          />
        </div>

        <div v-else-if="search.items.value.length === 0 && (search.loading.value || search.resultTerm.value === null)" class="search-loading">
          <Spinner :size="32" delayed />
        </div>

        <div v-else-if="search.items.value.length === 0" class="search-empty">
          <EmptyState
              :icon="SearchIcon"
              :title="noResultsTitle"
              :text="chip === 'all' ? 'Check the spelling or try a different word.' : 'Try All, or a different word.'"
          />
        </div>

        <div v-else class="card">
          <SearchResultRow
              v-for="item in search.items.value"
              :key="`${item.type}-${item.id}`"
              :item="item"
              :term="search.resultTerm.value"
          />
          <div v-if="search.cursor.value" class="search-loadmore">
            <Btn variant="secondary" size="sm" :loading="search.loadingMore.value" data-testid="search-load-more" @click="loadMore">Load more</Btn>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Inpt from '../../components/Inpt.vue'
import SegmentSwitch from '../../components/SegmentSwitch.vue'
import EmptyState from '../../components/EmptyState.vue'
import Spinner from '../../components/Spinner.vue'
import Btn from '../../components/Btn.vue'
import SearchResultRow from '../../components/SearchResultRow.vue'
import SearchIcon from '../../assets/SearchIcon.vue'
import { searchModel, SEARCH_MIN_LENGTH } from '../../scripts/models/searchModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

// No Completed chip — completed hits stay in All and their type, badged
const CHIPS = [
  { value: 'all', label: 'All', testid: 'search-chip-all' },
  { value: 'stuff', label: 'Inbox', testid: 'search-chip-stuff' },
  { value: 'action', label: 'Actions', testid: 'search-chip-action' },
  { value: 'project', label: 'Projects', testid: 'search-chip-project' },
  { value: 'recurring', label: 'Recurring', testid: 'search-chip-recurring' },
  { value: 'reference', label: 'Reference', testid: 'search-chip-reference' },
]

const route = useRoute()
const router = useRouter()
const search = searchModel().page
const toaster = errorModel()
const undo = undoModel()

const value = ref('')
const inputRef = ref(null)

const hasQuery = computed(() => value.value.trim().length >= SEARCH_MIN_LENGTH)
const chip = computed(() => search.types.value[0] || 'all')
const noResultsTitle = computed(() => `Nothing matches "${search.resultTerm.value}"`)

function onChip(next) {
  search.setTypes(next === 'all' ? [] : [next])
}

async function loadMore() {
  try {
    await search.loadMore()
  } catch {
    toaster.push("Couldn't load more results. Try again.")
  }
}
undo.registerRefresh(search.retry)
onAssistantChange(search.retry)

watch(value, (v) => search.input(v))

watch([search.term, search.types], ([q, types]) => {
  const query = {}
  if (q) query.q = q
  if (types.length) query.types = types.join(',')
  router.replace({ query })
})

onMounted(() => {
  search.reset()
  const types = route.query.types
  search.types.value = CHIPS.some(c => c.value === types && c.value !== 'all') ? [types] : []
  value.value = typeof route.query.q === 'string' ? route.query.q : ''
  search.input(value.value, { debounce: false })
  inputRef.value?.focus()
})
</script>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.search-header h1 {
  margin: 0;
  padding: 0;
}

.search-controls {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
}

.search-count {
  margin: 0;
  color: var(--color-text-tertiary);
}

.search-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

/* Spinner sits on the centre of the empty-state coin */
.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 128px 24px 48px;
}

@media (max-width: 768px) {
  .search-loading {
    padding-top: 108px;
  }
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.search-loadmore {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--color-border-subtle);
}

@media (max-width: 768px) {
  .search-chips {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .search-chips::-webkit-scrollbar {
    display: none;
  }
}
</style>
