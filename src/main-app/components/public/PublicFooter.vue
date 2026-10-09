<template>
  <footer class="public-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <AppIcon />
            <span class="footer-brand-name"><span class="footer-brand-primary">WhatsNext</span><span class="footer-brand-accent">Action</span></span>
          </div>
          <p class="text-caption footer-tagline">Stress-free productivity</p>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-overline">Product</h4>
          <ul class="footer-links">
            <li><a href="/#features" class="footer-link text-body-s">Features</a></li>
            <li><router-link to="/pricing" class="footer-link text-body-s">Pricing</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-overline">Support</h4>
          <ul class="footer-links">
            <li><router-link to="/help" class="footer-link text-body-s">Help &amp; FAQ</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-overline">Legal</h4>
          <ul class="footer-links">
            <li><router-link to="/legal/terms" class="footer-link text-body-s">Terms of Service</router-link></li>
            <li><router-link to="/legal/privacy" class="footer-link text-body-s">Privacy Policy</router-link></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="text-footnote footer-copyright">&copy; 2026 WhatsNextAction. All rights reserved.</p>
        <div class="footer-social">
          <a
            v-for="link in socialLinks"
            :key="link.platform"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`WhatsNextAction on ${link.name}`"
            :data-testid="`footer-social-${link.platform}`"
            class="footer-social-link"
          >
            <component :is="link.icon" class="footer-social-icon" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import AppIcon from '../../assets/AppIcon.vue'
import YoutubeIcon from '../../assets/YoutubeIcon.vue'
import InstagramIcon from '../../assets/InstagramIcon.vue'
import TiktokIcon from '../../assets/TiktokIcon.vue'
import LinkedinIcon from '../../assets/LinkedinIcon.vue'

const socialLinks = [
  { platform: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@WhatsNextAction', icon: YoutubeIcon },
  { platform: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/whatsnextaction', icon: InstagramIcon },
  { platform: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/@whatsnextaction', icon: TiktokIcon },
  { platform: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/company/qubforge', icon: LinkedinIcon }
]
</script>

<style scoped>
.public-footer {
  background: var(--color-bg-dark-deep);
}

.footer-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  padding: var(--section-py-mobile) var(--section-px);
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-brand-name {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.02em;
}

.footer-brand-primary {
  color: var(--color-text-inverse);
}

.footer-brand-accent {
  color: var(--color-action-medium);
}

.footer-tagline {
  color: var(--color-text-secondary);
  line-height: var(--lh-relaxed);
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-heading {
  color: var(--color-text-secondary-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.footer-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-link {
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--color-text-inverse);
}

.footer-bottom {
  border-top: 1px solid var(--color-border-dark-subtle);
  padding: 20px var(--section-px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-copyright {
  color: var(--color-text-secondary);
  margin: 0;
}

.footer-social {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-social-link {
  display: flex;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

.footer-social-link:hover {
  color: var(--color-action-medium);
}

.footer-social-icon {
  width: 20px;
  height: 20px;
}

@media (min-width: 769px) {
  .footer-grid {
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    padding: var(--section-py) var(--section-px);
  }
}

@media (max-width: 768px) {
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
