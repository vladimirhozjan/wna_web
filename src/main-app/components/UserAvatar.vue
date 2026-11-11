<template>
  <div class="avatar-wrapper" :style="sizeStyle" @click="$emit('toggle-menu')">
    <img v-if="shown === 'picture'" :key="props.pictureUrl" :src="pictureSrc(props.pictureUrl)" :alt="props.name || props.email || ''" class="avatar-img" @error="pictureFailed = true" />
    <img v-else-if="shown === 'gravatar'" :src="gravatarSrc" :alt="props.email || ''" class="avatar-img" @load="onGravatarLoad" @error="onGravatarError" />
    <div v-else class="avatar-fallback" :style="{ backgroundColor: bgColor, fontSize: initialsSize }">
      {{ initials }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { pictureSrc } from "../scripts/core/apiClient.js";
import { initialsOf } from "../scripts/core/person.js";

const props = defineProps({
  email: String,
  name: { type: String, default: null },
  pictureUrl: { type: String, default: null },
  size: { type: Number, default: null },
});

const emit = defineEmits(["toggle-menu", "source"]);

const CACHE_TTL = 24 * 60 * 60 * 1000;
const gravatarHash = ref(null);
const gravatarFailed = ref(false);
const gravatarLoaded = ref(false);
const pictureFailed = ref(false);

function getCachedStatus(hash) {
  try {
    const raw = localStorage.getItem(`gravatar_${hash}`);
    if (!raw) return null;
    const { status, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(`gravatar_${hash}`); return null; }
    return status;
  } catch { return null; }
}

function setCachedStatus(hash, status) {
  try { localStorage.setItem(`gravatar_${hash}`, JSON.stringify({ status, ts: Date.now() })); } catch {}
}

function onGravatarLoad() {
  gravatarLoaded.value = true;
  if (gravatarHash.value) setCachedStatus(gravatarHash.value, 'ok');
}

function onGravatarError() {
  gravatarFailed.value = true;
  if (gravatarHash.value) setCachedStatus(gravatarHash.value, 'fail');
}

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

watch(() => props.email, async (email) => {
  gravatarFailed.value = false;
  gravatarLoaded.value = false;
  if (!email) { gravatarHash.value = null; return; }
  const hash = await sha256Hex(email.trim().toLowerCase());
  const cached = getCachedStatus(hash);
  if (cached === 'fail') { gravatarFailed.value = true; }
  gravatarHash.value = hash;
}, { immediate: true });

watch(() => props.pictureUrl, () => { pictureFailed.value = false; });

const gravatarSrc = computed(() =>
    gravatarHash.value ? `https://gravatar.com/avatar/${gravatarHash.value}?s=${Math.max(72, (props.size || 0) * 2)}&d=404` : null
);

// An uploaded picture that fails to load falls to the initials, never to Gravatar
const shown = computed(() => {
  if (props.pictureUrl) return pictureFailed.value ? "initials" : "picture";
  return gravatarSrc.value && !gravatarFailed.value ? "gravatar" : "initials";
});

const source = computed(() => (shown.value === "gravatar" && !gravatarLoaded.value ? "initials" : shown.value));
watch(source, (value) => emit("source", value), { immediate: true });

const initials = computed(() => initialsOf(props.name, props.email));

const sizeStyle = computed(() => (props.size ? { width: `${props.size}px`, height: `${props.size}px` } : null));
const initialsSize = computed(() => (props.size ? `${Math.round(props.size * 0.36)}px` : null));

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
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.avatar-wrapper:active {
  opacity: 0.6;
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