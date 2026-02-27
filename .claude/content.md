Industry Standard

For legal docs (TOS, Privacy Policy): Markdown is the clear standard.

Why:
- Legal documents are 2000-5000 words of prose with headings, paragraphs, and bullet lists
- Markdown is the natural authoring format — readable, diffable in git, editable by non-developers
- When a lawyer sends updated terms, you paste/convert naturally rather than manually structuring JS objects
- Every major SaaS app (Stripe, Notion, Linear, etc.) stores legal content as markdown or in a CMS
- marked is 39KB minified, zero dependencies, 1B+ npm downloads — it's negligible overhead

For help content (FAQ, cards): JS data files are the standard.

Why:
- FAQ is structured data: [{ question, answer }] — maps naturally to JS
- Card grids (Getting Started, Best Practices) are title/description pairs — same
- No parser needed, just import and iterate
- Content stays type-safe and close to how the component consumes it

Recommended Structure

src/main-app/content/
legal/
    terms.md              ← prose, imported as raw string, rendered with marked
    privacy.md            ← same
help/
    faq.js                ← [{ question, answer }]
    gettingStarted.js     ← [{ title, description }]
    bestPractices.js      ← [{ title, description }]

Vite can import .md files as raw strings with ?raw — no Vite plugin needed. We just add marked for runtime HTML rendering.

This gives you:
- Natural authoring for legal prose (markdown)
- Structured data for help content (JS)
- One tiny dependency (marked)
- Easy future updates — swap the .md file, done
