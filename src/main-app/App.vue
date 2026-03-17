<template>
  <RouterView />
  <ErrorToaster />
  <ConfirmDialog />
  <MoveModal />
</template>

<script setup>
import ErrorToaster from "./components/ErrorToaster.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import MoveModal from "./components/MoveModal.vue";
</script>

