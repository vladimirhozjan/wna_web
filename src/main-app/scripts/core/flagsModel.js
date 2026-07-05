import { ref, computed } from 'vue'
import { getPublicFlags } from './apiClient.js'
import { authModel } from './authModel.js'

let instance = null

export function flagsModel() {
    if (instance) return instance

    const auth = authModel()
    const publicFlags = ref([])
    const loaded = ref(false)

    async function loadPublicFlags() {
        try {
            const data = await getPublicFlags()
            publicFlags.value = data.flags || []
        } catch {
            publicFlags.value = []
        } finally {
            loaded.value = true
        }
    }

    const activeFlags = computed(() => {
        if (auth.isAuthenticated.value && auth.currentUser.value?.active_flags) {
            return auth.currentUser.value.active_flags
        }
        return publicFlags.value
    })

    const isBeta = computed(() => activeFlags.value.includes('beta'))

    // Payment UI gate (FEAT-006): the backend enforces both flags on every payment endpoint
    const paymentsEnabled = computed(() => activeFlags.value.includes('beta_mode') && activeFlags.value.includes('payments'))

    function hasFlag(name) {
        return activeFlags.value.includes(name)
    }

    loadPublicFlags()

    instance = { activeFlags, publicFlags, loaded, isBeta, paymentsEnabled, hasFlag, loadPublicFlags }
    return instance
}
