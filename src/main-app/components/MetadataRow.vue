<template>
  <div v-if="hasAnyMetadata" class="metadata-row">
    <div class="metadata-row__indicators">
      <!-- No next action warning (projects only) -->
      <span v-if="missingNextAction" class="chip chip--warning">
        <WarningIcon class="chip__icon chip__icon--warning" />
        <span class="text-body-s chip__text chip__text--warning">No next action</span>
      </span>

      <!-- Recurrence rule -->
      <span v-if="item.recurrence_rule" class="chip">
        <RecurringIcon class="chip__icon chip__icon--tertiary" />
        <span class="text-body-s chip__text chip__text--tertiary">{{ recurrenceDescription }}</span>
      </span>

      <!-- Waiting for -->
      <span v-if="entityType === 'action' && item.waiting_for" class="chip">
        <HourglassIcon class="chip__icon" />
        <span class="chip__text">{{ item.waiting_for }}</span>
      </span>

      <!-- Due date -->
      <span v-if="entityType === 'action' && item.due_date" class="chip" :class="{ 'chip--danger': isItemOverdue }">
        <CalendarIcon class="chip__icon" />
        <span class="text-body-s chip__text">{{ isItemOverdue ? 'Overdue ' : '' }}{{ formattedDueDate }}</span>
      </span>

      <!-- Scheduled date -->
      <span v-if="entityType === 'action' && item.scheduled_date" class="chip">
        <CalendarIcon class="chip__icon chip__icon--scheduled" />
        <span class="text-body-s chip__text chip__text--scheduled">Sched {{ formattedScheduledDate }}</span>
      </span>

      <!-- Start date -->
      <span v-if="entityType === 'action' && item.start_date" class="chip">
        <CalendarIcon class="chip__icon chip__icon--tertiary" />
        <span class="text-body-s chip__text chip__text--tertiary">Starts {{ formattedStartDate }}</span>
      </span>

      <!-- Project -->
      <span v-if="entityType === 'action' && projectTitle" class="fw-medium chip chip--project">
        <ProjectsIcon class="chip__icon chip__icon--project" />
        <span class="text-body-s chip__text chip__text--project">{{ truncatedProjectTitle }}</span>
      </span>

      <!-- Attachments -->
      <span v-if="item.attachment_count > 0" class="chip">
        <AttachmentIcon class="chip__icon chip__icon--tertiary" />
        <span class="text-body-s chip__text chip__text--tertiary">{{ item.attachment_count }}</span>
      </span>

      <!-- Comments -->
      <span v-if="item.comment_count > 0" class="chip">
        <CommentIcon class="chip__icon chip__icon--tertiary" />
        <span class="text-body-s chip__text chip__text--tertiary">{{ item.comment_count }}</span>
      </span>

      <!-- Description -->
      <span v-if="item.description" class="chip">
        <DescriptionIcon class="chip__icon chip__icon--tertiary" />
      </span>
    </div>

    <div v-if="visibleTags.length" class="metadata-row__tags">
      <span v-for="tag in visibleTags" :key="tag" class="text-body-s tag-chip">{{ tag }}</span>
      <span v-if="hiddenTagCount > 0" class="text-body-s tag-chip tag-chip--overflow tag-chip--desktop">+{{ hiddenTagCount }}</span>
      <span v-if="mobileHiddenTagCount > 0" class="text-body-s tag-chip tag-chip--overflow tag-chip--mobile">+{{ mobileHiddenTagCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import HourglassIcon from '../assets/HourglassIcon.vue'
import CalendarIcon from '../assets/CalendarIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import AttachmentIcon from '../assets/AttachmentIcon.vue'
import CommentIcon from '../assets/CommentIcon.vue'
import RecurringIcon from '../assets/RecurringIcon.vue'
import WarningIcon from '../assets/WarningIcon.vue'
import DescriptionIcon from '../assets/DescriptionIcon.vue'
import { isOverdue, formatShortDate } from '../scripts/core/dateUtils.js'
import { describeRRule } from '../scripts/core/rruleUtils.js'

const props = defineProps({
  item: { type: Object, required: true },
  entityType: { type: String, required: true },
})

const isItemOverdue = computed(() =>
    props.entityType === 'action' && isOverdue(props.item.due_date)
)

const missingNextAction = computed(() =>
    props.entityType === 'project' && !props.item.next_action_id
)

const recurrenceDescription = computed(() => {
  let desc = describeRRule(props.item.recurrence_rule)
  if (!desc) return ''

  const time = props.item.scheduled_time
  if (time) {
    const [h, m] = time.split(':')
    desc += ` at ${h}:${m}`
  }

  const dur = props.item.scheduled_duration
  if (dur) {
    if (dur >= 60 && dur % 60 === 0) {
      desc += ` for ${dur / 60}h`
    } else if (dur >= 60) {
      desc += ` for ${Math.floor(dur / 60)}h ${dur % 60}m`
    } else {
      desc += ` for ${dur}m`
    }
  }

  return desc
})
const formattedDueDate = computed(() => formatShortDate(props.item.due_date))
const formattedScheduledDate = computed(() => formatShortDate(props.item.scheduled_date))
const formattedStartDate = computed(() => formatShortDate(props.item.start_date))
// Backend returns project as nested object: { id, title }
const projectTitle = computed(() => props.item.project?.title || props.item.project_title)

const MAX_PROJECT_TITLE = 20

const truncatedProjectTitle = computed(() => {
  const t = projectTitle.value
  if (!t || t.length <= MAX_PROJECT_TITLE) return t
  return t.slice(0, MAX_PROJECT_TITLE).trim() + '…'
})

const MAX_TAGS = 3

const visibleTags = computed(() => {
  const tags = props.item.tags
  if (!tags || !tags.length) return []
  return tags.slice(0, MAX_TAGS)
})

const hiddenTagCount = computed(() => {
  const tags = props.item.tags
  if (!tags) return 0
  return Math.max(0, tags.length - MAX_TAGS)
})

const MOBILE_MAX_TAGS = 2

const mobileHiddenTagCount = computed(() => {
  const tags = props.item.tags
  if (!tags) return 0
  return Math.max(0, tags.length - MOBILE_MAX_TAGS)
})

const hasAnyMetadata = computed(() => {
  const i = props.item
  const isAction = props.entityType === 'action'

  if (missingNextAction.value) return true
  if (i.recurrence_rule) return true
  if (isAction && i.waiting_for) return true
  if (isAction && i.due_date) return true
  if (isAction && i.scheduled_date) return true
  if (isAction && i.start_date) return true
  if (isAction && (i.project?.title || i.project_title)) return true
  if (i.description) return true
  if (i.attachment_count > 0) return true
  if (i.comment_count > 0) return true
  if (i.tags && i.tags.length > 0) return true
  return false
})
</script>

<style scoped>
.metadata-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.metadata-row__indicators {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;
}

.metadata-row__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.chip--danger {
  color: var(--color-danger);
}

.chip--warning {
  color: var(--color-warning);
}

.chip__icon {
  width: 20px;
  height: 20px;
  padding: 4px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.chip__icon--warning {
  color: var(--color-warning);
}

.chip__icon--scheduled {
  color: var(--color-calendar-scheduled-text);
}

.chip__icon--tertiary {
  color: var(--color-text-tertiary);
}

.chip__icon--project {
  color: var(--color-action);
}

.chip__text {
  line-height: var(--lh-tight);
}

.chip__text--warning {
  color: var(--color-warning);
}

.chip__text--scheduled {
  color: var(--color-calendar-scheduled-text);
}

.chip__text--tertiary {
  color: var(--color-text-tertiary);
}

.chip__text--project {
  color: var(--color-action);
}

.tag-chip {
  display: inline-block;
  padding: 1px 6px;
  line-height: var(--lh-normal);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  white-space: nowrap;
}

.tag-chip--overflow {
  color: var(--color-text-tertiary);
  background: transparent;
  border-color: transparent;
  padding: 1px 2px;
}

.tag-chip--mobile {
  display: none;
}

@media (max-width: 480px) {
  .metadata-row__tags .tag-chip:nth-child(n+3):not(.tag-chip--overflow) {
    display: none;
  }

  .tag-chip--desktop {
    display: none;
  }

  .tag-chip--mobile {
    display: inline-block;
  }

  .chip__text--project {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
