import { onMounted, onBeforeUnmount } from 'vue'
import router from '../../router/router.js'
import * as apiClient from './apiClient.js'
import { errorModel } from './errorModel.js'
import { statsModel } from '../models/statsModel.js'

const DETAIL_ROUTES = ['stuff-detail', 'action-detail', 'project-detail']
const ACTION_LISTS = ['NEXT', 'TODAY', 'CALENDAR', 'WAITING', 'SOMEDAY']
const LIST_LABELS = {
    INBOX: 'Inbox',
    NEXT: 'Next Actions',
    TODAY: 'Today',
    CALENDAR: 'Calendar',
    WAITING: 'Waiting For',
    SOMEDAY: 'Someday',
    ACTIVE: 'Projects',
}

let instance = null

export function undoModel() {
    if (instance) return instance

    const toaster = errorModel()
    let current = null
    let refreshPage = null

    // A detail op navigates away right after recording; remember where it left the user (DS7)
    router.afterEach((to) => {
        if (current?.returnTo && current.landedPath === null) current.landedPath = to.fullPath
    })

    // Call from a page's setup with the function that reloads what it shows
    function registerRefresh(fn) {
        onMounted(() => { refreshPage = fn })
        onBeforeUnmount(() => {
            if (refreshPage === fn) refreshPage = null
        })
    }

    function isUndoable({ op, item, to }) {
        // The server refuses uncomplete / restore / moves for a read-only member
        if (item.my_role === 'read_only') return false
        if (op !== 'move') {
            // D8: a recurring template's active instance respawns at once
            return !(item.recurring_parent_id && item.state !== 'COMPLETED')
        }
        if (item.type !== 'ACTION') return true
        if (!ACTION_LISTS.includes(item.state) || !ACTION_LISTS.includes(to)) return false
        // DS12 delegated to a connection, DS20 legacy shared Someday row
        if (item.state === 'WAITING' && item.waiting_for_user_id) return false
        return !(item.state === 'SOMEDAY' && item.project_shared)
    }

    // op: 'complete' | 'trash' | 'move'; item: the row / detail JSON before the op; to: the move's target state
    function record({ op, item, title, message, to = null, reorder = true }) {
        const entry = { op, item: { ...item }, title, to, reorder, returnTo: null, landedPath: null }
        if (!isUndoable(entry)) {
            toaster.success(message)
            return
        }
        const route = router.currentRoute.value
        if (DETAIL_ROUTES.includes(route.name) && route.params.id === item.id) {
            entry.returnTo = { name: route.name, params: { ...route.params }, query: { ...route.query } }
        }
        current = entry
        toaster.undoable(message, () => run(entry))
    }

    async function run(entry) {
        try {
            await inverse(entry)
        } catch (err) {
            if (!err?.upgrade) toaster.push(err?.fromServer ? err.message : failedCopy(entry))
            return
        }

        let restored = true
        try {
            await restore(entry)
        } catch {
            restored = false
        }

        if (restored) {
            toaster.success(`"${entry.title}" moved back`)
        } else {
            toaster.push(`"${entry.title}" is back, but its dates or waiting details didn't come back. Open it to set them again.`)
        }
        statsModel().refreshStats()

        if (entry.returnTo && entry.landedPath === router.currentRoute.value.fullPath) {
            await router.replace(entry.returnTo).catch(() => {})
        }
        if (refreshPage) Promise.resolve(refreshPage()).catch(() => {})
    }

    function failedCopy({ op, title, to }) {
        if (op === 'complete') return `Couldn't undo "${title}". Find it in Completed to restore it.`
        if (op === 'trash') return `Couldn't undo "${title}". Find it in Trash to restore it.`
        return `Couldn't undo "${title}". Open ${LIST_LABELS[to]} to move it back.`
    }

    // The one call that takes the op back; its failure leaves the item where the op put it
    function inverse({ op, item, to }) {
        const id = item.id
        if (item.type === 'STUFF') {
            if (op === 'complete') return apiClient.uncompleteStuff(id)
            if (op === 'trash') return apiClient.restoreStuff(id)
            return to === 'SOMEDAY' ? apiClient.activateStuff(id) : apiClient.clarifyToSomeday(id)
        }
        if (item.type === 'PROJECT') {
            if (op === 'complete') return apiClient.uncompleteProject(id)
            if (op === 'trash') return apiClient.restoreProject(id)
            return to === 'SOMEDAY' ? apiClient.activateProject(id) : apiClient.somedayProject(id)
        }
        if (op === 'complete') return apiClient.uncompleteAction(id)
        if (op === 'trash') return apiClient.restoreAction(id)
        return to === 'SOMEDAY' ? apiClient.activateAction(id) : toState(item, to)
    }

    // Back into the old list with the fields the op cleared; throws on a field failure (DS6)
    async function restore(entry) {
        const { op, item, to } = entry
        const id = item.id

        if (item.type === 'STUFF') {
            if (op !== 'move' && item.state === 'SOMEDAY') await apiClient.clarifyToSomeday(id)
            if (op !== 'move' && item.state === 'COMPLETED') return apiClient.completeStuff(id)
            return reorder(entry)
        }

        if (item.type === 'PROJECT') {
            if (op !== 'move' && item.state === 'SOMEDAY') await apiClient.somedayProject(id)
            if (op !== 'move' && item.state === 'COMPLETED') return apiClient.completeProject(id)
            return reorder(entry)
        }

        // DS11: restore puts a standalone action back in COMPLETED itself, a project action in its project
        if (op !== 'move' && item.state === 'COMPLETED') {
            if (item.project_id) await apiClient.completeAction(id)
            return
        }
        // DS19: the server places shared rows
        if (item.project_shared && op !== 'move') return
        if (op !== 'move' && item.backlog_position > 0) {
            await apiClient.moveProjectAction(id, item.backlog_position).catch(() => {})
            return
        }

        // D7 / DS15: re-promote the project's active action, then back to its own list
        const repromote = !item.project_shared && item.backlog_position === 0 && (op !== 'move' || to === 'SOMEDAY')
        // Where the inverse left it: activate lands in NEXT, every other inverse in the old list
        let state = op === 'move' && to === 'SOMEDAY' ? 'NEXT' : item.state
        if (repromote) {
            await apiClient.moveProjectAction(id, 0)
            state = 'NEXT'
        }
        const rewait = item.state === 'WAITING' && (state !== 'WAITING' || op === 'move')
        if (state !== item.state) await toState(item, state)
        if (rewait) await apiClient.updateAction(id, { title: item.title, waiting_since: item.waiting_since })
        if (op === 'move' && to === 'CALENDAR' && item.due_date) await apiClient.setDueDate(id, item.due_date, item.due_time || null)
        if (!item.project_shared) await reorder(entry)
    }

    // One state call from `from` back into the item's own list
    function toState(item, from) {
        const id = item.id
        switch (item.state) {
            case 'NEXT':
                if (from === 'WAITING') return apiClient.unwaitAction(id)
                if (from === 'SOMEDAY') return apiClient.activateAction(id)
                return apiClient.undeferAction(id)
            case 'TODAY':
                return apiClient.todayAction(id)
            case 'CALENDAR':
                return item.scheduled_date
                    ? apiClient.deferAction(id, 'scheduled', item.scheduled_date, item.scheduled_time || null, item.scheduled_duration || null)
                    : apiClient.deferAction(id, 'start', item.start_date, item.start_time || null)
            case 'WAITING':
                return apiClient.waitAction(id, item.waiting_for)
            case 'SOMEDAY':
                return apiClient.somedayAction(id)
        }
    }

    // Position-only: a failure here is silent (DS6)
    async function reorder({ item, reorder: allowed }) {
        const { id, position } = item
        if (!allowed || typeof position !== 'number') return
        // DS17: Today scheduled / due rows carry a Today position, not their own list's
        if (item.source && item.source !== 'manual') return
        let move = null
        if (item.type === 'STUFF') move = item.state === 'SOMEDAY' ? apiClient.moveSomeday : apiClient.moveStuff
        else if (item.state === 'SOMEDAY') move = apiClient.moveSomeday
        else if (item.type === 'PROJECT') move = item.state === 'ACTIVE' ? apiClient.moveProject : null
        else if (item.state === 'NEXT' || item.state === 'CALENDAR') move = apiClient.moveAction
        else if (item.state === 'WAITING') move = apiClient.moveWaitingPosition
        else if (item.state === 'TODAY' && item.source === 'manual') move = apiClient.moveTodayAction
        if (move) await move(id, position).catch(() => {})
    }

    instance = { record, registerRefresh }
    return instance
}
