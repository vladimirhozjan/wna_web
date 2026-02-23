import { reactive } from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'

export const ClarifyState = {
    IDLE: 'IDLE',
    START: 'START',
    ACTIONABLE_DECISION: 'ACTIONABLE_DECISION',
    NON_ACTIONABLE_TARGET: 'NON_ACTIONABLE_TARGET',
    ACTION_COUNT_DECISION: 'ACTION_COUNT_DECISION',
    CREATE_ACTION: 'CREATE_ACTION',
    CREATE_PROJECT: 'CREATE_PROJECT',
    DO_IT_NOW: 'DO_IT_NOW',
    DONE: 'DONE',
}

export const NonActionableTarget = {
    REFERENCE: 'REFERENCE',
    SOMEDAY: 'SOMEDAY',
    TRASH: 'TRASH',
}

let instance = null

export function clarifyModel() {
    if (instance) return instance

    const state = reactive({
        step: ClarifyState.IDLE,
        stuffItem: null,
        mode: 'inline', // 'inline' | 'modal' | 'fullscreen'

        // Decision tracking
        isActionable: null,
        nonActionableTarget: null,
        isSingleAction: null,

        // Form data
        actionData: {
            title: '',
            description: '',
            tags: [],
            deferType: null,
            deferDate: null,
            deferTime: null,
            deferDuration: null,
            dueDate: null,
            dueTime: null,
        },
        projectData: {
            title: '',
            outcome: '',
            nextActionTitle: '',
            description: '',
            tags: [],
        },

        // UI state
        loading: false,
        error: null,
    })

    function getProgress() {
        if (state.step === ClarifyState.DONE) return 100
        if (state.step === ClarifyState.DO_IT_NOW) return 100
        if (state.isActionable === false) {
            // Non-actionable: 2 steps
            if (state.step === ClarifyState.ACTIONABLE_DECISION) return 50
            return 100
        }
        // Actionable: 3 steps
        if (state.step === ClarifyState.ACTIONABLE_DECISION) return 33
        if (state.step === ClarifyState.ACTION_COUNT_DECISION) return 66
        if (state.step === ClarifyState.CREATE_ACTION || state.step === ClarifyState.CREATE_PROJECT) return 100
        return 0
    }

    function reset() {
        state.step = ClarifyState.IDLE
        state.stuffItem = null
        state.isActionable = null
        state.nonActionableTarget = null
        state.isSingleAction = null
        state.actionData = {
            title: '',
            description: '',
            tags: [],
            deferType: null,
            deferDate: null,
            deferTime: null,
            deferDuration: null,
            dueDate: null,
            dueTime: null,
        }
        state.projectData = {
            title: '',
            outcome: '',
            nextActionTitle: '',
            description: '',
            tags: [],
        }
        state.loading = false
        state.error = null
    }

    function start(stuffItem, mode = 'inline') {
        reset()
        state.stuffItem = stuffItem
        state.mode = mode
        state.step = ClarifyState.ACTIONABLE_DECISION

        // Pre-fill form data from stuff item
        state.actionData.title = stuffItem.title || ''
        state.actionData.description = stuffItem.description || ''
        state.projectData.title = stuffItem.title || ''
        state.projectData.description = stuffItem.description || ''
    }

    function setActionable(isActionable) {
        state.isActionable = isActionable
        if (isActionable) {
            state.step = ClarifyState.ACTION_COUNT_DECISION
        } else {
            state.step = ClarifyState.NON_ACTIONABLE_TARGET
        }
    }

    function setNonActionableTarget(target) {
        state.nonActionableTarget = target
    }

    function setSingleAction(isSingle) {
        state.isSingleAction = isSingle
        if (isSingle) {
            state.step = ClarifyState.CREATE_ACTION
        } else {
            state.step = ClarifyState.CREATE_PROJECT
        }
    }

    function setActionData(data) {
        Object.assign(state.actionData, data)
    }

    function setProjectData(data) {
        Object.assign(state.projectData, data)
    }

    function proceedToDoItNow() {
        state.step = ClarifyState.DO_IT_NOW
    }

    function back() {
        switch (state.step) {
            case ClarifyState.NON_ACTIONABLE_TARGET:
                state.step = ClarifyState.ACTIONABLE_DECISION
                state.nonActionableTarget = null
                break
            case ClarifyState.ACTION_COUNT_DECISION:
                state.step = ClarifyState.ACTIONABLE_DECISION
                state.isActionable = null
                break
            case ClarifyState.CREATE_ACTION:
                state.step = ClarifyState.ACTION_COUNT_DECISION
                state.isSingleAction = null
                break
            case ClarifyState.CREATE_PROJECT:
                state.step = ClarifyState.ACTION_COUNT_DECISION
                state.isSingleAction = null
                break
            case ClarifyState.DO_IT_NOW:
                state.step = ClarifyState.CREATE_ACTION
                break
            default:
                break
        }
    }

    async function confirm() {
        state.loading = true
        state.error = null

        try {
            const stuffId = state.stuffItem?.id

            if (!state.isActionable) {
                // Non-actionable path
                switch (state.nonActionableTarget) {
                    case NonActionableTarget.REFERENCE:
                        await apiClient.clarifyToReference(stuffId)
                        break
                    case NonActionableTarget.SOMEDAY:
                        await apiClient.clarifyToSomeday(stuffId)
                        break
                    case NonActionableTarget.TRASH:
                        await apiClient.clarifyToTrash(stuffId)
                        break
                }
            } else if (state.isSingleAction) {
                // Create action
                await apiClient.clarifyToAction(stuffId, state.actionData)
            } else {
                // Create project
                await apiClient.clarifyToProject(stuffId, state.projectData)
            }

            state.step = ClarifyState.DONE
            statsModel().refreshStats()
            return true
        } catch (err) {
            state.error = err.message || 'Failed to process item'
            return false
        } finally {
            state.loading = false
        }
    }

    async function doItNow() {
        state.loading = true
        state.error = null

        try {
            const stuffId = state.stuffItem?.id
            await apiClient.completeStuff(stuffId)
            state.step = ClarifyState.DONE
            statsModel().refreshStats()
            return true
        } catch (err) {
            state.error = err.message || 'Failed to complete item'
            return false
        } finally {
            state.loading = false
        }
    }

    function cancel() {
        reset()
    }

    function getConfirmSummary() {
        if (!state.isActionable) {
            switch (state.nonActionableTarget) {
                case NonActionableTarget.REFERENCE:
                    return {
                        action: 'Move to Reference',
                        description: 'This item will be saved as reference material.',
                    }
                case NonActionableTarget.SOMEDAY:
                    return {
                        action: 'Move to Someday',
                        description: 'This item will be saved for future consideration.',
                    }
                case NonActionableTarget.TRASH:
                    return {
                        action: 'Move to Trash',
                        description: 'This item will be moved to trash.',
                    }
            }
        } else if (state.isSingleAction) {
            return {
                action: 'Create Action',
                description: `Create action: "${state.actionData.title}"`,
                details: state.actionData,
            }
        } else {
            return {
                action: 'Create Project',
                description: `Create project: "${state.projectData.title}" with next action: "${state.projectData.nextActionTitle}"`,
                details: state.projectData,
            }
        }
        return { action: 'Unknown', description: '' }
    }

    instance = {
        state,
        getProgress,
        start,
        setActionable,
        setNonActionableTarget,
        setSingleAction,
        setActionData,
        setProjectData,
        proceedToDoItNow,
        back,
        confirm,
        doItNow,
        cancel,
        reset,
        getConfirmSummary,
    }

    return instance
}
