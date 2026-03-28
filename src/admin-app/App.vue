<template>
  <RouterView />
  <ErrorToaster />
  <ConfirmDialog />
</template>

<script setup>
import ErrorToaster from './components/ErrorToaster.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>
