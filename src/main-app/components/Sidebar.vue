<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Menu</span>
    </div>
    <nav>
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Tasks</a></li>
        <li><a href="#">Projects</a></li>
        <li><a href="#">Calendar</a></li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      <Btn @click="$emit('logout')">
        Logout
      </Btn>
    </div>
  </aside>
</template>

<script setup>
import Btn from "../components/Btn.vue";
defineEmits(['logout']);
</script>

<style scoped>
.sidebar {
  width: 240px;

  background: #f9f9f9;
  border-right: 1px solid #ddd;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 16px;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  margin-top: auto; /* potisne na dno */
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #666;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li + li {
  margin-top: 10px;
}

a {
  font-size: 14px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  color: #2563eb;
}


</style>
