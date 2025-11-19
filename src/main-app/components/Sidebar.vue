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
  </aside>
</template>

<script setup>
</script>

<style scoped>
.sidebar {
  width: 240px;
  border-right: 1px solid #e6e6e6;
  padding: 20px 16px;
  background: #fafafa;
  height: 100%;
  box-sizing: border-box;
}

.sidebar-header {
  margin-bottom: 16px;
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
