# Admin App Implementation Prompt

Replace `{PHASE}` and `{STEPS}` and paste into a new conversation.

---

```
Task: Implement admin-app Phase {PHASE} — {STEPS}

### Context — read these files first (do NOT skip any):
1. `.claude/admin-web-requirements.md` — Find Phase {PHASE}, read every step.
2. `.claude/general-guidelines.md` — Code style and rules. Follow strictly.
3. `.claude/ci.md` — Build config, runtime config, Vite proxy.
4. `../wna_backend/.claude/admin-api.md` — Backend API spec. Before implementing any API call, verify the endpoint exists here. If missing, STOP that step and report what is missing.
5. `CLAUDE.md` — Project context.

### Reference:
Study `src/main-app/` for code style and patterns. Re-implement independently in `src/admin-app/` — do NOT import from main-app.

### After implementation:
- Verify build: `APP=admin-app npm run build`
- List any missing backend endpoints
```