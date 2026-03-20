<template>
  <div v-if="hasAnyMetadata" class="metadata-row">
    <div class="metadata-row__indicators">
      <!-- No next action warning (projects only) -->
      <span v-if="missingNextAction" class="chip chip--warning">
        <WarningIcon class="chip__icon chip__icon--warning" />
        <span class="chip__text chip__text--warning">No next action</span>
      </span>

      <!-- Recurrence rule -->
      <span v-if="item.recurrence_rule" class="chip">
        <RecurringIcon class="chip__icon chip__icon--tertiary" />
        <span class="chip__text chip__text--tertiary">{{ recurrenceDescription }}</span>
      </span>

      <!-- Waiting for -->
      <span v-if="entityType === 'action' && item.waiting_for" class="chip">
        <HourglassIcon class="chip__icon" />
        <span class="chip__text">{{ item.waiting_for }}</span>
      </span>

      <!-- Due date -->
      <span v-if="entityType === 'action' && item.due_date" class="chip" :class="isItemOverdue ? 'chip--overdue' : 'chip--due'">
        <CalendarIcon class="chip__icon" :class="isItemOverdue ? 'chip__icon--overdue' : 'chip__icon--due'" />
        <span class="chip__text" :class="isItemOverdue ? 'chip__text--overdue' : 'chip__text--due'">{{ isItemOverdue ? 'Overdue' : 'Due' }} {{ formattedDueDate }}</span>
      </span>

      <!-- Scheduled date -->
      <span v-if="entityType === 'action' && item.scheduled_date" class="chip">
        <CalendarIcon class="chip__icon chip__icon--scheduled" />
        <span class="chip__text chip__text--scheduled">Scheduled {{ formattedScheduledDate }}</span>
      </span>

      <!-- Start date -->
      <span v-if="entityType === 'action' && item.start_date" class="chip">
        <CalendarIcon class="chip__icon chip__icon--start" />
        <span class="chip__text chip__text--start">Starts {{ formattedStartDate }}</span>
      </span>

      <!-- Project -->
      <span v-if="entityType === 'action' && projectTitle" class="chip chip--project">
        <ProjectsIcon class="chip__icon chip__icon--project" />
        <span class="chip__text chip__text--project">{{ truncatedProjectTitle }}</span>
      </span>

      <!-- Attachments -->
      <span v-if="item.attachment_count > 0" class="chip">
        <AttachmentIcon class="chip__icon chip__icon--tertiary" />
        <span class="chip__text chip__text--tertiary">{{ item.attachment_count }}</span>
      </span>

      <!-- Comments -->
      <span v-if="item.comment_count > 0" class="chip">
        <CommentIcon class="chip__icon chip__icon--tertiary" />
        <span class="chip__text chip__text--tertiary">{{ item.comment_count }}</span>
      </span>

      <!-- Description -->
      <span v-if="item.description" class="chip">
        <DescriptionIcon class="chip__icon chip__icon--tertiary" />
      </span>

      <!-- Tags (inline with other metadata) -->
      <span v-for="tag in visibleTags" :key="tag" class="tag-chip">{{ tag }}</span>
      <span v-if="hiddenTagCount > 0" class="tag-chip tag-chip--overflow tag-chip--desktop">+{{ hiddenTagCount }}</span>
      <span v-if="mobileHiddenTagCount > 0" class="tag-chip tag-chip--overflow tag-chip--mobile">+{{ mobileHiddenTagCount }}</span>
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
    props.entityType === 'project' && !props.item.next_action_id && props.item.state !== 'SOMEDAY'
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
  margin-top: 3px;
  min-width: 0;
}

.metadata-row__indicators {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.chip--due {
  color: var(--color-chip-due-text);
  font-weight: 600;
}

.chip--overdue {
  color: var(--color-calendar-overdue-text);
  font-weight: 600;
}

.chip--warning {
  color: var(--color-warning);
}

.chip--project {
  font-weight: 500;
  color: var(--color-action);
}

.chip__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.6;
}

.chip__icon--warning {
  color: var(--color-warning);
  opacity: 1;
}

.chip__icon--scheduled {
  color: var(--color-calendar-scheduled-text);
  opacity: 1;
}

.chip__icon--tertiary {
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.chip__icon--due {
  color: var(--color-chip-due-icon);
  opacity: 1;
}

.chip__icon--overdue {
  color: var(--color-calendar-overdue-border);
  opacity: 1;
}

.chip__icon--start {
  color: var(--color-chip-start-icon);
  opacity: 1;
}

.chip__icon--project {
  color: var(--color-action);
  opacity: 1;
}

.chip__text {
  line-height: 1.2;
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

.chip__text--due {
  color: var(--color-chip-due-text);
}

.chip__text--overdue {
  color: var(--color-calendar-overdue-text);
}

.chip__text--start {
  color: var(--color-chip-start-text);
}

.chip__text--project {
  color: var(--color-action);
}

.tag-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  line-height: 1.2;
  color: var(--color-action);
  background: var(--color-bg-accent-light);
  border-radius: 9999px;
  white-space: nowrap;
}

.tag-chip--overflow {
  color: var(--color-text-tertiary);
  background: transparent;
  font-weight: 400;
  padding: 1px 2px;
}

.tag-chip--mobile {
  display: none;
}

@media (max-width: 480px) {
  .metadata-row__indicators .tag-chip:nth-child(n+3 of .tag-chip):not(.tag-chip--overflow) {
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
