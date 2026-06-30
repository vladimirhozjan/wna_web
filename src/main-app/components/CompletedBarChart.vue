<template>
  <div class="completed-chart">
    <div class="text-body-s fw-semibold completed-chart__title">{{ title }}</div>
    <div class="completed-chart__container" role="img" :aria-label="ariaLabel">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <!-- Off-screen data table: screen-reader text alternative for the bars. -->
    <table class="completed-chart__sr">
      <caption>{{ ariaLabel }}</caption>
      <thead><tr><th>Period</th><th>Completed</th></tr></thead>
      <tbody>
        <tr v-for="(label, i) in labels" :key="label + i">
          <th scope="row">{{ label }}</th>
          <td>{{ data[i] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Colours read from existing tokens at runtime so they track the active light/dark theme.
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps({
  title: { type: String, required: true },
  labels: { type: Array, required: true },
  data: { type: Array, required: true },
  // Index of the current period's bar (today / this week / this month) — highlighted.
  highlightIndex: { type: Number, default: -1 },
  // Index of the best day (week chart only); -1 when suppressed (all zero) or N/A.
  bestDayIndex: { type: Number, default: -1 },
  ariaLabel: { type: String, required: true },
})

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function chartColors() {
  return {
    base: getCssVar('--color-success') || '#16a34a',     // positive "productivity" bars
    current: getCssVar('--color-action') || '#6366f1',   // current period highlight
    best: getCssVar('--color-warning') || '#d97706',     // best-day marker
    border: getCssVar('--color-border-subtle') || '#f3f4f6',
    text: getCssVar('--color-text-tertiary') || '#90a4af',
  }
}

const barColors = computed(() => {
  const c = chartColors()
  return props.data.map((_, i) => {
    if (i === props.highlightIndex) return c.current
    if (i === props.bestDayIndex) return c.best
    return c.base
  })
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    label: 'Completed',
    data: props.data,
    backgroundColor: barColors.value,
    borderRadius: 4,
    maxBarThickness: 48,
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.parsed.y} completed`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: () => chartColors().text } },
    y: {
      beginAtZero: true,
      grid: { color: () => chartColors().border },
      ticks: { precision: 0, color: () => chartColors().text },
    },
  },
}))
</script>

<style scoped>
.completed-chart {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.completed-chart__title {
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-align: center;
}

.completed-chart__container {
  position: relative;
  height: 180px;
}

/* Visually hidden, still read by screen readers. */
.completed-chart__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
