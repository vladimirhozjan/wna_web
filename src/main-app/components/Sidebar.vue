<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">

      <SidebarMenuItem label="Next Action" :to="{ name: 'next' }">
        <template #icon><NextIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Today" :to="{ name: 'today' }">
        <template #icon><TodayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Inbox" :to="{ name: 'inbox' }">
        <template #icon><InboxIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Projects" :to="{ name: 'projects' }">
        <template #icon><ProjectsIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Calendar" :to="{ name: 'calendar' }">
        <template #icon><CalendarIcon /></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Someday / Maybe" :to="{ name: 'someday' }">
        <template #icon><SomedayIcon/></template>
      </SidebarMenuItem>

      <SidebarMenuItem label="Reference" :to="{ name: 'reference' }">
        <template #icon><ReferenceIcon/></template>
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
import { useRouter } from "vue-router";

import SidebarMenuItem from "./SidebarMenuItem.vue";
import NextIcon from "../assets/NextIcon.vue";
import CalendarIcon from "../assets/CalendarIcon.vue";
import TodayIcon from "../assets/TodayIcon.vue";
import InboxIcon from "../assets/InboxIcon.vue";
import ProjectsIcon from "../assets/ProjectsIcon.vue";
import SomedayIcon from "../assets/SomedayIcon.vue";
import ReferenceIcon from "../assets/ReferenceIcon.vue";
import SettingsIcon from "../assets/SettingsIcon.vue";
import LogoutIcon from "../assets/LogoutIcon.vue";

const auth = authModel();
const router = useRouter();

function logout() {
  auth.logoutUser();
  router.push({ name: "landing" });
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
