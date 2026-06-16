---
description: Implement a feature/bug slice in this repo from its local feature file
argument-hint: <FEAT-or-BUG-id, e.g. FEAT-014>
---
Obey this repo's CLAUDE.md (code style, rules, memories) at all times. "This repo" means the sibling
you are invoked in (here: `wna-web`) — NOT `wna_orchestration`. Only `wna-web/CLAUDE.md` governs
your behavior.

Implement $ARGUMENTS in this repo.

1. Read the local feat/bug slice for $ARGUMENTS in this repo at `.claude/features/$ARGUMENTS-*.md`.
   That file is the source of truth for this repo's checklist, scope, and acceptance criteria. Do NOT
   read or depend on `wna_orchestration` — if the slice references shared facts or contracts you need,
   they must be captured in the local slice; if they're missing, STOP and ask.
2. Implement the slice's checklist, ticking items as you complete them. Write tests. Get the repo's
   CI gates green (build, types, tests, sanitizers/linters per CLAUDE.md) before calling it done.
3. Check all items in the checklist that were done

Rules:
- If the slice is unclear, missing, or conflicts with the actual code, STOP and ask me in ONE batch
  before writing code. Don't guess and don't invent spec.
- If implementing would require changing a contract or a shared fact, STOP and ask me — don't decide
  it locally.
- Keep edits within this repo. Don't write into other siblings or into orchestration.

Output: checklist items done vs remaining, CI status, and anything deferred to me.