import { reactive } from 'vue';

let instance = null;

export function errorModel() {
    if (instance) return instance;

    const state = reactive({
        errors: []   // { id, message }
    });

    let nextId = 1;

    function push(message) {
        // Remove duplicates
        const existing = state.errors.find(e => e.message === message);
        if (existing) return;

        const id = nextId++;

        // Keep max 4
        if (state.errors.length >= 4) {
            state.errors.splice(0, 1);
        }

        state.errors.push({ id, message });

        setTimeout(() => remove(id), 5000);
    }

    function remove(id) {
        const idx = state.errors.findIndex(e => e.id === id);
        if (idx !== -1) {
            state.errors.splice(idx, 1);
        }
    }

    instance = { state, push, remove };
    return instance;
}