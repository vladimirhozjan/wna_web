<template>
  <div :class="['tier', { 'tier--featured': featured }]">
    <span v-if="featured" class="tier__badge text-body-s">Most Popular</span>

    <h3 class="text-h4 tier__name">{{ name }}</h3>

    <div class="tier__price">
      <template v-if="price === 0">
        <span class="text-display">Free</span>
      </template>
      <template v-else>
        <span class="tier__currency">€</span>
        <span class="text-display">{{ price }}</span>
        <span class="tier__period">/{{ period === 'year' ? 'mo' : 'month' }}</span>
      </template>
    </div>

    <p v-if="period === 'year' && price > 0" class="text-footnote tier__footnote">
      Billed annually at €{{ price * 12 }}
    </p>

    <p class="text-body-s tier__description">{{ description }}</p>

    <Btn
        :variant="featured ? 'primary' : 'ghost'"
        size="lg"
        class="tier__cta"
        @click="$emit('cta-click')"
    >
      {{ ctaText }}
    </Btn>

    <ul class="tier__features">
      <li v-for="(feat, i) in features" :key="i" class="tier__feature text-body-s">
        <svg class="tier__check" viewBox="0 0 20 20" fill="none">
          <path d="M4 10.5l4 4 8-8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ feat }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import Btn from '../Btn.vue'

defineProps({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  period:      { type: String, default: 'month' },
  description: { type: String, default: '' },
  features:    { type: Array, default: () => [] },
  featured:    { type: Boolean, default: false },
  ctaText:     { type: String, default: 'Get Started' },
})

defineEmits(['cta-click'])
</script>

<style scoped>
.tier {
  position: relative;
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: 32px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.tier--featured {
  border: 2px solid var(--color-action);
  box-shadow: 0 4px 24px rgba(65, 133, 222, 0.15);
}

.tier__badge {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-action);
  color: #ffffff;
  padding: 4px 16px;
  border-radius: 20px;
  font-weight: 600;
  white-space: nowrap;
}

.tier__name {
  color: var(--color-text-primary);
  text-align: center;
}

.tier__price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-top: 16px;
}

.tier__price .text-display {
  font-size: var(--font-size-display);
  line-height: var(--lh-display);
  font-weight: 700;
  color: var(--color-text-primary);
}

.tier__currency {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
}

.tier__period {
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
}

.tier__footnote {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.tier__description {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.tier__cta {
  width: 100%;
  margin-top: 20px;
}

.tier__features {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
  border-top: 1px solid var(--color-border-light);
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tier__feature {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
}

.tier__check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--color-success);
}
</style>
