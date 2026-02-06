<template>
  <DashboardLayout>
    <div class="settings-page">

      <!-- Header -->
      <div class="settings-header">
        <h1 class="text-h1 color-text-primary">Settings</h1>
      </div>

      <!-- Body -->
      <div class="settings-body">

        <!-- Account Section -->
        <div class="settings-section">
          <h2 class="settings-section-title">Account</h2>

          <div class="settings-row">
            <span class="settings-label">Email</span>
            <span class="settings-value">{{ userEmail }}</span>
          </div>

          <div class="settings-row">
            <span class="settings-label">Password</span>
            <Btn variant="ghost" size="sm" @click="openPasswordModal">Change Password</Btn>
          </div>
        </div>

        <!-- Sessions Section -->
        <div class="settings-section">
          <div class="settings-section-header">
            <h2 class="settings-section-title">Sessions</h2>
            <Btn
                v-if="sessions.length > 1"
                variant="ghost"
                size="sm"
                :loading="revokingAll"
                @click="onRevokeAllSessions"
            >
              End Others
            </Btn>
          </div>

          <div v-if="loadingSessions" class="settings-loading">
            <span class="settings-spinner"></span>
            <span>Loading sessions...</span>
          </div>

          <div v-else-if="sessionsError" class="settings-error">
            <span>{{ sessionsError }}</span>
            <Btn variant="ghost" size="sm" @click="loadSessions">Retry</Btn>
          </div>

          <div v-else-if="sessions.length === 0" class="settings-empty">
            No active sessions found.
          </div>

          <div v-else class="sessions-list">
            <div
                v-for="session in sessions"
                :key="session.id"
                class="session-item"
                :class="{ 'session-item--current': session.is_current }"
            >
              <div class="session-info">
                <div class="session-device">
                  <span class="session-icon">{{ getDeviceIcon(session) }}</span>
                  <span class="session-name">{{ session.device || 'Unknown Device' }}</span>
                  <span v-if="session.is_current" class="session-badge">Current</span>
                </div>
                <div class="session-details">
                  <span v-if="session.ip">{{ session.ip }}</span>
                  <span v-if="session.ip && session.last_active" class="session-separator">·</span>
                  <span v-if="session.last_active">{{ formatSessionTime(session.last_active) }}</span>
                </div>
              </div>
              <ActionBtn
                  v-if="session.is_current"
                  variant="primary"
                  :loading="loggingOut"
                  @click="onLogout"
              />
              <ActionBtn
                  v-else
                  variant="primary"
                  :loading="revokingId === session.id"
                  @click="onRevokeSession(session.id)"
              />
            </div>
          </div>
        </div>

        <!-- Application Section -->
        <div class="settings-section">
          <h2 class="settings-section-title">Application</h2>

          <div class="settings-row">
            <span class="settings-label">New items position in the list</span>
            <Select
                v-model="addPosition"
                :options="positionOptions"
                title="New items position"
            />
          </div>
        </div>

        <!-- About Section -->
        <div class="settings-section">
          <h2 class="settings-section-title">About</h2>

          <div class="settings-row">
            <span class="settings-label">Version</span>
            <span class="settings-value">{{ appVersion }}</span>
          </div>

          <div class="settings-row">
            <span class="settings-label">Debug Mode</span>
            <label class="settings-toggle">
              <input type="checkbox" v-model="debugMode" />
              <span class="settings-toggle-slider"></span>
            </label>
          </div>
        </div>

      </div>

      <!-- Change Password Modal -->
      <Teleport to="body" v-if="showPasswordModal">
        <div class="password-modal-overlay" :class="{ 'password-modal-overlay--fullscreen': isMobile }">
          <div class="password-modal" :class="{ 'password-modal--fullscreen': isMobile }">
            <div class="password-modal-header">
              <h2 class="password-modal-title">Change Password</h2>
              <button class="password-modal-close" @click="closePasswordModal">&times;</button>
            </div>

            <div class="password-modal-body">
              <Inpt
                  ref="currentPasswordInput"
                  v-model="currentPassword"
                  v-model:error="currentPasswordError"
                  type="password"
                  title="Current Password"
                  placeholder="Enter current password"
                  @enter="onChangePassword"
              />

              <Inpt
                  v-model="newPassword"
                  v-model:error="newPasswordError"
                  type="password"
                  title="New Password"
                  placeholder="Enter new password"
                  @enter="onChangePassword"
              />

              <Inpt
                  v-model="confirmPassword"
                  v-model:error="confirmPasswordError"
                  type="password"
                  title="Confirm New Password"
                  placeholder="Confirm new password"
                  @enter="onChangePassword"
              />
            </div>

            <div class="password-modal-footer">
              <Btn variant="ghost" size="md" @click="closePasswordModal" :disabled="changingPassword">
                Cancel
              </Btn>
              <Btn
                  variant="primary"
                  size="md"
                  :loading="changingPassword"
                  :disabled="!canChangePassword"
                  @click="onChangePassword"
              >
                Change Password
              </Btn>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import ActionBtn from '../components/ActionBtn.vue'
import Select from '../components/Select.vue'
import { authModel } from '../scripts/authModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import { changePassword, listSessions, revokeSession, revokeAllSessions } from '../scripts/apiClient.js'

const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

// User data
const userEmail = computed(() => auth.currentUser.value?.email || '')

// App version from Vite define
const appVersion = __APP_VERSION__

// Preferences
const addPosition = ref(localStorage.getItem('pref-add-position') || 'end')
const debugMode = ref(localStorage.getItem('debug-window') !== null)

const positionOptions = [
  { value: 'end', label: 'End' },
  { value: 'beginning', label: 'Beginning' }
]

// Password modal state
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const currentPasswordError = ref('')
const newPasswordError = ref('')
const confirmPasswordError = ref('')
const changingPassword = ref(false)
const currentPasswordInput = ref(null)

// Sessions state
const sessions = ref([])
const loadingSessions = ref(false)
const sessionsError = ref(null)
const revokingId = ref(null)
const revokingAll = ref(false)

// Other state
const isMobile = ref(false)
const loggingOut = ref(false)

// Computed
const canChangePassword = computed(() => {
  return currentPassword.value.trim() &&
      newPassword.value.trim() &&
      confirmPassword.value.trim() &&
      !changingPassword.value
})

// Watch preferences and sync to localStorage
watch(addPosition, (val) => {
  localStorage.setItem('pref-add-position', val)
})

watch(debugMode, (val) => {
  if (val) {
    localStorage.setItem('debug-window', 'true')
  } else {
    localStorage.removeItem('debug-window')
  }
  // Notify App.vue about the change
  window.dispatchEvent(new CustomEvent('debug-mode-changed', { detail: val }))
})

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadSessions()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

// Sessions functions
async function loadSessions() {
  loadingSessions.value = true
  sessionsError.value = null
  try {
    const data = await listSessions()
    sessions.value = Array.isArray(data) ? data : (data.sessions || [])
  } catch (err) {
    sessionsError.value = err.message || 'Failed to load sessions'
  } finally {
    loadingSessions.value = false
  }
}

function getDeviceIcon(session) {
  const device = (session.device || '').toLowerCase()
  if (device.includes('mobile') || device.includes('iphone') || device.includes('android')) {
    return '📱'
  }
  if (device.includes('tablet') || device.includes('ipad')) {
    return '📱'
  }
  return '💻'
}

function formatSessionTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

async function onRevokeSession(sessionId) {
  const confirmed = await confirm.show({
    title: 'End Session',
    message: 'Are you sure you want to end this session? The device will be signed out within the next hour.',
    confirmText: 'End Session',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  revokingId.value = sessionId
  try {
    await revokeSession(sessionId)
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    toaster.success('Session ended')
  } catch (err) {
    toaster.push(err.message || 'Failed to end session')
  } finally {
    revokingId.value = null
  }
}

async function onRevokeAllSessions() {
  const otherCount = sessions.value.filter(s => !s.is_current).length
  const confirmed = await confirm.show({
    title: 'End All Other Sessions',
    message: `Are you sure you want to end all other sessions? ${otherCount} device${otherCount !== 1 ? 's' : ''} will be signed out within the next hour.`,
    confirmText: 'End All',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  revokingAll.value = true
  try {
    await revokeAllSessions()
    sessions.value = sessions.value.filter(s => s.is_current)
    toaster.success('All other sessions ended')
  } catch (err) {
    toaster.push(err.message || 'Failed to end sessions')
  } finally {
    revokingAll.value = false
  }
}

// Password modal functions
function openPasswordModal() {
  showPasswordModal.value = true
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  currentPasswordError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''
  nextTick(() => {
    currentPasswordInput.value?.focus()
  })
}

function closePasswordModal() {
  showPasswordModal.value = false
}

async function onChangePassword() {
  // Validate
  currentPasswordError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''

  if (!currentPassword.value.trim()) {
    currentPasswordError.value = 'Current password is required'
    return
  }

  if (!newPassword.value.trim()) {
    newPasswordError.value = 'New password is required'
    return
  }

  if (newPassword.value.length < 8) {
    newPasswordError.value = 'Password must be at least 8 characters'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return
  }

  changingPassword.value = true
  try {
    await changePassword(currentPassword.value, newPassword.value)
    toaster.success('Password changed successfully')
    closePasswordModal()
  } catch (err) {
    const msg = err.message || 'Failed to change password'
    // Try to show error on appropriate field
    if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
      currentPasswordError.value = msg
    } else {
      newPasswordError.value = msg
    }
  } finally {
    changingPassword.value = false
  }
}

// Account actions
async function onLogout() {
  const confirmed = await confirm.show({
    title: 'Log out',
    message: 'Are you sure you want to log out?',
    confirmText: 'Log out',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  loggingOut.value = true
  auth.logoutUser()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-header {
  flex-shrink: 0;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.settings-header h1 {
  margin: 0;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Sections */
.settings-section {
  margin-bottom: 32px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.settings-section-header .settings-section-title {
  margin: 0;
  padding: 0;
  border: none;
}

.settings-section-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

/* Rows */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
}

.settings-value {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
}

/* Loading, error, empty states */
.settings-loading,
.settings-error,
.settings-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
}

.settings-error {
  color: var(--color-danger);
}

.settings-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sessions list */
.sessions-list {
  display: flex;
  flex-direction: column;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.session-item:last-child {
  border-bottom: none;
}

.session-item--current {
  background: var(--color-bg-secondary);
  margin: 0 -12px;
  padding: 12px;
  border-radius: 8px;
  border-bottom: none;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-device {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-icon {
  font-size: 16px;
}

.session-name {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  font-weight: 500;
  color: var(--color-text-primary);
}

.session-badge {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-action);
  background: rgba(37, 99, 235, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.session-details {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
}

.session-separator {
  color: var(--color-text-tertiary);
}

/* Toggle switch */
.settings-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.settings-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.settings-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 24px;
  transition: 0.2s;
}

.settings-toggle-slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.settings-toggle input:checked + .settings-toggle-slider {
  background-color: var(--color-action);
  border-color: var(--color-action);
}

.settings-toggle input:checked + .settings-toggle-slider::before {
  transform: translateX(20px);
}

/* Password Modal */
.password-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.password-modal-overlay--fullscreen {
  padding: 0;
  background: var(--color-bg-primary);
}

.password-modal {
  background: var(--color-bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.password-modal--fullscreen {
  max-width: none;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.password-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.password-modal-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.password-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.password-modal-close:hover {
  color: var(--color-text-primary);
}

.password-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password-modal--fullscreen .password-modal-body {
  flex: 1;
}

.password-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-light);
}

/* Responsive */
@media (max-width: 768px) {
  .settings-body {
    padding: 12px;
  }

  .settings-row {
    padding: 12px 0;
  }

  .session-item--current {
    margin: 0 -8px;
    padding: 12px 8px;
  }

  .session-name {
    word-break: break-word;
  }
}
</style>
