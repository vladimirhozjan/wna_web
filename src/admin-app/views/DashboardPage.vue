<template>
  <div class="dashboard">
    <div class="dashboard-grid">
      <!-- System Health -->
      <Card title="System Health" subtitle="admin_service">
        <div v-if="dashboard.healthLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.healthData.value" class="health-widget">
          <div class="health-row">
            <StatusDot :color="dashboard.healthData.value.health?.status === 'OK' ? 'green' : 'red'" />
            <span class="text-body-s fw-medium">admin_service</span>
            <span class="text-caption color-text-tertiary health-version">
              {{ dashboard.healthData.value.version?.version || '—' }}
            </span>
          </div>
          <div v-if="dashboard.healthData.value.version" class="health-meta">
            <span class="text-caption color-text-tertiary">
              Build: {{ formatBuildTime(dashboard.healthData.value.version.build_time) }}
            </span>
            <span class="text-caption color-text-tertiary">
              {{ dashboard.healthData.value.version.git_commit?.slice(0, 8) }}
            </span>
          </div>
        </div>
        <p v-else class="text-caption color-text-tertiary">Unable to reach service.</p>
      </Card>

      <!-- Recent Admin Activity -->
      <Card title="Recent Admin Activity" class="span-2">
        <div v-if="dashboard.auditLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.auditData.value.length" class="audit-widget">
          <div v-for="entry in dashboard.auditData.value" :key="entry.id" class="audit-row">
            <div class="audit-row-main">
              <span class="text-body-s fw-medium audit-action">{{ formatAction(entry.action) }}</span>
              <span class="text-caption color-text-tertiary">{{ entry.details?.email || entry.target_id?.slice(0, 8) || '—' }}</span>
            </div>
            <span class="text-caption color-text-tertiary audit-time">{{ formatTime(entry.timestamp) }}</span>
          </div>
        </div>
        <p v-else class="text-caption color-text-tertiary">No audit log entries yet.</p>
        <template v-if="canViewAudit">
          <RouterLink to="/audit" class="text-caption widget-link">View all &rarr;</RouterLink>
        </template>
      </Card>

      <!-- Quick Actions -->
      <Card title="Quick Actions">
        <div class="quick-actions">
          <RouterLink v-if="hasMinRole(role, 'support')" to="/users" class="quick-action text-body-s">
            <svg class="quick-action-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="6" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
            Search Users
          </RouterLink>
          <RouterLink to="/health" class="quick-action text-body-s">
            <svg class="quick-action-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10h4l2-5 3 10 2-5h5"/></svg>
            System Health
          </RouterLink>
          <RouterLink v-if="hasMinRole(role, 'admin')" to="/audit" class="quick-action text-body-s">
            <svg class="quick-action-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2h10v16H5z"/><line x1="7.5" y1="6" x2="12.5" y2="6"/><line x1="7.5" y1="9" x2="12.5" y2="9"/></svg>
            Audit Log
          </RouterLink>
          <RouterLink v-if="hasMinRole(role, 'admin')" to="/feature-flags" class="quick-action text-body-s">
            <svg class="quick-action-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v16"/><path d="M3 3h11l-3 4 3 4H3"/></svg>
            Feature Flags
          </RouterLink>
        </div>
      </Card>

      <!-- Placeholder widgets for missing endpoints -->
      <Card title="User Overview" subtitle="Coming soon">
        <p class="text-caption color-text-tertiary">Awaiting backend endpoint.</p>
      </Card>

      <Card title="Platform Activity" subtitle="Coming soon">
        <p class="text-caption color-text-tertiary">Awaiting backend endpoint.</p>
      </Card>

      <Card title="Security Alerts" subtitle="Coming soon">
        <p class="text-caption color-text-tertiary">Awaiting backend endpoint.</p>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { format, parseISO } from 'date-fns'
import Card from '../components/Card.vue'
import Spinner from '../components/Spinner.vue'
import StatusDot from '../components/StatusDot.vue'
import { dashboardModel } from '../scripts/models/dashboardModel.js'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'

const dashboard = dashboardModel()
const auth = authModel()

const role = computed(() => auth.currentAdmin.value?.role)
const canViewAudit = computed(() => hasMinRole(role.value, 'admin'))

const ACTION_LABELS = {
  bootstrap_super_admin: 'Bootstrap Admin',
  password_reset_requested: 'Password Reset Requested',
  password_set: 'Password Set',
  otp_setup_completed: 'OTP Setup Completed',
  admin_created: 'Admin Created',
  admin_updated: 'Admin Updated',
  admin_disabled: 'Admin Disabled',
  admin_force_reset: 'Admin Force Reset',
  password_changed: 'Password Changed',
  otp_reset: 'OTP Reset',
}

function formatAction(action) {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ')
}

function formatTime(timestamp) {
  if (!timestamp) return '—'
  try {
    return format(parseISO(timestamp), 'MMM d, HH:mm')
  } catch {
    return timestamp
  }
}

function formatBuildTime(timestamp) {
  if (!timestamp) return '—'
  try {
    return format(parseISO(timestamp), 'MMM d, yyyy')
  } catch {
    return timestamp
  }
}

onMounted(() => {
  dashboard.startAutoRefresh(30000)
})

onUnmounted(() => {
  dashboard.stopAutoRefresh()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.span-2 {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}

/* Widget internals */
.widget-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* Health widget */
.health-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-version {
  margin-left: auto;
}

.health-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-subtle);
}

/* Audit widget */
.audit-widget {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.audit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.audit-row:last-child {
  border-bottom: none;
}

.audit-row-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.audit-action {
  color: var(--color-text-primary);
}

.audit-time {
  white-space: nowrap;
  margin-left: 12px;
}

/* Quick actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.quick-action:hover {
  background: var(--color-bg-secondary);
  color: var(--color-action);
}

.quick-action-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Widget link */
.widget-link {
  display: inline-block;
  margin-top: 10px;
  color: var(--color-link-text);
  text-decoration: none;
}

.widget-link:hover {
  color: var(--color-link-hover);
}
</style>
