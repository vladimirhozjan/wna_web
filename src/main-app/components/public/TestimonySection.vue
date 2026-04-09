<template>
  <section class="section">
    <div class="section-inner">
      <p class="text-overline section-overline">Founder</p>
      <h2 class="text-h1 color-text-primary">Why I Built This</h2>
      <blockquote class="testimony">
        <p class="testimony-text">
          I discovered David Allen's Getting Things Done methodology years ago, and it changed how I
          think about productivity. The idea of capturing everything, clarifying it, and organizing it
          into a trusted system gave me a sense of control I'd never had before.
        </p>
        <p class="testimony-text">
          But I could never find the right tool. Every app I tried was either too complex, too simple,
          or treated GTD as an afterthought — bolting on features that didn't respect the methodology.
        </p>
        <p class="testimony-text">
          So I built WhatsNextAction. A tool designed from the ground up around GTD principles.
          Nothing more, nothing less. And now I'm sharing it with anyone who wants to experience
          truly stress-free productivity.
        </p>
        <p class="text-body-s testimony-attr">— Dr. Vladimir Hozjan, Founder & CEO</p>
      </blockquote>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: var(--section-py-mobile) var(--section-px);
  background: var(--color-bg-subtle);
  text-align: center;
}

.section-inner {
  max-width: var(--section-max-width);
  margin: 0 auto;
}

.section-overline {
  color: var(--color-action);
  margin-bottom: 8px;
}

.testimony {
  border-left: 3px solid var(--color-action);
  padding-left: 24px;
  max-width: 700px;
  margin: 32px auto 0;
  text-align: left;
}

.testimony-text {
  font-family: var(--font-family-default);
  font-size: var(--font-size-md);
  font-style: italic;
  font-weight: var(--font-weight-normal);
  line-height: 1.85;
  color: var(--color-text-secondary-light);
  margin-top: 16px;
}

.testimony-text:first-child {
  margin-top: 0;
}

.testimony-attr {
  color: var(--color-text-secondary-light);
  margin-top: 24px;
}

@media (min-width: 769px) {
  .section {
    padding: var(--section-py) var(--section-px);
  }
}
</style>
