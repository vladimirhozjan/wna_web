<template>
  <nav class="legal-sidebar">
    <h2 class="text-label sidebar-heading">Legal Documents</h2>
    <ul class="sidebar-links">
      <li>
        <router-link to="/legal/terms" class="sidebar-link text-body-s" :class="{ active: doc === 'terms' }">
          Terms of Service
        </router-link>
      </li>
      <li>
        <router-link to="/legal/privacy" class="sidebar-link text-body-s" :class="{ active: doc === 'privacy' }">
          Privacy Policy
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
defineProps({
  doc: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.legal-sidebar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 16px;
}

.sidebar-heading {
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.sidebar-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 16px;
}

.sidebar-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: color 0.15s;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.sidebar-link:hover {
  color: var(--color-action);
}

.sidebar-link.active {
  color: var(--color-action);
  font-weight: 600;
}

@media (min-width: 769px) {
  .legal-sidebar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    border-bottom: none;
    padding-bottom: 0;
    position: sticky;
    top: 80px;
  }

  .sidebar-heading {
    margin-bottom: 8px;
  }

  .sidebar-links {
    flex-direction: column;
    gap: 4px;
  }

  .sidebar-link {
    padding: 6px 0;
    min-height: auto;
  }
}
</style>