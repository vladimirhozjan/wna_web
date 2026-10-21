<template>
  <Item
      :id="item.id"
      :title="item.title"
      :editable="false"
      no-checkbox
      class="search-row"
      :data-testid="`search-row-${item.type}`"
      @click="open"
  >
    <template #prefix>
      <ItemTypeIcon :type="item.type.toUpperCase()" />
    </template>
    <template #title>
      <template v-for="(part, i) in titleParts" :key="i">
        <mark v-if="part.mark" class="search-row__mark">{{ part.text }}</mark>
        <template v-else>{{ part.text }}</template>
      </template>
    </template>
    <template v-if="item.completed || item.shared" #title-suffix>
      <Badge v-if="item.completed" type="draft" label="Completed" />
      <Badge v-if="item.shared" type="primary" label="Shared" />
    </template>
    <template v-if="item.snippet || showMetadata" #subtitle>
      <p v-if="item.snippet" class="text-body-s search-row__snippet">
        <template v-for="(part, i) in snippetParts" :key="i">
          <mark v-if="part.mark" class="search-row__mark">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <MetadataRow v-if="showMetadata" :item="metadata" entity-type="action" />
    </template>
  </Item>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Item from './Item.vue'
import ItemTypeIcon from './ItemTypeIcon.vue'
import Badge from './Badge.vue'
import MetadataRow from './MetadataRow.vue'
import { markParts, searchRoute } from '../scripts/models/searchModel.js'

const props = defineProps({
  item: { type: Object, required: true },
  term: { type: String, default: '' },
})

const router = useRouter()

const titleParts = computed(() => markParts(props.item.title, props.term))
const snippetParts = computed(() => markParts(props.item.snippet, props.term))

// Completed rows pass no due date — no false "Overdue"
const metadata = computed(() => ({
  due_date: props.item.completed ? null : props.item.due_date,
  project: props.item.project,
}))
const showMetadata = computed(() =>
    props.item.type === 'action' && !!(metadata.value.due_date || metadata.value.project)
)

function open() {
  const to = searchRoute(props.item)
  if (to) router.push(to)
}
</script>

<style scoped>
.search-row__mark {
  background: var(--color-highlight-yellow);
  color: inherit;
}

.search-row__snippet {
  margin: 0;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-row__snippet + .metadata-row {
  margin-top: 4px;
}
</style>
