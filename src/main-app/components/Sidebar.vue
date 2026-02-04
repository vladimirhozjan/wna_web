<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">

      <SidebarMenuItem
          label="Next Action"
          :to="{ name: 'next' }"
          :accept-drop="['stuff']"
          @drop="onDropToNextAction"
      >
        <template #icon><NextIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Today" :to="{ name: 'today' }">
        <template #icon><TodayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Inbox" :to="{ name: 'inbox' }">
        <template #icon><InboxIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Projects"
          :to="{ name: 'projects' }"
          :accept-drop="['stuff']"
          @drop="onDropToProjects"
      >
        <template #icon><ProjectsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Calendar" :to="{ name: 'calendar' }">
        <template #icon><CalendarIcon /></template>
      </SidebarMenuItem>

      <SidebarMenuItem
          label="Someday / Maybe"
          :to="{ name: 'someday' }"
          :accept-drop="['stuff']"
          @drop="onDropToSomeday"
      >
        <template #icon><SomedayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Reference" :to="{ name: 'reference' }">
        <template #icon><ReferenceIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Completed" :to="{ name: 'completed' }">
        <template #icon><CompletedIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Trash" :to="{ name: 'trash' }">
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
import apiClient from "../scripts/apiClient.js";
import { useRouter } from "vue-router";

import SidebarMenuItem from "./SidebarMenuItem.vue";
import NextIcon from "../assets/NextIcon.vue";
import CalendarIcon from "../assets/CalendarIcon.vue";
import TodayIcon from "../assets/TodayIcon.vue";
import InboxIcon from "../assets/InboxIcon.vue";
import ProjectsIcon from "../assets/ProjectsIcon.vue";
import SomedayIcon from "../assets/SomedayIcon.vue";
import ReferenceIcon from "../assets/ReferenceIcon.vue";
import CompletedIcon from "../assets/CompletedIcon.vue";
import TrashIcon from "../assets/TrashIcon.vue";
import SettingsIcon from "../assets/SettingsIcon.vue";
import LogoutIcon from "../assets/LogoutIcon.vue";

const auth = authModel();
const toaster = errorModel();
const { items: stuffItems } = stuffModel();
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
  if (data.sourceType !== 'stuff') return;

  try {
    await apiClient.clarifyToAction(data.id, {
      title: data.title,
      description: data.description || ''
    });
    removeFromInbox(data.id);
    toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`);
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToProjects(data) {
  if (data.sourceType !== 'stuff') return;

  try {
    await apiClient.clarifyToProject(data.id, {
      title: data.title,
      description: data.description || ''
    });
    removeFromInbox(data.id);
    toaster.success(`"${truncateTitle(data.title)}" moved to Projects`);
  } catch (err) {
    toaster.push(err.message || 'Failed to move item');
  }
}

async function onDropToSomeday(data) {
  if (data.sourceType !== 'stuff') return;

  try {
    await apiClient.clarifyToSomeday(data.id);
    removeFromInbox(data.id);
    toaster.success(`"${truncateTitle(data.title)}" moved to Someday`);
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
