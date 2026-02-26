<template>
  <div class="tag-filter">
    <Dropdown ref="dropdown" title="Filter by tag" align="right">
      <template #trigger>
        <Btn variant="icon" :class="{ 'tag-filter--active': modelValue.length > 0 || activeTag }">
          <FilterIcon />
        </Btn>
      </template>

      <template #default="{ close }">
        <div class="tag-filter__menu">
          <div v-if="tags.length === 0" class="tag-filter__empty">
            No tags yet
          </div>
          <template v-else>
            <button
                v-for="tag in tags"
                :key="tag"
                type="button"
                class="tag-filter__item"
                :class="{ 'tag-filter__item--context': tag === activeTag }"
                :disabled="tag === activeTag"
                @click="toggleTag(tag)"
            >
              <span class="tag-filter__check">{{ (modelValue.includes(tag) || tag === activeTag) ? '\u2713' : '' }}</span>
              <span class="tag-filter__label">{{ tag }}</span>
            </button>
            <button
                v-if="modelValue.length > 0"
                type="button"
                class="tag-filter__clear"
                @click="clearAll(close)"
            >
              Clear all
            </button>
          </template>
        </div>
      </template>
    </Dropdown>

    <span v-if="activeTag" class="tag-filter__chip tag-filter__chip--context">
      {{ activeTag }}
    </span>
    <span v-for="tag in modelValue" :key="tag" class="tag-filter__chip">
      {{ tag }}
      <button type="button" class="tag-filter__chip-remove" @click="removeTag(tag)">&times;</button>
    </span>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Dropdown from './Dropdown.vue'
import Btn from './Btn.vue'
import FilterIcon from '../assets/FilterIcon.vue'
import { tagModel } from '../scripts/models/tagModel.js'
import { contextModel } from '../scripts/models/contextModel.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const { activeTag } = contextModel()

const emit = defineEmits(['update:modelValue'])

const { tags, loadTags } = tagModel()

onMounted(() => {
  loadTags()
})

function toggleTag(tag) {
  if (props.modelValue.includes(tag)) {
    emit('update:modelValue', props.modelValue.filter(t => t !== tag))
  } else {
    emit('update:modelValue', [...props.modelValue, tag])
  }
}

function removeTag(tag) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

function clearAll(closeFn) {
  emit('update:modelValue', [])
  closeFn()
}
</script>

<style scoped>
.tag-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-filter--active {
  color: var(--color-action) !important;
}

.tag-filter__menu {
  min-width: 180px;
  max-height: 300px;
  overflow-y: auto;
}

.tag-filter__empty {
  padding: 12px 16px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-s);
  font-family: var(--font-family-default), sans-serif;
}

.tag-filter__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
  gap: 8px;
}

.tag-filter__item:hover {
  background: var(--color-bg-secondary);
}

.tag-filter__check {
  width: 18px;
  text-align: center;
  color: var(--color-action);
  font-weight: 600;
  flex-shrink: 0;
}

.tag-filter__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-filter__clear {
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

.tag-filter__clear:hover {
  color: var(--color-text-primary);
}

.tag-filter__chip {
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

.tag-filter__chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  margin-left: 2px;
  font-size: 14px;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.tag-filter__chip-remove:hover {
  color: var(--color-text-primary);
}

.tag-filter__chip--context {
  background: var(--color-action);
  border-color: var(--color-action);
  color: #fff;
}

.tag-filter__item--context {
  opacity: 0.5;
  cursor: default;
}

@media (max-width: 768px) {
  .tag-filter__item {
    padding: 12px 16px;
    font-size: var(--font-size-body-l);
  }
}
</style>
