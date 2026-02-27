<template>
  <Dropdown v-model="showMenu" title="Move to" align="right">
    <template #trigger>
      <button type="button" class="move-btn" title="Move to..." @click.stop>
        <MoveIcon class="move-icon" />
      </button>
    </template>

    <!-- Stuff (Inbox) destinations -->
    <template v-if="itemType === 'stuff'">
      <button class="dropdown-item" @click="onMove('action')">
        <NextIcon class="dropdown-item-icon" /> Next Actions
      </button>
      <button class="dropdown-item" @click="onMove('today')">
        <TodayIcon class="dropdown-item-icon" /> Today
      </button>
      <button class="dropdown-item" @click="onMove('calendar')">
        <CalendarIcon class="dropdown-item-icon" /> Calendar
      </button>
      <button class="dropdown-item" @click="onMove('waiting')">
        <WaitingIcon class="dropdown-item-icon" /> Waiting For
      </button>
      <button class="dropdown-item" @click="onMove('project')">
        <ProjectsIcon class="dropdown-item-icon" /> Projects
      </button>
      <button class="dropdown-item" @click="onMove('someday')">
        <SomedayIcon class="dropdown-item-icon" /> Someday
      </button>
      <button class="dropdown-item" @click="onMove('reference')">
        <ReferenceIcon class="dropdown-item-icon" /> Reference
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" @click="onMove('completed')">
        <CompletedIcon class="dropdown-item-icon" /> Completed
      </button>
      <button class="dropdown-item dropdown-item--danger" @click="onMove('trash')">
        <TrashIcon class="dropdown-item-icon" /> Trash
      </button>
    </template>

    <!-- Action destinations -->
    <template v-else-if="itemType === 'action'">
      <button v-if="currentState !== 'NEXT'" class="dropdown-item" @click="onMove('NEXT')">
        <NextIcon class="dropdown-item-icon" /> Next Actions
      </button>
      <button v-if="currentState !== 'TODAY'" class="dropdown-item" @click="onMove('TODAY')">
        <TodayIcon class="dropdown-item-icon" /> Today
      </button>
      <button v-if="currentState !== 'CALENDAR'" class="dropdown-item" @click="onMove('CALENDAR')">
        <CalendarIcon class="dropdown-item-icon" /> Calendar
      </button>
      <button v-if="currentState !== 'WAITING'" class="dropdown-item" @click="onMove('WAITING')">
        <WaitingIcon class="dropdown-item-icon" /> Waiting For
      </button>
      <button v-if="currentState !== 'SOMEDAY'" class="dropdown-item" @click="onMove('SOMEDAY')">
        <SomedayIcon class="dropdown-item-icon" /> Someday
      </button>
      <button class="dropdown-item" @click="onMove('PROJECT')">
        <ProjectsIcon class="dropdown-item-icon" /> Projects
      </button>
    </template>

    <!-- Project destinations -->
    <template v-else-if="itemType === 'project'">
      <button v-if="currentState !== 'SOMEDAY'" class="dropdown-item" @click="onMove('SOMEDAY')">
        <SomedayIcon class="dropdown-item-icon" /> Someday
      </button>
    </template>
  </Dropdown>
</template>

<script setup>
import { ref } from 'vue'
import Dropdown from './Dropdown.vue'
import MoveIcon from '../assets/MoveIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import TodayIcon from '../assets/TodayIcon.vue'
import WaitingIcon from '../assets/WaitingIcon.vue'
import CalendarIcon from '../assets/CalendarIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import ReferenceIcon from '../assets/ReferenceIcon.vue'
import CompletedIcon from '../assets/CompletedIcon.vue'
import TrashIcon from '../assets/TrashIcon.vue'

const props = defineProps({
  itemId: {
    type: [String, Number],
    required: true
  },
  itemType: {
    type: String,
    required: true,
    validator: v => ['stuff', 'action', 'project'].includes(v)
  },
  currentState: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['move'])

const showMenu = ref(false)

function onMove(destination) {
  showMenu.value = false
  emit('move', props.itemId, destination)
}
</script>

<style scoped>
.move-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.move-btn:hover {
  background: var(--color-bg-hover);
}

.move-icon {
  width: 18px;
  height: 18px;
  padding: 4px;
  box-sizing: border-box;
  color: var(--color-text-tertiary);
}

.move-btn:hover .move-icon {
  color: var(--color-action);
}

.dropdown-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--color-border-light);
}

.dropdown-item--danger {
  color: var(--color-danger);
}

.dropdown-item--danger:hover {
  background: var(--color-danger-bg);
}
</style>
