<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">

      <ContextFilter />

      <!-- ENGAGE -->
      <div class="sidebar-section-label">Engage</div>

      <SidebarMenuItem
          label="Dashboard"
          :to="{ name: 'engage' }"
      >
        <template #icon><EngageIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Today"
          :to="{ name: 'today' }"
          :count="stats?.today?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday', 'completed']"
          @drop="onDropToToday"
      >
        <template #icon><TodayIcon :overdue="stats?.today?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Next Action"
          :to="{ name: 'next' }"
          :count="stats?.next?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday', 'completed', 'reference']"
          @drop="onDropToNextAction"
      >
        <template #icon><NextIcon :overdue="stats?.next?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Calendar"
          :to="{ name: 'calendar' }"
          :count="stats?.calendar?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday', 'completed']"
          @drop="onDropToCalendar"
      >
        <template #icon><CalendarIcon :overdue="stats?.calendar?.overdue > 0"/></template>
      </SidebarMenuItem>

      <!-- ORGANIZE -->
      <div class="sidebar-section-label">Organize</div>

      <SidebarMenuItem
          label="Inbox"
          :to="{ name: 'inbox' }"
          :count="stats?.inbox?.count"
          :accept-drop="['someday', 'completed', 'reference']"
          @drop="onDropToInbox"
      >
        <template #icon><InboxIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Projects"
          :to="{ name: 'projects' }"
          :count="stats?.projects?.count"
          :accept-drop="['stuff', 'action', 'someday', 'completed', 'reference']"
          @drop="onDropToProjects"
      >
        <template #icon><ProjectsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Waiting For"
          :to="{ name: 'waiting-for' }"
          :count="stats?.waiting?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday', 'completed']"
          @drop="onDropToWaitingFor"
      >
        <template #icon><WaitingIcon :overdue="stats?.waiting?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Someday / Maybe"
          :to="{ name: 'someday' }"
          :count="stats?.someday?.count"
          :accept-drop="['stuff', 'action', 'project', 'completed']"
          @drop="onDropToSomeday"
      >
        <template #icon><SomedayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Reference"
          :to="{ name: 'reference' }"
          :badge="referenceLabel"
          :accept-drop="['stuff', 'action', 'project']"
          @drop="onDropToReference"
      >
        <template #icon><ReferenceIcon/></template>
      </SidebarMenuItem>

      <!-- REFLECT -->
      <div v-if="settingsMdl.state.reviewEnabled" class="sidebar-section-label">Reflect</div>

      <SidebarMenuItem
          v-if="settingsMdl.state.reviewEnabled"
          label="Review"
          :to="{ name: 'review' }"
          :badge="reviewBadge"
          :badge-color="reviewBadgeColor"
      >
        <template #icon><ReviewIcon/></template>
      </SidebarMenuItem>

      <!-- ARCHIVE -->
      <div class="sidebar-section-label">Archive</div>

      <SidebarMenuItem
          label="Completed"
          :to="{ name: 'completed' }"
          :count="stats?.completed?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday']"
          @drop="onDropToCompleted"
      >
        <template #icon><CompletedIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Trash"
          :to="{ name: 'trash' }"
          :count="stats?.trash?.count"
          :accept-drop="['stuff', 'action', 'project', 'someday', 'completed']"
          @drop="onDropToTrash"
      >
        <template #icon><TrashIcon/></template>
      </SidebarMenuItem>

    </nav>

    <div class="sidebar-footer">

      <SidebarMenuItem label="Settings" :to="{ name: 'settings' }">
        <template #icon><SettingsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Logout" @click="logout">
        <template #icon><LogoutIcon/></template>
      </SidebarMenuItem>

    </div>
  </aside>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { authModel } from "../scripts/core/authModel.js";
import { errorModel } from "../scripts/core/errorModel.js";
import { stuffModel } from "../scripts/models/stuffModel.js";
import { nextActionModel } from "../scripts/models/nextActionModel.js";
import { todayModel } from "../scripts/models/todayModel.js";
import { waitingModel } from "../scripts/models/waitingModel.js";
import { somedayModel } from "../scripts/models/somedayModel.js";
import { calendarModel } from "../scripts/models/calendarModel.js";
import { moveModel } from "../scripts/models/moveModel.js";
import { statsModel } from "../scripts/models/statsModel.js";
import { projectModel } from "../scripts/models/projectModel.js";
import { completedModel } from "../scripts/models/completedModel.js";
import { overdueModel } from "../scripts/models/overdueModel.js";
import { trashModel } from "../scripts/models/trashModel.js";
import apiClient from "../scripts/core/apiClient.js";
import { useRouter } from "vue-router";

import SidebarMenuItem from "./SidebarMenuItem.vue";
import ContextFilter from "./ContextFilter.vue";
import NextIcon from "../assets/NextIcon.vue";
import CalendarIcon from "../assets/CalendarIcon.vue";
import TodayIcon from "../assets/TodayIcon.vue";
import InboxIcon from "../assets/InboxIcon.vue";
import ProjectsIcon from "../assets/ProjectsIcon.vue";
import SomedayIcon from "../assets/SomedayIcon.vue";
import WaitingIcon from "../assets/WaitingIcon.vue";
import ReferenceIcon from "../assets/ReferenceIcon.vue";
import CompletedIcon from "../assets/CompletedIcon.vue";
import TrashIcon from "../assets/TrashIcon.vue";
import SettingsIcon from "../assets/SettingsIcon.vue";
import LogoutIcon from "../assets/LogoutIcon.vue";
import ReviewIcon from "../assets/ReviewIcon.vue";
import EngageIcon from "../assets/EngageIcon.vue";
import { reviewModel } from "../scripts/models/reviewModel.js";
import { settingsModel } from "../scripts/models/settingsModel.js";
import { engageModel } from "../scripts/models/engageModel.js";

const auth = authModel();
const toaster = errorModel();
const mover = moveModel();
const { items: stuffItems, loadStuff } = stuffModel();
const { items: actionItems, loadActions: loadNextActions } = nextActionModel();
const { items: todayItems, loadActions: loadTodayActions } = todayModel();
const { items: waitingItems, loadWaiting } = waitingModel();
const { items: somedayItems, loadSomeday } = somedayModel();
const { items: calendarItems } = calendarModel();
const { items: projectItems, loadProjects } = projectModel();
const { items: completedItems, loadCompleted } = completedModel();
const { items: overdueItems, loadItems: loadOverdue } = overdueModel();
const { items: trashItems, loadTrash } = trashModel();
const { stats, loadStats, refreshStats } = statsModel();
const engage = engageModel();

function refreshAfterDrop() {
  refreshStats()
  if (engage.loaded.value) {
    engage.loadDashboard().catch(() => {})
  }
  // Reload all loaded list models to backfill removed items
  if (stuffItems.value.length)    loadStuff({ reset: true }).catch(() => {})
  if (actionItems.value.length)   loadNextActions({ reset: true }).catch(() => {})
  if (todayItems.value.length)    loadTodayActions({ reset: true }).catch(() => {})
  if (waitingItems.value.length)  loadWaiting({ reset: true }).catch(() => {})
  if (somedayItems.value.length)  loadSomeday({ reset: true }).catch(() => {})
  if (projectItems.value.length)  loadProjects({ reset: true }).catch(() => {})
  if (completedItems.value.length) loadCompleted({ reset: true }).catch(() => {})
  if (overdueItems.value.length)  loadOverdue({ reset: true }).catch(() => {})
  if (trashItems.value.length)    loadTrash({ reset: true }).catch(() => {})
}
const router = useRouter();
const { daysSinceReview } = reviewModel();
const settingsMdl = settingsModel();

const reviewBadge = computed(() => {
  const days = daysSinceReview.value;
  if (days === null || days < 1) return null;
  return `${days}d`;
});

const reviewBadgeColor = computed(() => {
  const days = daysSinceReview.value;
  if (days >= 14) return 'var(--color-danger)';
  if (days >= 7) return '#ea580c';
  return null;
});

onMounted(loadStats);

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

const referenceLabel = computed(() => {
  if (!stats.value?.reference) return null;
  const used = formatBytes(stats.value.reference.used_bytes);
  const quota = formatBytes(stats.value.reference.quota_bytes);
  return `${used} / ${quota}`;
});

async function logout() {
  const confirmed = await auth.logoutWithConfirm();
  if (confirmed) router.push({ name: "landing" });
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title;
  return title.slice(0, maxLen).trim() + '…';
}

async function onDropToInbox(data) {
  try {
    if (data.sourceType === 'someday' && data.type === 'STUFF') {
      await apiClient.activateStuff(data.id);
    } else if (data.sourceType === 'completed' && data.type === 'STUFF') {
      await apiClient.uncompleteStuff(data.id);
    } else if (data.sourceType === 'reference' && data.source_type === 1) {
      await apiClient.transformFileToOriginal(data.id, 'stuff');
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Inbox`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToNextAction(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
    } else if (data.sourceType === 'action') {
      if (data.state === 'NEXT') return;
      await apiClient.undeferAction(data.id);
    } else if (data.sourceType === 'project') {
      await apiClient.transformProjectToAction(data.id);
    } else if (data.sourceType === 'someday') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        removeFromSource(data);
        toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
        refreshAfterDrop();
        return;
      } else if (data.type === 'ACTION') {
        await apiClient.activateAction(data.id);
      } else if (data.type === 'PROJECT') {
        await apiClient.transformProjectToAction(data.id);
      } else return;
    } else if (data.sourceType === 'completed') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        removeFromSource(data);
        toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
        refreshAfterDrop();
        return;
      } else if (data.type === 'ACTION') {
        await apiClient.uncompleteAction(data.id);
      } else if (data.type === 'PROJECT') {
        await apiClient.transformProjectToAction(data.id);
      } else return;
    } else if (data.sourceType === 'reference' && data.source_type === 2) {
      await apiClient.transformFileToOriginal(data.id, 'action');
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToProjects(data) {
  // Reference file with source_type=3 → transform back to project
  if (data.sourceType === 'reference' && data.source_type === 3) {
    try {
      await apiClient.transformFileToOriginal(data.id, 'project');
      removeFromSource(data);
      toaster.success(`"${truncateTitle(data.title)}" restored to Projects`);
      refreshAfterDrop();
    } catch (err) {
      toaster.push(err.message || 'Failed to restore file');
    }
    return;
  }

  // Projects accepting a project from someday/completed = activate/uncomplete
  if ((data.sourceType === 'someday' || data.sourceType === 'completed') && data.type === 'PROJECT') {
    try {
      if (data.sourceType === 'someday') {
        await apiClient.activateProject(data.id);
      } else {
        await apiClient.uncompleteProject(data.id);
      }
      removeFromSource(data);
      toaster.success(`"${truncateTitle(data.title)}" moved to Projects`);
      refreshAfterDrop();
    } catch (err) {
      toaster.push(err.message || 'Failed to move item');
    }
    return;
  }

  const outcome = await mover.showOutcome()
  if (!outcome) return

  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToProject(data.id, {
        title: data.title,
        description: data.description || '',
        outcome
      });
    } else if (data.sourceType === 'action') {
      await apiClient.transformActionToProject(data.id, outcome);
    } else if (data.sourceType === 'someday' && data.type === 'ACTION') {
      await apiClient.transformActionToProject(data.id, outcome);
    } else if (data.sourceType === 'completed' && data.type === 'ACTION') {
      await apiClient.uncompleteAction(data.id);
      await apiClient.transformActionToProject(data.id, outcome);
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" converted to project`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToSomeday(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToSomeday(data.id);
    } else if (data.sourceType === 'action') {
      if (data.state === 'SOMEDAY') return;
      await apiClient.somedayAction(data.id);
    } else if (data.sourceType === 'project') {
      await apiClient.somedayProject(data.id);
    } else if (data.sourceType === 'completed') {
      // Uncomplete then someday
      if (data.type === 'STUFF') {
        await apiClient.uncompleteStuff(data.id);
        await apiClient.clarifyToSomeday(data.id);
      } else if (data.type === 'ACTION') {
        await apiClient.uncompleteAction(data.id);
        await apiClient.somedayAction(data.id);
      } else if (data.type === 'PROJECT') {
        await apiClient.uncompleteProject(data.id);
        await apiClient.somedayProject(data.id);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Someday`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToToday(data) {
  try {
    if (data.sourceType === 'stuff') {
      const result = await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
      await apiClient.todayAction(result.id);
    } else if (data.sourceType === 'action') {
      if (data.state === 'TODAY') return;
      await apiClient.todayAction(data.id);
    } else if (data.sourceType === 'project') {
      const result = await apiClient.transformProjectToAction(data.id);
      await apiClient.todayAction(result.id);
    } else if (data.sourceType === 'someday') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        await apiClient.todayAction(result.id);
      } else if (data.type === 'ACTION') {
        await apiClient.activateAction(data.id);
        await apiClient.todayAction(data.id);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.todayAction(result.id);
      } else return;
    } else if (data.sourceType === 'completed') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        await apiClient.todayAction(result.id);
      } else if (data.type === 'ACTION') {
        await apiClient.uncompleteAction(data.id);
        await apiClient.todayAction(data.id);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.todayAction(result.id);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Today`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToCalendar(data) {
  if (data.sourceType === 'action' && data.state === 'CALENDAR') return;

  const scheduleData = await mover.showSchedule({
    date: '',
    time: '',
    duration: null
  });

  if (!scheduleData || !scheduleData.date) return;

  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || '',
        deferType: 'scheduled',
        deferDate: scheduleData.date,
        deferTime: scheduleData.time || null,
        deferDuration: scheduleData.duration || null
      });
    } else if (data.sourceType === 'action') {
      await apiClient.deferAction(data.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
    } else if (data.sourceType === 'project') {
      const result = await apiClient.transformProjectToAction(data.id);
      await apiClient.deferAction(result.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
    } else if (data.sourceType === 'someday') {
      if (data.type === 'STUFF') {
        await apiClient.clarifyToAction(data.id, {
          title: data.title, description: data.description || '',
          deferType: 'scheduled', deferDate: scheduleData.date,
          deferTime: scheduleData.time || null, deferDuration: scheduleData.duration || null
        });
      } else if (data.type === 'ACTION') {
        await apiClient.activateAction(data.id);
        await apiClient.deferAction(data.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.deferAction(result.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
      } else return;
    } else if (data.sourceType === 'completed') {
      if (data.type === 'STUFF') {
        await apiClient.clarifyToAction(data.id, {
          title: data.title, description: data.description || '',
          deferType: 'scheduled', deferDate: scheduleData.date,
          deferTime: scheduleData.time || null, deferDuration: scheduleData.duration || null
        });
      } else if (data.type === 'ACTION') {
        await apiClient.uncompleteAction(data.id);
        await apiClient.deferAction(data.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.deferAction(result.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Calendar`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToWaitingFor(data) {
  if (data.sourceType === 'action' && data.state === 'WAITING') return;

  const waitingFor = await mover.showWaiting({
    waitingFor: ''
  });

  if (!waitingFor) return;

  try {
    if (data.sourceType === 'stuff') {
      const result = await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
      await apiClient.waitAction(result.id, waitingFor);
    } else if (data.sourceType === 'action') {
      await apiClient.waitAction(data.id, waitingFor);
    } else if (data.sourceType === 'project') {
      const result = await apiClient.transformProjectToAction(data.id);
      await apiClient.waitAction(result.id, waitingFor);
    } else if (data.sourceType === 'someday') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        await apiClient.waitAction(result.id, waitingFor);
      } else if (data.type === 'ACTION') {
        await apiClient.activateAction(data.id);
        await apiClient.waitAction(data.id, waitingFor);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.waitAction(result.id, waitingFor);
      } else return;
    } else if (data.sourceType === 'completed') {
      if (data.type === 'STUFF') {
        const result = await apiClient.clarifyToAction(data.id, { title: data.title, description: data.description || '' });
        await apiClient.waitAction(result.id, waitingFor);
      } else if (data.type === 'ACTION') {
        await apiClient.uncompleteAction(data.id);
        await apiClient.waitAction(data.id, waitingFor);
      } else if (data.type === 'PROJECT') {
        const result = await apiClient.transformProjectToAction(data.id);
        await apiClient.waitAction(result.id, waitingFor);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Waiting For`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToReference(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.transformStuffToFile(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.transformActionToFile(data.id);
    } else if (data.sourceType === 'project') {
      await apiClient.transformProjectToFile(data.id);
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Reference`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToCompleted(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.completeStuff(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.completeAction(data.id);
    } else if (data.sourceType === 'project') {
      await apiClient.completeProject(data.id);
    } else if (data.sourceType === 'someday') {
      if (data.type === 'STUFF') {
        await apiClient.completeStuff(data.id);
      } else if (data.type === 'ACTION') {
        await apiClient.completeAction(data.id);
      } else if (data.type === 'PROJECT') {
        await apiClient.completeProject(data.id);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" marked as completed`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to complete item');
  }
}

async function onDropToTrash(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.trashStuff(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.trashAction(data.id);
    } else if (data.sourceType === 'project') {
      await apiClient.trashProject(data.id);
    } else if (data.sourceType === 'someday' || data.sourceType === 'completed') {
      if (data.type === 'STUFF') {
        await apiClient.trashStuff(data.id);
      } else if (data.type === 'ACTION') {
        await apiClient.trashAction(data.id);
      } else if (data.type === 'PROJECT') {
        await apiClient.trashProject(data.id);
      } else return;
    } else {
      return;
    }
    removeFromSource(data);
    toaster.success(`"${truncateTitle(data.title)}" moved to Trash`);
    refreshAfterDrop();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

function removeFromInbox(id) {
  const idx = stuffItems.value.findIndex(i => i.id === id);
  if (idx !== -1) {
    stuffItems.value.splice(idx, 1);
  }
}

function removeFromActions(id) {
  // Remove from all action lists (Next, Today, Waiting, Someday, Calendar)
  for (const list of [actionItems, todayItems, waitingItems, somedayItems, calendarItems]) {
    const idx = list.value.findIndex(i => i.id === id);
    if (idx !== -1) list.value.splice(idx, 1);
  }
}

function removeFromProjects(id) {
  const idx = projectItems.value.findIndex(i => i.id === id);
  if (idx !== -1) projectItems.value.splice(idx, 1);
}

function removeFromCompleted(id) {
  const idx = completedItems.value.findIndex(i => i.id === id);
  if (idx !== -1) completedItems.value.splice(idx, 1);
}

function removeFromSource(data) {
  if (data.sourceType === 'stuff') removeFromInbox(data.id);
  else if (data.sourceType === 'action') removeFromActions(data.id);
  else if (data.sourceType === 'project') removeFromProjects(data.id);
  else if (data.sourceType === 'someday') {
    // Someday list has mixed types
    const idx = somedayItems.value.findIndex(i => i.id === data.id);
    if (idx !== -1) somedayItems.value.splice(idx, 1);
  }
  else if (data.sourceType === 'completed') removeFromCompleted(data.id);
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--color-sidebar-background);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px 0;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.sidebar-section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  padding: 16px 20px 4px;
}

.sidebar-section-label:first-child {
  padding-top: 4px;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border-light);
  padding: 8px 0 0;
  display: flex;
  flex-direction: column;
}
</style>
