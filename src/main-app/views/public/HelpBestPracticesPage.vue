<template>
  <LandingLayout class="page" @open-login="openAuth('login')" @open-register="openAuth('register')">

    <section class="section">
      <div class="section-inner">
        <router-link to="/help" class="back-link text-body-s">
          <ChevronLeftIcon class="back-link__icon" />
          Back to Help
        </router-link>

        <h1 class="text-h1 heading">GTD Best Practices</h1>

        <div class="card-grid">
          <div v-for="item in bestPractices" :key="item.title" class="card">
            <h3 class="text-h4">{{ item.title }}</h3>
            <p class="text-body-s card-desc">{{ item.description }}</p>
          </div>
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
import ChevronLeftIcon from '../../assets/ChevronLeftIcon.vue'
import { bestPractices } from '../../content/help/bestPractices.js'

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
  background: var(--color-bg-secondary);
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
  padding: 1px;
  box-sizing: border-box;
}

.heading {
  color: var(--color-text-primary);
  margin-top: 16px;
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 24px;
}

.card {
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  background: var(--color-bg-primary);
  text-align: left;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
}

.card-desc {
  color: var(--color-text-secondary);
  margin-top: 18px;
}

@media (min-width: 520px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 769px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>