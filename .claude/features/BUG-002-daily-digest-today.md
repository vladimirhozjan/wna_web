# BUG-002 (wna_web slice): Daily digest sections don't mirror the app's lists

Parent / spec / root cause: `wna_orchestration/features/BUG-002-daily-digest-today.md`.
Branch: `bug/002-daily-digest-today`. Do not restate the parent — this is the local checklist only.

## Checklist (wna_web)
- [ ] Settings → notifications: replace the "Task due today" + "Daily next actions" toggles with a
      single "Daily digest" toggle mapping to the `daily_digest` event (see
      `wna_orchestration/specs/features/wna-features.md` §26)
- [ ] CI green