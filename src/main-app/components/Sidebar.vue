<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">

      <SidebarMenuItem
          label="Next Action"
          :to="{ name: 'next' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToNextAction"
      >
        <template #icon><NextIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Today"
          :to="{ name: 'today' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToToday"
      >
        <template #icon><TodayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Inbox" :to="{ name: 'inbox' }">
        <template #icon><InboxIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Projects"
          :to="{ name: 'projects' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToProjects"
      >
        <template #icon><ProjectsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Calendar"
          :to="{ name: 'calendar' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToCalendar"
      >
        <template #icon><CalendarIcon /></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Waiting For"
          :to="{ name: 'waiting-for' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToWaitingFor"
      >
        <template #icon><WaitingIcon /></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Someday / Maybe"
          :to="{ name: 'someday' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToSomeday"
      >
        <template #icon><SomedayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Reference"
          :to="{ name: 'reference' }"
          :accept-drop="['stuff']"
          @drop="onDropToReference"
      >
        <template #icon><ReferenceIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Completed"
          :to="{ name: 'completed' }"
          :accept-drop="['stuff', 'action']"
          @drop="onDropToCompleted"
      >
        <template #icon><CompletedIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Trash"
          :to="{ name: 'trash' }"
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

      <div class="logout" @click="logout">
        <span><LogoutIcon/></span>
        <span class="label text-body-m">Logout</span>
      </div>

    </div>
  </aside>
</template>

<script setup>
import { authModel } from "../scripts/authModel.js";
import { errorModel } from "../scripts/errorModel.js";
import { stuffModel } from "../scripts/stuffModel.js";
import { nextActionModel } from "../scripts/nextActionModel.js";
import { todayModel } from "../scripts/todayModel.js";
import { waitingModel } from "../scripts/waitingModel.js";
import { somedayModel } from "../scripts/somedayModel.js";
import { calendarModel } from "../scripts/calendarModel.js";
import { moveModel } from "../scripts/moveModel.js";
import apiClient from "../scripts/apiClient.js";
import { useRouter } from "vue-router";

import SidebarMenuItem from "./SidebarMenuItem.vue";
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

const auth = authModel();
const toaster = errorModel();
const mover = moveModel();
const { items: stuffItems } = stuffModel();
const { items: actionItems } = nextActionModel();
const { items: todayItems } = todayModel();
const { items: waitingItems } = waitingModel();
const { items: somedayItems } = somedayModel();
const { items: calendarItems } = calendarModel();
const router = useRouter();

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
      // Skip if already in NEXT state
      if (data.state === 'NEXT') return;
      // Use undeferAction to move to NEXT (clears dates)
      await apiClient.undeferAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToProjects(data) {
  try {
    if (data.sourceType === 'stuff') {
      await apiClient.clarifyToProject(data.id, {
        title: data.title,
        description: data.description || ''
      });
      removeFromInbox(data.id);
    } else if (data.sourceType === 'action') {
      // Transform action to project: create project, then trash action
      await apiClient.addProject({
        title: data.title,
        description: data.description || ''
      });
      await apiClient.trashAction(data.id);
      removeFromActions(data.id);
    } else {
      return;
    }
    toaster.success(`"${truncateTitle(data.title)}" converted to project`);
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
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border-light);
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.logout {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 0.15s ease;
  color: var(--color-menu-item-default-text);
}

.logout:hover {
  background: var(--color-menu-item-hover-bg);
  color: var(--color-menu-item-hover-txt);
}

.label {
  display: block;
}

</style>
