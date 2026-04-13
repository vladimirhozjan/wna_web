<template>
  <section class="section" id="features">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">Your Trusted System, Organized</h2>
      <p class="text-body-m section-subtitle">Everything you need to stay organized — nothing you don't.</p>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="icon-wrap">
            <component :is="feature.icon" class="feature-icon" />
          </div>
          <h3 class="text-h3-italic card-title">{{ feature.title }}</h3>
          <p class="text-body-s card-desc">{{ feature.description }}</p>
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

const features = [
  {
    title: 'Inbox',
    description: 'Capture everything that has your attention. Get it out of your head and into your trusted system.',
    icon: InboxIcon,
  },
  {
    title: 'Next Actions',
    description: 'See the concrete physical steps you can take right now to move things forward.',
    icon: NextIcon,
  },
  {
    title: 'Projects',
    description: 'Track outcomes that require more than one action step to complete.',
    icon: ProjectsIcon,
  },
  {
    title: 'Waiting For',
    description: 'Keep track of everything you\'re waiting on from other people.',
    icon: WaitingIcon,
  },
  {
    title: 'Someday / Maybe',
    description: 'Park ideas and possibilities you might want to pursue in the future.',
    icon: SomedayIcon,
  },
  {
    title: 'Calendar',
    description: 'Your hard landscape — only for time-specific actions and commitments.',
    icon: CalendarIcon,
  },
  {
    title: 'Weekly Review',
    description: 'A guided weekly routine to keep your system current and your mind clear.',
    icon: ReviewIcon,
  },
  {
    title: 'Context Tags',
    description: 'Tag actions by context — @computer, @phone, @errands — and filter what to do now.',
    icon: FilterIcon,
  },
  {
    title: 'Reference Files',
    description: 'Store non-actionable materials you might need later. Always organized, always findable.',
    icon: ReferenceIcon,
  },
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

.section-subtitle {
  color: var(--color-text-secondary-light);
  margin-top: 12px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 36px;
}

.feature-card {
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: 32px var(--card-padding);
  background: var(--color-bg-primary);
  text-align: center;
  transition: box-shadow 0.2s;
}

.feature-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.feature-icon {
  width: 36px;
  height: 36px;
  color: var(--color-action);
  margin: 0 auto 16px;
  display: block;
  stroke-width: 1;
}

.card-title {
  margin-top: 24px;
  color: var(--color-text-primary-dark);
}

.card-desc {
  color: var(--color-text-secondary-light);
  margin-top: 24px;
}

@media (min-width: 520px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
