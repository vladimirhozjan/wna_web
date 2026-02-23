import { ref } from 'vue'

let instance = null

export function contextModel() {
    if (instance) return instance

    const activeTag = ref(null)

    function setTag(tag) {
        activeTag.value = activeTag.value === tag ? null : tag
    }

    function clear() {
        activeTag.value = null
    }

    instance = { activeTag, setTag, clear }
    return instance
}
