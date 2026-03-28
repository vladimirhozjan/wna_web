<template>
  <div class="pagination">
    <span class="text-caption color-text-secondary">
      {{ rangeText }}
    </span>

    <div class="pagination-controls">
      <button
          class="pagination-btn"
          :disabled="page <= 1"
          @click="$emit('update:page', page - 1)"
          aria-label="Previous page"
      >
        &lsaquo;
      </button>

      <button
          v-for="p in visiblePages"
          :key="p"
          class="pagination-btn"
          :class="{ active: p === page }"
          @click="typeof p === 'number' && $emit('update:page', p)"
          :disabled="typeof p !== 'number'"
      >
        {{ p }}
      </button>

      <button
          class="pagination-btn"
          :disabled="page >= totalPages"
          @click="$emit('update:page', page + 1)"
          aria-label="Next page"
      >
        &rsaquo;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 20,
  },
  total: {
    type: Number,
    default: 0,
  },
})

defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const rangeText = computed(() => {
  if (props.total === 0) return 'No results'
  const start = (props.page - 1) * props.pageSize + 1
  const end = Math.min(props.page * props.pageSize, props.total)
  return `${start}\u2013${end} of ${props.total}`
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('\u2026')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('\u2026')

  pages.push(total)
  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-body-s);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-medium);
}

.pagination-btn.active {
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-color: var(--color-action);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
