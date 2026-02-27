<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">

    <section class="section">
      <div class="section-inner">
        <router-link to="/help" class="back-link text-body-s">
          <ChevronLeftIcon class="back-link__icon" />
          Back to Help
        </router-link>

        <h1 class="text-h1 heading">Frequently Asked Questions</h1>

        <div class="faq-list">
          <FaqItem
            v-for="item in faq"
            :key="item.question"
            :question="item.question"
            :answer="item.answer"
          />
        </div>
      </div>
    </section>

  </LandingLayout>

  <AuthDialog
    v-model:mode="authMode"
    @logged-in="onSuccess"
    @registered="onSuccess"
    @password-reset-success="onSuccessPasswordReset"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LandingLayout from '../../layouts/LandingLayout.vue'
import AuthDialog from '../../components/AuthDialog.vue'
import FaqItem from '../../components/public/FaqItem.vue'
import ChevronLeftIcon from '../../assets/ChevronLeftIcon.vue'
import { faq } from '../../content/help/faq.js'

const router = useRouter()
const authMode = ref(null)

function openAuth(mode) { authMode.value = mode }
function onSuccess() { authMode.value = null; router.push({ name: 'engage' }) }
function onSuccessPasswordReset() { authMode.value = null; router.push({ name: 'login' }) }
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-primary);
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

@media (min-width: 769px) {
  .section { padding: var(--section-py) var(--section-px); }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-action);
  text-decoration: none;
  font-weight: 500;
  min-height: 44px;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.back-link__icon {
  width: 16px;
  height: 16px;
}

.heading {
  color: var(--color-text-primary);
  margin-top: 16px;
}

.faq-list {
  margin-top: 24px;
}
</style>