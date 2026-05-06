<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">
    <HeroSection @open-register="openAuth('register')" />
    <HowItWorksSection />
    <FeaturesSection />
    <WhyUsSection />
    <TestimonySection />
    <BookSection />
    <CtaBanner @open-register="openAuth('register')" />
  </LandingLayout>
  <AuthDialog
      v-model:mode="authMode"
      :token="props.token"
      :prefill-email="prefillEmail"
      @logged-in="onSuccess"
      @registered="onSuccess"
      @password-reset-success="onSuccessPasswordReset"
  />
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import {flagsModel} from '../../scripts/core/flagsModel.js'
import HeroSection from '../../components/public/HeroSection.vue'
import HowItWorksSection from '../../components/public/HowItWorksSection.vue'
import FeaturesSection from '../../components/public/FeaturesSection.vue'
import WhyUsSection from '../../components/public/WhyUsSection.vue'
import TestimonySection from '../../components/public/TestimonySection.vue'
import BookSection from '../../components/public/BookSection.vue'
import CtaBanner from '../../components/public/CtaBanner.vue'

const props = defineProps({
  mode: {
    type: String,
    default: null, // 'login' | 'register' | 'forgot' | 'reset' | null
  },
  token: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const route = useRoute()
const { isBeta } = flagsModel()

function resolveRedirect() {
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/') && !r.startsWith('//')) return r
  return null
}

const authMode = ref(null)

const prefillEmail = computed(() => {
  const e = route.query.email
  return typeof e === 'string' ? e : ''
})

watch(
    () => props.mode,
    (m) => {
      authMode.value = m
    },
    {immediate: true}
)

function openAuth(mode) {
  authMode.value = mode
}

function closeAuth() {
  authMode.value = null
}

function onSuccess() {
  closeAuth()
  const redirect = resolveRedirect()
  if (redirect) router.push(redirect)
  else router.push({name: 'engage'})
}

function onSuccessPasswordReset() {
  closeAuth()
  const redirect = resolveRedirect()
  router.push({name: 'login', query: redirect ? {redirect} : {}})
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
