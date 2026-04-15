<template>
  <div ref="rootRef" class="feedback-wrapper">
    <button class="feedback-btn" :class="{ active: open }" @click="open = !open">
      <QuizIcon width="18" height="18" />
    </button>

    <div v-if="open" class="feedback-popover">
      <a
        class="feedback-item"
        href="mailto:support@whatsnextaction.com?subject=Support%20Request%20-%20WhatsNextAction"
        @click="open = false"
      >
        <CommentIcon width="16" height="16" />
        <span>Contact Support</span>
      </a>
      <a
        class="feedback-item"
        href="mailto:bug@whatsnextaction.com?subject=Bug%20Report%20-%20WhatsNextAction"
        @click="open = false"
      >
        <WarningIcon width="16" height="16" />
        <span>Report a Bug</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QuizIcon from '../assets/QuizIcon.vue'
import CommentIcon from '../assets/CommentIcon.vue'
import WarningIcon from '../assets/WarningIcon.vue'

const open = ref(false)
const rootRef = ref(null)

function onClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onClickOutside))
onUnmounted(() => document.removeEventListener('pointerdown', onClickOutside))
</script>

<style scoped>
.feedback-wrapper {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 897;
}

.feedback-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px 0 0 8px;
  border: 1px solid var(--color-border-light);
  border-right: none;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-popover);
  transition: color 0.15s, background 0.15s;
}

.feedback-btn:hover,
.feedback-btn.active {
  color: var(--color-action);
  background: var(--color-bg-accent-light);
}

.feedback-popover {
  position: absolute;
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  margin-right: 8px;
  min-width: 180px;
  background: var(--color-popup-background);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-popover);
  padding: 4px 0;
  animation: feedback-fade-in 0.15s ease;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  color: var(--color-menu-item-default-text);
  text-decoration: none;
  font-size: 14px;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  white-space: nowrap;
}

.feedback-item:first-child {
  border-radius: 7px 7px 0 0;
}

.feedback-item:last-child {
  border-radius: 0 0 7px 7px;
}

.feedback-item:hover {
  background: var(--color-menu-item-hover-bg);
  color: var(--color-menu-item-hover-txt);
}

@keyframes feedback-fade-in {
  from { opacity: 0; transform: translateY(-50%) translateX(4px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

@media (max-width: 768px) {
  .feedback-wrapper {
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
}
</style>
