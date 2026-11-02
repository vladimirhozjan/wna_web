<template>
  <div :class="['tier', { 'tier--featured': featured }]">
    <span v-if="featured" class="text-body-s fw-semibold tier__badge">Most Popular</span>

    <h3 class="text-h4 tier__name">{{ name }}</h3>

    <div class="tier__price">
      <template v-if="price === 0">
        <span class="text-display">Free</span>
      </template>
      <template v-else>
        <span class="text-h2 tier__currency">€</span>
        <span class="text-display">{{ price }}</span>
        <span class="text-body-m tier__period">/{{ perUser ? 'user/' : '' }}{{ period === 'year' ? 'mo' : 'month' }}</span>
      </template>
    </div>

    <p class="text-footnote tier__footnote" :style="{ visibility: period === 'year' && price > 0 ? 'visible' : 'hidden' }">
      Billed annually at €{{ yearlyTotal || Math.round(price * 12) }}{{ perUser ? '/user' : '' }}
    </p>

    <p class="text-body-s tier__description">{{ description }}</p>

    <Btn
        :variant="featured ? 'primary' : 'ghost'"
        size="lg"
        class="tier__cta"
        :disabled="disabled"
        @click="$emit('cta-click')"
    >
      {{ ctaText }}
    </Btn>

    <div v-if="aiCredits !== null && aiRequests !== null" class="tier__ai" :data-testid="`pricing-ai-credits-${name.toLowerCase()}`">
      <AiIcon class="tier__ai-icon" />
      <div>
        <p class="text-body-s fw-semibold tier__ai-credits">
          {{ aiCredits.toLocaleString('en-US') }} AI credits a month{{ perUser ? ' per user' : '' }}
        </p>
        <p class="text-footnote tier__ai-requests">≈ {{ aiRequests.toLocaleString('en-US') }} requests</p>
      </div>
    </div>

    <ul class="tier__features">
      <li v-for="(feat, i) in features" :key="i" class="tier__feature text-body-s">
        <CheckIcon class="tier__check" />
        {{ feat }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import Btn from '../Btn.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import AiIcon from '../../assets/AiIcon.vue'

defineProps({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  period:      { type: String, default: 'month' },
  description: { type: String, default: '' },
  features:    { type: Array, default: () => [] },
  featured:    { type: Boolean, default: false },
  ctaText:     { type: String, default: 'Get Started' },
  perUser:     { type: Boolean, default: false },
  yearlyTotal: { type: Number, default: 0 },
  disabled:    { type: Boolean, default: false },
  aiCredits:   { type: Number, default: null },
  aiRequests:  { type: Number, default: null },
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
  color: var(--color-text-inverse);
  padding: 4px 16px;
  border-radius: 20px;
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
  color: var(--color-text-primary);
}

.tier__currency {
  color: var(--color-text-primary);
}

.tier__period {
  color: var(--color-text-secondary);
}

.tier__footnote {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 4px;
  min-height: 17px;
}

.tier__description {
  text-align: center;
  color: var(--color-text-secondary);
  margin-top: 12px;
  min-height: 51px;
}

.tier__cta {
  width: 100%;
  margin-top: 20px;
}

.tier__ai {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 20px;
}

.tier__ai-icon {
  width: 18px;
  height: 18px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-action);
}

.tier__ai-credits {
  color: var(--color-text-primary);
}

.tier__ai-requests {
  color: var(--color-text-secondary);
  margin-top: 2px;
}

@media (min-width: 769px) {
  .tier__ai {
    min-height: 50px;
  }
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
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
  color: var(--color-success);
}
</style>
