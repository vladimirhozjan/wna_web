// The share received from another app, written by the service worker (public/sw.js) under one key; not bound to a user
const DB_NAME = 'wna_share'
const STORE = 'pending'
const KEY = 'current'

let dbPromise = null

function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1)
            req.onupgradeneeded = () => req.result.createObjectStore(STORE)
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

export function pendingShare() {

    // → the record or null; a device that can't open the store has no pending share
    async function read() {
        try {
            return (await inStore('readonly', s => s.get(KEY))) ?? null
        } catch {
            return null
        }
    }

    async function exists() {
        try {
            return await inStore('readonly', s => s.count(KEY)) > 0
        } catch {
            return false
        }
    }

    async function remove() {
        try {
            await inStore('readwrite', s => s.delete(KEY))
        } catch { /* nothing stored */ }
    }

    // Where a successful sign-in goes: a share received before it wins over any other target
    async function afterLogin(target) {
        return await exists() ? { name: 'share' } : target
    }

    return { read, exists, remove, afterLogin }
}
