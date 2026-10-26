<template>
  <div class="capture-chips">
    <div
        v-for="chip in chips"
        :key="chip.id"
        class="capture-chip"
        :class="{ 'capture-chip--red': errors[chip.id], 'capture-chip--locked': locked }"
        data-testid="capture-chip"
    >
      <div class="capture-chip__body">
        <template v-if="chip.kind === 'voice'">
          <Btn variant="icon" size="sm" class="capture-chip__play" :aria-label="playingId === chip.id ? 'Stop' : 'Play'" @mousedown.prevent @click="emit('toggle-play', chip)">
            <StopIcon v-if="playingId === chip.id" class="capture-chip__play-icon" />
            <TriangleRightIcon v-else class="capture-chip__play-icon" />
          </Btn>
          <span class="text-body-s capture-chip__name">Voice memo · {{ formatDuration(chip.duration) }}</span>
        </template>
        <template v-else>
          <img
              v-if="chip.kind === 'photo' && chip.url && !chip.thumbFailed"
              :src="chip.url"
              :alt="chip.file.name"
              class="capture-chip__thumb"
              @error="chip.thumbFailed = true"
          />
          <RefFileIcon v-else :mime-type="chip.file.type" class="capture-chip__icon" />
          <span class="text-body-s capture-chip__name">{{ chip.file.name }}</span>
        </template>
        <template v-if="!locked">
          <Spinner v-if="saving && !errors[chip.id]" :size="14" />
          <ActionBtn v-else variant="default" class="capture-chip__remove" @mousedown.prevent @click="emit('remove', chip)" />
        </template>
      </div>
      <span v-if="errors[chip.id]" class="text-footnote capture-chip__reason">{{ errors[chip.id] }}</span>
    </div>

    <div v-if="pasted" class="capture-chip" data-testid="capture-chip-pasted">
      <div class="capture-chip__body">
        <DescriptionIcon class="capture-chip__icon" />
        <span class="text-body-s capture-chip__name">Pasted text — goes to the description</span>
        <Spinner v-if="saving" :size="14" />
        <ActionBtn v-else variant="default" class="capture-chip__remove" @mousedown.prevent @click="emit('remove-pasted')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Btn from './Btn.vue'
import ActionBtn from './ActionBtn.vue'
import Spinner from './Spinner.vue'
import RefFileIcon from './reference/RefFileIcon.vue'
import StopIcon from '../assets/StopIcon.vue'
import TriangleRightIcon from '../assets/TriangleRightIcon.vue'
import DescriptionIcon from '../assets/DescriptionIcon.vue'
import { formatDuration } from '../scripts/core/captureRules.js'

defineProps({
  chips: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  // Free: shown in the attach menu's disabled look, never removable or sent
  locked: { type: Boolean, default: false },
  pasted: { type: Boolean, default: false },
  playingId: { type: Number, default: null },
})

const emit = defineEmits(['remove', 'remove-pasted', 'toggle-play'])
</script>

<style scoped>
.capture-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.capture-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
  padding: 4px 4px 4px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  box-sizing: border-box;
}

.capture-chip--red {
  background: var(--color-danger-light);
}

.capture-chip__body {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.capture-chip__thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

/* RefFileIcon colours by type inline; capture chips keep one neutral tone */
.capture-chip__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-text-tertiary) !important;
}

.capture-chip__name {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.capture-chip--locked .capture-chip__name {
  color: var(--color-text-tertiary);
}

.capture-chip__play-icon {
  width: 14px;
  height: 14px;
}

.capture-chip__remove {
  position: relative;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.capture-chip__reason {
  color: var(--color-danger);
}
@media (max-width: 768px) {
  .capture-chip__remove::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    transform: translate(-50%, -50%);
  }
}
</style>
