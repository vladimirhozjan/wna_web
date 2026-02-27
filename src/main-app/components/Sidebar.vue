<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">

      <SidebarMenuItem
          label="Dashboard"
          :to="{ name: 'engage' }"
      >
        <template #icon><EngageIcon/></template>
      </SidebarMenuItem>

      <ContextFilter />

      <SidebarMenuItem
          label="Next Action"
          :to="{ name: 'next' }"
          :count="stats?.next?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToNextAction"
      >
        <template #icon><NextIcon :overdue="stats?.next?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Today"
          :to="{ name: 'today' }"
          :count="stats?.today?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToToday"
      >
        <template #icon><TodayIcon :overdue="stats?.today?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Inbox"
          :to="{ name: 'inbox' }"
          :count="stats?.inbox?.count"
      >
        <template #icon><InboxIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Projects"
          :to="{ name: 'projects' }"
          :count="stats?.projects?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToProjects"
      >
        <template #icon><ProjectsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Calendar"
          :to="{ name: 'calendar' }"
          :count="stats?.calendar?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToCalendar"
      >
        <template #icon><CalendarIcon :overdue="stats?.calendar?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Waiting For"
          :to="{ name: 'waiting-for' }"
          :count="stats?.waiting?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToWaitingFor"
      >
        <template #icon><WaitingIcon :overdue="stats?.waiting?.overdue > 0"/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Someday / Maybe"
          :to="{ name: 'someday' }"
          :count="stats?.someday?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToSomeday"
      >
        <template #icon><SomedayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Reference"
          :to="{ name: 'reference' }"
          :badge="referenceLabel"
          :accept-drop="['stuff']"
          @drop="onDropToReference"
      >
        <template #icon><ReferenceIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          v-if="settingsMdl.state.reviewEnabled"
          label="Review"
          :to="{ name: 'review' }"
          :badge="reviewBadge"
          :badge-color="reviewBadgeColor"
      >
        <template #icon><ReviewIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Completed"
          :to="{ name: 'completed' }"
          :count="stats?.completed?.count"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToCompleted"
      >
        <template #icon><CompletedIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Trash"
          :to="{ name: 'trash' }"
          :count="stats?.trash?.count"
          :accept-drop="['stuff', 'action']"
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

const auth = authModel();
const toaster = errorModel();
const mover = moveModel();
const { items: stuffItems } = stuffModel();
const { items: actionItems } = nextActionModel();
const { items: todayItems } = todayModel();
const { items: waitingItems } = waitingModel();
const { items: somedayItems } = somedayModel();
const { items: calendarItems } = calendarModel();
const { stats, loadStats, refreshStats } = statsModel();
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

async function onDropToNextAction(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      if (data.state === 'NEXT') return;
      // undefer works from any active state (TODAY, CALENDAR, WAITING, SOMEDAY) → NEXT
      await apiClient.undeferAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToProjects(data) {
  const outcome = await mover.showOutcome()
  if (!outcome) return

  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToProject(data.id, {
        title: data.title,
        description: data.description || '',
        outcome
      });
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      // Transform action to project: create project, then trash action
      await apiClient.addProject({
        title: data.title,
        description: data.description || '',
        outcome
      });
      await apiClient.trashAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" converted to project`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToSomeday(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToSomeday(data.id);
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      // Skip if already in SOMEDAY state
      if (data.state === 'SOMEDAY') return;
      await apiClient.somedayAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Someday`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToToday(data) {
  try {
    if (data.sourceType === 'stuff') {
      // Transform to action first, then mark today
      const result = await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
      await apiClient.todayAction(result.id);
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      // Skip if already in TODAY state
      if (data.state === 'TODAY') return;
      await apiClient.todayAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Today`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToCalendar(data) {
  // Skip if action is already in CALENDAR state
  if (data.sourceType === 'action' && data.state === 'CALENDAR') return;

  // Show schedule modal to get date/time
  const scheduleData = await mover.showSchedule({
    date: '',
    time: '',
    duration: 15
  });

  if (!scheduleData || !scheduleData.date) return; // User cancelled

  try {
    if (data.sourceType === 'stuff') {
      // Transform to action with scheduled_date
      await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || '',
        deferType: 'scheduled',
        deferDate: scheduleData.date,
        deferTime: scheduleData.time || null,
        deferDuration: scheduleData.duration || null
      });
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.deferAction(data.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Calendar`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToWaitingFor(data) {
  // Skip if action is already in WAITING state
  if (data.sourceType === 'action' && data.state === 'WAITING') return;

  // Show waiting modal to get waiting_for value
  const waitingFor = await mover.showWaiting({
    waitingFor: ''
  });

  if (!waitingFor) return; // User cancelled

  try {
    if (data.sourceType === 'stuff') {
      // Transform to action first, then set waiting
      const result = await apiClient.clarifyToAction(data.id, {
        title: data.title,
        description: data.description || ''
      });
      await apiClient.waitAction(result.id, waitingFor);
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.waitAction(data.id, waitingFor);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Waiting For`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToReference(data) {
  if (data.sourceType !== 'stuff') return;

  try {
    await apiClient.clarifyToReference(data.id);
    removeFromInbox(data.id);
    toaster.success(`"${truncateTitle(data.title)}" moved to Reference`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToCompleted(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.completeStuff(data.id);
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.completeAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" marked as completed`);
    refreshStats();
  } catch (err) {
    toaster.push(err.message || 'Failed to complete item');
  }
}

async function onDropToTrash(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.trashStuff(data.id);
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      await apiClient.trashAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Trash`);
    refreshStats();
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
  const nextIdx = actionItems.value.findIndex(i => i.id === id);
  if (nextIdx !== -1) {
    actionItems.value.splice(nextIdx, 1);
  }
  const todayIdx = todayItems.value.findIndex(i => i.id === id);
  if (todayIdx !== -1) {
    todayItems.value.splice(todayIdx, 1);
  }
  const waitingIdx = waitingItems.value.findIndex(i => i.id === id);
  if (waitingIdx !== -1) {
    waitingItems.value.splice(waitingIdx, 1);
  }
  const somedayIdx = somedayItems.value.findIndex(i => i.id === id);
  if (somedayIdx !== -1) {
    somedayItems.value.splice(somedayIdx, 1);
  }
  const calendarIdx = calendarItems.value.findIndex(i => i.id === id);
  if (calendarIdx !== -1) {
    calendarItems.value.splice(calendarIdx, 1);
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--color-sidebar-background);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 10px;
  row-gap: 10px;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border-light);
  padding: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 12px;
}


</style>
