<template>
  <div class="context-filter">
    <Dropdown ref="dropdown" title="Context filter" align="left">
      <template #trigger>
        <button type="button" class="context-trigger" :class="{ 'context-trigger--active': activeTag }">
          <span class="context-trigger__icon"><FilterIcon /></span>
          <span v-if="!activeTag" class="context-trigger__hint">Filter by context</span>
        </button>
      </template>

      <template #default="{ close }">
        <div class="context-filter__menu">
          <div v-if="allTags.length === 0" class="context-filter__empty">
            No tags yet
          </div>
          <template v-else>
            <button
                v-for="tag in allTags"
                :key="tag"
                type="button"
                class="context-filter__item"
                :class="{ 'context-filter__item--active': activeTag === tag }"
                @click="onSelect(tag)"
            >
              {{ tag }}
            </button>
            <button
                v-if="activeTag"
                type="button"
                class="context-filter__clear"
                @click="onClear(close)"
            >
              Clear
            </button>
          </template>
        </div>
      </template>
    </Dropdown>

    <span v-if="activeTag" class="context-filter__chip">
      {{ activeTag }}
      <button type="button" class="context-filter__chip-remove" @click="clear">&times;</button>
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Dropdown from './Dropdown.vue'
import FilterIcon from '../assets/FilterIcon.vue'
import { tagModel } from '../scripts/models/tagModel.js'
import { contextModel } from '../scripts/models/contextModel.js'

const { tags, loadTags, getPresets } = tagModel()
const { activeTag, setTag, clear } = contextModel()

const allTags = computed(() => {
  const presets = getPresets()
  const merged = [...presets]
  for (const tag of tags.value) {
    if (!merged.includes(tag)) {
      merged.push(tag)
    }
  }
  return merged
})

onMounted(() => {
  loadTags()
})

function onSelect(tag) {
  setTag(tag)
}

function onClear(closeFn) {
  clear()
  closeFn()
}
</script>

<style scoped>
.context-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-border-light);
}

.context-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: 0.15s ease;
}

.context-trigger:hover {
  color: var(--color-text-primary);
}

.context-trigger--active {
  color: var(--color-action);
}

.context-trigger__icon {
  display: flex;
  flex-shrink: 0;
}

.context-trigger__icon :deep(svg) {
  width: 28px;
  height: 28px;
  padding: 4px;
  box-sizing: border-box;
}

.context-trigger__hint {
  white-space: nowrap;
  font-style: italic;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-s);
}

.context-filter__menu {
  min-width: 180px;
  max-height: 300px;
  overflow-y: auto;
}

.context-filter__empty {
  padding: 12px 16px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-s);
  font-family: var(--font-family-default), sans-serif;
}

.context-filter__item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-filter__item:hover {
  background: var(--color-bg-secondary);
}

.context-filter__item--active {
  background: var(--color-bg-secondary);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}

.context-filter__clear {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  cursor: pointer;
  margin-top: 4px;
}

.context-filter__clear:hover {
  color: var(--color-text-primary);
}

.context-filter__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.context-filter__chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  margin-left: 2px;
  font-size: var(--font-size-sm);
  line-height: var(--lh-none);
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.context-filter__chip-remove:hover {
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .context-filter__item {
    padding: 12px 16px;
    font-size: var(--font-size-body-l);
  }
}
</style>
