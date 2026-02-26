import { reactive } from 'vue';

let instance = null;

export function errorModel() {
    if (instance) return instance;

    const state = reactive({
        errors: []   // { id, message, type }
    });

    let nextId = 1;

    function push(message, type = 'error') {
        // Log errors to console
        if (type === 'error') {
            console.error('[Toast]', message);
        }

        // Remove duplicates
        const existing = state.errors.find(e => e.message === message);
        if (existing) return;

        const id = nextId++;

        // Keep max 5
        if (state.errors.length >= 5) {
            state.errors.splice(0, 1);
        }

        state.errors.push({ id, message, type });

        const timeout = type === 'success' ? 3000 : 5000;
        setTimeout(() => remove(id), timeout);
    }

    function success(message) {
        push(message, 'success');
    }

    function remove(id) {
        const idx = state.errors.findIndex(e => e.id === id);
        if (idx !== -1) {
            state.errors.splice(idx, 1);
        }
    }

    instance = { state, push, success, remove };
    return instance;
}