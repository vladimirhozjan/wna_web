import {ref, reactive, computed} from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'

let instance = null

export function referenceModel() {
    if (instance) return instance

    const currentFolderId = ref(null)
    const breadcrumbs = ref([])
    const folders = ref([])
    const files = ref([])
    const totalFiles = ref(0)
    const offset = ref(0)
    const limit = ref(20)
    const viewMode = ref(localStorage.getItem('ref_view_mode') || 'list')
    const loading = ref(false)
    const error = ref(null)
    const searchQuery = ref('')
    const uploads = ref([])
    const quota = ref(null)

    const preview = reactive({
        visible: false,
        file: null,
        url: null,
        text: null,
        loading: false,
    })

    const rename = reactive({
        visible: false,
        type: null,     // 'file' | 'folder' | 'new-folder'
        id: null,
        currentName: '',
    })

    const hasMore = computed(() => offset.value + files.value.length < totalFiles.value)

    // Cache for folder lookups (used when building breadcrumbs)
    const folderCache = new Map()

    async function buildBreadcrumbs(folderId) {
        const crumbs = []
        let id = folderId
        while (id) {
            let folder = folderCache.get(id)
            if (!folder) {
                folder = await apiClient.getRefFolder(id)
                folderCache.set(id, folder)
            }
            crumbs.unshift({id: folder.id, name: folder.name})
            id = folder.parent_id || null
        }
        breadcrumbs.value = crumbs
    }

    async function navigateToFolder(folderId) {
        currentFolderId.value = folderId
        searchQuery.value = ''
        if (folderId) {
            await buildBreadcrumbs(folderId)
        } else {
            breadcrumbs.value = []
        }
        await loadContents({reset: true})
    }

    async function loadContents({reset = false} = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                offset.value = 0
            }

            const isSearch = searchQuery.value.trim().length > 0

            const [foldersData, filesData] = await Promise.all([
                isSearch ? Promise.resolve([]) : apiClient.listRefFolders(currentFolderId.value),
                apiClient.listRefFiles({
                    folder_id: isSearch ? null : currentFolderId.value,
                    q: isSearch ? searchQuery.value.trim() : null,
                    limit: limit.value,
                    offset: offset.value,
                }),
            ])

            if (reset) {
                folders.value = Array.isArray(foldersData) ? foldersData : (foldersData.folders || [])
                files.value = Array.isArray(filesData) ? filesData : (filesData.files || [])
                totalFiles.value = filesData.total ?? files.value.length
            } else {
                const newFiles = Array.isArray(filesData) ? filesData : (filesData.files || [])
                files.value.push(...newFiles)
                totalFiles.value = filesData.total ?? files.value.length
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function loadMoreFiles() {
        offset.value = files.value.length
        await loadContents()
    }

    async function createFolder(name) {
        error.value = null
        try {
            const folder = await apiClient.createRefFolder({
                name,
                parent_id: currentFolderId.value,
            })
            folderCache.set(folder.id, folder)
            folders.value.unshift(folder)
            return folder
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function renameFolder(id, name) {
        error.value = null
        try {
            const updated = await apiClient.updateRefFolder(id, {name})
            folders.value = folders.value.map(f => f.id === id ? {...f, name} : f)
            folderCache.set(id, {...(folderCache.get(id) || {}), ...updated})
            return updated
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function renameFile(id, name) {
        error.value = null
        try {
            const updated = await apiClient.updateRefFile(id, {name})
            files.value = files.value.map(f => f.id === id ? {...f, name} : f)
            return updated
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function deleteFolder(id) {
        error.value = null
        try {
            await apiClient.deleteRefFolder(id)
            folders.value = folders.value.filter(f => f.id !== id)
            folderCache.delete(id)
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function trashFile(id) {
        error.value = null
        try {
            await apiClient.trashRefFile(id)
            files.value = files.value.filter(f => f.id !== id)
            totalFiles.value = Math.max(0, totalFiles.value - 1)
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    let uploadIdCounter = 0

    async function uploadFiles(fileList) {
        for (const file of fileList) {
            if (file.size > 50 * 1024 * 1024) {
                error.value = {message: `"${file.name}" exceeds 50 MB limit`}
                continue
            }

            const uploadId = ++uploadIdCounter
            const entry = reactive({id: uploadId, name: file.name, progress: 0, status: 'uploading', error: null})
            uploads.value.push(entry)

            try {
                const result = await apiClient.uploadRefFile(file, currentFolderId.value, (pct) => {
                    entry.progress = pct
                })
                entry.status = 'done'
                entry.progress = 100
                files.value.unshift(result)
                totalFiles.value++
                loadQuota()
                statsModel().refreshStats()
            } catch (err) {
                entry.status = 'error'
                entry.error = err.message || 'Upload failed'
            }

            setTimeout(() => {
                const idx = uploads.value.findIndex(u => u.id === uploadId)
                if (idx !== -1) uploads.value.splice(idx, 1)
            }, 3000)
        }
    }

    async function downloadFile(file) {
        try {
            const blob = await apiClient.downloadRefFile(file.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function openPreview(file) {
        preview.visible = true
        preview.file = file
        preview.url = null
        preview.text = null
        preview.loading = true

        try {
            const blob = await apiClient.previewRefFile(file.id)
            const mime = file.mime_type || blob.type || ''

            if (mime.startsWith('text/') || mime === 'application/json') {
                preview.text = await blob.text()
            } else {
                preview.url = URL.createObjectURL(blob)
            }
        } catch (err) {
            error.value = err
        } finally {
            preview.loading = false
        }
    }

    function closePreview() {
        if (preview.url) {
            URL.revokeObjectURL(preview.url)
        }
        preview.visible = false
        preview.file = null
        preview.url = null
        preview.text = null
        preview.loading = false
    }

    async function search(query) {
        searchQuery.value = query
        offset.value = 0
        await loadContents({reset: true})
    }

    function setViewMode(mode) {
        viewMode.value = mode
        localStorage.setItem('ref_view_mode', mode)
    }

    async function loadQuota() {
        try {
            quota.value = await apiClient.getRefQuota()
        } catch {
            // non-critical
        }
    }

    function startRename(type, id, currentName) {
        rename.visible = true
        rename.type = type
        rename.id = id
        rename.currentName = currentName
    }

    function startNewFolder() {
        rename.visible = true
        rename.type = 'new-folder'
        rename.id = null
        rename.currentName = ''
    }

    function closeRename() {
        rename.visible = false
        rename.type = null
        rename.id = null
        rename.currentName = ''
    }

    instance = {
        currentFolderId,
        breadcrumbs,
        folders,
        files,
        totalFiles,
        offset,
        limit,
        viewMode,
        loading,
        error,
        searchQuery,
        uploads,
        quota,
        preview,
        rename,
        hasMore,

        navigateToFolder,
        loadContents,
        loadMoreFiles,
        createFolder,
        renameFolder,
        renameFile,
        deleteFolder,
        trashFile,
        uploadFiles,
        downloadFile,
        openPreview,
        closePreview,
        search,
        setViewMode,
        loadQuota,
        startRename,
        startNewFolder,
        closeRename,
    }
    return instance
}
