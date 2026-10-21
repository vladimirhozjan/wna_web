<template>
  <div class="search-box">
    <div class="search-box__field">
      <SearchIcon class="search-box__icon" />
      <input
          ref="inputRef"
          v-model="value"
          type="text"
          class="text-body-s search-box__input"
          placeholder="Search everything..."
          data-testid="topnav-search-input"
          @input="search.input(value)"
          @keydown.enter="seeAll"
      />
    </div>

    <div v-if="panelOpen" class="search-box__panel" data-testid="topnav-search-panel">
      <div v-if="search.error.value" class="search-box__state">
        <span class="text-body-s search-box__message">{{ errorText }}</span>
        <Btn variant="link" size="sm" @click="search.retry()">Try again</Btn>
      </div>

      <div v-else-if="search.items.value.length === 0 && (search.loading.value || search.resultTerm.value === null)" class="search-box__state">
        <Spinner :size="16" />
      </div>

      <div v-else-if="search.items.value.length === 0" class="search-box__state">
        <span class="text-body-s search-box__message">No results found for "{{ search.resultTerm.value }}". Try a different search term.</span>
      </div>

      <template v-else>
        <SearchResultRow
            v-for="item in search.items.value"
            :key="`${item.type}-${item.id}`"
            :item="item"
            :term="search.resultTerm.value"
        />
        <div v-if="search.totalCount.value > search.items.value.length" class="search-box__footer">
          <Btn variant="link" size="sm" data-testid="topnav-search-see-all" @click="seeAll">See all {{ search.totalCount.value }} results</Btn>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Btn from './Btn.vue'
import Spinner from './Spinner.vue'
import SearchResultRow from './SearchResultRow.vue'
import SearchIcon from '../assets/SearchIcon.vue'
import { searchModel, SEARCH_MIN_LENGTH } from '../scripts/models/searchModel.js'

const router = useRouter()
const search = searchModel().dropdown

const value = ref('')
const inputRef = ref(null)

const panelOpen = computed(() => value.value.trim().length >= SEARCH_MIN_LENGTH)

const errorText = computed(() =>
    search.error.value?.status === 429
        ? 'Too many searches. Wait a moment and try again.'
        : 'Search failed. Check your connection and try again.'
)

function seeAll() {
  const q = value.value.trim()
  if (q.length < SEARCH_MIN_LENGTH) return
  router.push({ name: 'search', query: { q } })
}

onBeforeUnmount(() => search.reset())

defineExpose({
  focus() {
    inputRef.value?.focus()
  },
})
</script>

<style scoped>
.search-box {
  position: relative;
}

.search-box__field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box__icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-box__input {
  padding: 6px 10px 6px 30px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  width: 200px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.search-box__input:focus {
  outline: none;
  border-color: var(--color-action);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.search-box__input::placeholder {
  color: var(--color-text-tertiary);
}

.search-box__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 400px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-dropdown);
  z-index: 1000;
  overflow: hidden;
}

.search-box__state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 24px 12px;
  text-align: center;
}

.search-box__message {
  color: var(--color-text-tertiary);
}

.search-box__footer {
  display: flex;
  justify-content: center;
  padding: 8px 12px;
}
</style>
