import { connectionModel } from '../models/connectionModel.js'

export function isNotConnection(err) {
    return err?.status === 404 && err?.code === 'not_a_connection'
}

// Call before refreshConnections(): the re-read drops the refused person from the list
export function recipientLabel(err, pickEmail = '') {
    if (pickEmail) return pickEmail
    const c = (connectionModel().connections.value || []).find(x => x.user_id === err?.user_id)
    return c?.email || 'Someone you picked'
}

export function refreshConnections() {
    return connectionModel().loadAll().catch(() => {})
}

export const notConnectionCopy = {
    pickAgain: (who) => `${who} is no longer a connection. Pick someone else.`,
    shareRest: (who) => `${who} is no longer a connection. Select Share to go on with the rest.`,
    allRefused: 'These people are no longer connections. Pick someone else.',
    notAdded: (who) => `${who} is no longer a connection, so they weren't added.`,
    notAddedMany: (n) => `${n} people are no longer connections, so they weren't added.`,
    inNext: (who) => `${who} is no longer a connection. The action is in Next Actions — open it to pick someone else.`,
    activeAgain: (who) => `${who} is no longer a connection. The action is active again — open it to pick someone else.`,
}
