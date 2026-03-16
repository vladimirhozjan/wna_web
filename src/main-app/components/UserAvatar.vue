<template>
  <div class="avatar-wrapper" @click="$emit('toggle-menu')">
    <img v-if="gravatarSrc && !gravatarFailed" :src="gravatarSrc" class="avatar-img" @error="gravatarFailed = true" />
    <div v-else class="avatar-fallback" :style="{ backgroundColor: bgColor }">
      {{ initials }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  email: String,
});

const gravatarHash = ref(null);
const gravatarFailed = ref(false);

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

watch(() => props.email, async (email) => {
  gravatarFailed.value = false;
  if (!email) { gravatarHash.value = null; return; }
  gravatarHash.value = await sha256Hex(email.trim().toLowerCase());
}, { immediate: true });

const gravatarSrc = computed(() =>
    gravatarHash.value ? `https://gravatar.com/avatar/${gravatarHash.value}?s=72&d=404` : null
);

const initials = computed(() => {
  if (!props.email) return "?";
  return props.email.slice(0, 2).toUpperCase();
});

function emailToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

const bgColor = computed(() => {
  if (!props.email) return "#777";
  const hue = emailToHue(props.email);
  return `hsl(${hue}, 82%, 31%)`;
});

defineEmits(["toggle-menu"]);
</script>

<style scoped>
.avatar-wrapper {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  color: var(--color-text-inverse);
  font-weight: 700;
  font-size: 12px;
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