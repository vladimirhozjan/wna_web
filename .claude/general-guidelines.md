# General Guidelines — WNA Admin App Implementation

These guidelines apply to every implementation step in the admin-app. All AI agents and developers must follow them.

---

## 1. Code Style & Conventions

### Vue 3 Composition API
- **Always use `<script setup>`** — no Options API, no `defineComponent()`
- **Props:** `defineProps({ ... })` with default values where applicable
- **Emits:** `defineEmits([...])` — list all emitted events
- **Refs/Reactive:** `ref()` for primitives, `reactive()` for objects, `computed()` for derived state
- **Watchers:** `watch()` for side effects, `watchEffect()` only when appropriate

### File Naming
- **Components:** PascalCase `.vue` (e.g., `DataTable.vue`, `UserDetailPage.vue`)
- **Pages/Views:** PascalCase with `Page` suffix (e.g., `DashboardPage.vue`, `LoginPage.vue`)
- **Models/Scripts:** camelCase `.js` with descriptive suffix (e.g., `authModel.js`, `apiClient.js`)
- **Icons:** PascalCase `.vue` with `Icon` suffix (e.g., `UsersIcon.vue`)
- **CSS files:** kebab-case (e.g., `globals.css`, `colors.css`)

### Import Paths
- Use `@admin/` alias for admin-app internal imports: `import Btn from '@admin/components/Btn.vue'`
- Use `@/` only for truly shared code (currently none — keep apps independent)
- Relative imports within the same directory are fine: `import { authModel } from './authModel.js'`

### Component Organization
Inside `<script setup>`, order code as:
1. Imports (Vue, components, scripts — grouped by type)
2. Props and emits
3. Reactive state (refs, reactive, computed)
4. Methods/functions
5. Watchers
6. Lifecycle hooks (onMounted, onUnmounted)

### Template Conventions
- Use `v-if` / `v-else` for conditional rendering (not `v-show` unless performance-critical toggling)
- Use `v-for` with `:key` always
- Event handlers: `@click="handler"` — not `v-on:click`
- Attribute binding: `:prop="value"` — not `v-bind:prop`
- Self-closing tags for components without content: `<Btn />`

---

## 2. Singleton Model Pattern

All global state uses the singleton pattern (no Vuex/Pinia):

```javascript
let instance = null

export function modelName() {
  if (instance) return instance

  // Reactive state
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Methods
  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await apiClient.fetchSomething()
      items.value = result.data
    } catch (err) {
      error.value = err.message || 'Something went wrong'
    } finally {
      loading.value = false
    }
  }

  instance = { items, loading, error, load }
  return instance
}
```

**Rules:**
- One singleton per domain concern (auth, dashboard, users, audit, etc.)
- State is reactive refs, not plain objects
- Methods handle their own loading/error state
- `try-catch-finally` for all async operations
- Return only what consumers need

---

## 3. API Integration Pattern

### Three-Layer Architecture
1. **httpApi.js** — Axios instance (base URL, interceptors, token management)
2. **apiClient.js** — Named async functions wrapping httpApi calls with error normalization
3. **Models** — Singleton models that call apiClient and manage reactive state

### apiClient Functions
```javascript
export async function listUsers(params) {
  try {
    const { data } = await httpApi.get('/users', { params })
    return data
  } catch (err) {
    throw normalizeError(err)
  }
}
```

### Error Normalization
```javascript
function normalizeError(err) {
  if (err.response) {
    return {
      status: err.response.status,
      message: err.response.data?.detail || err.response.data?.error || 'Request failed'
    }
  }
  return { status: 0, message: 'Network error' }
}
```

### Error Display
- Use `errorModel().push(message)` for error toasts
- Use `errorModel().success(message)` for success toasts
- Never show raw error objects to the user
- Provide actionable error messages where possible

---

## 4. Routing & Guards

### Route Meta
Every route should declare its requirements:
```javascript
{
  path: '/users',
  component: UsersPage,
  meta: { requiresAuth: true, minRole: 'support' }
}
```

### Guard Logic (in order)
1. Not authenticated → redirect to `/login`
2. Authenticated but `pending_otp_setup` → redirect to `/otp-setup`
3. Authenticated but insufficient role → redirect to `/dashboard` (or show 403 page)
4. Allow

### Lazy Loading
Use dynamic imports for non-critical routes to enable code splitting:
```javascript
{ path: '/analytics', component: () => import('../views/AnalyticsPage.vue') }
```
Critical routes (login, dashboard) should be eagerly loaded.

---

## 5. Styling Rules

### CSS Variables Only
- **Never hardcode colors** — always use CSS variables from tokens
- **Never hardcode font sizes or weights** — use typography tokens
- **Never hardcode spacing** — use layout tokens for consistent gaps/padding

### Scoped Styles
- All component styles must be `<style scoped>`
- Exception: global styles in `globals.css` and token files

### Theme Support
- All colors must work in both light and dark themes
- Use semantic color names (`--color-text-primary`, `--color-bg-primary`) not absolute names (`--color-white`)
- Test both themes during development

### Responsive Design
- Mobile breakpoint: `max-width: 768px`
- Tablet breakpoint: `max-width: 1024px`
- Sidebar collapses to drawer on mobile
- Data tables scroll horizontally on mobile
- Forms stack vertically on mobile

### Transitions
- Use Vue `<Transition>` for mount/unmount animations
- Standard durations: 150ms for micro-interactions, 200ms for modals/panels, 250ms for page transitions
- Ease function: `ease` or `ease-in-out`

---

## 6. Component Guidelines

### Props
- Use descriptive prop names
- Provide sensible defaults
- Document complex props with comments if needed

### Events
- Name events as verbs: `@update`, `@delete`, `@select`, `@close`
- Emit data, not DOM events
- For v-model: use `modelValue` prop + `update:modelValue` emit

### Slots
- Use named slots for complex components: `header`, `footer`, `actions`, `empty`
- Default slot for simple content
- Provide fallback content where useful

### Accessibility
- All interactive elements must be keyboard-accessible (Enter, Escape, Tab)
- Buttons use `<button>`, not `<div @click>`
- Inputs have associated labels
- Modals trap focus
- Use `aria-label` for icon-only buttons

---

## 7. Security Guidelines

### Token Storage
- Store JWT in localStorage (consistent with main-app pattern)
- Use `admin_` prefix for all localStorage keys to prevent collision with main-app
- Clear all admin tokens on logout
- Never expose tokens in URLs or logs

### Input Validation
- Validate all user inputs client-side before sending to API
- Sanitize any user-generated content displayed in the UI (XSS prevention)
- For email confirmation dialogs (delete user), compare exact string match

### Role Enforcement
- UI must hide elements the admin's role cannot access
- But never rely solely on frontend role checks — backend enforces authorization
- If backend returns 403, show appropriate message (not raw error)

---

## 8. Performance Guidelines

### Data Fetching
- Fetch data on mount, not in route guards (keep navigation instant)
- Use loading states — never show empty/stale data without indicator
- Cancel pending requests when navigating away (via AbortController or component unmount)
- Dashboard auto-refresh: use `setInterval`, clear on unmount

### Bundle Size
- Lazy-load route components for pages not in the critical path
- Avoid large dependencies — prefer lightweight alternatives
- Only import what's needed from libraries (tree-shaking)

### Pagination
- All list pages must be paginated — never load all records at once
- Use the pagination format provided by the backend (cursor-based or offset-based)
- Show total count and current page/range

---

## 9. Error Handling

### User-Facing Errors
- Toast for transient errors (network issues, temporary failures)
- Inline errors for form validation (below the field)
- Full-page error state for critical failures (service unreachable)
- Never show stack traces or raw JSON to users

### Loading States
- Every async operation must have a visible loading indicator
- Buttons show spinner when their action is loading
- Tables show skeleton/spinner while loading
- Disable form submission while loading

### Edge Cases
- Handle empty states (no data) with helpful messages
- Handle 401 (expired session) → redirect to login
- Handle 403 (insufficient role) → show permission message
- Handle 404 → show "not found" state
- Handle network errors → show retry option

---

## 10. Git & Commit Conventions

- Feature branches from `develop-a`
- Commit messages: imperative mood, concise
  - `Add login page with email/password form`
  - `Fix OTP guard redirect loop`
  - `Update sidebar to hide items by role`
- One logical change per commit
- Never commit: `.env` files, `node_modules/`, `dist/`, IDE config, secrets

---

## 11. Testing Strategy

For V1, manual testing against the running backend is the primary testing method. When automated testing is introduced:

- **Unit tests:** Utility functions, model logic, role hierarchy helper
- **Component tests:** Form validation, conditional rendering, event emission
- **E2E tests:** Auth flow (login → OTP → dashboard), role-based navigation, CRUD operations

---

## 12. Dependency Policy

- **Minimize new dependencies** — prefer vanilla JS/CSS solutions
- **Approved additions for admin-app:**
  - `qrcode` — for OTP QR code generation (required)
  - Charting library (deferred to analytics phase) — prefer lightweight (`chart.js` or CSS-only)
- **Already in package.json (shared with main-app):**
  - Vue 3, Vue Router, Axios, date-fns
- **Do not add:** state management libraries (Pinia/Vuex), CSS frameworks (Tailwind/Bootstrap), large UI component libraries (Vuetify/Element)