<template>
  <DashboardLayout>
    <h1 class="text-h1 color-text-primary">Next</h1>

    <div ref="el" class="list">
      <div v-for="item in list" :key="item.id" class="list-item">
        {{ item.name }}
      </div>
    </div>

  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "../layouts/DashboardLayout.vue";
import UnderConstruction from "../components/UnderConstruction.vue";

import { ref } from 'vue'
import { useDraggable } from 'vue-draggable-plus'

const el = ref()

const list = ref([
  {
    name: 'Joao',
    id: 1
  },
  {
    name: 'Jean',
    id: 2
  },
  {
    name: 'Johanna',
    id: 3
  },
  {
    name: 'Juan',
    id: 4
  }
])

// The return value is an object, which contains some methods, such as start, destroy, pause, etc.
const draggable = useDraggable(el, list, {
  animation: 150,
  onStart() {
    console.log('start')
  },
  onUpdate() {
    console.log('update')
  }
})

</script>

<style scoped>
h1 {
  padding: 10px;
}

.list-item {
  background-color: white;
}

.sortable-chosen {
  background-color: red;
}

.sortable-chosen .list-item{
  opacity: 0;
}

.sortable-drag {
  background-color: green;
}

.sortable-fallback {
  background-color: blue;
}

</style>
