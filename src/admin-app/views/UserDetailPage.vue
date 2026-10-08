<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/users" class="text-body-s back-link">&larr; Users</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!user" class="empty-state">
      <p class="text-body-m color-text-secondary">User not found.</p>
    </div>

    <div v-else class="detail">
      <!-- Profile -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Profile</h3>
        <div class="info-row">
          <span class="text-label color-text-secondary">Email</span>
          <span class="text-body-m fw-medium">{{ user.email }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Email Verified</span>
          <StatusDot :color="user.email_verified ? 'green' : 'gray'" :title="user.email_verified ? 'Verified' : 'Unverified'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Status</span>
          <Badge type="status" :value="user.disabled ? 'disabled' : 'active'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Tier</span>
          <Badge type="role" :value="user.subscription_tier || 'free'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Login Provider</span>
          <span class="text-body-s">{{ user.login_provider || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Created</span>
          <span class="text-body-s">{{ formatDate(user.created_at) }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Last Active</span>
          <span class="text-body-s">{{ formatDate(user.last_active) }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Email to Inbox</span>
          <span v-if="inboxEmailLoading" class="text-body-s color-text-tertiary">…</span>
          <span v-else-if="inboxEmailError" class="text-body-s color-text-danger">Failed to load</span>
          <button
              v-else-if="inboxEmail && inboxEmail.email"
              type="button"
              class="text-body-s row-link inbox-trigger"
              @click="showInboxModal = true"
          >
            <StatusDot
                :color="inboxEmail.enabled ? 'green' : 'gray'"
                :title="inboxEmail.enabled ? 'Capture is on' : 'Capture is paused'"
            />
            <span class="inbox-address">{{ inboxEmail.email }}</span>
          </button>
          <span v-else class="text-body-s color-text-tertiary">Not generated</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Sessions</span>
          <RouterLink :to="`/users/${user.id}/sessions`" class="text-body-s row-link">
            {{ user.session_summary?.active_count ?? 0 }} active · last login {{ formatDate(user.session_summary?.last_login_at) }} &rarr;
          </RouterLink>
        </div>
      </div>

      <!-- WNA Data Summary -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">WNA Summary</h3>
        <div v-if="user.wna_data" class="wna-grid">
          <Stat label="Inbox (Stuff)" :value="user.wna_data.stuff_count" />
          <Stat label="Next Actions" :value="user.wna_data.action_next" />
          <Stat label="Today" :value="user.wna_data.action_today" />
          <Stat label="Calendar" :value="user.wna_data.action_calendar" />
          <Stat label="Waiting" :value="user.wna_data.action_waiting" />
          <Stat label="Backlog" :value="user.wna_data.action_backlog" />
          <Stat label="Someday" :value="user.wna_data.action_someday" />
          <Stat label="Completed Actions" :value="user.wna_data.action_completed" />
          <Stat label="Active Projects" :value="user.wna_data.project_active" />
          <Stat label="Completed Projects" :value="user.wna_data.project_completed" />
          <Stat label="Someday Projects" :value="user.wna_data.project_someday" />
          <Stat label="Tags" :value="user.wna_data.tag_count" />
        </div>
        <RouterLink :to="`/content/${user.id}`" class="browse-btn">
          <svg class="browse-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h5l2 2h7v12H3V3z"/></svg>
          <div class="browse-text">
            <span class="text-body-s fw-medium">Browse User Data</span>
            <span class="text-caption color-text-tertiary">View inbox, actions, projects, tags, attachments</span>
          </div>
          <span class="text-body-s color-text-tertiary">&rarr;</span>
        </RouterLink>
      </div>

      <!-- Collaboration -->
      <div class="info-card card" :class="{ 'span-full': !isAdmin }">
        <h3 class="text-label color-text-secondary section-title">Collaboration</h3>
        <div v-if="collabLoading" class="inbox-loading">
          <Spinner />
        </div>
        <p v-else-if="collabError" class="text-body-s color-text-danger">{{ collabError }}</p>
        <div v-else class="tile-grid">
          <RouterLink v-for="t in collabTiles" :key="t.label" :to="t.to" class="tile">
            <Stat :label="t.label" :value="t.value" />
            <span class="text-caption color-text-tertiary">{{ t.detail }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="isAdmin" class="actions-card card">
        <h3 class="text-label color-text-secondary section-title">Actions</h3>

        <!-- Disable / Enable -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">{{ user.disabled ? 'Enable Account' : 'Disable Account' }}</span>
            <span class="text-caption color-text-tertiary">
              {{ user.disabled ? 'Re-activate this user account' : 'Block this user from logging in' }}
            </span>
          </div>
          <Btn
              :variant="user.disabled ? 'ghost' : 'ghost-danger'"
              size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleToggleDisabled"
          >
            {{ user.disabled ? 'Enable' : 'Disable' }}
          </Btn>
        </div>

        <!-- Reset Password -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Reset Password</span>
            <span class="text-caption color-text-tertiary">Send a password reset email to this user</span>
          </div>
          <Btn
              variant="secondary" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleResetPassword"
          >
            Reset
          </Btn>
        </div>

        <!-- Force Logout -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Force Logout</span>
            <span class="text-caption color-text-tertiary">Invalidate all active sessions</span>
          </div>
          <Btn
              variant="ghost-danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleForceLogout"
          >
            Force Logout
          </Btn>
        </div>

        <!-- Delete Account -->
        <div class="action-row action-row--danger">
          <div class="action-info">
            <span class="text-body-s fw-medium color-text-danger">Delete Account</span>
            <span class="text-caption color-text-tertiary">Soft-delete with 30-day grace period</span>
          </div>
          <Btn
              variant="danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleDelete"
          >
            Delete
          </Btn>
        </div>
      </div>

      <!-- Payments & Billing -->
      <div v-if="isAdmin" class="info-card card span-full">
        <h3 class="text-label color-text-secondary section-title">Payments &amp; Billing</h3>

        <!-- Current billing status -->
        <div class="info-row expiration-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Current status</span>
          </div>
          <div class="action-control">
            <Badge type="role" :value="user.subscription_tier || 'free'" />
            <template v-if="user.subscription">
              <Badge type="status" :value="user.subscription.status" />
              <span class="text-body-s color-text-secondary">{{ user.subscription.billing_period }} · expires on {{ expirationDisplay || '—' }}</span>
            </template>
            <span v-else class="text-body-s color-text-secondary">no subscription</span>
          </div>
        </div>

        <!-- Set subscription — one card, identical for every user -->
        <div class="info-row expiration-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Set subscription</span>
          </div>
          <div class="action-control">
            <select v-model="subTier" class="text-body-s select-input" :disabled="subSaving">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </select>
            <select v-model="subPeriod" class="text-body-s select-input" :disabled="subSaving || subTier === 'free'">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
                v-model="subExpiryInput"
                type="datetime-local"
                class="text-body-s select-input"
                title="Expiration (optional — defaults to one period)"
                :disabled="subSaving || subTier === 'free'"
            />
            <Btn
                variant="secondary" size="sm"
                :loading="subSaving"
                :disabled="subSaving || cancelSaving"
                @click="handleSaveSubscription"
            >
              Save
            </Btn>
          </div>
        </div>
        <div class="info-row expiration-row">
          <div class="action-info">
            <span class="text-caption color-text-tertiary">Tier changes here never touch {{ gatewayName }} billing — use Cancel on {{ gatewayName }} to stop charges</span>
            <span class="text-caption color-text-secondary">{{ gatewayCaption }}</span>
          </div>
          <div class="action-control">
            <Btn
                variant="ghost-danger" size="sm"
                :loading="cancelSaving"
                :disabled="subSaving || cancelSaving || gatewayState !== 'active'"
                @click="handleCancelGateway"
            >
              Cancel on {{ gatewayName }}
            </Btn>
          </div>
        </div>

        <div v-if="billingLoading" class="inbox-loading">
          <Spinner />
        </div>
        <p v-else-if="billingError" class="text-body-s color-text-danger billing-error">{{ billingError }}</p>
        <template v-else>
          <h4 class="text-label color-text-secondary subsection-title">Payments</h4>
          <div class="tile-grid">
            <RouterLink v-for="t in paymentTiles" :key="t.label" :to="t.to" class="tile">
              <Stat :label="t.label" :value="t.value" />
            </RouterLink>
          </div>
          <h4 class="text-label color-text-secondary subsection-title">Invoices</h4>
          <div class="tile-grid">
            <RouterLink v-for="t in invoiceTiles" :key="t.label" :to="t.to" class="tile">
              <Stat :label="t.label" :value="t.value" />
            </RouterLink>
          </div>
        </template>
      </div>
    </div>

    <!-- Email to Inbox Modal -->
    <Modal :visible="showInboxModal" title="Email to Inbox" @close="showInboxModal = false">
      <template v-if="inboxEmail">
        <div class="info-row">
          <span class="text-label color-text-secondary">Address</span>
          <span class="text-body-s inbox-address">{{ inboxEmail.email }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Capture</span>
          <StatusDot
              :color="inboxEmail.enabled ? 'green' : 'gray'"
              :title="inboxEmail.enabled ? 'Capture is on' : 'Capture is paused'"
          />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Used Today</span>
          <span class="text-body-s">{{ inboxEmail.emails_today ?? 0 }} of {{ inboxEmail.daily_limit ?? '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Created</span>
          <span class="text-body-s">{{ formatDate(inboxEmail.created_at) }}</span>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :visible="showDeleteModal" title="Delete User Account" @close="showDeleteModal = false">
      <p class="text-body-s">
        This will soft-delete the account with a 30-day grace period. Type the user's email to confirm:
      </p>
      <p class="text-body-s fw-semibold delete-email">{{ user?.email }}</p>
      <Inpt
          v-model="deleteEmailInput"
          type="email"
          placeholder="Type email to confirm"
          :disabled="actionLoading"
      />
      <p v-if="deleteError" class="text-body-s color-text-danger delete-error">{{ deleteError }}</p>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="showDeleteModal = false" :disabled="actionLoading">Cancel</Btn>
        <Btn
            variant="danger" size="sm"
            :loading="actionLoading"
            :disabled="actionLoading || deleteEmailInput !== user?.email"
            @click="confirmDelete"
        >
          Delete Account
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import StatusDot from '../components/StatusDot.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient, { gatewayLabel } from '../scripts/core/apiClient.js'

const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const user = ref(null)
const loading = ref(true)
const actionLoading = ref(false)

// Inbox address + usage
const inboxEmail = ref(null)
const inboxEmailLoading = ref(true)
const inboxEmailError = ref(false)
const showInboxModal = ref(false)

const role = computed(() => auth.currentAdmin.value?.role)
const isAdmin = computed(() => hasMinRole(role.value, 'admin'))

// Stat tiles — each card loads on its own (D14)
const collabStats = ref(null)
const collabLoading = ref(true)
const collabError = ref('')
const billingStats = ref(null)
const billingLoading = ref(true)
const billingError = ref('')

// Payments & billing
const expirationDisplay = ref('')
const subTier = ref('free')
const subPeriod = ref('monthly')
const subExpiryInput = ref('')
const subSaving = ref(false)
const cancelSaving = ref(false)
// 'checking' | 'active' | <gateway status verbatim> | 'no-subscription' | 'unreachable'
const gatewayState = ref('checking')
const gatewayNextCharge = ref(null)
// Known only once the gateway-subscription lookup answers; generic wording until then
const gatewayProvider = ref(null)

const gatewayName = computed(() => gatewayProvider.value ? gatewayLabel(gatewayProvider.value) : 'gateway')

const gatewayCaption = computed(() => {
  const name = gatewayName.value
  const Name = name.charAt(0).toUpperCase() + name.slice(1)
  switch (gatewayState.value) {
    case 'checking': return `Checking ${name}…`
    case 'active': return `${Name} · Next charge on ${formatDate(gatewayNextCharge.value)}`
    case 'no-subscription': return `No ${name} subscription`
    case 'unreachable': return `${Name} unreachable`
    default: return `${Name} · ${gatewayState.value}`
  }
})

const collabTiles = computed(() => {
  const s = collabStats.value || {}
  const base = `/users/${route.params.id}`
  const c = s.connections || {}
  const sp = s.shared_projects || {}
  const d = s.delegations || {}
  return [
    { label: 'Connections', value: c.accepted ?? 0, detail: `${c.pending ?? 0} pending`, to: `${base}/connections` },
    { label: 'Shared Projects', value: (sp.owned ?? 0) + (sp.member ?? 0), detail: `${sp.owned ?? 0} owned · ${sp.member ?? 0} member`, to: `${base}/shared-projects` },
    { label: 'Delegations', value: (d.out_open ?? 0) + (d.in_open ?? 0), detail: `${d.out_open ?? 0} by them · ${d.in_open ?? 0} to them`, to: `${base}/delegations` },
  ]
})

const paymentTiles = computed(() => {
  const p = billingStats.value?.payments || {}
  const path = `/users/${route.params.id}/payments`
  return [
    { label: 'Total paid', value: formatEur(p.total_paid_minor ?? 0), to: { path, query: { status: 'paid' } } },
    { label: 'Paid', value: p.paid_count ?? 0, to: { path, query: { status: 'paid' } } },
    { label: 'Refunded', value: `${formatEur(p.refunded_total_minor ?? 0)} (${p.refunded_count ?? 0})`, to: { path, query: { kind: 'refund' } } },
    { label: 'Failed', value: p.failed_count ?? 0, to: { path, query: { status: 'failed' } } },
    { label: 'Last payment', value: formatDate(p.last_payment_at), to: { path } },
  ]
})

const invoiceTiles = computed(() => {
  const i = billingStats.value?.invoices || {}
  const path = `/users/${route.params.id}/invoices`
  return [
    { label: 'Invoices', value: i.invoice_count ?? 0, to: { path, query: { type: 'invoice' } } },
    { label: 'Credit notes', value: i.credit_note_count ?? 0, to: { path, query: { type: 'credit_note' } } },
    { label: 'Fiscal issues', value: i.fiscal_issue_count ?? 0, to: { path } },
    { label: 'Last issued', value: formatDate(i.last_issued_at), to: { path } },
  ]
})

// Delete modal state
const showDeleteModal = ref(false)
const deleteEmailInput = ref('')
const deleteError = ref('')

async function load() {
  loading.value = true
  try {
    user.value = await apiClient.getPlatformUser(route.params.id)
    if (user.value) {
      expirationDisplay.value = user.value.subscription_expires_at ? formatDate(user.value.subscription_expires_at) : ''
      subTier.value = user.value.subscription_tier || 'free'
      subPeriod.value = user.value.subscription?.billing_period || 'monthly'
      subExpiryInput.value = user.value.subscription_expires_at
          ? format(parseISO(user.value.subscription_expires_at), "yyyy-MM-dd'T'HH:mm")
          : ''
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to load user')
    user.value = null
  } finally {
    loading.value = false
  }
}

// Address + usage; 404 (none generated) / 403 (Free, not entitled) → empty state, no toast.
async function loadInboxEmail() {
  inboxEmailLoading.value = true
  inboxEmailError.value = false
  try {
    inboxEmail.value = await apiClient.getPlatformUserInboxEmail(route.params.id)
  } catch (err) {
    inboxEmail.value = null
    if (err.status !== 404 && err.status !== 403) {
      inboxEmailError.value = true
      toaster.push(err.message || 'Failed to load inbox email')
    }
  } finally {
    inboxEmailLoading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function loadCollabStats() {
  collabLoading.value = true
  collabError.value = ''
  try {
    collabStats.value = await apiClient.getPlatformUserCollaborationStats(route.params.id)
  } catch (err) {
    collabError.value = err.message || 'Failed to load collaboration stats'
  } finally {
    collabLoading.value = false
  }
}

async function loadBillingStats() {
  if (!isAdmin.value) return
  billingLoading.value = true
  billingError.value = ''
  try {
    billingStats.value = await apiClient.getPlatformUserBillingStats(route.params.id)
  } catch (err) {
    billingError.value = err.message || 'Failed to load billing stats'
  } finally {
    billingLoading.value = false
  }
}

// Fired after the user-detail load, never awaited by the page; any failure lands in 'unreachable'.
async function loadGatewaySubscription() {
  if (!hasMinRole(role.value, 'admin')) return
  gatewayState.value = 'checking'
  gatewayNextCharge.value = null
  gatewayProvider.value = null
  try {
    const data = await apiClient.getGatewaySubscription(route.params.id)
    gatewayProvider.value = data?.provider || null
    if (!data?.present) {
      gatewayState.value = 'no-subscription'
      return
    }
    gatewayState.value = data.status
    gatewayNextCharge.value = data.next_charge_on || null
  } catch {
    gatewayState.value = 'unreachable'
  }
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

function parseSubExpiry() {
  if (!subExpiryInput.value) return ''
  const d = new Date(subExpiryInput.value)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

async function handleSaveSubscription() {
  const free = subTier.value === 'free'
  const expiresAt = parseSubExpiry()
  if (!free && expiresAt === null) {
    toaster.push('Enter a valid expiration date and time')
    return
  }

  const until = expiresAt
      ? `until ${formatDate(expiresAt)}`
      : `for one ${subPeriod.value === 'yearly' ? 'year' : 'month'}`
  const confirmed = await confirm.show({
    title: 'Set Subscription',
    message: free
        ? `Remove ${user.value.email}'s subscription? The account drops to Free immediately. Gateway billing is not touched.`
        : `Set ${user.value.email} to ${subTier.value === 'team' ? 'Team' : 'Pro'} (${subPeriod.value}) ${until}? Gateway billing is not touched.`,
    confirmText: free ? 'Remove' : 'Save',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  subSaving.value = true
  try {
    await apiClient.setSubscription(user.value.id, free
        ? { tier: 'free' }
        : { tier: subTier.value, billingPeriod: subPeriod.value, expiresAt })
    toaster.success(free ? 'Subscription removed' : 'Subscription updated')
    await load()
    loadBillingStats()
    loadGatewaySubscription()
  } catch (err) {
    toaster.push(err.message || 'Failed to set subscription')
  } finally {
    subSaving.value = false
  }
}

async function handleCancelGateway() {
  const name = gatewayName.value
  const confirmed = await confirm.show({
    title: `Cancel on ${name}`,
    message: `Cancel ${user.value.email}'s subscription on ${name}? Billing stops at the gateway (cancel at period end); access runs until expiry.`,
    confirmText: `Cancel on ${name}`,
    cancelText: 'Keep',
  })
  if (!confirmed) return

  cancelSaving.value = true
  try {
    await apiClient.cancelGateway(user.value.id)
    toaster.success(`${name} subscription cancelled — billing stops at period end`)
    await load()
    loadBillingStats()
    loadGatewaySubscription()
  } catch (err) {
    if (err.status === 404) {
      toaster.push(`Nothing to cancel on ${name}`)
    } else if (err.status === 502) {
      toaster.push(`${name} gateway failed — nothing was changed`)
    } else {
      toaster.push(err.message || `Failed to cancel on ${name}`)
    }
  } finally {
    cancelSaving.value = false
  }
}

async function handleToggleDisabled() {
  const isDisabled = user.value.disabled
  const action = isDisabled ? 'enable' : 'disable'
  const confirmed = await confirm.show({
    title: `${isDisabled ? 'Enable' : 'Disable'} Account`,
    message: `Are you sure you want to ${action} ${user.value.email}?`,
    confirmText: isDisabled ? 'Enable' : 'Disable',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    if (isDisabled) {
      await apiClient.enablePlatformUser(user.value.id)
    } else {
      await apiClient.disablePlatformUser(user.value.id)
    }
    toaster.success(`Account ${action}d`)
    await load()
  } catch (err) {
    toaster.push(err.message || `Failed to ${action} account`)
  } finally {
    actionLoading.value = false
  }
}

async function handleResetPassword() {
  const confirmed = await confirm.show({
    title: 'Reset Password',
    message: `Send a password reset email to ${user.value.email}?`,
    confirmText: 'Reset Password',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.resetPlatformUserPassword(user.value.id)
    toaster.success('Password reset email sent')
  } catch (err) {
    toaster.push(err.message || 'Failed to send reset email')
  } finally {
    actionLoading.value = false
  }
}

async function handleForceLogout() {
  const confirmed = await confirm.show({
    title: 'Force Logout',
    message: `Invalidate all sessions for ${user.value.email}?`,
    confirmText: 'Force Logout',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.forceLogoutPlatformUser(user.value.id)
    toaster.success('All sessions invalidated')
  } catch (err) {
    toaster.push(err.message || 'Failed to force logout')
  } finally {
    actionLoading.value = false
  }
}

function handleDelete() {
  deleteEmailInput.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (deleteEmailInput.value !== user.value.email) {
    deleteError.value = 'Email does not match'
    return
  }

  actionLoading.value = true
  deleteError.value = ''
  try {
    await apiClient.deletePlatformUser(user.value.id, deleteEmailInput.value)
    toaster.success('Account deleted (30-day grace period)')
    showDeleteModal.value = false
    await load()
  } catch (err) {
    deleteError.value = err.message || 'Failed to delete account'
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  load().then(loadGatewaySubscription)
  loadInboxEmail()
  loadCollabStats()
  loadBillingStats()
})
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 1400px;
}

.page-header {
  margin-bottom: 20px;
}

.back-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.detail > .card {
  margin-bottom: 0;
}

.span-full {
  grid-column: 1 / -1;
}

.info-card {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-row:last-child {
  border-bottom: none;
}

/* WNA grid */
.wna-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
}

/* Linked rows (Email to Inbox, Sessions) */
.row-link {
  color: var(--color-link-text);
  text-decoration: none;
  text-align: right;
}

.row-link:hover {
  color: var(--color-link-hover);
}

.inbox-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* Stat tiles */
.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.tile:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-light);
}

/* Actions card */
.actions-card {
  padding: 20px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.action-row:last-child,
.action-row:has(+ .action-row--danger) {
  border-bottom: none;
}

.action-row--danger {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.select-input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

/* Browse User Data link */
.browse-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  text-decoration: none;
  color: var(--color-text-primary);
  border-radius: 8px;
  transition: background 0.15s;
}

.browse-btn:hover {
  background: var(--color-bg-secondary);
}

.browse-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--color-action);
}

.browse-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

/* Payments & Billing */
.subsection-title {
  margin: 16px 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.expiration-row {
  gap: 16px;
}

.billing-error {
  margin: 16px 0 0;
}

/* Email to Inbox */
.inbox-address {
  font-family: var(--font-family-mono);
  word-break: break-all;
  text-align: right;
}

.inbox-loading {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

/* Delete modal */
.delete-email {
  margin: 8px 0;
  font-family: var(--font-family-mono);
}

.delete-error {
  margin: 8px 0 0;
}

@media (max-width: 1024px) {
  .detail {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>