import apiClient from './apiClient.js'
import { captureQueue } from './captureQueue.js'
import { offlineModel } from './offlineModel.js'
import { upgradeModel } from './upgradeModel.js'
import { formatDate } from './dateUtils.js'

const PHOTO_MAX_EDGE = 2048
const PHOTO_QUALITY = 0.85
const URL_RE = /https?:\/\/[^\s<>"']+/gi
export const CAPTURE_LOCKED_LINE = 'Photo, voice and file capture is available on Pro and Team plans.'
const UPGRADE_MESSAGE = `${CAPTURE_LOCKED_LINE} Upgrade to snap a receipt, record a thought or drop a file straight into your Inbox.`
const QUEUE_FULL = 'No offline space left on this device — attach it when you\'re back online'

let chipSeq = 0

// Photo chips show a thumbnail of the file itself
export function createChip(kind, file, extra = {}) {
    return {
        id: ++chipSeq,
        kind,
        file,
        url: kind === 'photo' ? URL.createObjectURL(file) : null,
        thumbFailed: false,
        queueFull: false,
        lateError: null,
        ...extra,
    }
}

export function formatSize(bytes) {
    if (bytes == null) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export function formatDuration(seconds) {
    const s = Math.max(0, Math.round(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function stamp() {
    return formatDate(new Date(), 'yyyyMMdd-HHmm')
}

export function showCaptureUpgrade() {
    upgradeModel().show({ message: UPGRADE_MESSAGE })
}

export function contactSupport() {
    window.location.href = 'mailto:support@whatsnextaction.com'
}

// Offline the last known limits are used; none known → the server decides at sync
export async function loadAttachmentLimits() {
    const queue = captureQueue()
    if (offlineModel().isOffline.value) return queue.lastAttachmentLimits()
    try {
        return (await apiClient.getRefQuota()).attachment_limits ?? null
    } catch {
        return queue.lastAttachmentLimits()
    }
}

// Plan limits apply in capture order; a chip over a limit is red and never sent
export function chipErrors(chips, limits, tier) {
    const errors = {}
    let count = 0
    let total = 0
    for (const chip of chips) {
        if (chip.queueFull) {
            errors[chip.id] = QUEUE_FULL
            continue
        }
        if (chip.lateError) {
            errors[chip.id] = chip.lateError
            continue
        }
        if (!limits) continue
        const size = chip.file.size
        if (limits.max_file_bytes != null && size > limits.max_file_bytes) {
            errors[chip.id] = `Larger than ${formatSize(limits.max_file_bytes)} — choose a smaller file`
        } else if (limits.max_per_item != null && count >= limits.max_per_item) {
            errors[chip.id] = 'Over the files-per-item limit — capture it separately'
        } else if (limits.available_bytes != null && total + size > limits.available_bytes) {
            errors[chip.id] = tier === 'team'
                ? 'Not enough storage — delete files you no longer need'
                : 'Not enough storage — upgrade for more space'
        } else {
            count++
            total += size
        }
    }
    return errors
}

// Reason on a chip whose upload the server refused after the item was created
export function lateUploadReason(err) {
    if (err?.code) return err.message
    if (err?.status === 409) return 'Over the files-per-item limit — capture it separately'
    if (err?.status === 413) return 'Too large or storage full — free up space, then attach it from the item'
    return 'Upload failed — attach it from the item'
}

// Photo-menu images are scaled down on the device; an image the browser can't decode is kept as it is
export async function resizePhoto(file) {
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
        const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY))
        return blob ? new File([blob], `photo-${stamp()}.jpg`, { type: 'image/jpeg' }) : file
    } catch {
        return file
    }
}

// A multi-line text keeps its first line as the title line; the rest goes to the description
export function splitLines(text) {
    const lines = text.replace(/\r\n?/g, '\n').trim().split('\n')
    const first = lines.shift().trim()
    return { first, rest: lines.join('\n').trim() }
}

// Links leave the title line and go to the description
export function splitTitle(line) {
    const urls = line.match(URL_RE) ?? []
    const typed = line.replace(URL_RE, ' ').replace(/\s+/g, ' ').trim()
    return { typed, urls }
}

// Every image counts as a photo, however it was picked; the chip kind only sets the chip's look
function isImage(chip) {
    return chip.file.type.startsWith('image/')
}

export function inputType(files) {
    if (!files.length) return 'text'
    if (files.every(isImage)) return 'photo'
    if (files.length === 1 && files[0].kind === 'voice') return 'audio'
    return 'file'
}

export function autoTitle(files, urls, descriptionLines) {
    const when = formatDate(new Date(), 'd MMM HH:mm')
    if (files.length) {
        if (files.every(isImage)) {
            return files.length === 1 ? `Photo · ${when}` : `${files.length} photos · ${when}`
        }
        if (files.length === 1 && files[0].kind === 'voice') return `Voice memo · ${formatDuration(files[0].duration)}`
        if (files.length === 1) return files[0].file.name
        const more = files.length - 1
        return `${files[0].file.name} + ${more} ${more === 1 ? 'file' : 'files'}`
    }
    if (urls.length) return `Link · ${when}`
    return descriptionLines.shift() ?? ''
}

// Typed text → title; links and the further lines → description
export function buildCapture(text, moreText, files) {
    const { typed, urls } = splitTitle(text)
    const lines = [...urls, ...(moreText.trim() ? moreText.trim().split('\n') : [])]
    const title = typed || autoTitle(files, urls, lines)
    return { title, description: lines.join('\n') }
}
