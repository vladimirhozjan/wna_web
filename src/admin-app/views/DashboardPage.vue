<template>
  <div class="dashboard">
    <div class="dashboard-grid">
      <!-- System Health -->
      <Card title="System Health">
        <div v-if="dashboard.healthLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.healthData.value" class="health-widget">
          <div class="health-overall">
            <StatusDot :color="overallHealthColor" />
            <span class="text-body-s fw-medium">{{ dashboard.healthData.value.overall_status }}</span>
          </div>
          <div class="health-services">
            <div v-for="svc in dashboard.healthData.value.services" :key="svc.name" class="health-row">
              <StatusDot :color="svc.status === 'up' ? 'green' : 'red'" />
              <span class="text-body-s">{{ svc.name }}</span>
              <span class="text-caption color-text-tertiary health-version">
                {{ svc.version || svc.error || '—' }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-caption color-text-tertiary">Unable to reach services.</p>
      </Card>

      <!-- User Overview -->
      <Card title="User Overview">
        <div v-if="dashboard.userOverviewLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.userOverview.value" class="stats-grid">
          <Stat label="Total Users" :value="dashboard.userOverview.value.total_users" size="lg" />
          <Stat label="Signups Today" :value="dashboard.userOverview.value.signups_today" />
          <Stat label="Signups This Week" :value="dashboard.userOverview.value.signups_this_week" />
          <Stat label="DAU" :value="dashboard.userOverview.value.dau" />
          <Stat label="Active Sessions (15m)" :value="dashboard.userOverview.value.active_sessions_15min" />
        </div>
        <p v-else class="text-caption color-text-tertiary">Unable to load user stats.</p>
      </Card>

      <!-- Platform Activity -->
      <Card title="Platform Activity">
        <div v-if="dashboard.platformActivityLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.platformActivity.value" class="stats-grid">
          <Stat label="Total Stuff" :value="dashboard.platformActivity.value.total_stuff" />
          <Stat label="Total Actions" :value="dashboard.platformActivity.value.total_actions" />
          <Stat label="Total Projects" :value="dashboard.platformActivity.value.total_projects" />
          <Stat label="Completed Today" :value="dashboard.platformActivity.value.actions_completed_today" />
          <Stat label="Completed This Week" :value="dashboard.platformActivity.value.actions_completed_this_week" />
          <Stat label="Avg Inbox Size" :value="dashboard.platformActivity.value.avg_inbox_size" />
        </div>
        <p v-else class="text-caption color-text-tertiary">Unable to load platform stats.</p>
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

      <!-- Security Alerts -->
      <Card title="Security Alerts">
        <div v-if="dashboard.securityAlertsLoading.value" class="widget-loading">
          <Spinner size="sm" />
        </div>
        <div v-else-if="dashboard.securityAlerts.value" class="stats-grid">
          <Stat
              label="Failed Admin Logins (24h)"
              :value="dashboard.securityAlerts.value.failed_admin_logins_24h"
              :trend-direction="dashboard.securityAlerts.value.failed_admin_logins_24h > 5 ? 'up' : 'neutral'"
          />
        </div>
        <p v-else class="text-caption color-text-tertiary">Unable to load security alerts.</p>
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
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { format, parseISO } from 'date-fns'
import Card from '../components/Card.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import StatusDot from '../components/StatusDot.vue'
import { dashboardModel } from '../scripts/models/dashboardModel.js'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'

const dashboard = dashboardModel()
const auth = authModel()

const role = computed(() => auth.currentAdmin.value?.role)
const canViewAudit = computed(() => hasMinRole(role.value, 'admin'))

const overallHealthColor = computed(() => {
  const status = dashboard.healthData.value?.overall_status
  if (status === 'healthy') return 'green'
  if (status === 'degraded') return 'yellow'
  return 'red'
})

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
  user_disabled: 'User Disabled',
  user_enabled: 'User Enabled',
  user_deleted: 'User Deleted',
  user_logout_forced: 'User Force Logout',
  user_password_reset_requested: 'User Password Reset',
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

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

/* Health widget */
.health-overall {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-transform: capitalize;
}

.health-services {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.health-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-version {
  margin-left: auto;
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