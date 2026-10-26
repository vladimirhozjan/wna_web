import { ref, watch } from 'vue'
import apiClient from './apiClient.js'
import { authModel } from './authModel.js'
import { offlineModel } from './offlineModel.js'
import { errorModel } from './errorModel.js'
import { stuffModel } from '../models/stuffModel.js'
import { statsModel } from '../models/statsModel.js'
import { truncateTitle } from './textUtils.js'

const DB_NAME = 'wna_capture'
const STORE = 'queue'
// contracts/limits.md §Offline capture queue
const OFFLINE_CAP_BYTES = 50 * 1024 * 1024
const RETRY_MS = 30000
// Shared by every tab: after a transient error no automatic run sends before this time (ms)
const RETRY_AT_KEY = 'wna_capture_retry_at'
// Set while a run holds the lock; a run that ends (any way but its tab closing) removes it
const RUNNING_KEY = 'wna_capture_running'
// Each tab holds wna_capture_tab_<id> while it is open; entries carry the id of the tab that captured or retried them
const TAB_LOCK_PREFIX = 'wna_capture_tab_'
const tabId = crypto.randomUUID()
const DEVICE_WRITE_ERROR = 'Couldn\'t save this on your device. Free up space on your device, then press Add again.'

const entries = ref([])
const sendingKey = ref(null)
// client_key → { resolve, notify, title } of a caller of enqueue waiting for the outcome
const outcomes = new Map()
// Captures added (or retried) in this page session; only these get the per-item toast when sent
const sessionKeys = new Set()

let auth = null
let dbPromise = null
let channel = null
let started = false
let running = false
let rerun = false
let retryTimer = null
let persistAsked = false
let reloadVersion = 0

function userId() {
    auth ??= authModel()
    return auth.currentUser.value?.id ?? null
}

function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1)
            req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'client_key' })
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
        dbPromise.catch(() => { dbPromise = null })
    }
    return dbPromise
}

async function inStore(mode, fn) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
    })
}

const dbAll = () => inStore('readonly', s => s.getAll())
const dbGet = (key) => inStore('readonly', s => s.get(key))
const dbPut = (entry) => inStore('readwrite', s => s.put(entry))
const dbDelete = (key) => inStore('readwrite', s => s.delete(key))

// Writes an entry back only while it is still queued, so a discard or a logout during a send never brings it back;
// → whether it was still there
async function dbUpdate(entry) {
    let present = false
    await inStore('readwrite', (s) => {
        const req = s.get(entry.client_key)
        req.onsuccess = () => {
            present = !!req.result
            if (present) s.put(entry)
        }
        return req
    })
    return present
}

async function userEntries() {
    const uid = userId()
    if (!uid) return []
    return (await dbAll()).filter(e => e.user_id === uid)
}

function savedOnDevice(title) {
    errorModel().success(`"${truncateTitle(title)}" saved offline`)
}

// Read and write in one transaction, so a send updating the same entry meanwhile is never overwritten
async function markWaited(key) {
    try {
        await inStore('readwrite', (s) => {
            const req = s.get(key)
            req.onsuccess = () => {
                const entry = req.result
                if (entry && entry.status === 'waiting' && !entry.waited) s.put({ ...entry, waited: true })
            }
            return req
        })
    } catch { /* stays as it is */ }
}

// Everything of this user still waiting while the app is offline has waited: sent later, it counts in that run's
// "{n} captured items synced" toast, never the per-item one
async function markAllWaited() {
    try {
        for (const e of await userEntries()) {
            if (e.status === 'waiting' && !e.waited) await markWaited(e.client_key)
        }
    } catch { /* stays as it is */ }
}

// 'sent' | 'failed' | 'waiting' (stays on the device for now). A caller that asked to be told about a wait gets the
// saved-on-device toast here, unless the runner has just shown it for this capture
function settle(key, outcome, announced = false) {
    const waiter = outcomes.get(key)
    if (!waiter) return
    outcomes.delete(key)
    if (outcome === 'waiting' && waiter.notify && !announced) {
        savedOnDevice(waiter.title)
        markWaited(key)
    }
    waiter.resolve(outcome)
}

function settleWaiting() {
    for (const key of [...outcomes.keys()]) settle(key, 'waiting')
}

// A broadcast reload that drops an entry already created on the server (another tab sent or discarded it) loads the
// Inbox first, so its server row is there when the queued row goes
async function reload({ fromOtherTab = false } = {}) {
    // Overlapping reloads: only the last one started may write, so an older read never brings back a removed row
    const version = ++reloadVersion
    let next
    try {
        next = await userEntries()
    } catch {
        if (version === reloadVersion) entries.value = []
        return
    }
    const keys = new Set(next.map(e => e.client_key))
    if (fromOtherTab && entries.value.some(e => e.server_id && !keys.has(e.client_key))) await refreshInbox()
    if (version !== reloadVersion) return
    entries.value = next
    // Another tab's run may send or fail an entry this tab waits for
    for (const key of outcomes.keys()) {
        const entry = entries.value.find(e => e.client_key === key)
        if (!entry) settle(key, 'sent')
        else if (entry.status === 'failed') settle(key, 'failed')
    }
}

function changed() {
    channel?.postMessage({ type: 'changed' })
    return reload()
}

function setSending(key) {
    sendingKey.value = key
    channel?.postMessage({ type: 'sending', key })
}

function refreshInbox() {
    statsModel().refreshStats()
    return stuffModel().loadStuff({ reset: true }).catch(() => {})
}

// Another tab is sending: queue one takeover behind its lock. The lock is released when that run ends or its tab
// closes; only a closed sender is replaced here (see sync)
function onMessage({ data }) {
    if (data.type === 'changed') reload({ fromOtherTab: true })
    else if (data.type === 'sent' && sessionKeys.has(data.key)) errorModel().success(`"${truncateTitle(data.title)}" added to Inbox`)
    else if (data.type === 'sending') {
        sendingKey.value = data.key
        if (data.key && navigator.locks && !running) sync({ takeover: true })
    }
}

function armRetry(at) {
    clearTimeout(retryTimer)
    retryTimer = setTimeout(() => sync({ auto: true }), Math.max(0, at - Date.now()))
}

// The upload endpoint answers 413 for both cases; the current quota tells them apart
async function failureReason(err, file) {
    if (err.code === 'drive_file_too_large') return { code: 'drive_too_large', file: file?.name }
    if (err.code === 'drive_reconnect_required') return { code: 'drive_reconnect' }
    if (file && err.status === 413) {
        let max = null
        try {
            max = (await apiClient.getRefQuota()).attachment_limits?.max_file_bytes ?? null
        } catch { /* unknown — treated as storage */ }
        return max != null && file.size > max ? { code: 'too_large', file: file.name } : { code: 'storage' }
    }
    if (file && err.status === 409) return { code: 'count' }
    return { code: 'other' }
}

// → 'sent' | 'failed' | 'skipped' | 'offline' | 'session' | 'transient'
async function send(key) {
    const entry = await dbGet(key)
    if (!entry || entry.status !== 'waiting') return 'skipped'

    let file = null
    try {
        if (!entry.server_id) {
            const created = await apiClient.addStuff({
                title: entry.title,
                description: entry.description,
                state: 'INBOX',
                client_key: entry.client_key,
                input_type: entry.input_type,
            }, { quiet: true })
            entry.server_id = created.id
            if (!await dbUpdate(entry)) return 'skipped'
            // Every tab hides the new server row from now on, until the queued row goes
            await changed()
        } else if (entry.files.some(f => !f.uploaded)) {
            // A lost upload response must not store the file twice
            const { attachments = [] } = await apiClient.listAttachments('stuff', entry.server_id)
            for (const f of entry.files) {
                if (attachments.some(a => a.file_name === f.name && a.size_bytes === f.size)) f.uploaded = true
            }
            if (!await dbUpdate(entry)) return 'skipped'
        }

        for (const f of entry.files) {
            if (f.uploaded) continue
            file = f
            await apiClient.uploadAttachment('stuff', entry.server_id, new File([f.blob], f.name, { type: f.type }), null, { quiet: true })
            f.uploaded = true
            if (!await dbUpdate(entry)) return 'skipped'
        }
        return 'sent'
    } catch (err) {
        const status = err?.status
        // No response: offline when the network is gone (httpApi marked it), else a slow server — try again later
        if (!status) return offlineModel().isOffline.value ? 'offline' : 'transient'
        if (status === 401) return 'session'
        if (status === 429 || status >= 500) return 'transient'
        entry.status = 'failed'
        entry.error = await failureReason(err, file)
        await dbUpdate(entry)
        return 'failed'
    }
}

// auto: a run nobody asked for (another tab's lock released, the retry timer) — it waits out the shared back-off
// Whether the tab that captured (or retried) this entry is still open; unknown without Web Locks → no
async function capturingTabOpen(entry) {
    if (!navigator.locks || !entry.tab_id) return false
    try {
        const { held } = await navigator.locks.query()
        return held.some(lock => lock.name === TAB_LOCK_PREFIX + entry.tab_id)
    } catch {
        return false
    }
}

async function runQueue({ auto = false } = {}) {
    // A queued run may be granted long after it was asked for
    if (!userId() || offlineModel().isOffline.value) {
        setSending(null)
        settleWaiting()
        await markAllWaited()
        return
    }
    const retryAt = Number(localStorage.getItem(RETRY_AT_KEY)) || 0
    if (auto && retryAt > Date.now()) {
        setSending(null)
        armRetry(retryAt)
        return
    }
    const uid = userId()
    const toaster = errorModel()
    const list = (await userEntries())
        .filter(e => e.status === 'waiting')
        .sort((a, b) => a.captured_at.localeCompare(b.captured_at))

    let synced = 0
    let failed = 0
    let stop = null

    for (let i = 0; i < list.length; i++) {
        const entry = list[i]
        if (userId() !== uid) break
        setSending(entry.client_key)
        const result = await send(entry.client_key)

        if (result === 'sent') {
            // The server row is loaded (hidden by server_id) before the queued row goes, and both change in one tick,
            // so the capture never shows twice or not at all
            await refreshInbox()
            await dbDelete(entry.client_key)
            reloadVersion++
            entries.value = entries.value.filter(e => e.client_key !== entry.client_key)
            settle(entry.client_key, 'sent')
            // Sent straight away: the per-item toast in the tab it was captured or retried in, wherever it is sent from;
            // a waited entry, or one whose tab has closed, counts here
            if (entry.waited) synced++
            else if (sessionKeys.has(entry.client_key)) toaster.success(`"${truncateTitle(entry.title)}" added to Inbox`)
            else if (await capturingTabOpen(entry)) channel?.postMessage({ type: 'sent', key: entry.client_key, title: entry.title })
            else synced++
        } else if (result === 'failed') {
            failed++
            settle(entry.client_key, 'failed')
        } else if (result !== 'skipped') {
            stop = result
            const announced = result === 'offline' && !entry.waited && sessionKeys.has(entry.client_key)
            if (announced) savedOnDevice(entry.title)
            for (const rest of list.slice(i)) {
                settle(rest.client_key, 'waiting', announced && rest === entry)
                if (rest.waited) continue
                await markWaited(rest.client_key)
            }
            // Also captures and Retries that arrived during this run and wait for the re-run
            if (result === 'offline') await markAllWaited()
            break
        }
        await changed()
    }
    // Entries this run didn't reach (another user signed in) wait for the next run
    for (const entry of list) settle(entry.client_key, 'waiting')
    setSending(null)
    await changed()

    if (synced) toaster.success(synced === 1 ? '1 captured item synced' : `${synced} captured items synced`)
    // Not the router: importing it here would close an import cycle through authModel
    if (failed && location.pathname !== '/inbox') {
        toaster.push(failed === 1
            ? '1 captured item couldn\'t sync — open Inbox to retry or discard it'
            : `${failed} captured items couldn't sync — open Inbox to retry or discard them`, 'error', { keepOffline: true })
    }
    if (stop === 'transient') {
        const at = Date.now() + RETRY_MS
        localStorage.setItem(RETRY_AT_KEY, String(at))
        armRetry(at)
    } else {
        localStorage.removeItem(RETRY_AT_KEY)
    }
}

// One tab sends at a time; a trigger during a run queues one more run
function sync({ auto = false, takeover = false } = {}) {
    if (running) {
        rerun = true
        return
    }
    if (!userId() || offlineModel().isOffline.value) {
        settleWaiting()
        markAllWaited()
        return
    }
    running = true
    clearTimeout(retryTimer)
    const work = async () => {
        // The sender ended normally: send nothing, so captures it got meanwhile go from its own re-run with their
        // per-item toast; just drop its Syncing… and keep the shared back-off. Its marker still set = its tab closed
        if (takeover && !localStorage.getItem(RUNNING_KEY)) {
            setSending(null)
            const retryAt = Number(localStorage.getItem(RETRY_AT_KEY)) || 0
            if (retryAt > Date.now()) armRetry(retryAt)
            return
        }
        localStorage.setItem(RUNNING_KEY, '1')
        try {
            await runQueue({ auto: auto || takeover })
        } finally {
            localStorage.removeItem(RUNNING_KEY)
        }
    }
    const run = navigator.locks ? navigator.locks.request('wna_capture_sync', work) : work()
    run.catch(() => setSending(null)).finally(() => {
        running = false
        if (rerun) {
            rerun = false
            sync()
        }
    })
}

export function captureQueue() {

    function start() {
        if (started) return
        started = true
        if ('BroadcastChannel' in window) {
            channel = new BroadcastChannel('wna_capture')
            channel.onmessage = onMessage
        }
        // Held until the tab closes, so a sending tab can tell whether the capturing tab is still there
        navigator.locks?.request(TAB_LOCK_PREFIX + tabId, () => new Promise(() => {}))
        watch(userId, () => {
            reload()
            sync()
        }, { immediate: true })
        watch(offlineModel().isOffline, (offline) => {
            if (!offline) sync()
            else if (!running) {
                settleWaiting()
                markAllWaited()
            }
        })
    }

    // Every capture is written here first and sent by the sync runner; offline files count against the device cap
    // Files of an offline capture that would take the device's queued file total over the cap; online captures are
    // never counted
    async function overCap(files) {
        if (!offlineModel().isOffline.value || !files.length) return []
        let used = (await dbAll()).reduce((sum, e) => sum + e.files.reduce((s, f) => s + f.size, 0), 0)
        return files.filter((f) => {
            if (used + f.size > OFFLINE_CAP_BYTES) return true
            used += f.size
            return false
        })
    }

    // → { rejected, outcome }: outcome resolves 'sent', 'failed' or 'waiting' for this capture; notifyWaiting shows the
    // saved-on-device toast for every wait, not only for a capture made or cut off offline
    async function enqueue({ title, description = '', input_type = null, files = [], notifyWaiting = false }) {
        const offline = offlineModel().isOffline.value
        const key = crypto.randomUUID()
        let rejected = []
        let accepted = files

        try {
            rejected = await overCap(files)
            accepted = files.filter(f => !rejected.includes(f))

            await dbPut({
                client_key: key,
                user_id: userId(),
                captured_at: new Date().toISOString(),
                title,
                description,
                input_type,
                files: accepted.map(f => ({ name: f.name, type: f.type, size: f.size, blob: f, uploaded: false })),
                status: 'waiting',
                error: null,
                server_id: null,
                waited: offline,
                tab_id: tabId,
            })
        } catch {
            const err = new Error(DEVICE_WRITE_ERROR)
            err.deviceWrite = true
            throw err
        }

        if (!persistAsked) {
            persistAsked = true
            navigator.storage?.persist?.().catch(() => {})
        }
        sessionKeys.add(key)
        const outcome = offline
            ? Promise.resolve('waiting')
            : new Promise(resolve => outcomes.set(key, { resolve, notify: notifyWaiting, title }))
        await changed()
        if (offline) savedOnDevice(title)
        sync()
        return { rejected, outcome }
    }

    // For a browser that refuses to keep the capture on the device while online: create + uploads straight away,
    // nothing queued; → { failures } maps each file that didn't upload to its error
    async function sendNow({ title, description = '', input_type = null, files = [] }) {
        const created = await apiClient.addStuff({ title, description, state: 'INBOX', input_type })
        const failures = new Map()
        for (const f of files) {
            try {
                await apiClient.uploadAttachment('stuff', created.id, f)
            } catch (err) {
                failures.set(f, err)
            }
        }
        await refreshInbox()
        if (!failures.size) errorModel().success(`"${truncateTitle(title)}" added to Inbox`)
        return { failures }
    }

    async function retry(key) {
        const entry = await dbGet(key)
        if (!entry) return
        sessionKeys.add(key)
        await dbPut({ ...entry, status: 'waiting', error: null, waited: offlineModel().isOffline.value, tab_id: tabId })
        await changed()
        sync()
    }

    // An item already created on the server stays there with the files stored so far
    async function discard(key) {
        const entry = await dbGet(key)
        if (entry?.server_id) await refreshInbox()
        await dbDelete(key)
        await changed()
    }

    async function pendingCount() {
        try {
            return (await userEntries()).length
        } catch {
            return 0
        }
    }

    async function clearUser() {
        try {
            for (const e of await userEntries()) await dbDelete(e.client_key)
        } catch { /* nothing stored */ }
        await changed()
    }

    // Last known plan limits for the offline pre-check; null when never read for this user
    function lastAttachmentLimits() {
        try {
            const saved = JSON.parse(localStorage.getItem('attachment_limits'))
            return saved?.user_id === userId() ? saved.limits : null
        } catch {
            return null
        }
    }

    return {
        entries,
        sendingKey,
        start,
        overCap,
        enqueue,
        sendNow,
        retry,
        discard,
        pendingCount,
        clearUser,
        lastAttachmentLimits,
    }
}
