import { computed, shallowReactive, onMounted, onUnmounted } from 'vue'
import { format, parseISO, isSameMonth, isSameYear } from 'date-fns'
import router from '../../router/router.js'
import { contextModel } from './contextModel.js'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import EngageIcon from '../../assets/EngageIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import TodayIcon from '../../assets/TodayIcon.vue'
import WaitingIcon from '../../assets/WaitingIcon.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import InboxIcon from '../../assets/InboxIcon.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import ReviewIcon from '../../assets/ReviewIcon.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'
import CompletedIcon from '../../assets/CompletedIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'
import HorizonIcon from '../../assets/HorizonIcon.vue'
import ConnectionsIcon from '../../assets/ConnectionsIcon.vue'
import SearchIcon from '../../assets/SearchIcon.vue'
import CalendarIcon from '../../assets/CalendarIcon.vue'

// contracts/limits.md §AI assistant — place caps
const TAGS_MAX = 20
const TEXT_MAX = 500

// Route name → the page's h1 and sidebar icon; a route not listed sends no place
const LIST_PAGES = {
    'engage': ['Engage', EngageIcon],
    'next': ['Next', NextIcon],
    'today': ['Today', TodayIcon],
    'waiting-for': ['Waiting For', WaitingIcon],
    'someday': ['Someday / Maybe', SomedayIcon],
    'projects': ['Projects', ProjectsIcon],
    'inbox': ['Inbox', InboxIcon],
    'overdue': ['Overdue', WarningIcon],
    'review': ['Weekly Review', ReviewIcon],
    'reference': ['Reference', ReferenceIcon],
    'completed': ['Completed', CompletedIcon],
    'trash': ['Trash', TrashIcon],
    'horizons': ['Horizons', HorizonIcon],
    'connections': ['Connections', ConnectionsIcon],
    'project-templates': ['Project templates', ProjectsIcon],
    'search': ['Search', SearchIcon],
    'calendar': ['Calendar', CalendarIcon],
}

// Item type → its name while the item loads and its ItemTypeIcon type
const ITEM_TYPES = {
    action: ['Action', 'ACTION'],
    stuff: ['Inbox item', 'STUFF'],
    project: ['Project', 'PROJECT'],
    recurring: ['Recurring action', 'RECURRING'],
    project_template: ['Project template', 'PROJECT'],
}
const ITEM_PAGES = new Set(['action-detail', 'stuff-detail', 'recurring-detail', 'project-detail', 'project-template-detail', 'project-canvas'])

const clip = (s, max) => [...s].slice(0, max).join('')

function calendarLabel({ view, start, end }) {
    if (view === 'recurring') return 'Recurring actions'
    const s = parseISO(start)
    const e = parseISO(end)
    if (view === 'day') return format(s, isSameYear(s, new Date()) ? 'EEEE, MMMM d' : 'EEEE, MMMM d, yyyy')
    if (view === 'week') return isSameMonth(s, e) ? `${format(s, 'MMM d')} – ${format(e, 'd')}` : `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`
    if (view === 'month') return format(s, 'MMMM yyyy')
    return format(s, 'yyyy')
}

let instance = null

export function assistantPlace() {
    if (instance) return instance

    const { activeTag } = contextModel()
    const parts = shallowReactive([])

    const place = computed(() => {
        const page = router.currentRoute.value.name
        if (!LIST_PAGES[page] && !ITEM_PAGES.has(page)) return null
        const part = Object.assign({}, ...parts.filter(p => p.page === page).map(p => p.getter() || {}))
        if (part.hidden) return null

        const out = { page }
        if (part.item) {
            out.item = { type: part.item.type, id: part.item.id }
            if (part.item.title) out.item.title = clip(part.item.title, TEXT_MAX)
        }
        if (part.tags) {
            const tags = [...new Set([activeTag.value, ...part.tags].filter(Boolean))].slice(0, TAGS_MAX)
            if (tags.length) out.tags = tags
        }
        if (part.calendar) out.calendar = { ...part.calendar }
        if (part.query) out.query = clip(part.query, TEXT_MAX)
        if (part.idea) out.idea = { id: part.idea.id, text: clip(part.idea.text || '', TEXT_MAX) }
        return out
    })

    const label = computed(() => {
        const p = place.value
        if (!p) return ''
        if (p.item) {
            const name = p.item.title ? `"${p.item.title}"` : ITEM_TYPES[p.item.type][0]
            return p.page === 'project-canvas' ? `${name} · Brainstorm` : name
        }
        const name = LIST_PAGES[p.page][0]
        if (p.tags) return `${name} · ${p.tags.join(', ')}`
        if (p.query) return `${name} · "${p.query}"`
        if (p.calendar) return `${name} · ${calendarLabel(p.calendar)}`
        return name
    })

    const icon = computed(() => {
        const p = place.value
        if (!p) return null
        if (p.item) return { is: ItemTypeIcon, props: { type: ITEM_TYPES[p.item.type][1] } }
        return { is: LIST_PAGES[p.page][1], props: {} }
    })

    instance = { place, label, icon, parts }
    return instance
}

// A page hands its part of the place: { item } · { tags } · { calendar } · { query } · { idea } · { hidden: true }
export function usePlacePart(getter) {
    const { parts } = assistantPlace()
    const entry = { getter, page: null }
    onMounted(() => {
        entry.page = router.currentRoute.value.name
        parts.push(entry)
    })
    onUnmounted(() => {
        const i = parts.indexOf(entry)
        if (i >= 0) parts.splice(i, 1)
    })
}
