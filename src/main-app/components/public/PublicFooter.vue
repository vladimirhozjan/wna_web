<template>
  <footer class="public-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="../../assets/AppIcon.svg" alt="logo" class="footer-logo-img" />
            <span class="text-h4 color-text-primary">WhatsNextAction</span>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-label">Product</h4>
          <ul class="footer-links">
            <li><a href="/#features" class="footer-link text-body-s">Features</a></li>
            <li><router-link to="/pricing" class="footer-link text-body-s">Pricing</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-label">Support</h4>
          <ul class="footer-links">
            <li><router-link to="/help" class="footer-link text-body-s">Help &amp; FAQ</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading text-label">Legal</h4>
          <ul class="footer-links">
            <li><router-link to="/legal/terms" class="footer-link text-body-s">Terms of Service</router-link></li>
            <li><router-link to="/legal/privacy" class="footer-link text-body-s">Privacy Policy</router-link></li>
          </ul>
        </div>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-light);
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
  align-items: flex-start;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-logo-img {
  height: 36px;
  width: 36px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-heading {
  color: var(--color-text-secondary);
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
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--color-action);
}

.footer-bottom {
  border-top: 1px solid var(--color-border-light);
  padding: 20px var(--section-px);
  text-align: center;
}

.footer-bottom .text-footnote {
  color: var(--color-text-tertiary);
  margin: 0;
}

.footer-bottom .text-footnote + .text-footnote {
  margin-top: 4px;
}

@media (min-width: 769px) {
  .footer-grid {
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    padding: var(--section-py) var(--section-px);
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
