<template>
  <RouterView />
  <ErrorToaster />
  <ConfirmDialog />
  <MoveModal />
  <UpgradeModal />
  <FeedbackBtn />
</template>

<script setup>
import ErrorToaster from "./components/ErrorToaster.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import MoveModal from "./components/MoveModal.vue";
import UpgradeModal from "./components/UpgradeModal.vue";
import FeedbackBtn from "./components/FeedbackBtn.vue";
</script>

