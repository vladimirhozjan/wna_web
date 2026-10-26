import { reactive } from 'vue';
import { offlineModel } from './offlineModel.js';

const UNDO_MS = 6000;
export const SUCCESS_TOAST_MS = 3000;

let instance = null;

export function errorModel() {
    if (instance) return instance;

    const state = reactive({
        errors: []   // { id, message, type, undo?, undoing? }
    });

    let nextId = 1;
    const timers = new Map();

    function push(message, type = 'error', { keepOffline = false } = {}) {
        // BUG-066 — offline content on screen already shows the failure
        if (type === 'error' && !keepOffline && offlineModel().offlineContentShown.value) return;
        if (type === 'error') {
            console.error('[Toast]', message);
        }

        // Remove duplicates
        const existing = state.errors.find(e => e.message === message);
        if (existing) return;

        const id = nextId++;

        add({ id, message, type }, type === 'success' ? SUCCESS_TOAST_MS : 5000);
    }

    function add(toast, timeout) {
        // Keep max 5
        if (state.errors.length >= 5) {
            remove(state.errors[0].id);
        }
        state.errors.push(toast);
        timers.set(toast.id, setTimeout(() => remove(toast.id), timeout));
    }

    function success(message) {
        push(message, 'success');
    }

    // Success toast with an Undo button; a new one replaces the previous, never deduped by message
    function undoable(message, undo) {
        const previous = undoToast();
        if (previous) remove(previous.id);
        add({ id: nextId++, message, type: 'undo', undo, undoing: false }, UNDO_MS);
    }

    function undoToast() {
        return state.errors.find(e => e.type === 'undo') || null;
    }

    // The toast stays, timer stopped, until the undo settles
    async function runUndo() {
        const toast = undoToast();
        if (!toast || toast.undoing) return;
        toast.undoing = true;
        clearTimeout(timers.get(toast.id));
        try {
            await toast.undo();
        } finally {
            remove(toast.id);
        }
    }

    function dismiss(toast) {
        if (!toast.undoing) remove(toast.id);
    }

    function remove(id) {
        clearTimeout(timers.get(id));
        timers.delete(id);
        const idx = state.errors.findIndex(e => e.id === id);
        if (idx !== -1) {
            state.errors.splice(idx, 1);
        }
    }

    instance = { state, push, success, undoable, undoToast, runUndo, dismiss, remove };
    return instance;
}