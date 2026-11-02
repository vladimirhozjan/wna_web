import { computed } from 'vue'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { themeModel } from '../models/themeModel.js'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, Filler,
)

const theme = themeModel()

// Chart theme colors (read from CSS vars at runtime)
function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Re-read on theme change so charts pick up the new palette
export const chartColors = computed(() => {
    theme.isDark.value
    return {
        action: getCssVar('--color-action') || '#6366f1',
        success: getCssVar('--color-success') || '#10b981',
        warning: getCssVar('--color-warning') || '#f59e0b',
        info: getCssVar('--color-info') || '#0284c7',
        border: getCssVar('--color-border-subtle') || '#e5e7eb',
        text: getCssVar('--color-text-tertiary') || '#9ca3af',
    }
})

export const baseOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 16, color: chartColors.value.text } },
    },
    scales: {
        x: { grid: { display: false }, ticks: { color: chartColors.value.text } },
        y: { beginAtZero: true, grid: { color: chartColors.value.border }, ticks: { color: chartColors.value.text } },
    },
}))
