<template>
  <section class="section" id="features">
    <div class="section-inner">
      <h2 class="text-h1 color-text-primary">Your Trusted System, Organized</h2>
      <p class="text-body-m section-subtitle">Everything you need to implement GTD — nothing you don't.</p>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="icon-wrap">
            <svg :viewBox="feature.viewBox" xmlns="http://www.w3.org/2000/svg" class="feature-icon" v-html="feature.svg" />
          </div>
          <h3 class="text-h4">{{ feature.title }}</h3>
          <p class="text-body-s card-desc">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Each viewBox is cropped to the icon's content bounds + uniform padding
// so all icons render at the same visual weight
const features = [
  {
    title: 'Inbox',
    description: 'Capture everything that has your attention. Get it out of your head and into your trusted system.',
    viewBox: '11 11 26 26',
    svg: '<path fill="currentColor" d="M17 33C16.45 33 15.98 32.8 15.59 32.41C15.2 32.02 15 31.55 15 31V17C15 16.45 15.2 15.98 15.59 15.59C15.98 15.2 16.45 15 17 15H31C31.55 15 32.02 15.2 32.41 15.59C32.8 15.98 33 16.45 33 17V27L27 33H17ZM17 31H25V27C25 26.45 25.2 25.98 25.59 25.59C25.98 25.2 26.45 25 27 25H31V17H17V31ZM27 31L31 27H27V31Z"/>',
  },
  {
    title: 'Next Actions',
    description: 'See the concrete physical steps you can take right now to move things forward.',
    viewBox: '14 11 20 26',
    svg: '<g transform="translate(24,24) scale(0.55) translate(-32,-32)"><path fill="currentColor" d="M27 52L31 35H20L37 12L33 29H44L27 52Z"/></g>',
  },
  {
    title: 'Projects',
    description: 'Track outcomes that require more than one action step to complete.',
    viewBox: '10 12 28 24',
    svg: '<path fill="currentColor" d="M16 32C15.45 32 14.9792 31.8042 14.5875 31.4125C14.1958 31.0208 14 30.55 14 30V18C14 17.45 14.1958 16.9792 14.5875 16.5875C14.9792 16.1958 15.45 16 16 16H22L24 18H32C32.55 18 33.0208 18.1958 33.4125 18.5875C33.8042 18.9792 34 19.45 34 20V30C34 30.55 33.8042 31.0208 33.4125 31.4125C33.0208 31.8042 32.55 32 32 32H16ZM16 30H32V20H23.175L21.175 18H16V30Z"/>',
  },
  {
    title: 'Waiting For',
    description: 'Keep track of everything you\'re waiting on from other people.',
    viewBox: '8 0 32 48',
    svg: '<path fill="currentColor" d="M12 4v12h.02L12 16.02 20 24l-8 8 .02.02H12V44h24V32.02h-.02L36 32l-8-8 8-7.98-.02-.02H36V4H12zm20 29V40H16v-7l8-8 8 8zm-8-10l-8-8V8h16v7l-8 8z"/>',
  },
  {
    title: 'Someday / Maybe',
    description: 'Park ideas and possibilities you might want to pursue in the future.',
    viewBox: '9 11 32 26',
    svg: '<path fill="currentColor" d="M19.5 33C17.85 33 16.44 32.41 15.27 31.24C14.1 30.07 13.5 28.65 13.5 27C13.5 25.55 13.96 24.27 14.87 23.15C15.78 22.03 16.95 21.35 18.35 21.1C18.85 19.35 19.83 17.94 21.29 16.86C22.75 15.79 24.38 15.25 26.2 15.25C28.45 15.25 30.35 16.05 31.9 17.6C33.45 19.15 34.25 21.05 34.25 23.3V24C35.6 24.05 36.73 24.53 37.63 25.43C38.53 26.33 39 27.45 39 28.8C39 30 38.53 31.04 37.6 31.9C36.67 32.77 35.55 33.2 34.25 33.2L19.5 33ZM19.5 31H34.25C34.95 31 35.54 30.76 36.03 30.27C36.51 29.79 36.75 29.2 36.75 28.5C36.75 27.8 36.51 27.21 36.03 26.73C35.54 26.24 34.95 26 34.25 26H32V23.3C32 21.7 31.44 20.33 30.33 19.2C29.22 18.07 27.85 17.5 26.2 17.5C24.55 17.5 23.17 18.07 22.05 19.2C20.93 20.33 20.37 21.7 20.37 23.3H19.5C18.45 23.3 17.56 23.67 16.84 24.39C16.11 25.11 15.75 26 15.75 27C15.75 28.05 16.11 28.94 16.84 29.66C17.56 30.39 18.45 30.75 19.5 30.75Z"/>',
  },
  {
    title: 'Calendar',
    description: 'Your hard landscape — only for time-specific actions and commitments.',
    viewBox: '11 10 26 28',
    svg: '<path fill="currentColor" d="M17 34c-.55 0-1.02-.2-1.41-.59C15.2 33.02 15 32.55 15 32V18c0-.55.2-1.02.59-1.41C15.98 16.2 16.45 16 17 16h1v-2h2v2h8v-2h2v2h1c.55 0 1.02.2 1.41.59.39.39.59.86.59 1.41v14c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H17Zm0-2h14V22H17v10Z"/>',
  },
  {
    title: 'Weekly Review',
    description: 'A guided weekly routine to keep your system current and your mind clear.',
    viewBox: '11 8 26 34',
    svg: '<path fill="currentColor" d="M19 34h10v-2H19v2Zm0-4h10v-2H19v2Zm-2 8c-.55 0-1.02-.2-1.41-.59C15.2 37.02 15 36.55 15 36V16c0-.55.2-1.02.59-1.41C15.98 14.2 16.45 14 17 14h4.18c.17-.58.5-1.06 1-1.44.5-.38 1.07-.56 1.72-.56h.2c.65 0 1.22.18 1.72.56.5.38.83.86 1 1.44H31c.55 0 1.02.2 1.41.59.39.39.59.86.59 1.41v20c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H17Zm0-2h14V16h-2v2H19v-2h-2v20Zm4-18h6v-2h-6v2Z"/>',
  },
  {
    title: 'Context Tags',
    description: 'Tag actions by context — @computer, @phone, @errands — and filter by what you can do right now.',
    viewBox: '-1 1 22 18',
    svg: '<rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor"/><rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor"/><rect x="7" y="14" width="6" height="2" rx="1" fill="currentColor"/>',
  },
  {
    title: 'Reference Files',
    description: 'Store non-actionable materials you might need later. Always organized, always findable.',
    viewBox: '13 10 22 28',
    svg: '<path fill="currentColor" d="M17 35V16C17 15.45 17.2 14.98 17.59 14.59C17.98 14.2 18.45 14 19 14H29C29.55 14 30.02 14.2 30.41 14.59C30.8 14.98 31 15.45 31 16V35L24 31.5L17 35ZM19 31.85L24 29.35L29 31.85V16H19V31.85Z"/>',
  },
]
</script>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-accent-light);
  text-align: center;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.section-subtitle {
  color: var(--color-text-secondary);
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
  padding: var(--card-padding);
  background: var(--color-bg-primary);
  text-align: left;
  transition: box-shadow 0.2s;
}

.feature-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(65, 133, 222, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.feature-icon {
  width: 28px;
  height: 28px;
  color: var(--color-action);
}

.card-desc {
  color: var(--color-text-secondary);
  margin-top: 6px;
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
