<template>
  <DashboardLayout>
    <div class="overdue-page">
      <div class="overdue-header">
        <h1 class="page-title">Overdue</h1>
      </div>

      <div class="overdue-content">
        <div class="card">
          <div class="empty-state">
            <WarningIcon class="empty-state__icon" />
            <h2 class="text-h3 empty-state__title">No overdue items</h2>
            <p class="text-body-m empty-state__text">
              You're all caught up. Overdue actions will appear here when they pass their due date.
            </p>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
</script>

<style scoped>
.overdue-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.overdue-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.page-title {
  padding: 10px;
}

.overdue-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 10px 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-state__icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state__title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}
</style>
