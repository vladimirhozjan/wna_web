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
      </div>

      <!-- WNA Data Summary -->
      <div v-if="user.wna_data" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">WNA Summary</h3>
        <div class="wna-grid">
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
      </div>

      <!-- Email to Inbox -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Email to Inbox</h3>

        <div v-if="inboxEmailLoading" class="inbox-loading">
          <Spinner />
        </div>

        <template v-else-if="inboxEmail && inboxEmail.email">
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

        <div v-else class="info-row inbox-empty">
          <span class="text-body-s color-text-tertiary">No inbox address generated.</span>
        </div>
      </div>

      <!-- Login History -->
      <div v-if="user.login_history && user.login_history.length" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Login History</h3>
        <div class="login-history">
          <div v-for="session in user.login_history" :key="session.id" class="history-row">
            <div class="history-main">
              <span class="text-body-s fw-medium">{{ session.device || 'Unknown device' }}</span>
              <span class="text-caption color-text-tertiary">IP: {{ session.ip || '—' }}</span>
            </div>
            <div class="history-times">
              <span class="text-caption color-text-tertiary">Login: {{ formatDate(session.created_at) }}</span>
              <span class="text-caption color-text-tertiary">Active: {{ formatDate(session.last_active) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Collaboration (connections, shared projects, delegations) -->
      <UserCollaboration v-if="hasMinRole(role, 'support')" :user-id="user.id" :user-email="user.email" />

      <!-- Payments & Billing -->
      <div v-if="hasMinRole(role, 'admin')" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Payments &amp; Billing</h3>

        <div v-if="paymentsLoading" class="inbox-loading">
          <Spinner />
        </div>

        <template v-else>
          <!-- Subscription — grant (free) / edit granted / read-only Paywiser -->
          <div v-if="!user.subscription" class="info-row expiration-row">
            <div class="action-info">
              <span class="text-body-s fw-medium">Subscription</span>
              <span class="text-caption color-text-tertiary">Free — grant an admin subscription (no payment gateway; the expiry sweep ends it)</span>
            </div>
            <div class="action-control">
              <select v-model="grantPlan" class="text-body-s select-input" :disabled="grantSaving">
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </select>
              <select v-model="grantPeriod" class="text-body-s select-input" :disabled="grantSaving">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                  v-model="grantExpiryInput"
                  type="datetime-local"
                  class="text-body-s select-input"
                  title="Expiration (optional — defaults to one period)"
                  :disabled="grantSaving"
              />
              <Btn
                  variant="secondary" size="sm"
                  :loading="grantSaving"
                  :disabled="grantSaving"
                  @click="handleGrantSubscription"
              >
                Grant
              </Btn>
            </div>
          </div>

          <template v-else-if="user.subscription.source === 'granted'">
            <div class="info-row expiration-row">
              <div class="action-info">
                <span class="text-body-s fw-medium">Subscription <Badge type="status" :value="user.subscription.status" /></span>
                <span class="text-caption color-text-tertiary">Admin-granted — never auto-renews; the expiry sweep ends it</span>
              </div>
              <div class="action-control">
                <select v-model="grantPlan" class="text-body-s select-input" :disabled="grantSaving">
                  <option value="pro">Pro</option>
                  <option value="team">Team</option>
                </select>
                <select v-model="grantPeriod" class="text-body-s select-input" :disabled="grantSaving">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input
                    v-model="grantExpiryInput"
                    type="datetime-local"
                    class="text-body-s select-input"
                    :disabled="grantSaving"
                />
                <Btn
                    variant="secondary" size="sm"
                    :loading="grantSaving"
                    :disabled="grantSaving"
                    @click="handleSaveSubscription"
                >
                  Save
                </Btn>
              </div>
            </div>
            <div class="info-row expiration-row">
              <div class="action-info">
                <span class="text-caption color-text-tertiary">Extend by one billing period, or revoke to Free immediately</span>
              </div>
              <div class="action-control">
                <Btn
                    variant="secondary" size="sm"
                    :loading="grantSaving"
                    :disabled="grantSaving"
                    @click="handleRenewSubscription"
                >
                  Renew +1 {{ grantPeriod === 'yearly' ? 'year' : 'month' }}
                </Btn>
                <Btn
                    variant="ghost-danger" size="sm"
                    :disabled="grantSaving"
                    @click="handleRevokeSubscription"
                >
                  Revoke
                </Btn>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="info-row expiration-row">
              <div class="action-info">
                <span class="text-body-s fw-medium">Subscription <Badge type="primary" value="Paywiser" /></span>
                <span class="text-caption color-text-tertiary">
                  {{ user.subscription_tier }} · {{ user.subscription.billing_period }} · {{ user.subscription.status }} ·
                  {{ user.subscription.status === 'active' ? 'renews' : 'expires' }} {{ expirationDisplay || '—' }}
                </span>
              </div>
            </div>

            <!-- Expiration override — Paywiser-backed only; granted subs edit expiry in the form above -->
            <div class="info-row expiration-row">
              <div class="action-info">
                <span class="text-body-s fw-medium">Subscription Expiration</span>
                <span class="text-caption color-text-tertiary">
                  {{ expirationDisplay ? `Current: ${expirationDisplay}` : 'No expiration set' }}
                </span>
              </div>
              <div class="action-control">
                <input
                    v-model="expirationInput"
                    type="datetime-local"
                    class="text-body-s select-input"
                    :disabled="expirationSaving"
                />
                <Btn
                    variant="secondary" size="sm"
                    :loading="expirationSaving"
                    :disabled="expirationSaving || !expirationInput"
                    @click="handleSetExpiration"
                >
                  Set
                </Btn>
                <Btn variant="ghost-danger" size="sm" :disabled="expirationSaving" @click="handleClearExpiration">
                  Clear
                </Btn>
              </div>
            </div>
          </template>

          <!-- Payment requests -->
          <h4 class="text-label color-text-secondary subsection-title">Payments</h4>
          <div v-if="!payments.length" class="info-row inbox-empty">
            <span class="text-body-s color-text-tertiary">No payments.</span>
          </div>
          <div v-else class="login-history">
            <div v-for="p in payments" :key="p.id" class="history-row">
              <div class="history-main">
                <span class="text-body-s fw-medium payment-kind">{{ p.kind }} · {{ formatEur(p.amount_minor) }}</span>
                <span class="text-caption color-text-tertiary">
                  {{ formatDate(p.created_at) }} · {{ p.billing_country || '—' }}<template v-if="p.vat_amount_minor != null"> · VAT {{ formatEur(p.vat_amount_minor) }}</template>
                </span>
              </div>
              <div class="payment-side">
                <Badge type="status" :value="p.status" />
                <Btn
                    v-if="p.kind !== 'refund' && p.status === 'paid'"
                    variant="ghost-danger" size="sm"
                    :loading="refundingId === p.id"
                    :disabled="refundingId !== null"
                    @click="handleRefund(p)"
                >
                  Refund
                </Btn>
              </div>
            </div>
          </div>

          <!-- Issued invoices -->
          <h4 class="text-label color-text-secondary subsection-title">Invoices</h4>
          <div v-if="!invoices.length" class="info-row inbox-empty">
            <span class="text-body-s color-text-tertiary">No invoices issued.</span>
          </div>
          <div v-else class="login-history">
            <template v-for="inv in invoices" :key="inv.id">
              <div class="history-row">
                <div class="history-main">
                  <span class="text-body-s fw-medium">{{ inv.invoice_number }}</span>
                  <span class="text-caption color-text-tertiary">
                    Issued {{ formatDate(inv.issued_at) }} · {{ formatEur(inv.amount_minor) }}
                  </span>
                </div>
                <Btn
                    variant="secondary" size="sm"
                    :loading="downloadingId === inv.id"
                    :disabled="downloadingId !== null"
                    @click="downloadInvoice(inv)"
                >
                  Download
                </Btn>
              </div>
              <div v-for="cn in inv.credit_notes || []" :key="cn.id" class="history-row credit-note-row">
                <div class="history-main">
                  <span class="text-body-s fw-medium">{{ cn.credit_note_number }}</span>
                  <span class="text-caption color-text-tertiary">
                    Issued {{ formatDate(cn.issued_at) }} · −{{ formatEur(cn.amount_minor) }}
                  </span>
                </div>
                <Btn
                    variant="secondary" size="sm"
                    :loading="downloadingId === cn.id"
                    :disabled="downloadingId !== null"
                    @click="downloadCreditNote(cn)"
                >
                  Download
                </Btn>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Actions -->
      <div v-if="hasMinRole(role, 'admin')" class="actions-card card">
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

        <!-- Delete Account (admin+) -->
        <div v-if="hasMinRole(role, 'admin')" class="action-row action-row--danger">
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

      <!-- Browse Data -->
      <div v-if="hasMinRole(role, 'support')" class="browse-card card">
        <RouterLink :to="`/content/${user.id}`" class="browse-btn">
          <svg class="browse-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h5l2 2h7v12H3V3z"/></svg>
          <div class="browse-text">
            <span class="text-body-s fw-medium">Browse User Data</span>
            <span class="text-caption color-text-tertiary">View inbox, actions, projects, tags, attachments</span>
          </div>
          <span class="text-body-s color-text-tertiary">&rarr;</span>
        </RouterLink>
      </div>
    </div>

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
import UserCollaboration from '../components/UserCollaboration.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { downloadDocumentPdf } from '../scripts/core/invoicePdf.js'

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

const role = computed(() => auth.currentAdmin.value?.role)

// Payments & billing
const paymentsLoading = ref(true)
const payments = ref([])
const refundingId = ref(null)
const downloadingId = ref(null)
const expirationInput = ref('')
const expirationSaving = ref(false)
const expirationDisplay = ref('')
const grantPlan = ref('pro')
const grantPeriod = ref('monthly')
const grantExpiryInput = ref('')
const grantSaving = ref(false)

// invoice rows carry no amount — taken from the backing payment
const invoices = computed(() => payments.value
    .filter(p => p.invoice)
    .map(p => ({ ...p.invoice, amount_minor: p.amount_minor })))

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
      grantPlan.value = user.value.subscription_tier === 'team' ? 'team' : 'pro'
      grantPeriod.value = user.value.subscription?.billing_period || 'monthly'
      grantExpiryInput.value = user.value.subscription?.source === 'granted' && user.value.subscription_expires_at
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
  try {
    inboxEmail.value = await apiClient.getPlatformUserInboxEmail(route.params.id)
  } catch (err) {
    if (err.status === 404 || err.status === 403) {
      inboxEmail.value = null
    } else {
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

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

async function loadPayments() {
  if (!hasMinRole(role.value, 'admin')) {
    paymentsLoading.value = false
    return
  }
  paymentsLoading.value = true
  try {
    const data = await apiClient.getPlatformUserPayments(route.params.id)
    payments.value = data.payments || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load payments')
  } finally {
    paymentsLoading.value = false
  }
}

async function handleRefund(p) {
  const confirmed = await confirm.show({
    title: 'Refund Payment',
    message: `Refund ${formatEur(p.amount_minor)} to ${user.value.email}? This returns the money only — the tier and expiration are not changed.`,
    confirmText: 'Refund',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  refundingId.value = p.id
  try {
    await apiClient.refundPlatformUserPayment(user.value.id, p.id)
    toaster.success('Payment refunded')
    await loadPayments()
  } catch (err) {
    toaster.push(err.message || 'Failed to refund payment')
  } finally {
    refundingId.value = null
  }
}

async function downloadInvoice(inv) {
  if (downloadingId.value) return
  downloadingId.value = inv.id
  try {
    const html = await apiClient.getPlatformUserInvoiceHtml(user.value.id, inv.id)
    await downloadDocumentPdf(html, `invoice-${inv.invoice_number}.pdf`)
  } catch (err) {
    toaster.push(err.message || 'Failed to download invoice')
  } finally {
    downloadingId.value = null
  }
}

async function downloadCreditNote(cn) {
  if (downloadingId.value) return
  downloadingId.value = cn.id
  try {
    const html = await apiClient.getPlatformUserCreditNoteHtml(user.value.id, cn.id)
    await downloadDocumentPdf(html, `credit-note-${cn.credit_note_number}.pdf`)
  } catch (err) {
    toaster.push(err.message || 'Failed to download credit note')
  } finally {
    downloadingId.value = null
  }
}

function parseGrantExpiry() {
  if (!grantExpiryInput.value) return ''
  const d = new Date(grantExpiryInput.value)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

async function doGrant(expiresAt, successMsg) {
  grantSaving.value = true
  try {
    await apiClient.grantSubscription(user.value.id, {
      plan: grantPlan.value,
      billingPeriod: grantPeriod.value,
      expiresAt,
    })
    toaster.success(successMsg)
    await load()
    await loadPayments()
  } catch (err) {
    toaster.push(err.status === 409
        ? 'Active Paywiser subscription — manage via payments'
        : (err.message || 'Failed to save subscription'))
  } finally {
    grantSaving.value = false
  }
}

async function handleGrantSubscription() {
  const expiresAt = parseGrantExpiry()
  if (expiresAt === null) {
    toaster.push('Enter a valid expiration date and time')
    return
  }

  const until = expiresAt
      ? `until ${formatDate(expiresAt)}`
      : `for one ${grantPeriod.value === 'yearly' ? 'year' : 'month'}`
  const confirmed = await confirm.show({
    title: 'Grant Subscription',
    message: `Grant ${user.value.email} an active ${grantPlan.value === 'team' ? 'Team' : 'Pro'} (${grantPeriod.value}) subscription ${until}? It has no payment gateway behind it and never renews — the expiry sweep ends it.`,
    confirmText: 'Grant',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  await doGrant(expiresAt, 'Subscription granted')
}

async function handleSaveSubscription() {
  const expiresAt = parseGrantExpiry()
  if (!expiresAt) {
    toaster.push('Enter a valid expiration date and time (or use Renew)')
    return
  }
  await doGrant(expiresAt, 'Subscription updated')
}

async function handleRenewSubscription() {
  await doGrant('', 'Subscription renewed')
}

async function handleRevokeSubscription() {
  const confirmed = await confirm.show({
    title: 'Revoke Subscription',
    message: `Revoke ${user.value.email}'s granted subscription? The account drops to Free immediately.`,
    confirmText: 'Revoke',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  grantSaving.value = true
  try {
    await apiClient.revokeSubscription(user.value.id)
    toaster.success('Subscription revoked')
    await load()
    await loadPayments()
  } catch (err) {
    toaster.push(err.status === 409
        ? 'Active Paywiser subscription — manage via payments'
        : (err.message || 'Failed to revoke subscription'))
  } finally {
    grantSaving.value = false
  }
}

async function handleSetExpiration() {
  const expiresAt = new Date(expirationInput.value)
  if (isNaN(expiresAt.getTime())) {
    toaster.push('Enter a valid date and time')
    return
  }

  const confirmed = await confirm.show({
    title: 'Set Subscription Expiration',
    message: `Set ${user.value.email}'s subscription expiration to ${formatDate(expiresAt.toISOString())}?`,
    confirmText: 'Set Expiration',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  expirationSaving.value = true
  try {
    const data = await apiClient.setSubscriptionExpiration(user.value.id, expiresAt.toISOString())
    expirationDisplay.value = formatDate(data.expires_at)
    toaster.success('Subscription expiration updated')
  } catch (err) {
    toaster.push(err.message || 'Failed to set expiration')
  } finally {
    expirationSaving.value = false
  }
}

async function handleClearExpiration() {
  const confirmed = await confirm.show({
    title: 'Clear Subscription Expiration',
    message: `Clear ${user.value.email}'s subscription expiration? The tier will no longer expire automatically.`,
    confirmText: 'Clear',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  expirationSaving.value = true
  try {
    await apiClient.setSubscriptionExpiration(user.value.id, '')
    expirationDisplay.value = ''
    expirationInput.value = ''
    toaster.success('Subscription expiration cleared')
  } catch (err) {
    toaster.push(err.message || 'Failed to clear expiration')
  } finally {
    expirationSaving.value = false
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
  load()
  loadInboxEmail()
  loadPayments()
})
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 800px;
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
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* Login history */
.login-history {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.history-row:last-child {
  border-bottom: none;
}

.history-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-times {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
  white-space: nowrap;
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

/* Browse card */
.browse-card {
  padding: 0;
}

.browse-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
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

.payment-kind {
  text-transform: capitalize;
}

.payment-side {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.credit-note-row {
  padding-left: 20px;
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

.inbox-empty {
  border-bottom: none;
}

/* Delete modal */
.delete-email {
  margin: 8px 0;
  font-family: var(--font-family-mono);
}

.delete-error {
  margin: 8px 0 0;
}

@media (max-width: 768px) {
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-times {
    text-align: left;
  }
}
</style>