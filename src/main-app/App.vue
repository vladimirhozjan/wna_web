<template>
  <RouterView />
  <ErrorToaster />
  <ConfirmDialog />
  <MoveModal />
  <UpgradeModal />
</template>

<script setup>
import ErrorToaster from "./components/ErrorToaster.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import MoveModal from "./components/MoveModal.vue";
import UpgradeModal from "./components/UpgradeModal.vue";
</script>

