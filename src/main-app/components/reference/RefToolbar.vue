<template>
  <div class="toolbar">
    <div class="toolbar__left">
      <RefBreadcrumb
          :breadcrumbs="breadcrumbs"
          @navigate="$emit('navigate', $event)"
      />
    </div>
    <div class="toolbar__right">
      <div class="toolbar__search">
        <input
            type="text"
            class="text-body-s search-input"
            placeholder="Search files..."
            :value="searchQuery"
            @input="$emit('search', $event.target.value)"
            @keydown.escape="$emit('search', '')"
        />
      </div>
      <Btn variant="ghost" size="sm" @click="$emit('new-folder')">New Folder</Btn>
      <Btn variant="primary" size="sm" @click="$emit('upload')">Upload</Btn>
      <div class="toolbar__view-toggle">
        <button
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'list' }"
            @click="$emit('set-view', 'list')"
            title="List view"
            type="button"
        >
          <ListViewIcon />
        </button>
        <button
            class="view-btn"
            :class="{ 'view-btn--active': viewMode === 'grid' }"
            @click="$emit('set-view', 'grid')"
            title="Grid view"
            type="button"
        >
          <GridViewIcon />
        </button>
      </div>
      <div v-if="quota" class="toolbar__quota">
        <span class="text-footnote quota-text">{{ formatBytes(quota.used_bytes) }} / {{ formatBytes(quota.quota_bytes) }}</span>
        <div class="quota-bar">
          <div class="quota-bar__fill" :style="{ width: quotaPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import RefBreadcrumb from './RefBreadcrumb.vue'
import Btn from '../Btn.vue'
import ListViewIcon from '../../assets/ListViewIcon.vue'
import GridViewIcon from '../../assets/GridViewIcon.vue'

const props = defineProps({
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
  searchQuery: {
    type: String,
    default: '',
  },
  viewMode: {
    type: String,
    default: 'list',
  },
  quota: {
    type: Object,
    default: null,
  },
})

defineEmits(['navigate', 'search', 'new-folder', 'upload', 'set-view'])

const quotaPercent = computed(() => {
  if (!props.quota || !props.quota.quota_bytes) return 0
  return Math.min(100, Math.round((props.quota.used_bytes / props.quota.quota_bytes) * 100))
})

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.toolbar__left {
  min-width: 0;
  flex-shrink: 1;
}

.toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar__search {
  position: relative;
}

.search-input {
  padding: 6px 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  width: 160px;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-action);
  box-shadow: 0 0 0 1px rgba(65, 133, 222, 0.2);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.toolbar__view-toggle {
  display: flex;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  background: none;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.view-btn :deep(svg) {
  width: 18px;
  height: 18px;
  padding: 1px;
  box-sizing: border-box;
}

.view-btn:hover {
  background: var(--color-bg-hover);
}

.view-btn--active {
  background: var(--color-bg-secondary);
  color: var(--color-action);
}

.toolbar__quota {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 100px;
}

.quota-text {
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.quota-bar {
  width: 100%;
  height: 3px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.quota-bar__fill {
  height: 100%;
  background: var(--color-action);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Stack toolbar vertically on narrow screens */
@media (max-width: 600px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar__right {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar__search {
    flex: 1 1 100%;
    order: -1;
  }

  .search-input {
    width: 100%;
  }

  .toolbar__quota {
    display: none;
  }
}
</style>
