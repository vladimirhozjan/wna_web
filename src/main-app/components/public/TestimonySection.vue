<template>
  <section class="section">
    <div class="section-inner">
      <h2 class="text-h2 color-text-primary">Why I Built This</h2>
      <blockquote class="testimony">
        <p class="text-body-m testimony-text">
          I discovered David Allen's Getting Things Done methodology years ago, and it changed how I
          think about productivity. The idea of capturing everything, clarifying it, and organizing it
          into a trusted system gave me a sense of control I'd never had before.
        </p>
        <p class="text-body-m testimony-text">
          But I could never find the right tool. Every app I tried was either too complex, too simple,
          or treated GTD as an afterthought — bolting on features that didn't respect the methodology.
        </p>
        <p class="text-body-m testimony-text">
          So I built WhatsNextAction. A tool designed from the ground up around GTD principles.
          Nothing more, nothing less. And now I'm sharing it with anyone who wants to experience
          truly stress-free productivity.
        </p>
      </blockquote>
      <p class="text-label testimony-attr">— Dr. Vladimir Hozjan, Founder & CEO</p>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-accent-light);
  text-align: center;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.testimony {
  border-left: 3px solid var(--color-action);
  padding-left: 24px;
  max-width: 700px;
  margin: 24px auto 0;
  text-align: left;
}

.testimony-text {
  color: var(--color-text-secondary);
  margin-top: 12px;
}

.testimony-text:first-child {
  margin-top: 0;
}

.testimony-attr {
  color: var(--color-text-tertiary);
  margin-top: 16px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }
}
</style>
