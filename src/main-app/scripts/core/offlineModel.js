import { ref, computed } from 'vue'

const browserOffline = ref(!navigator.onLine)
const noResponse = ref(false)
const isOffline = computed(() => browserOffline.value || noResponse.value)

window.addEventListener('online', () => {
    browserOffline.value = false
    noResponse.value = false
})

window.addEventListener('offline', () => {
    browserOffline.value = true
})

export function offlineModel() {

    // A request that failed on the network (not a timeout) marks the app offline until the next online event or
    // answered request
    function markNoResponse() {
        noResponse.value = true
    }

    function markResponse() {
        noResponse.value = false
    }

    return { isOffline, markNoResponse, markResponse }
}
