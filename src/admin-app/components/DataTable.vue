<template>
  <div class="data-table-wrapper">
    <div v-if="loading" class="data-table-loading">
      <Spinner />
    </div>

    <div v-else-if="!rows.length" class="data-table-empty">
      <slot name="empty">
        <p class="text-body-m color-text-tertiary">{{ emptyText }}</p>
      </slot>
    </div>

    <div v-else class="data-table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th
                v-for="col in columns"
                :key="col.key"
                class="text-label"
                :class="{ sortable: col.sortable, active: sortKey === col.key }"
                :style="col.width ? { width: col.width } : {}"
                @click="col.sortable && onSort(col.key)"
            >
              {{ col.label }}
              <span v-if="col.sortable && sortKey === col.key" class="sort-arrow">
                {{ sortDir === 'asc' ? '\u2191' : '\u2193' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
              v-for="(row, idx) in rows"
              :key="row.id || idx"
              :class="{ clickable: rowClickable }"
              @click="rowClickable && $emit('row-click', row)"
          >
            <td v-for="col in columns" :key="col.key" class="text-body-s">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && rows.length && showPagination" class="data-table-footer">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup>
import Spinner from './Spinner.vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: 'No data found.',
  },
  sortKey: {
    type: String,
    default: '',
  },
  sortDir: {
    type: String,
    default: 'asc',
  },
  rowClickable: {
    type: Boolean,
    default: false,
  },
  showPagination: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['sort', 'row-click'])

function onSort(key) {
  const dir = props.sortKey === key && props.sortDir === 'asc' ? 'desc' : 'asc'
  emit('sort', { key, dir })
}
</script>

<style scoped>
.data-table-wrapper {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
}

.data-table-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.data-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.data-table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.data-table th {
  text-align: left;
  padding: 10px 16px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  user-select: none;
}

.data-table th.sortable {
  cursor: pointer;
}

.data-table th.sortable:hover {
  color: var(--color-text-primary);
}

.data-table th.active {
  color: var(--color-action);
}

.sort-arrow {
  margin-left: 4px;
  font-size: var(--font-size-xs);
}

.data-table td {
  padding: 12px 16px;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-subtle);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr.clickable {
  cursor: pointer;
}

.data-table tbody tr.clickable:hover {
  background: var(--color-bg-secondary);
}

.data-table-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-light);
}
</style>
