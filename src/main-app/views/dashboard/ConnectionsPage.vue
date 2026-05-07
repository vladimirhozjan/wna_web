<template>
  <DashboardLayout>
    <div class="connections-page">
      <div class="connections-header">
        <div class="header-row">
          <h1 class="page-title">Connections</h1>
        </div>
      </div>

      <div class="connections-content">
        <div class="card">
          <div class="connections-body">

            <!-- Invite form — Team tier only -->
            <div v-if="isTeamTier" class="settings-row settings-row--column">
              <span class="settings-label">Invite someone by email</span>
              <p class="text-body-s settings-hint">
                They'll receive an invitation. If they're not on WhatsNextAction yet, they'll get a link to sign up.
              </p>
              <div class="connections-invite-row">
                <Inpt
                    v-model="inviteEmail"
                    v-model:error="inviteError"
                    type="email"
                    placeholder="name@example.com"
                    @enter="onInvite"
                />
                <Btn
                    variant="primary"
                    size="md"
                    :loading="inviting"
                    :disabled="!inviteEmail.trim() || inviting"
                    @click="onInvite"
                >Send</Btn>
              </div>
            </div>

            <!-- Loading state -->
            <div v-if="connections.loading.value && !connections.loaded.value" class="settings-loading">
              <Spinner :size="16" />
              <span>Loading connections...</span>
            </div>

            <template v-else>
              <!-- Empty state: non-Team tier without received invitations -->
              <div v-if="showUpgradeEmpty" class="connections-empty">
                <EmptyState
                    :icon="ConnectionsIcon"
                    title="Connect with your team"
                    text="Connections let you collaborate with other WhatsNextAction users — delegate actions and share projects. Available on the Team plan."
                    buttonText="Upgrade to Team"
                    @action="openUpgrade"
                />
              </div>

              <!-- Empty state: Team tier with no connections or invitations -->
              <div v-else-if="showTeamEmpty" class="connections-empty">
                <EmptyState
                    :icon="ConnectionsIcon"
                    title="No connections yet"
                    text="Invite teammates by email above to start collaborating — delegate actions and share projects."
                />
              </div>

              <!-- Data state -->
              <template v-else>
                <!-- Downgraded tier banner -->
                <div v-if="showDowngradeBanner" class="settings-row settings-row--column">
                  <p class="text-body-s settings-hint">
                    You're not on the Team plan. You can keep or remove existing connections, but inviting and accepting new connections requires Team.
                  </p>
                  <Btn variant="primary" size="sm" @click="openUpgrade">Upgrade to Team</Btn>
                </div>

                <!-- Received invitations (all tiers) -->
                <div v-if="connections.pendingReceived.value.length > 0" class="settings-row settings-row--column">
                  <span class="settings-label">Received invitations</span>
                  <template v-if="!isTeamTier">
                    <p class="text-body-s settings-hint">
                      You can accept these invitations by upgrading to the Team plan. Otherwise, you can decline them on your current plan.
                    </p>
                    <Btn variant="primary" size="sm" @click="openUpgrade">Upgrade to Team</Btn>
                  </template>
                  <div class="connections-list">
                    <div v-for="inv in connections.pendingReceived.value" :key="inv.id" class="connection-item">
                      <div class="connection-info">
                        <span class="fw-medium">{{ inv.inviter_email }}</span>
                        <span class="text-body-s connection-meta">invited you · {{ formatRelative(inv.created) }}</span>
                      </div>
                      <div class="connection-actions">
                        <Btn
                            variant="primary"
                            size="sm"
                            :loading="actingId === inv.id && actingType === 'accept'"
                            :disabled="!!actingId || !isTeamTier"
                            @click="onAccept(inv)"
                        >Accept</Btn>
                        <Btn
                            variant="secondary"
                            size="sm"
                            :loading="actingId === inv.id && actingType === 'decline'"
                            :disabled="!!actingId"
                            @click="onDecline(inv)"
                        >Decline</Btn>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sent invitations -->
                <div v-if="connections.pendingSent.value.length > 0" class="settings-row settings-row--column">
                  <span class="settings-label">Pending invitations</span>
                  <div class="connections-list">
                    <div v-for="inv in connections.pendingSent.value" :key="inv.id" class="connection-item">
                      <div class="connection-info">
                        <span class="fw-medium">{{ inv.invitee_email }}</span>
                        <span class="text-body-s connection-meta">sent · {{ formatRelative(inv.created) }}</span>
                      </div>
                      <div class="connection-actions">
                        <Btn
                            variant="ghost"
                            size="sm"
                            :loading="actingId === inv.id && actingType === 'remove'"
                            :disabled="!!actingId"
                            @click="onRemove(inv)"
                        >Cancel</Btn>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Accepted connections -->
                <div v-if="connections.connections.value.length > 0" class="settings-row settings-row--column">
                  <span class="settings-label">Connections ({{ connections.connections.value.length }})</span>
                  <div class="connections-list">
                    <div v-for="conn in connections.connections.value" :key="conn.id" class="connection-item">
                      <div class="connection-info">
                        <span class="fw-medium">{{ conn.email }}</span>
                        <span class="text-body-s connection-meta">connected · {{ formatRelative(conn.connected_since) }}</span>
                      </div>
                      <div class="connection-actions">
                        <Btn
                            variant="ghost-danger"
                            size="sm"
                            :loading="actingId === conn.id && actingType === 'remove'"
                            :disabled="!!actingId"
                            @click="onRemove(conn)"
                        >Remove</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>

          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import Spinner from '../../components/Spinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import ConnectionsIcon from '../../assets/ConnectionsIcon.vue'
import { authModel } from '../../scripts/core/authModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { connectionModel } from '../../scripts/models/connectionModel.js'
import { upgradeModel } from '../../scripts/core/upgradeModel.js'

const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const connections = connectionModel()
const upgrade = upgradeModel()

const tier = computed(() => auth.currentUser.value?.subscription_tier)
const isTeamTier = computed(() => tier.value === 'team')

const inviteEmail = ref('')
const inviteError = ref('')
const inviting = ref(false)
const actingId = ref(null)
const actingType = ref(null)

const hasAnyData = computed(() =>
    connections.connections.value.length > 0 ||
    connections.pendingReceived.value.length > 0 ||
    connections.pendingSent.value.length > 0
)

const showUpgradeEmpty = computed(() => !isTeamTier.value && !hasAnyData.value)

const showTeamEmpty = computed(() => isTeamTier.value && !hasAnyData.value)

const showDowngradeBanner = computed(() =>
    !isTeamTier.value &&
    (connections.connections.value.length > 0 || connections.pendingSent.value.length > 0)
)

function openUpgrade() {
  upgrade.show({
    message: 'Connections and team collaboration are available on the Team plan. Upgrade to invite teammates, delegate actions, and share projects.'
  })
}

function isEmailValid(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

async function onInvite() {
  const email = inviteEmail.value.trim()
  inviteError.value = ''
  if (!email) {
    inviteError.value = 'Enter an email address'
    return
  }
  if (!isEmailValid(email)) {
    inviteError.value = 'Enter a valid email address'
    return
  }
  if (email.toLowerCase() === (auth.currentUser.value?.email || '').toLowerCase()) {
    inviteError.value = "You can't invite yourself"
    return
  }
  inviting.value = true
  try {
    await connections.invite(email)
    inviteEmail.value = ''
  } catch (err) {
    inviteError.value = err?.message || 'Could not send invitation'
  } finally {
    inviting.value = false
  }
}

async function onAccept(inv) {
  if (!isTeamTier.value) {
    upgrade.show({
      message: 'Accepting connections is available on the Team plan. Upgrade to connect with other WhatsNextAction users — delegate actions and share projects.'
    })
    return
  }
  actingId.value = inv.id
  actingType.value = 'accept'
  try {
    await connections.accept(inv.token || inv.id)
  } catch (err) {
    if (err?.status === 403) {
      upgrade.show({
        message: 'Accepting connections requires the Team plan.'
      })
    } else {
      toaster.push(err?.message || 'Could not accept invitation')
    }
  } finally {
    actingId.value = null
    actingType.value = null
  }
}

async function onDecline(inv) {
  actingId.value = inv.id
  actingType.value = 'decline'
  try {
    await connections.decline(inv.token || inv.id)
  } catch (err) {
    toaster.push(err?.message || 'Could not decline invitation')
  } finally {
    actingId.value = null
    actingType.value = null
  }
}

async function onRemove(item) {
  const confirmed = await confirm.show({
    title: 'Remove connection',
    message: item.email
        ? `Remove ${item.email} from your connections? In-flight delegations stay open.`
        : `Cancel the invitation to ${item.invitee_email || item.inviter_email || 'this person'}?`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  actingId.value = item.id
  actingType.value = 'remove'
  try {
    await connections.remove(item.id)
  } catch (err) {
    toaster.push(err?.message || 'Could not remove')
  } finally {
    actingId.value = null
    actingType.value = null
  }
}

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  connections.loadAll().catch(() => {
    // Silent — UI handles empty state. Non-Team users still need received invitations loaded.
  })
})
</script>

<style scoped>
.connections-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.connections-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connections-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.connections-body {
  padding: 0 20px;
}

.connections-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row--column {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.settings-label {
  font-size: 14px;
  color: var(--color-text-primary);
}

.settings-hint {
  color: var(--color-text-secondary);
  margin: 0;
}

.settings-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--color-text-secondary);
}

.connections-invite-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 4px;
  width: 100%;
}

.connections-invite-row :deep(label) {
  flex: 1;
  width: auto;
}

.connections-invite-row :deep(input) {
  margin-top: 0;
  margin-bottom: 0;
}

.connections-list {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  width: 100%;
}

.connection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.connection-item:last-child {
  border-bottom: none;
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.connection-info .fw-medium {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-meta {
  color: var(--color-text-tertiary);
}

.connection-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .connections-body {
    padding: 0 12px;
  }
}
</style>
