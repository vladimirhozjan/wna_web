<template>
  <section class="section" id="gtd-lists" data-testid="landing-gtd-strip">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">Every GTD List, Built In</h2>
      <div class="strip">
        <div v-for="item in lists" :key="item.title" class="strip-item">
          <component :is="item.icon" class="strip-icon" />
          <span class="text-body-s fw-medium color-text-primary">{{ item.title }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import InboxIcon from '../../assets/InboxIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import WaitingIcon from '../../assets/WaitingIcon.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import CalendarIcon from '../../assets/CalendarIcon.vue'
import ReviewIcon from '../../assets/ReviewIcon.vue'
import FilterIcon from '../../assets/FilterIcon.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'

const lists = [
  { title: 'Inbox', icon: InboxIcon },
  { title: 'Next Actions', icon: NextIcon },
  { title: 'Projects', icon: ProjectsIcon },
  { title: 'Waiting For', icon: WaitingIcon },
  { title: 'Someday / Maybe', icon: SomedayIcon },
  { title: 'Calendar', icon: CalendarIcon },
  { title: 'Weekly Review', icon: ReviewIcon },
  { title: 'Context Tags', icon: FilterIcon },
  { title: 'Reference Files', icon: ReferenceIcon },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-subtle);
  text-align: center;
  scroll-margin-top: 64px;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 16px;
  margin-top: 36px;
}

.strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.strip-icon {
  width: 36px;
  height: 36px;
  color: var(--color-action);
  stroke-width: 1;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .strip {
    grid-template-columns: repeat(9, 1fr);
    gap: 12px;
  }
}
</style>
