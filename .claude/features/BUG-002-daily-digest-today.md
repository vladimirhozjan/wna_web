# BUG-002 (wna_web slice): Daily digest sections don't mirror the app's lists

Parent / spec / root cause: `wna_orchestration/features/BUG-002-daily-digest-today.md`.
Do not restate the parent — this is the local checklist only. (All work on `main` — no branches.)

## Checklist (wna_web)
- [x] Settings → notifications: replace the "Task due today" + "Daily next actions" toggles with a
      single "Daily digest" toggle mapping to the `daily_digest` event (see
      `wna_orchestration/specs/features/wna-features.md` §26)
- [x] In-app notification routing: `TopNav.vue` must handle the renamed `daily_digest` event — add a
      **single** `daily_digest` case → route **`engage`** (the Engage page shows all three sections),
      and remove the now-dead `daily_next_actions` / `task_due_today` branches. Net = **1 deep link**:
      `daily_digest` is one event → one destination (`/engage`). Do NOT add a deep link per section
      (sections are email-only). Decision: decisions.md 2026-06-16. (Note: target changed from `today`
      → `engage`; if a prior pass wired it to `today`, fix it.)
- [x] CI green (re-confirm after the TopNav change)