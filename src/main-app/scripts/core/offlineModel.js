import { ref, computed } from 'vue'

const browserOffline = ref(!navigator.onLine)
const noResponse = ref(false)
const isOffline = computed(() => browserOffline.value || noResponse.value)
const dashboardShown = ref(false)
const offlineContentShown = computed(() => isOffline.value && dashboardShown.value)

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

    function setDashboardShown(v) {
        dashboardShown.value = v
    }

    return { isOffline, offlineContentShown, markNoResponse, markResponse, setDashboardShown }
}
