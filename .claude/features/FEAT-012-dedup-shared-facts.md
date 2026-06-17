# FEAT-012 (web slice): De-duplicate shared facts — develop-a / develop-b worktree reconcile

Parent / design / decisions (C6 full centralization): `wna_orchestration/features/FEAT-012-dedup-shared-facts.md`.
Do not restate the parent — this is the local checklist only. (All work on `main`-of-each-worktree — no branches.)
Scope: the **main** worktree was already reconciled in the parent; this slice closes the deferred
**develop-a / develop-b** worktree copies. This slice file lives in `develop-a` only.

## Checklist (web — worktree reconcile)
- [x] **develop-a**: confirm `CLAUDE.md` carries only frontend-local conventions + one-line pointers to
      the orchestration Fact Index / spec homes, and restates no shared fact (tier quotas, pricing,
      roadmap, domain model, API surface). Cite `file:line` of the pointer block. (Note: as of writing,
      develop-a `CLAUDE.md` is byte-identical to the reconciled `main` `CLAUDE.md` — verify it still is.)
      **Verified:** pointer block `CLAUDE.md:9-13` (roadmap → `wna_orchestration/roadmap.md`; Fact Index →
      `wna_orchestration/CLAUDE.md`), plus pointers `CLAUDE.md:17-18` (GTD domain), `:166-167` (API surface),
      `:184-188` (spec-sync homes), `:242-248` (related-docs list). All `Tier quotas|Subscription pricing|GTD
      domain` grep hits (`CLAUDE.md:12,17,244`) are pointer language, not restatements. `git diff main --
      CLAUDE.md` → empty (still byte-identical to reconciled main).
- [x] **develop-a**: confirm no restated-spec `.md` files remain anywhere in the worktree (e.g. a stale
      `.claude/*.md` spec copy, an `api.md`/`wna-features.md`/`wna-test-cases.md` duplicate). Grep and
      confirm `0`: `grep -rl "Tier quotas\|Subscription pricing\|GTD domain" --include=*.md .` outside
      `.claude/features` → `0`. Cite the grep result.
      **Verified:** worktree `.md` files = `CLAUDE.md`, `README.md`, `src/main-app/content/legal/{terms,privacy}.md`,
      `.claude/commands/implement.md`, memory + slice files — no `api.md`/`wna-features.md`/`wna-test-cases.md`/`ci.md`
      spec copy. Grep outside `.claude/features` returns only `CLAUDE.md` (pointer language per check 1). `terms.md:107`
      mentions "Free plan … limited usage quotas" but is user-facing legal copy with no quota numbers — not a restated
      shared fact.
- [x] **develop-a**: `README.md` keeps only local dev-setup/build facts; any cross-project fact is a
      pointer to its orchestration home. Cite `file:line`.
      **Verified + fixed:** env domains already point home at `README.md:202` (→ `wna_orchestration/contracts/external.md`).
      `README.md:200` previously pointed K8s/CI manifests at the removed local file `.claude/ci.md`; fixed to point at the
      orchestration home `wna_orchestration/specs/ci/frontend-ci.md` (matching `CLAUDE.md:188`). `grep "\.claude/.*\.md"
      README.md` → `0` dangling local spec refs. (Per user: develop-a fixed only; develop-b/main to be synced via git.)
- [x] **develop-b**: the slice file cannot live there (web slices are develop-a-only), but the worktree
      still needs the same reconcile. Apply the same three checks in `../develop-b` and record the result
      here (it is currently identical to `main` — re-verify, don't assume). Cite the develop-b paths.
      **Verified (read-only):** `../develop-b/CLAUDE.md` and `../develop-b/README.md` both `git diff main` → empty
      (byte-identical to main). Same `.md` inventory, no stale spec copies; only `CLAUDE.md` pointer-language grep hit.
      `../develop-b/README.md:200` carries the same pre-existing `.claude/ci.md` dangling pointer — NOT edited here
      (web slices are develop-a-only; user will propagate the develop-a README fix to develop-b via git).

## User flows (this project's part)
n/a — internal spec-centralization refactor; no end-user-facing behavior. Per the parent, **all roles
(Free / Pro / Team owner / Team member / Admin / Unauthenticated) are n/a** — this only changes where
docs live, not what any user sees or does.

## Hard rules for the implementer
1. **Do not tick a checkbox you haven't verified by re-reading the actual source.** Each `[x]` must
   cite the `file:line` that proves it. A green test run is NOT proof a feature exists — open the file.
2. **Definition of done = observable end-user behavior**, not "code compiles" or "tests pass". Here the
   concrete artifact is the worktree's docs themselves: open `develop-a`/`develop-b` `CLAUDE.md` +
   `README.md` and confirm they restate no shared fact and point to the orchestration homes.
3. **Leave zero references to anything you renamed/removed** — grep the worktree and confirm `0` matches
   before claiming done.
4. **Honor the parent's User flows for every role** (all n/a here); don't silently implement only part.
5. **No false "complete".** If a box is partial or blocked, mark `[ ]` and write exactly what's left.
   Overstating completion is the worst failure — it ships broken work as done.
6. **Sync the shared spec you change — in orchestration, directly; never defer it.** If your work
   changes a fact whose canonical home is a spec in `wna_orchestration` (response shapes →
   `specs/api/*`; SQL DDL / CI → `specs/ci/*`; features → `specs/features/*`; test cases →
   `specs/tests/*`; architecture → `specs/architecture/*`; numbers → `contracts/*`), you MUST update
   that spec file in `wna_orchestration` as part of this work. Editing the spec's orchestration home is
   the documented sibling sync requirement (see this repo's CLAUDE.md) — it is REQUIRED, never
   forbidden, and never "deferred to the user." The local-slice rule forbids only *restating* shared
   facts inside the slice, NOT updating their canonical home. Cite the orchestration `file:line` you
   updated. (Find the home in the orchestration Fact Index.) — For this slice the expected direction is
   the reverse: you are *removing* restated facts from the worktree and pointing at homes, not adding
   new facts; no orchestration spec edit is expected unless you discover a worktree-only fact with no home.