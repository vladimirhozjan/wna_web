<template>
  <span class="lnk text-body-s color-text-primary">
    {{ text }}
    <a href="#" @click.prevent="emit('action')">{{ link }}</a>
  </span>
</template>

<script setup>
const props = defineProps({
  text: { type: String, required: true },
  link: { type: String, required: true }
})

const emit = defineEmits(["action"])
</script>

<style scoped>
.lnk {
  text-align: center;
  display: block;
}

.lnk a {
  color: var(--color-link-text);
  cursor: pointer;
  text-decoration: none;
  font-size: var(--font-size-body-s);
  margin-right: 8px;
}

.lnk a:hover {
  color: var(--color-link-hover);
}
</style>
