<template>
  <div class="avatar-wrapper" @click="$emit('toggle-menu')">
    <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
    <div v-else class="avatar-fallback" :style="{ backgroundColor: bgColor }">
      {{ initials }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  email: String,
  avatarUrl: String
});

const initials = computed(() => {
  if (!props.email) return "?";
  return props.email.slice(0, 2).toUpperCase();
});

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

const bgColor = computed(() =>
    props.email ? stringToColor(props.email) : "#777"
);

defineEmits(["toggle-menu"]);
</script>

<style scoped>
.avatar-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  color: white;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .avatar-wrapper {
    width: 32px;
    height: 32px;
  }
}
</style>