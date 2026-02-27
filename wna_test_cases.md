# WNA (WhatsNextAction) - QA Test Case Document

## How to Use This Document

This document contains manual test cases for the WNA GTD productivity application. Each test case is a self-contained scenario that validates a specific feature or behavior.

**Before you begin:**
- Ensure the frontend dev server is running (`npm run dev` on `http://localhost:5173`)
- Ensure the backend is running on `http://localhost:8000`
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Clear localStorage and cookies before starting a fresh test run
- Have access to at least one pre-registered test account and one unused email address

**Legend:**

| Symbol | Meaning |
|--------|---------|
| **P** | Pass - Test case behaves exactly as expected |
| **F** | Fail - Actual behavior deviates from expected result |
| **S** | Skip - Test case was not executed (note reason in Comment) |
| **B** | Blocked - Cannot run due to a dependency or environment issue |

**Priority Definitions:**

| Priority | Meaning |
|----------|---------|
| **High** | Core functionality; if broken, the feature is unusable |
| **Medium** | Important behavior; degraded experience but workaround exists |
| **Low** | Polish, edge cases, or cosmetic concerns |

---

## Test Run Summary

Use the table below to log each full or partial test run.

| # | Date | Tester | Total Passed | Total Failed | Total Skipped | Build / Branch | Comments |
|---|------|--------|--------------|--------------|---------------|----------------|----------|
| 1 |      |        |              |              |               |                |          |
| 2 |      |        |              |              |               |                |          |
| 3 |      |        |              |              |               |                |          |
| 4 |      |        |              |              |               |                |          |
| 5 |      |        |              |              |               |                |          |
| 6 |      |        |              |              |               |                |          |
| 7 |      |        |              |              |               |                |          |
| 8 |      |        |              |              |               |                |          |
| 9 |      |        |              |              |               |                |          |
| 10 |     |        |              |              |               |                |          |

---

## Section 1: Authentication & Account

---

### TC-001: Successful Registration
**Priority:** High | **Area:** Registration

**Preconditions:** User is not logged in. No account exists for the test email address. Browser localStorage is clear of `auth_token` and `refresh_token`.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Locate and click the "Start Here" call-to-action button.
3. Verify the authentication dialog opens and the registration form is displayed (fields: email, password, confirm password).
4. Enter a valid, unused email address in the email field (e.g., `testuser_001@example.com`).
5. Enter a valid password that meets all requirements: minimum 8 characters, at least 1 letter, at least 1 digit, and at least 1 symbol (e.g., `TestPass1!`).
6. Enter the same password in the confirm password field.
7. Click the "Register" (or equivalent submit) button.
8. Wait for the request to complete.

**Expected Result:**
- The registration request succeeds (no error messages displayed).
- The user is automatically logged in and redirected to `/engage` (the main dashboard).
- Opening the browser developer tools and inspecting `localStorage` shows both `auth_token` and `refresh_token` keys present with non-empty JWT string values.
- The dashboard layout is visible (sidebar, top navigation, inbox or default view).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-002: Registration with Invalid Email Format
**Priority:** High | **Area:** Registration

**Preconditions:** User is not logged in. The registration form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Start Here" to open the authentication dialog in registration mode.
3. In the email field, type `notanemail` (a string that is not a valid email format).
4. Enter a valid password in the password field (e.g., `TestPass1!`).
5. Enter the same password in the confirm password field.
6. Click the "Register" submit button, or tab out of the email field to trigger validation.

**Expected Result:**
- A client-side validation error is displayed near or below the email field indicating the email format is invalid (e.g., "Please enter a valid email address" or the browser's native email validation message).
- No HTTP request is sent to the backend (verify in the Network tab of developer tools).
- The user remains on the registration form.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-003: Registration with Weak Password
**Priority:** High | **Area:** Registration

**Preconditions:** User is not logged in. The registration form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Start Here" to open the authentication dialog in registration mode.
3. Enter a valid email address in the email field (e.g., `testuser_003@example.com`).
4. In the password field, enter `12345678` (8 characters but only digits -- no letter and no symbol).
5. Enter `12345678` in the confirm password field.
6. Click the "Register" submit button or trigger validation by tabbing/blurring out of the password field.

**Expected Result:**
- A validation error is displayed indicating the password does not meet strength requirements (must contain at least 1 letter, 1 digit, and 1 symbol).
- The registration is not submitted to the backend.
- The user remains on the registration form with the error visible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-004: Registration Password Mismatch
**Priority:** High | **Area:** Registration

**Preconditions:** User is not logged in. The registration form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Start Here" to open the authentication dialog in registration mode.
3. Enter a valid email address in the email field (e.g., `testuser_004@example.com`).
4. In the password field, enter a valid password: `TestPass1!`.
5. In the confirm password field, enter a different password: `DifferentPass2@`.
6. Click the "Register" submit button.

**Expected Result:**
- A validation error is displayed indicating that the passwords do not match (e.g., "Passwords do not match").
- The registration request is not sent to the backend.
- The user remains on the registration form. Both password fields remain filled so the user can correct them.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-005: Registration with Existing Email
**Priority:** High | **Area:** Registration

**Preconditions:** An account already exists with the email `existing@example.com` (or another known registered email). User is not logged in.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Start Here" to open the authentication dialog in registration mode.
3. Enter the already-registered email address in the email field (e.g., `existing@example.com`).
4. Enter a valid password: `TestPass1!`.
5. Enter the same password in the confirm password field: `TestPass1!`.
6. Click the "Register" submit button.
7. Wait for the backend response.

**Expected Result:**
- The backend returns HTTP 409 (Conflict).
- An error message is displayed to the user containing text such as "Email already exists" or similar wording indicating the email is taken.
- The user remains on the registration form and can correct the email.
- No tokens are stored in localStorage.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-006: Registration Submit Button Disabled When Fields Empty
**Priority:** Medium | **Area:** Registration

**Preconditions:** User is not logged in. The registration form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Start Here" to open the authentication dialog in registration mode.
3. Observe the submit button with all three fields (email, password, confirm password) empty.
4. Verify the submit button is visually disabled (greyed out, cursor not pointer) and cannot be clicked.
5. Enter only an email address in the email field. Leave password and confirm password empty.
6. Verify the submit button remains disabled.
7. Enter a password in the password field. Leave confirm password empty.
8. Verify the submit button remains disabled.
9. Enter the matching password in the confirm password field.
10. Verify the submit button is now enabled (visually active, cursor is pointer).
11. Clear the email field, leaving password and confirm password filled.
12. Verify the submit button returns to the disabled state.

**Expected Result:**
- The submit button is disabled whenever any of the three fields (email, password, confirm password) is empty.
- The submit button becomes enabled only when all three fields have non-empty values.
- Clicking a disabled button produces no action, no API call, and no error.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-007: Successful Login
**Priority:** High | **Area:** Login

**Preconditions:** A valid user account exists (e.g., `testuser@example.com` with password `TestPass1!`). User is not logged in. localStorage is clear of auth tokens.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" in the top navigation to open the authentication dialog in login mode.
3. Enter the registered email address in the email field: `testuser@example.com`.
4. Enter the correct password in the password field: `TestPass1!`.
5. Click the "Log In" (or equivalent submit) button.
6. Wait for the request to complete.

**Expected Result:**
- The login request succeeds with no error messages.
- The user is redirected to `/engage` (the main dashboard).
- The authentication dialog closes.
- Opening browser developer tools and checking `localStorage` reveals both `auth_token` and `refresh_token` with valid JWT string values.
- The `current_user` key in localStorage contains cached user data.
- The dashboard UI loads correctly (sidebar, top nav with user context).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-008: Login with Wrong Password
**Priority:** High | **Area:** Login

**Preconditions:** A valid user account exists (e.g., `testuser@example.com`). User is not logged in.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog in login mode.
3. Enter the registered email address: `testuser@example.com`.
4. Enter an incorrect password: `WrongPassword1!`.
5. Click the "Log In" submit button.
6. Wait for the backend response.

**Expected Result:**
- The backend returns HTTP 401 (Unauthorized).
- An error message is displayed to the user indicating invalid credentials (e.g., "Invalid email or password" or similar).
- The user remains on the login form.
- No tokens are stored in localStorage.
- The password field is cleared or remains filled (note which behavior occurs).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-009: Login with Invalid Email Format
**Priority:** Medium | **Area:** Login

**Preconditions:** User is not logged in. The login form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog in login mode.
3. Enter an invalid email format in the email field: `notanemail`.
4. Enter any password in the password field: `TestPass1!`.
5. Click the "Log In" submit button.
6. Wait for the response.

**Expected Result:**
- Either a client-side validation error is shown preventing submission, or the request is sent and the backend returns HTTP 400 (Bad Request) with a message indicating invalid email format.
- An appropriate error message is displayed to the user.
- The user remains on the login form.
- No tokens are stored in localStorage.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-010: Login with Empty Fields
**Priority:** Medium | **Area:** Login

**Preconditions:** User is not logged in. The login form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog in login mode.
3. Leave both the email and password fields empty.
4. Observe the state of the "Log In" submit button.
5. Attempt to click the submit button.
6. Enter only an email address, leave the password empty. Observe the submit button state.
7. Clear the email, enter only a password. Observe the submit button state.
8. Fill in both email and password. Observe the submit button state.

**Expected Result:**
- The submit button is disabled when either or both fields are empty.
- The submit button becomes enabled only when both email and password fields contain non-empty values.
- No API request is made when the button is disabled and clicked.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-011: Login via /login URL
**Priority:** Medium | **Area:** Login

**Preconditions:** User is not logged in. No authentication dialog is currently open.

**Steps:**
1. Open a new browser tab.
2. Navigate directly to `http://localhost:5173/login` by typing or pasting the URL into the address bar.
3. Wait for the page to load.

**Expected Result:**
- The application loads the landing page with the authentication dialog automatically open in login mode.
- The login form is visible with email and password fields.
- The URL may remain as `/login` or redirect; note the actual behavior.
- The form is functional and a valid login can be completed from this state.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-012: Login via "Sign In" Button on Landing Page
**Priority:** High | **Area:** Login

**Preconditions:** User is not logged in. User is on the landing page.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Locate the "Sign In" button in the top navigation bar.
3. Click the "Sign In" button.
4. Observe what happens.

**Expected Result:**
- An authentication modal/dialog opens overlaid on the landing page.
- The dialog is in login mode (shows email and password fields, a "Log In" button).
- The landing page content is visible behind the dialog (with a blur backdrop effect).
- The dialog is centered on screen.
- The form is functional and ready for input.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-013: Navigate to Forgot Password
**Priority:** High | **Area:** Forgot/Reset Password

**Preconditions:** User is not logged in. The login form is open.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog in login mode.
3. Verify the login form is displayed with email and password fields.
4. Locate the "Forgot your password?" link on the login form.
5. Click the "Forgot your password?" link.
6. Observe the transition.

**Expected Result:**
- The dialog transitions from the login form to the forgot password form.
- The forgot password form displays an email input field and a submit button.
- The transition is smooth (animated, not an abrupt jump).
- Any previously entered email in the login form may be carried over to the forgot password email field (note actual behavior).
- A back link or way to return to the login form is available.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-014: Submit Forgot Password
**Priority:** High | **Area:** Forgot/Reset Password

**Preconditions:** User is not logged in. The forgot password form is displayed (navigate via TC-013 steps).

**Steps:**
1. Open the forgot password form (follow steps 1-5 from TC-013).
2. Enter a valid registered email address in the email field (e.g., `testuser@example.com`).
3. Click the submit button (e.g., "Send Reset Code" or "Submit").
4. Wait for the backend response.

**Expected Result:**
- The request is sent to the backend (`POST /v1/user/forgot`).
- Upon success, the dialog transitions to the password reset form, which includes fields for new password and confirm new password (and possibly a reset code/token field).
- A success message or instruction may be displayed (e.g., "Check your email for a reset code").
- The user remains in the authentication dialog flow.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-015: Reset Password with Valid New Password
**Priority:** High | **Area:** Forgot/Reset Password

**Preconditions:** The forgot password step has been completed (TC-014). The reset password form is displayed. A valid reset code/token is available (from email or test setup).

**Steps:**
1. Complete the forgot password flow (TC-014) to reach the reset password form.
2. If a reset code/token field is present, enter the valid reset code.
3. In the new password field, enter a password meeting all requirements: `NewTestPass1!` (min 8 chars, 1 letter, 1 digit, 1 symbol).
4. In the confirm new password field, enter the same password: `NewTestPass1!`.
5. Click the submit button (e.g., "Reset Password").
6. Wait for the backend response.

**Expected Result:**
- The request is sent to the backend (`POST /v1/user/reset`).
- Upon success, the dialog transitions back to the login form.
- A success message may be displayed (e.g., "Password reset successfully. Please log in.").
- The user can now log in with the new password.
- The old password no longer works.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-016: Reset Password Validation
**Priority:** Medium | **Area:** Forgot/Reset Password

**Preconditions:** The reset password form is displayed (reached via TC-013 and TC-014 steps).

**Steps:**
1. Reach the reset password form (complete TC-014).
2. **Test weak password:** Enter `12345678` in the new password field and `12345678` in the confirm field. Attempt to submit.
3. Observe the validation error.
4. Clear the fields.
5. **Test mismatch:** Enter `NewTestPass1!` in the new password field and `DifferentPass2@` in the confirm field. Attempt to submit.
6. Observe the validation error.
7. Clear the fields.
8. **Test empty fields:** Leave both password fields empty. Observe the submit button state.

**Expected Result:**
- Weak password: A validation error is shown indicating the password does not meet strength requirements (must include letter, digit, and symbol).
- Password mismatch: A validation error is shown indicating the passwords do not match.
- Empty fields: The submit button is disabled or submission is prevented.
- In all failing cases, no reset request is sent to the backend.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-017: Close Auth Dialog by Clicking Backdrop
**Priority:** Medium | **Area:** Auth Dialog Behaviors

**Preconditions:** User is not logged in. User is on the landing page.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog.
3. Verify the dialog is open and visible, overlaid on the landing page with a backdrop behind it.
4. Click on the backdrop area (the darkened/blurred area outside the dialog card).
5. Observe the result.
6. Reopen the dialog by clicking "Sign In" again.
7. Click "Start Here" to switch to registration mode. Verify the dialog is showing the registration form.
8. Click on the backdrop area outside the dialog card.
9. Observe the result.

**Expected Result:**
- In both cases (login mode and registration mode), clicking the backdrop closes the authentication dialog.
- The dialog closes with a smooth animation (fade out).
- The landing page is fully visible and interactive after the dialog closes.
- No errors are thrown in the browser console.
- The URL returns to `/` (landing page root) if it had changed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-018: Switch Between Auth Modes (Login/Register)
**Priority:** Medium | **Area:** Auth Dialog Behaviors

**Preconditions:** User is not logged in. User is on the landing page.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog in login mode.
3. Verify the login form is displayed (email field, password field, submit button).
4. Enter an email address in the email field: `testuser@example.com`.
5. Enter a password in the password field: `SomePass1!`.
6. Locate and click the link/button to switch to registration mode (e.g., "Don't have an account? Register" or similar).
7. Verify the form transitions to registration mode.
8. Check the email field: does it retain the previously entered email (`testuser@example.com`)?
9. Check the password field: is it cleared?
10. Check the confirm password field: is it empty?
11. Check for any lingering error messages from the previous mode: they should be cleared.
12. Now enter a password and confirm password in the registration form.
13. Click the link/button to switch back to login mode (e.g., "Already have an account? Sign In").
14. Verify the form transitions back to login mode.
15. Check the email field: does it still retain the email from step 4?
16. Check the password field: is it cleared?
17. Check for any lingering error messages: they should be cleared.

**Expected Result:**
- Switching between login and register modes preserves the email address.
- Password fields are cleared on every mode switch (for security).
- Any validation errors from the previous mode are cleared.
- The transition between modes is animated (not an instant jump).
- The dialog remains open throughout the mode switches.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-019: Animated Transitions Between Auth Modes
**Priority:** Low | **Area:** Auth Dialog Behaviors

**Preconditions:** User is not logged in. User is on the landing page.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog.
3. Observe the dialog opening animation.
4. Click the link to switch to registration mode.
5. Carefully observe the transition animation between login and register forms.
6. Switch back to login mode.
7. Observe the reverse transition animation.
8. Click "Forgot your password?" to navigate to the forgot password form.
9. Observe the transition animation.
10. Navigate back to the login form and observe the reverse animation.

**Expected Result:**
- The dialog opens with a visible animation (fade in + slide up or similar entry animation).
- Switching between modes (login, register, forgot password) uses a smooth animated transition (e.g., fade + slide up/down, or cross-fade).
- Transitions are not instantaneous/jarring -- there is a perceptible but brief animation (approximately 200-400ms).
- The dialog card does not visually "jump" or resize abruptly.
- No visual glitches, flickering, or layout shifts during transitions.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-020: Auth Dialog Styling and Layout
**Priority:** Low | **Area:** Auth Dialog Behaviors

**Preconditions:** User is not logged in. User is on the landing page.

**Steps:**
1. Navigate to `http://localhost:5173/` (the landing page).
2. Click "Sign In" to open the authentication dialog.
3. Inspect the backdrop: does it have a blur effect applied to the background content?
4. Inspect the dialog card positioning: is it centered both horizontally and vertically on the screen?
5. Using browser developer tools, inspect the dialog card's computed CSS: what is its `max-width`?
6. Resize the browser window to a narrow width (e.g., 375px mobile width). Observe how the dialog adapts.
7. Resize the browser to a wide desktop width (e.g., 1920px). Observe the dialog positioning and size.

**Expected Result:**
- The backdrop has a CSS `backdrop-filter: blur(...)` effect, making the landing page content behind it blurred.
- The dialog card is centered on the screen (horizontally and vertically).
- The dialog card has a `max-width` of `420px` (or close to it as defined in the design).
- On narrow screens (mobile), the dialog adapts gracefully: it may take near-full width with appropriate padding, and content remains accessible without horizontal scrolling.
- On wide screens, the dialog remains centered and does not stretch beyond its max-width.
- The dialog card has appropriate styling (border-radius, shadow, padding).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-021: Token Storage After Login
**Priority:** High | **Area:** JWT & Session Management

**Preconditions:** A valid user account exists. User is not logged in. localStorage is clear (no `auth_token`, `refresh_token`, or `current_user` keys).

**Steps:**
1. Open browser developer tools and navigate to the Application tab (Chrome) or Storage tab (Firefox).
2. Expand localStorage for `http://localhost:5173`.
3. Verify no `auth_token`, `refresh_token`, or `current_user` keys exist.
4. Navigate to `http://localhost:5173/`.
5. Click "Sign In" and log in with valid credentials.
6. After successful login and redirect to `/engage`, return to the developer tools.
7. Inspect localStorage.
8. Click on the `auth_token` value and examine its format.
9. Click on the `refresh_token` value and examine its format.
10. Click on the `current_user` value and examine its contents.

**Expected Result:**
- After login, localStorage contains three keys: `auth_token`, `refresh_token`, and `current_user`.
- `auth_token` is a non-empty string in JWT format (three base64-encoded segments separated by dots: `xxxxx.yyyyy.zzzzz`).
- `refresh_token` is a non-empty string in JWT format.
- `current_user` contains a JSON-serialized object with user data (at minimum, an email or user ID).
- The `auth_token` and `refresh_token` are different values from each other.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-022: Proactive Token Refresh Before Expiry
**Priority:** High | **Area:** JWT & Session Management

**Preconditions:** User is logged in. Both `auth_token` and `refresh_token` are present in localStorage. The httpApi interceptor is configured to refresh tokens when the auth_token expires within 60 seconds.

**Steps:**
1. Log in to the application with valid credentials.
2. Open browser developer tools, go to the Application tab, and locate `auth_token` in localStorage.
3. Decode the JWT `auth_token` (use a tool like jwt.io or a browser extension) and note the `exp` (expiration) claim timestamp.
4. Manually modify the `auth_token` in localStorage to simulate near-expiry: replace it with a token whose `exp` is within the next 60 seconds. Alternatively, wait until the token is within 60 seconds of expiry (if feasible in the test environment).
5. Trigger an API call by performing an action in the app (e.g., navigate to Inbox, which fetches stuff items).
6. Open the Network tab in developer tools and observe the HTTP requests.

**Expected Result:**
- Before the main API call is sent, the httpApi interceptor detects the token is within 60 seconds of expiry.
- An automatic request is made to the token refresh endpoint (`POST /v1/user/refresh`) using the `refresh_token`.
- The refresh endpoint returns new tokens.
- The `auth_token` and `refresh_token` in localStorage are updated with the new values.
- The original API call proceeds with the new `auth_token` in the Authorization header and succeeds.
- The user experiences no interruption or error.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-023: Cross-Tab Logout
**Priority:** Medium | **Area:** JWT & Session Management

**Preconditions:** User is logged in.

**Steps:**
1. Log in to the application in Tab A at `http://localhost:5173/engage`.
2. Verify the dashboard loads correctly in Tab A.
3. Open a new browser tab (Tab B) and navigate to `http://localhost:5173/engage`.
4. Verify the dashboard loads correctly in Tab B (the user is still authenticated).
5. In Tab A, perform a logout action: click the logout option (from the TopNav user menu, Settings page, or Sidebar -- wherever it is available).
6. If a confirmation dialog appears, confirm the logout.
7. Verify that Tab A redirects to the landing page (`/`).
8. Switch to Tab B.
9. Observe Tab B's behavior. Perform an action that triggers an API call (e.g., click on Inbox, refresh the page, or wait for any polling).

**Expected Result:**
- Tab A logs out successfully and redirects to the landing page.
- Tab B detects the logout (via a `storage` event listener on localStorage changes, or on the next API call).
- Tab B either automatically redirects to the landing page, or when the user tries to interact, the API call fails (due to cleared tokens) and the user is redirected to the landing page.
- No stale authenticated UI is shown in Tab B after the logout is detected.
- localStorage in both tabs no longer contains `auth_token` or `refresh_token`.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-024: Logout Flow
**Priority:** High | **Area:** JWT & Session Management

**Preconditions:** User is logged in and on the dashboard (`/engage`).

**Steps:**
1. Log in to the application and verify you are on `/engage`.
2. Locate the logout option. Check the following locations:
   a. TopNav -- look for a user avatar/menu or a logout icon in the top navigation bar.
   b. Sidebar -- look for a logout option at the bottom of the sidebar.
   c. Settings -- navigate to settings and look for a logout button.
3. Click the logout option.
4. Observe whether a confirmation dialog appears.
5. If a confirmation dialog appears:
   a. Verify it asks for confirmation (e.g., "Are you sure you want to log out?").
   b. Verify it has confirm and cancel buttons.
   c. Click the cancel button first. Verify the dialog closes and you remain logged in on `/engage`.
   d. Click logout again and this time confirm the action.
6. After confirming (or if no dialog, after clicking logout):
   a. Observe the redirect behavior.
   b. Open developer tools and check localStorage.

**Expected Result:**
- A confirmation dialog appears before logging out (using the `confirmModel` singleton pattern).
- Canceling the dialog keeps the user logged in with no side effects.
- Confirming the logout:
  - Clears `auth_token`, `refresh_token`, and `current_user` from localStorage.
  - Redirects the user to the landing page (`/`).
  - The dashboard is no longer accessible without logging in again.
- No errors are thrown in the browser console during the logout process.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-025: Route Protection for Authenticated Routes
**Priority:** High | **Area:** JWT & Session Management

**Preconditions:** User is NOT logged in. localStorage does not contain `auth_token` or `refresh_token`.

**Steps:**
1. Open browser developer tools and verify localStorage has no `auth_token` or `refresh_token`.
2. In the browser address bar, navigate directly to `http://localhost:5173/engage`.
3. Observe the application behavior.
4. Check the URL in the address bar after the page loads.
5. Attempt to navigate to other protected routes:
   a. `http://localhost:5173/engage/inbox`
   b. `http://localhost:5173/engage/next`
   c. `http://localhost:5173/engage/projects`
   d. `http://localhost:5173/engage/calendar`
   e. `http://localhost:5173/engage/settings`
6. For each, observe the redirect behavior and final URL.

**Expected Result:**
- For every protected route (`/engage` and all sub-routes), the Vue Router auth guard intercepts the navigation.
- The user is redirected to the landing page (`/`) since they are not authenticated.
- No flash of the dashboard UI is visible before the redirect (the guard should prevent the component from mounting).
- The redirect happens consistently for all protected routes tested.
- After redirect, the user can log in normally and then access `/engage`.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |


## Section 2: Dashboard Layout & Navigation

---

### TC-026: Top Nav - Guest View Desktop
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is not authenticated. Browser viewport is desktop width (>768px). Application is loaded at the landing page.

**Steps:**
1. Open the application in a desktop browser without being logged in
2. Observe the top navigation bar on the left side
3. Observe the center section of the top navigation bar
4. Observe the right side of the top navigation bar
5. Resize the browser window to various desktop widths (1024px, 1280px, 1440px, 1920px) and observe layout behavior

**Expected Result:** The left side of the nav displays the app icon and "WhatsNextAction" text. The center section contains navigation links: "Why GTD", "Features", "Pricing", and "Help". The right side displays a "Start Here" button and a "Sign In" button. All elements remain properly aligned and visible across desktop viewport widths. Links are clickable and route to their respective pages.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-027: Top Nav - Guest View Mobile
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is not authenticated. Browser viewport is mobile width (<=768px). Application is loaded at the landing page.

**Steps:**
1. Open the application in a mobile-width browser (or use DevTools to set viewport to 375px width) without being logged in
2. Observe the top navigation bar
3. Verify the app icon and "WhatsNextAction" text are present
4. Verify that a hamburger menu icon is visible instead of the inline navigation links
5. Tap the hamburger menu icon
6. Verify the menu contains all navigation links: "Why GTD", "Features", "Pricing", "Help"
7. Verify the menu contains "Start Here" and "Sign In" buttons
8. Tap each link and verify it navigates to the correct page
9. Tap outside the menu or tap a close control to dismiss it

**Expected Result:** On mobile viewports, the center navigation links and right-side buttons are replaced by a hamburger menu icon. Tapping the hamburger reveals a dropdown or drawer containing all the same links ("Why GTD", "Features", "Pricing", "Help") and buttons ("Start Here", "Sign In"). Each link navigates correctly. The menu can be dismissed by tapping outside it or using a close control.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-028: Top Nav - Authenticated Desktop
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated with a valid session. Browser viewport is desktop width (>768px). User is on any dashboard page.

**Steps:**
1. Log in with valid credentials on a desktop browser
2. Observe the top navigation bar after login
3. Verify a "Quick Add" button is visible in the nav bar
4. Click the "Quick Add" button and verify it opens an input for adding stuff
5. Verify the user avatar is displayed on the right side of the nav bar
6. Click the user avatar to open the dropdown menu
7. Verify the dropdown contains: "My Dashboard", "Settings", and "Logout" options
8. Click "My Dashboard" and verify navigation to the dashboard view
9. Click the avatar again, then click "Settings" and verify navigation to settings
10. Click the avatar again, then click "Logout" and verify the user is logged out and redirected to the landing page

**Expected Result:** The authenticated desktop nav bar shows a "Quick Add" button and a user avatar. The Quick Add button opens an input for rapidly adding inbox items. Clicking the avatar reveals a dropdown with "My Dashboard", "Settings", and "Logout". Each option navigates to the correct destination. Logout clears the session and redirects to the landing page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-029: Top Nav - Authenticated Mobile
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated with a valid session. Browser viewport is mobile width (<=768px). User is on any dashboard page.

**Steps:**
1. Log in with valid credentials on a mobile-width browser (or set DevTools viewport to 375px)
2. Observe the top navigation bar after login
3. Verify a hamburger icon is displayed in the nav bar
4. Tap the hamburger icon
5. Verify that a sidebar drawer slides in from the left side of the screen
6. Verify the drawer contains all sidebar navigation items (Dashboard, Inbox, Next Action, Projects, etc.)
7. Tap any navigation item and verify it routes correctly and the drawer closes
8. Re-open the drawer and verify it can be closed by tapping the overlay area outside the drawer

**Expected Result:** On mobile authenticated view, the hamburger icon replaces the full sidebar. Tapping it opens a slide-in sidebar drawer from the left containing all navigation items. Selecting a nav item routes to the correct page and closes the drawer. The drawer can also be dismissed by tapping the overlay outside it.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-030: Sidebar Desktop - Full Navigation Panel
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated. Browser viewport is desktop width (>768px). User is on the dashboard.

**Steps:**
1. Log in and navigate to any dashboard page on desktop
2. Observe the left sidebar panel
3. Measure or inspect the sidebar width (should be 260px fixed)
4. Verify the following nav items are present, each with an icon and count badge:
   - Dashboard
   - Context Filter
   - Next Action
   - Today
   - Inbox
   - Projects
   - Calendar
   - Waiting For
   - Someday/Maybe
   - Reference (with storage quota indicator)
   - Review (conditional, may or may not be visible)
   - Completed
   - Trash
5. Verify the footer area of the sidebar contains "Settings" and "Logout" options
6. Click each navigation item and verify it routes to the correct page
7. Verify the active/current page is visually highlighted in the sidebar

**Expected Result:** The sidebar is a 260px fixed-width panel on the left side of the dashboard. It displays all listed navigation items, each accompanied by an icon and a count badge showing the number of items in that category. The Reference item includes a storage quota indicator. The sidebar footer contains Settings and Logout links. Clicking any item navigates to the corresponding page, and the active page is visually highlighted.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-031: Sidebar Count Badges Update
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated on desktop. Sidebar is visible with count badges displayed. The inbox has at least one item.

**Steps:**
1. Note the current count badge number on "Inbox" in the sidebar
2. Navigate to the Inbox page
3. Add a new stuff item by typing text and pressing Enter
4. Observe the Inbox count badge in the sidebar (wait at least 300ms for debounce)
5. Verify the count has incremented by 1
6. Complete one stuff item by clicking its checkbox
7. Wait at least 300ms and verify the Inbox count badge decrements by 1
8. Delete another stuff item via the trash icon
9. Wait at least 300ms and verify the Inbox count badge decrements by 1 and the Trash count badge increments by 1
10. Navigate to different pages and verify all badges reflect current item counts

**Expected Result:** Sidebar count badges update dynamically (with a debounce of approximately 300ms) whenever items are created, completed, or deleted. Adding an item increments the relevant badge, completing an item decrements it, and deleting an item decrements the source badge while incrementing the Trash badge. All badges remain accurate across page navigation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-032: Sidebar Review Conditional Display
**Priority:** Medium | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated on desktop. User has access to Settings where Weekly Review can be enabled or disabled.

**Steps:**
1. Navigate to Settings
2. Disable the Weekly Review feature if it is currently enabled
3. Return to the dashboard and observe the sidebar
4. Verify the "Review" nav item is NOT visible in the sidebar
5. Navigate back to Settings and enable the Weekly Review feature
6. Return to the dashboard and observe the sidebar
7. Verify the "Review" nav item IS now visible in the sidebar
8. Without performing a weekly review, wait or simulate 7+ days since the last review
9. Verify the Review badge color changes to orange
10. Wait or simulate 14+ days since the last review
11. Verify the Review badge color changes to red

**Expected Result:** The Review sidebar item is conditionally displayed based on whether Weekly Review is enabled in settings. When disabled, it does not appear. When enabled, it appears with a badge. The badge color changes to orange when 7 or more days have passed since the last review, and to red when 14 or more days have passed, providing urgency cues to the user.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-033: Mobile Sidebar Drawer
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated. Browser viewport is mobile width (<=768px).

**Steps:**
1. Log in on a mobile viewport (375px width or use DevTools)
2. Verify the sidebar is not visible by default (no 260px panel on the left)
3. Tap the hamburger icon in the top navigation bar
4. Verify a sidebar drawer slides in from the left side of the screen with an animation
5. Verify a blur overlay covers the rest of the screen behind the drawer
6. Verify the drawer contains all navigation items matching the desktop sidebar
7. Tap the blur overlay area (outside the drawer)
8. Verify the drawer slides back closed and the overlay disappears
9. Re-open the drawer by tapping the hamburger icon again
10. Tap a navigation item inside the drawer
11. Verify the drawer closes and the app navigates to the selected page

**Expected Result:** On mobile viewports (<=768px), the sidebar is hidden by default. Tapping the hamburger icon causes a drawer to slide in from the left with a blur overlay behind it. The drawer contains all sidebar navigation items. Tapping the overlay closes the drawer. Tapping a nav item inside the drawer navigates to that page and closes the drawer.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-034: User Avatar Display
**Priority:** Medium | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated. Test with two accounts: one with a profile avatar image uploaded, and one without.

**Steps:**
1. Log in with an account that has a profile avatar image
2. Observe the user avatar in the top navigation bar on desktop
3. Verify the avatar displays as a 36px circle showing the uploaded image
4. Resize the viewport to mobile width (<=768px)
5. Verify the avatar displays as a 32px circle on mobile
6. Log out and log in with an account that has no profile avatar image
7. Observe the avatar area on desktop
8. Verify a colored circle fallback is displayed at 36px
9. Verify the fallback shows the first 2 characters of the user's email address, uppercased
10. Verify the text is legible against the background color
11. Check on mobile that the fallback circle is 32px

**Expected Result:** The user avatar displays as a 36px circle on desktop and 32px on mobile. When an avatar image is set, it is shown cropped to the circle. When no image is set, a colored circle fallback is shown containing the first 2 characters of the user's email address in uppercase. The fallback text is legible against the background color.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-035: User Avatar Color Consistency
**Priority:** Low | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated with an account that has no profile avatar image (uses fallback). Multiple sessions or browsers available for testing.

**Steps:**
1. Log in with an account that has no avatar image (e.g., user@example.com)
2. Note the background color of the fallback avatar circle
3. Log out and log back in with the same account
4. Verify the fallback avatar background color is exactly the same as before
5. Open the application in a different browser or incognito window
6. Log in with the same account
7. Verify the fallback avatar background color matches the previous sessions
8. Log in with a different account (e.g., other@example.com) and note its avatar color
9. Verify the color is different from the first account (unless the hash function produces the same result, which is unlikely)
10. Log back in with the first account and confirm the color has not changed

**Expected Result:** The avatar fallback background color is deterministically generated from the user's email address, producing the same color every time for the same email across sessions, browsers, and devices. Different email addresses produce different colors (with high probability).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-036: Sidebar Drag-Drop Targets
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated on desktop. Inbox contains at least 2 stuff items. Next Actions list contains at least 1 action item.

**Steps:**
1. Navigate to the Inbox page
2. Begin dragging a stuff item from the list toward the sidebar
3. Observe which sidebar items visually indicate they accept the drop (highlight or border change)
4. Drop the item on "Next Action" sidebar item and verify the stuff/action is moved to Next Actions
5. Drag another item and drop on "Today" sidebar item, verify acceptance
6. Drag an item and drop on "Calendar" sidebar item, verify acceptance
7. Drag an item and drop on "Waiting For" sidebar item, verify acceptance
8. Drag an item and drop on "Someday" sidebar item, verify acceptance
9. Drag an item and drop on "Completed" sidebar item, verify acceptance
10. Drag an item and drop on "Trash" sidebar item, verify acceptance
11. Drag an item and drop on "Projects" sidebar item, verify acceptance (stuff/actions allowed)
12. Drag a stuff item and drop on "Reference" sidebar item, verify acceptance (stuff only)
13. Navigate to Next Actions, drag an action item and drop on "Reference" sidebar item, verify it is rejected (actions not allowed on Reference)
14. Verify that sidebar items that do not accept the dragged item type do not show a drop indicator

**Expected Result:** The following sidebar items accept stuff and actions via drag-drop: Next, Today, Calendar, Waiting For, Someday, Completed, Trash, and Projects. The Reference sidebar item accepts stuff only, not actions. Non-accepting sidebar items do not show a drop indicator. Successfully dropped items are moved to the target bucket.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-037: Complex Sidebar Drops with Modal Prompts
**Priority:** High | **Area:** Dashboard Layout & Navigation

**Preconditions:** User is authenticated on desktop. Inbox contains at least 3 stuff items.

**Steps:**
1. Navigate to the Inbox page
2. Drag a stuff item and drop it on the "Calendar" sidebar item
3. Verify a date/time picker modal opens prompting the user to select a date and time
4. Select a date and time, then confirm
5. Verify the item is moved to the Calendar view with the selected date/time
6. Drag another stuff item and drop it on the "Waiting For" sidebar item
7. Verify a waiting-for modal opens prompting the user to specify who or what they are waiting for
8. Enter a name or description and confirm
9. Verify the item is moved to the Waiting For view with the waiting-for metadata set
10. Drag another stuff item and drop it on the "Projects" sidebar item
11. Verify an outcome modal opens prompting the user to define the project outcome
12. Enter an outcome description and confirm
13. Verify the item is transformed into a project and appears in the Projects view

**Expected Result:** Dropping an item on Calendar opens a date/time modal; after confirmation, the item appears in Calendar with the selected date. Dropping on Waiting For opens a modal to specify the waiting-for party; after confirmation, the item moves to Waiting For with metadata set. Dropping on Projects opens an outcome modal; after confirmation, the stuff is transformed into a project. All modals can be cancelled without moving the item.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-038: Catch-All Route Redirect
**Priority:** Medium | **Area:** Dashboard Layout & Navigation

**Preconditions:** Application is running. Test both as an authenticated and unauthenticated user.

**Steps:**
1. While not logged in, manually navigate to a non-existent URL path (e.g., /nonexistent-page)
2. Verify the application redirects to the root path (/)
3. Verify the landing page is displayed
4. Log in with valid credentials
5. Manually navigate to another non-existent URL path (e.g., /this-does-not-exist)
6. Verify the application redirects to the root path (/)
7. Verify the appropriate page is displayed (landing or dashboard depending on auth state routing)
8. Try additional invalid paths such as /foo/bar/baz and /inbox/invalid/subpath
9. Verify all unknown routes redirect to /

**Expected Result:** Any URL path that does not match a defined route in the application redirects the user to the root path (/). This applies to both authenticated and unauthenticated users. No 404 error page is shown; the user is seamlessly redirected.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 3: Inbox (Stuff)

---

### TC-039: Add Stuff Item to Inbox
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated and on the Inbox page.

**Steps:**
1. Navigate to the Inbox page
2. Locate the text input field for adding new items
3. Type "Buy groceries for the week" into the input field
4. Click the "Add" button (or press Enter)
5. Verify the new item "Buy groceries for the week" appears in the inbox list
6. Verify the input field is cleared after submission
7. Verify the item appears at the expected position in the list (typically top or bottom depending on implementation)
8. Add another item by typing "Call dentist to schedule appointment" and pressing Enter
9. Verify this second item also appears in the list
10. Refresh the page and verify both items persist

**Expected Result:** Typing text into the input and pressing Enter or clicking Add creates a new stuff item that immediately appears in the inbox list. The input field clears after submission. Items persist after page refresh, confirming they are saved to the backend.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-040: Inbox Item Count Badge
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox is empty or has a known number of items. Sidebar is visible (desktop viewport).

**Steps:**
1. Note the current count badge number next to "Inbox" in the sidebar (should be 0 if empty)
2. Navigate to the Inbox page
3. Add a new stuff item
4. Verify the Inbox sidebar badge updates to reflect the new count (previous count + 1)
5. Add two more stuff items
6. Verify the badge updates to previous count + 3
7. Complete one item by clicking its checkbox
8. Verify the badge decrements by 1
9. Delete one item via the trash icon
10. Verify the badge decrements by 1 again
11. Navigate away from the Inbox page and back, verify the badge still shows the correct count

**Expected Result:** The sidebar Inbox count badge accurately reflects the total number of items in the inbox at all times. It increments when items are added and decrements when items are completed or deleted. The count remains accurate across page navigation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-041: Complete Stuff from List
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 2 stuff items.

**Steps:**
1. Navigate to the Inbox page
2. Note the title of the first item in the list
3. Click the checkbox on the first item
4. Verify the item is removed from the inbox list (with animation if applicable)
5. Verify a success toast notification appears (e.g., "Item completed" or similar)
6. Verify the toast auto-dismisses after a few seconds
7. Verify the Inbox sidebar count badge decrements by 1
8. Navigate to the Completed page
9. Verify the completed item appears in the Completed list with its original title
10. Return to the Inbox and verify the item is no longer present

**Expected Result:** Clicking the checkbox on a stuff item marks it as completed, removes it from the inbox list, displays a success toast notification, updates the sidebar badge count, and the item appears in the Completed section.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-042: Inline Title Edit
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item with a known title.

**Steps:**
1. Navigate to the Inbox page
2. Click directly on the title text of an item (not the checkbox, not the general row area)
3. Verify the title text transforms into an editable input field containing the current title
4. Clear the text and type a new title: "Updated task title"
5. Press Enter
6. Verify the input reverts to display mode showing "Updated task title"
7. Refresh the page and verify the title persists as "Updated task title"
8. Click the title again to enter edit mode
9. Change the title to "Another update"
10. Click somewhere else on the page (blur the input)
11. Verify the title saves as "Another update" on blur
12. Click the title again to enter edit mode
13. Change the title to "This should not save"
14. Press Escape
15. Verify the title reverts to "Another update" (the Escape key cancels the edit)

**Expected Result:** Clicking an item's title activates inline editing. Pressing Enter saves the new title. Clicking away (blur) also saves the title. Pressing Escape cancels the edit and reverts to the previous title. All saved changes persist after page refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-043: Trash Stuff from List
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item.

**Steps:**
1. Navigate to the Inbox page on a desktop browser
2. Hover over an item in the list
3. Verify a trash icon appears on hover
4. Click the trash icon
5. Verify a confirmation dialog appears (ConfirmDialog) with title "Delete", a message asking "Are you sure?", and "Delete" and "Cancel" buttons
6. Click "Cancel"
7. Verify the dialog closes and the item remains in the list
8. Hover over the same item again and click the trash icon
9. Click "Delete" in the confirmation dialog
10. Verify the item is removed from the inbox list
11. Verify the Inbox sidebar badge decrements by 1
12. Navigate to the Trash page and verify the deleted item appears there
13. Test on a touch device (or emulated touch): verify the trash icon is always visible (not only on hover)

**Expected Result:** On desktop, the trash icon appears on hover. On touch devices, it is always visible. Clicking the trash icon opens a confirmation dialog. Cancelling the dialog preserves the item. Confirming deletion removes the item from the inbox, decrements the sidebar badge, and moves the item to Trash.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-044: Drag to Reorder Inbox
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 3 stuff items with known titles in a known order (e.g., Item A, Item B, Item C from top to bottom).

**Steps:**
1. Navigate to the Inbox page
2. Note the current order of items (e.g., Item A at position 1, Item B at position 2, Item C at position 3)
3. Click and hold on Item C (the last item)
4. Drag it upward to the position above Item A (the first position)
5. Release the drag
6. Verify the new order is: Item C, Item A, Item B
7. Refresh the page
8. Verify the order remains: Item C, Item A, Item B (order persisted to the backend)
9. Drag Item A from the middle to the last position
10. Verify the new order is: Item C, Item B, Item A
11. Refresh and confirm persistence

**Expected Result:** Items in the inbox can be reordered by dragging and dropping. The new order is visually reflected immediately and persists after page refresh, confirming the backend saves the updated positions.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-045: Click to Stuff Detail Page
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item with a known ID.

**Steps:**
1. Navigate to the Inbox page
2. Identify an item in the list
3. Click on the item row area (not on the title text, not on the checkbox, not on any action button)
4. Verify the browser navigates to /stuff/:id where :id is the item's unique identifier
5. Verify the Stuff Detail page loads with the correct item information
6. Use the browser back button to return to the Inbox
7. Verify the Inbox page loads correctly with the item still present

**Expected Result:** Clicking the general row area of an inbox item (excluding the title, checkbox, and action buttons) navigates to the Stuff Detail page at /stuff/:id. The detail page displays the correct item. Browser back navigation returns to the Inbox.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-046: Inbox Pagination / Load More
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains more than 10 stuff items (add items until there are at least 15).

**Steps:**
1. Navigate to the Inbox page
2. Verify only the first batch of items is loaded (e.g., 10 items visible)
3. Scroll to the bottom of the list
4. Verify a "Load more" button is visible (or infinite scroll triggers automatically)
5. Click "Load more" (or scroll to trigger infinite scroll)
6. Verify additional items are loaded and appended to the list
7. Verify previously loaded items are still visible above the newly loaded items
8. Continue loading until all items are displayed
9. Verify "Load more" is no longer visible when all items are loaded
10. Verify the total number of displayed items matches the expected count

**Expected Result:** The inbox initially loads a limited batch of items. A "Load more" button or infinite scroll mechanism allows loading additional items. Items are appended without removing previously loaded ones. When all items are loaded, the load more mechanism is no longer shown.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-047: Inbox Empty State
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains zero stuff items (complete or delete all existing items).

**Steps:**
1. Ensure the inbox is completely empty (no items)
2. Navigate to the Inbox page
3. Verify an empty state illustration or icon is displayed (inbox icon)
4. Verify the text "Your inbox is empty" (or similar) is displayed
5. Verify instructional text is shown explaining what the inbox is for or how to add items
6. Verify no list items, no "Load more" button, and no loading spinner are visible
7. Add a new item via the input field
8. Verify the empty state disappears and the item list appears with the new item

**Expected Result:** When the inbox has no items, an empty state is displayed featuring an inbox icon, a primary message such as "Your inbox is empty", and instructional text. The empty state disappears as soon as an item is added.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-048: Clarify Mode Activation from Inbox Header (Desktop)
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated on a desktop browser. Inbox contains at least 2 stuff items.

**Steps:**
1. Navigate to the Inbox page on desktop
2. Verify a "Clarify" button is visible in the page header area
3. Click the "Clarify" button
4. Verify the inbox list shrinks to approximately 320px width on the left side
5. Verify the ClarifyPanel opens to the right of the list in a side-by-side layout
6. Verify the first item in the inbox list is highlighted (blue highlight) as the current clarify target
7. Verify the ClarifyPanel displays the first step of the clarify workflow for the highlighted item
8. Verify the clarify panel shows the title of the currently selected item as context
9. Click a different item in the shrunk list
10. Verify the blue highlight moves to the clicked item and the ClarifyPanel updates to show that item's clarify workflow

**Expected Result:** Clicking the "Clarify" button in the inbox header activates clarify mode. On desktop, the inbox list compresses to 320px on the left and the ClarifyPanel opens side-by-side on the right. The first item is highlighted in blue as the current target. Clicking a different item switches the clarify target.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-049: Clarify Mode Mobile (Full-Screen Overlay)
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated on a mobile viewport (<=768px). Inbox contains at least 2 stuff items.

**Steps:**
1. Navigate to the Inbox page on a mobile viewport
2. Verify the "Clarify" button is visible in the page header
3. Tap the "Clarify" button
4. Verify the ClarifyPanel opens as a full-screen overlay covering the entire viewport
5. Verify the first inbox item is the target of the clarify workflow (its title shown in the panel)
6. Verify navigation controls are available to go to the next/previous item
7. Verify a close (X) button is available to exit clarify mode
8. Tap the close button
9. Verify the full-screen overlay closes and the inbox list is visible again

**Expected Result:** On mobile viewports, activating clarify mode opens the ClarifyPanel as a full-screen overlay rather than a side-by-side layout. The panel displays the clarify workflow for the current item. The user can navigate between items and close the overlay to return to the inbox list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-050: Clarify Mode Item Interactions (Disabled State)
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated on desktop. Inbox contains at least 3 stuff items. Clarify mode is activated from the inbox header.

**Steps:**
1. Navigate to the Inbox page and activate clarify mode by clicking the "Clarify" button
2. Verify the first item is highlighted in blue
3. Attempt to click on the title of any item to trigger inline editing
4. Verify inline editing does NOT activate (items are disabled in clarify mode)
5. Hover over an item and verify action buttons (trash, etc.) are NOT visible or are disabled
6. Verify the checkbox on each item is disabled or hidden
7. Click on a different item in the list (not the currently highlighted one)
8. Verify the blue highlight moves to the clicked item
9. Verify the ClarifyPanel updates to reflect the newly selected item
10. Verify no other interactions (drag-to-reorder, navigation to detail page) are possible while in clarify mode

**Expected Result:** In clarify mode, all item interactions are disabled except for selecting a different item as the clarify target. Inline editing, action buttons, checkboxes, drag-to-reorder, and navigation to detail pages are all suppressed. Clicking an item only changes the blue highlight and updates the ClarifyPanel target.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-051: Clarify Auto-Start via URL Parameter
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item.

**Steps:**
1. Manually navigate to the URL /inbox?clarify=1 in the browser address bar
2. Verify the Inbox page loads
3. Verify clarify mode is automatically activated without needing to click the "Clarify" button
4. On desktop, verify the side-by-side layout (320px list + ClarifyPanel) is shown
5. On mobile, verify the full-screen ClarifyPanel overlay is shown
6. Verify the first inbox item is the active clarify target
7. Close clarify mode
8. Navigate to /inbox (without the query parameter)
9. Verify clarify mode is NOT automatically activated

**Expected Result:** Navigating to /inbox?clarify=1 automatically activates clarify mode on page load. The appropriate layout (side-by-side on desktop, full-screen on mobile) is used. Without the query parameter, clarify mode does not auto-start.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-052: Clarify Completion (Auto-Exit When List Empty)
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains exactly 2 stuff items. Clarify mode is activated.

**Steps:**
1. Navigate to the Inbox page and activate clarify mode
2. Verify the first item is the active clarify target
3. Complete the clarify workflow for the first item (e.g., choose "Not actionable" then "Trash")
4. Verify the item is removed from the inbox list
5. Verify the ClarifyPanel automatically advances to the second (now only remaining) item
6. Complete the clarify workflow for the second item
7. Verify the item is removed from the inbox list
8. Verify the inbox list is now empty
9. Verify clarify mode automatically exits
10. Verify the inbox empty state is displayed

**Expected Result:** As items are clarified and removed from the inbox, the ClarifyPanel automatically advances to the next item. When the last item is clarified and the inbox becomes empty, clarify mode automatically exits and the inbox empty state is shown.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-053: Input Hidden in Clarify Mode
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item.

**Steps:**
1. Navigate to the Inbox page
2. Verify the "Add" input field is visible at the top or bottom of the inbox list
3. Activate clarify mode by clicking the "Clarify" button
4. Verify the "Add" input field is now hidden
5. Verify there is no way to add new items while in clarify mode
6. Exit clarify mode (close the ClarifyPanel)
7. Verify the "Add" input field reappears

**Expected Result:** The add input field is hidden when clarify mode is active, preventing users from adding new items during the clarification process. The input reappears when clarify mode is exited.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-054: Stuff Detail Page
**Priority:** High | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item with a known title.

**Steps:**
1. Navigate to the Inbox page and click an item to go to the Stuff Detail page (/stuff/:id)
2. Verify the page loads with the item's title displayed prominently
3. Click on the title text
4. Verify it becomes an editable textarea (click-to-edit)
5. Modify the title and click outside (blur) to save
6. Verify the title is updated
7. Verify the following action buttons are present:
   - "Clarify" button styled as primary
   - "Done" button styled as ghost
   - "Move" dropdown button
   - "Trash" button styled as danger
8. Verify a description section is present (may be empty for new stuff items)
9. Verify an attachments section is present
10. Verify a comments section is present
11. Verify metadata information is displayed (created date, last modified, etc.)
12. Click the "Done" button and verify the item is marked as completed
13. Navigate back to Inbox and verify the item is no longer listed

**Expected Result:** The Stuff Detail page displays the item's title as a click-to-edit textarea, action buttons (Clarify as primary, Done as ghost, Move as dropdown, Trash as danger), and sections for description, attachments, comments, and metadata. The title can be edited inline. Action buttons function correctly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-055: Stuff Detail Page Navigation (Position-Based Browsing)
**Priority:** Medium | **Area:** Inbox / Stuff

**Preconditions:** User is authenticated. Inbox contains at least 4 stuff items (e.g., Item 1, Item 2, Item 3, Item 4 in order).

**Steps:**
1. Navigate to the Inbox page and click the first item to open its detail page
2. Verify navigation arrows are displayed: First, Previous, Next, Last
3. Verify "First" and "Previous" are disabled or hidden (already at the first item)
4. Click "Next"
5. Verify the page navigates to the second item's detail view (position-based, not ID-based)
6. Click "Next" again to advance to the third item
7. Click "Previous" to go back to the second item
8. Verify the correct item is displayed
9. Click "Last" to jump to the last item (Item 4)
10. Verify "Next" and "Last" are disabled or hidden (already at the last item)
11. Click "First" to jump back to Item 1
12. Verify the correct item is displayed
13. If the inbox contains mixed item types (stuff and actions in shared lists), verify that navigation automatically routes to the correct detail page type for each item

**Expected Result:** The Stuff Detail page provides First, Previous, Next, and Last navigation arrows for position-based browsing through the inbox. First/Previous are disabled at the beginning of the list, Next/Last at the end. Navigation correctly advances through items in order. In mixed lists, the detail page type auto-routes based on the item type.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 4: Clarify Workflow

---

### TC-056: Clarify Step 1 - Is It Actionable?
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Inbox contains at least 1 stuff item. Clarify mode is not yet active.

**Steps:**
1. Navigate to the Inbox page
2. Activate clarify mode by clicking the "Clarify" button (or navigate to a stuff item's detail and click "Clarify")
3. Verify the ClarifyPanel opens and displays the first step of the workflow
4. Verify the question "Is this actionable?" (or equivalent) is prominently displayed
5. Verify the item's title is shown as context (e.g., "Processing: [item title]")
6. Verify two options are presented: "Yes" and "No"
7. Verify no other workflow steps are visible (step 1 of the multi-step flow)
8. Verify a step counter is displayed (e.g., "1/4" or similar)
9. Verify a progress bar shows the current progress

**Expected Result:** The first step of the clarify workflow displays the question "Is this actionable?" with Yes and No options. The item being processed is identified by its title in the panel. A step counter and progress bar indicate the user is at step 1 of the workflow.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-057: Non-Actionable Path - Reference
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item. Currently at step 1 ("Is this actionable?").

**Steps:**
1. At step 1 of the clarify workflow, click "No" (not actionable)
2. Verify the panel advances to a sub-step presenting options for non-actionable items (e.g., Reference, Someday, Trash)
3. Select "Reference"
4. Verify the stuff item is converted to a text file in the reference system (API call to transform endpoint)
5. Verify a success indicator appears (e.g., green checkmark with "Item processed successfully!")
6. Verify the item is removed from the inbox
7. Navigate to the Reference page
8. Verify the item appears in the Reference section as a reference entry
9. Verify the original title/content is preserved in the reference entry

**Expected Result:** Choosing "No" then "Reference" converts the stuff item into a reference entry. The item is removed from the inbox and appears in the Reference section. The original content is preserved.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-058: Non-Actionable Path - Someday
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item. Currently at step 1 ("Is this actionable?").

**Steps:**
1. At step 1 of the clarify workflow, click "No" (not actionable)
2. Verify the panel advances to present non-actionable options
3. Select "Someday"
4. Verify the stuff item's state changes to SOMEDAY (API call)
5. Verify a success indicator appears
6. Verify the item is removed from the inbox
7. Navigate to the Someday/Maybe page
8. Verify the item appears in the Someday list with its original title
9. Verify the sidebar badge for Someday increments accordingly

**Expected Result:** Choosing "No" then "Someday" changes the stuff item's state to SOMEDAY. The item is removed from the inbox and appears in the Someday/Maybe section. Sidebar badges update accordingly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-059: Non-Actionable Path - Trash
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item. Currently at step 1 ("Is this actionable?").

**Steps:**
1. At step 1 of the clarify workflow, click "No" (not actionable)
2. Verify the panel advances to present non-actionable options
3. Select "Trash"
4. Verify the stuff item is deleted (API call)
5. Verify a success indicator appears
6. Verify the item is removed from the inbox
7. Navigate to the Trash page
8. Verify the deleted item appears in the Trash
9. Verify the Inbox sidebar badge decrements and Trash badge increments

**Expected Result:** Choosing "No" then "Trash" deletes the stuff item from the inbox. The item appears in the Trash section. Sidebar badges update accordingly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-060: Clarify Step 2 - Single or Multiple Steps?
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item. Currently at step 1 ("Is this actionable?").

**Steps:**
1. At step 1 of the clarify workflow, click "Yes" (actionable)
2. Verify the panel advances to step 2
3. Verify the question asks about single step vs. multiple steps (e.g., "Is this a single action or does it require multiple steps?")
4. Verify two options are presented: "Single Action" and "Project" (multiple steps)
5. Verify the step counter updates (e.g., "2/4")
6. Verify the progress bar advances
7. Verify a back button is available to return to step 1
8. Click the back button
9. Verify the panel returns to step 1 ("Is this actionable?") with the previous selection state

**Expected Result:** Choosing "Yes" at step 1 advances to step 2, which asks whether the item requires a single action or multiple steps (project). Two options are presented. The step counter and progress bar update. A back button allows returning to the previous step.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-061: Single Action - Two-Minute Rule
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently at step 2 after choosing "Yes" (actionable).

**Steps:**
1. At step 2, select "Single Action"
2. Verify the panel advances to step 3
3. Verify the question asks about the two-minute rule (e.g., "Can you do this in less than 2 minutes?")
4. Verify two options are presented: "Yes" and "No"
5. Verify the step counter updates (e.g., "3/4")
6. Verify the progress bar advances
7. Verify contextual information about the two-minute rule may be displayed (e.g., "If it takes less than 2 minutes, do it now!")

**Expected Result:** Selecting "Single Action" at step 2 advances to step 3, presenting the two-minute rule question. The user is asked whether the action can be completed in under 2 minutes. Two options (Yes/No) are provided.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-062: Two-Minute Yes - Do It Now
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently at step 3 (two-minute rule question).

**Steps:**
1. At step 3, select "Yes" (can be done in less than 2 minutes)
2. Verify the panel displays a "Do It Now" screen
3. Verify the screen includes encouraging text (e.g., motivational message to complete the task immediately)
4. Verify a "Complete" or "Done" button is prominently displayed
5. Click the "Complete" button
6. Verify the stuff item is marked as completed (API call to /v1/stuff/{id}/complete)
7. Verify a success indicator appears (e.g., green checkmark + "Item processed successfully!")
8. Verify the item is removed from the inbox
9. Navigate to the Completed page and verify the item appears there

**Expected Result:** Choosing "Yes" for the two-minute rule displays a "Do It Now" encouragement screen. Clicking "Complete" marks the stuff as done, removes it from the inbox, and shows a success confirmation. The item appears in the Completed section.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-063: Two-Minute No - Create Action Form
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently at step 3 (two-minute rule question). The stuff item has the title "Research vacation destinations".

**Steps:**
1. At step 3, select "No" (cannot be done in less than 2 minutes)
2. Verify the panel advances to the Create Action form
3. Verify the form displays the following fields:
   - Title: pre-filled with the original stuff item's title ("Research vacation destinations")
   - Description: empty text area
   - Tags: tag input field
4. Verify the Title field is editable (can be changed)
5. Modify the title if desired
6. Add a description
7. Add one or more tags
8. Verify a "Confirm" or "Create Action" button is available

**Expected Result:** Choosing "No" for the two-minute rule displays the Create Action form. The Title field is pre-filled with the stuff item's original title. Description and Tags fields are available. All fields are editable.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-064: Create Action Form - Dates Section
**Priority:** Medium | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently viewing the Create Action form (step after two-minute "No").

**Steps:**
1. On the Create Action form, locate the dates section (may be collapsed/expandable)
2. Expand the dates section if it is collapsed
3. Verify the following date options are present:
   - Deferred: with sub-options "Scheduled for" and "Start after"
   - Due Date: date picker
   - Duration: selection of predefined options
4. Click on the "Scheduled for" date option and verify a date picker appears
5. Select a date and verify it is set
6. Click on the "Start after" date option and verify a date picker appears
7. Select a date for deferred start
8. Click on the Due Date field and verify a date picker appears
9. Select a due date
10. Open the Duration selector and verify the following options are available: 15, 30, 45, 60, 90, 120, 180, 240 minutes
11. Select a duration (e.g., 30 minutes)
12. Verify all selected values are displayed correctly in the form

**Expected Result:** The dates section of the Create Action form includes Deferred (Scheduled for / Start after), Due Date, and Duration fields. Date pickers function correctly. Duration offers predefined options: 15, 30, 45, 60, 90, 120, 180, and 240 minutes. All selections are reflected in the form.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-065: Create Action Confirm
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently on the Create Action form with Title filled.

**Steps:**
1. On the Create Action form, verify the Title field contains the item's title (pre-filled or manually entered)
2. Optionally fill in Description, Tags, and date fields
3. Click the "Confirm" or "Create Action" button
4. Verify an API call is made to /v1/stuff/{id}/transform to transform the stuff item into an action
5. Verify a success indicator appears (e.g., green checkmark + "Item processed successfully!")
6. Verify the item is removed from the inbox
7. Navigate to the Next Actions page
8. Verify the newly created action appears in the list with the correct title
9. If tags or dates were set, verify they are reflected on the action
10. Verify the Inbox sidebar badge decremented and the Next Action badge incremented

**Expected Result:** Clicking Confirm on the Create Action form transforms the stuff item into an action via the API. The item is removed from the inbox and appears in Next Actions with all specified metadata (title, description, tags, dates). Sidebar badges update accordingly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-066: Multiple Steps - Create Project Form
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently at step 2 after choosing "Yes" (actionable). The stuff item has the title "Plan office renovation".

**Steps:**
1. At step 2, select "Project" (multiple steps)
2. Verify the panel advances to the Create Project form
3. Verify the form displays the following fields:
   - Title: pre-filled with the original stuff item's title ("Plan office renovation")
   - Outcome: a required text field (may be marked with asterisk or "required" label)
   - Description: text area
   - Tags: tag input field
4. Verify the Title field is editable
5. Verify the Outcome field is marked as required
6. Attempt to submit the form without filling in the Outcome field
7. Verify a validation error appears indicating Outcome is required
8. Fill in the Outcome field (e.g., "Office is fully renovated and operational")
9. Optionally fill in Description and Tags
10. Verify a "Confirm" or "Create Project" button is available

**Expected Result:** Selecting "Project" at step 2 displays the Create Project form with Title (pre-filled), Outcome (required), Description, and Tags fields. The form cannot be submitted without the Outcome field. Validation prevents submission of incomplete forms.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-067: Create Project Confirm
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active. Currently on the Create Project form with Title and Outcome filled.

**Steps:**
1. On the Create Project form, verify the Title field contains the item's title
2. Verify the Outcome field is filled with a valid outcome description
3. Optionally fill in Description and Tags
4. Click the "Confirm" or "Create Project" button
5. Verify an API call is made to /v1/stuff/{id}/transform to transform the stuff item into a project
6. Verify a success indicator appears (e.g., green checkmark + "Item processed successfully!")
7. Verify the item is removed from the inbox
8. Navigate to the Projects page
9. Verify the newly created project appears in the list with the correct title and outcome
10. If tags were set, verify they are reflected on the project
11. Verify the Inbox sidebar badge decremented and the Projects badge incremented

**Expected Result:** Clicking Confirm on the Create Project form transforms the stuff item into a project via the API. The item is removed from the inbox and appears in the Projects section with the correct title, outcome, and any additional metadata. Sidebar badges update accordingly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-068: Clarify Panel UI Elements
**Priority:** Medium | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item. The ClarifyPanel is visible.

**Steps:**
1. Observe the ClarifyPanel when it first opens at step 1
2. Verify a step counter is displayed (e.g., "1/4" or "Step 1 of 4")
3. Verify a progress bar is displayed showing current progress through the workflow
4. Verify a context label is present showing "Processing: [item title]" (or equivalent)
5. Verify a close button (X) is present in the top-right area of the panel
6. Advance to step 2 by selecting "Yes" (actionable)
7. Verify the step counter updates (e.g., "2/4")
8. Verify the progress bar advances
9. Verify a back button is present to return to the previous step
10. Click the back button and verify the panel returns to step 1
11. Verify the step counter reverts to "1/4" and the progress bar adjusts
12. Click the close button (X)
13. Verify the ClarifyPanel closes and clarify mode exits

**Expected Result:** The ClarifyPanel displays a step counter, progress bar, context label with the item title, back button (from step 2 onward), and close (X) button. The step counter and progress bar update as the user advances through steps. The back button returns to the previous step. The close button exits clarify mode.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-069: Clarify Done State
**Priority:** Medium | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Clarify mode is active on a stuff item.

**Steps:**
1. Complete the clarify workflow for an item (choose any valid path, e.g., Not actionable -> Trash)
2. After the final step is confirmed, observe the ClarifyPanel
3. Verify a green checkmark icon or animation is displayed
4. Verify the text "Item processed successfully!" (or equivalent success message) is shown
5. Verify the panel either auto-advances to the next item after a brief delay or provides a button to continue
6. If there are more items in the inbox, verify the panel transitions to the next item's step 1
7. If there are no more items, verify clarify mode exits (as tested in TC-052)

**Expected Result:** After completing the clarify workflow for an item, the panel briefly displays a success state with a green checkmark and "Item processed successfully!" message. The panel then either auto-advances to the next inbox item or, if the inbox is empty, exits clarify mode.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-070: Clarify Keyboard Shortcuts
**Priority:** Medium | **Area:** Clarify Workflow

**Preconditions:** User is authenticated on desktop. Clarify mode is active on a stuff item. Currently at step 2 or later (so the back button is available). Focus is not in any input field.

**Steps:**
1. Ensure the ClarifyPanel is open and you are at step 2 of the workflow
2. Press the Escape key on the keyboard
3. Verify the ClarifyPanel closes and clarify mode exits
4. Reactivate clarify mode and advance to step 2 again
5. Press the Backspace key (ensure no input field is focused)
6. Verify the panel navigates back to step 1 (equivalent to clicking the back button)
7. Press Backspace again at step 1 (first step)
8. Verify the panel either does nothing (cannot go back further) or closes
9. Navigate to step 3 (single action -> two-minute rule)
10. Click into an input field (e.g., if a text input is focused)
11. Press Backspace while the input is focused
12. Verify Backspace functions as normal text editing (deletes a character) and does NOT navigate back

**Expected Result:** When no input field is focused, Escape closes the ClarifyPanel and exits clarify mode, and Backspace navigates to the previous step. When an input field is focused, Backspace operates normally for text editing and does not trigger navigation. At step 1, Backspace either does nothing or closes the panel.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-071: Clarify from Detail Page
**Priority:** High | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Inbox contains at least 2 stuff items. User is on a Stuff Detail page (/stuff/:id).

**Steps:**
1. Navigate to the Stuff Detail page of an inbox item
2. Click the "Clarify" button (styled as primary)
3. On desktop: verify the ClarifyPanel slides in from the right side as a slide-over panel, approximately 480px wide
4. Verify the panel displays step 1 of the clarify workflow for the current item
5. Complete the clarify workflow (e.g., actionable -> single action -> no -> create action -> confirm)
6. Verify the item is transformed and removed from the inbox
7. Verify the detail page auto-advances to the next stuff item in the inbox (position-based)
8. Verify the ClarifyPanel remains open and begins the workflow for the newly displayed item
9. On mobile: navigate to a stuff detail page and click "Clarify"
10. Verify the ClarifyPanel opens as a full-screen overlay
11. Complete the workflow and verify the same auto-advance behavior

**Expected Result:** Clicking "Clarify" on the Stuff Detail page opens a right slide-over panel (480px on desktop, full-screen on mobile). After clarifying the item, the detail page auto-advances to the next inbox item and the ClarifyPanel remains open, ready for the next item's workflow.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-072: Clarify Panel Modes
**Priority:** Medium | **Area:** Clarify Workflow

**Preconditions:** User is authenticated. Inbox contains at least 2 stuff items. Desktop and mobile viewports available for testing.

**Steps:**
1. **Inline mode (inbox side panel):**
   a. Navigate to the Inbox page on desktop
   b. Click the "Clarify" button in the header
   c. Verify the ClarifyPanel opens inline as a side panel next to the compressed (320px) inbox list
   d. Verify the panel is part of the page layout (not a modal or overlay)
   e. Complete a clarify workflow and verify the inline panel behavior
   f. Close clarify mode and verify the inbox list returns to full width

2. **Modal mode (detail slide-over):**
   a. Navigate to a Stuff Detail page on desktop
   b. Click the "Clarify" button
   c. Verify the ClarifyPanel opens as a slide-over modal from the right (approximately 480px)
   d. Verify the detail page is still partially visible behind the slide-over
   e. Verify the panel can be closed with the X button, returning to the full detail page
   f. Complete a clarify workflow and verify modal behavior

3. **Fullscreen mode (mobile):**
   a. Switch to mobile viewport (<=768px)
   b. Navigate to the Inbox page and activate clarify mode
   c. Verify the ClarifyPanel opens as a full-screen overlay covering the entire viewport
   d. Verify no part of the inbox list is visible behind the panel
   e. Verify close (X) returns to the inbox list
   f. Navigate to a Stuff Detail page on mobile and click "Clarify"
   g. Verify the ClarifyPanel also opens as full-screen on mobile from the detail page

**Expected Result:** The ClarifyPanel supports three display modes: (1) Inline - side panel in the inbox, list compresses to 320px; (2) Modal - right slide-over from the detail page at 480px width; (3) Fullscreen - full viewport overlay on mobile. Each mode is triggered by the appropriate context (inbox desktop, detail desktop, any mobile) and behaves consistently within that mode.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |


## Section 5: Next Actions

---

### TC-073: Add Next Action via Collapsible Form
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and on the Next Actions page (/next)

**Steps:**
1. Observe the page header area for the add action form (collapsed by default)
2. Click the "+" button to expand the collapsible add form
3. Verify the form expands revealing a title input field and an "Add" button
4. Leave the title input empty and verify the "Add" button is disabled
5. Type "Buy groceries for dinner" into the title input
6. Verify the "Add" button becomes enabled
7. Click the "Add" button
8. Verify the new action "Buy groceries for dinner" appears in the next actions list
9. Verify a success toast is shown confirming creation
10. Verify the input field is cleared after successful creation
11. Verify the form remains open for quick successive additions
12. Click the "-" button to collapse the form
13. Verify the form collapses and only the "+" button is visible

**Expected Result:** The collapsible form toggles open/closed with +/- button. New action is created with state NEXT and appears in the list. Input clears after creation. Add button is disabled when title is empty.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-074: Complete Action from Next Actions List
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and at least one action exists in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the title of the first action in the list (e.g., "Buy groceries for dinner")
3. Click the checkbox on the left side of that action item
4. Verify the action is removed from the Next Actions list with an appropriate animation/transition
5. Verify a success toast appears (e.g., "Action completed")
6. Navigate to the Completed page (/completed)
7. Verify the completed action appears in the completed items list
8. Return to the Next Actions page
9. Verify the completed action is no longer present

**Expected Result:** Clicking the checkbox marks the action as completed, removes it from the Next Actions list, shows a success toast, and the action appears on the Completed page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-075: Inline Edit Action Title
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and at least one action exists in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the current title of the first action (e.g., "Buy groceries for dinner")
3. Click on the title text of the action
4. Verify the title transforms into an editable inline text input pre-filled with the current title
5. Clear the text and type "Buy organic groceries"
6. Press Enter
7. Verify the title updates to "Buy organic groceries" and the input reverts to display mode
8. Verify a success toast or silent save occurs (no error shown)
9. Click the title again to enter edit mode
10. Change the text to "Something else"
11. Press Escape
12. Verify the edit is cancelled and the title reverts to "Buy organic groceries"
13. Click the title again to enter edit mode
14. Change the text to "Updated via blur"
15. Click somewhere else on the page (trigger blur)
16. Verify the title saves as "Updated via blur"
17. Reload the page and verify the last saved title persists

**Expected Result:** Clicking the title enables inline editing. Enter and blur save the change. Escape cancels the edit and reverts to the previous title. Changes persist across page reloads.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-076: Trash Action from Next Actions List
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and at least one action exists in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Hover over an action item in the list
3. Verify a trash icon becomes visible in the actions area (right side of the item)
4. Note the title of the action
5. Click the trash icon
6. Verify a confirmation dialog appears with title "Delete", a message asking for confirmation, and "Delete" and "Cancel" buttons
7. Click "Cancel"
8. Verify the dialog closes and the action remains in the list
9. Click the trash icon again
10. Verify the confirmation dialog appears again
11. Click "Delete" (confirm)
12. Verify the action is removed from the Next Actions list
13. Verify a success toast appears confirming deletion
14. Navigate to the Trash page (/trash)
15. Verify the deleted action appears in the trash

**Expected Result:** Trash icon appears on hover. Clicking it shows a confirmation dialog. Cancelling preserves the item. Confirming removes the item from the list, shows a success toast, and moves it to trash.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-077: Drag Reorder Actions in Next Actions List
**Priority:** Medium | **Area:** Next Actions

**Preconditions:** User is logged in and at least three actions exist in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the order of the first three actions (e.g., Action A at position 1, Action B at position 2, Action C at position 3)
3. Click and hold on Action C's drag handle
4. Drag Action C upward to position 1 (above Action A)
5. Release the mouse button
6. Verify the list now shows: Action C, Action A, Action B
7. Reload the page
8. Verify the new order persists: Action C, Action A, Action B
9. Drag Action A to position 3 (below Action B)
10. Verify the list now shows: Action C, Action B, Action A
11. Navigate away from the page and return
12. Verify the order is still: Action C, Action B, Action A

**Expected Result:** Dragging an action to a new position reorders the list visually and persists the new order to the backend. The order survives page reloads and navigation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-078: Click to Navigate to Action Detail
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and at least one action exists in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the title and ID of the first action in the list
3. Click on the action item (not on the checkbox, trash icon, or title edit area — click the navigable area of the item)
4. Verify the browser navigates to /action/:id where :id matches the action's ID
5. Verify the action detail page loads displaying the correct action information
6. Click the browser back button
7. Verify the user returns to the Next Actions page with the list intact

**Expected Result:** Clicking an action item navigates to /action/:id showing the full action detail page. Back navigation returns to the Next Actions list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-079: Next Actions Pagination (Load More)
**Priority:** Medium | **Area:** Next Actions

**Preconditions:** User is logged in and more than 10 actions exist in the Next Actions list (create enough actions to exceed one page)

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Verify that the initial load shows the first batch of actions (up to 10 items)
3. Scroll to the bottom of the list
4. Verify a "Load more" button or infinite scroll trigger is present
5. Note the number of currently displayed actions
6. Click the "Load more" button (or scroll to trigger infinite scroll)
7. Verify additional actions are appended to the list below the existing ones
8. Verify the total number of displayed actions has increased
9. If more actions remain, repeat clicking "Load more"
10. Verify all actions eventually load
11. Verify no duplicate actions appear in the list

**Expected Result:** When more than one page of actions exists, a "Load more" mechanism is available. Clicking it loads additional actions appended to the list without duplicates. All actions can eventually be loaded.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-080: Tag Filtering on Next Actions
**Priority:** Medium | **Area:** Next Actions

**Preconditions:** User is logged in and multiple actions exist with various tags assigned (e.g., some tagged "home", some tagged "work", some tagged "errands")

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Verify all actions are displayed (no filter active)
3. Locate and click the tag filter icon in the page header
4. Verify a tag filter panel or dropdown opens showing available tags
5. Select the tag "home"
6. Verify the list filters to show only actions tagged "home"
7. Verify a filter chip appears showing "home" with an X (remove) button
8. Select an additional tag "work"
9. Verify the list now shows actions tagged "home" OR "work"
10. Verify two filter chips are displayed: "home" and "work"
11. Click the X on the "home" chip
12. Verify the "home" chip is removed and the list shows only "work" actions
13. Verify a "Clear all" button is visible
14. Click "Clear all"
15. Verify all filter chips are removed and the full unfiltered list is displayed

**Expected Result:** Tag filter icon opens a filter panel. Selecting tags filters the list to matching actions. Filter chips display active filters with X buttons to remove individually. "Clear all" removes all filters and restores the full list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-081: Empty State Without Filter on Next Actions
**Priority:** Medium | **Area:** Next Actions

**Preconditions:** User is logged in and has no actions in the Next Actions list (all actions are completed, trashed, or moved elsewhere)

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Verify the page loads successfully with no action items displayed
3. Verify an empty state message is shown with text "No next actions" (or similar)
4. Verify instructional/helper text is displayed below the main message explaining what next actions are or how to create them
5. Verify the add action form (+) button is still accessible and functional
6. Verify no "Load more" button is shown
7. Verify no tag filter chips are displayed

**Expected Result:** When no next actions exist and no filter is active, the page shows a "No next actions" message with instructional text guiding the user. The add form remains accessible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-082: Empty State With Active Tag Filter on Next Actions
**Priority:** Medium | **Area:** Next Actions

**Preconditions:** User is logged in, some actions exist in Next Actions but none are tagged with the tag "urgent"

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Verify actions are displayed in the list
3. Click the tag filter icon
4. Select a tag that no actions are tagged with (e.g., "urgent")
5. Verify the list becomes empty (no matching actions)
6. Verify the empty state message indicates no actions match the filter, such as "No actions for this context" followed by the tag name "urgent"
7. Verify the filter chip for "urgent" is still displayed with an X button
8. Verify the "Clear all" button is available
9. Click "Clear all" or remove the filter chip
10. Verify the list returns to showing all actions

**Expected Result:** When a tag filter is active but no actions match, a context-specific empty state message is shown (e.g., "No actions for this context" with the tag name). The filter can be cleared to restore the full list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-083: Action Detail Page Full Content
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and at least one action exists with the following attributes set: title, description, tags, deferred date, due date, association with a project, at least one attachment, and at least one comment

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Click on the action item to navigate to /action/:id
3. Verify the action detail page loads
4. Verify the action title is displayed prominently and is editable (click-to-edit)
5. Verify the description section is displayed with the current description text, editable on click
6. Verify the tags section shows the assigned tags as chips
7. Verify the deferred date (defer_until) is displayed in the dates section
8. Verify the due date (due_date) is displayed in the dates section
9. Verify a project link is shown indicating which project this action belongs to
10. Click the project link and verify it navigates to the project detail page
11. Navigate back to the action detail page
12. Verify the attachments section displays the uploaded attachment(s)
13. Verify the comments section displays the existing comment(s) with author and timestamp
14. Verify metadata is displayed (e.g., creation date, last modified date)
15. Verify navigation arrows (First/Previous/Next/Last) are present for position-based navigation

**Expected Result:** The action detail page displays all fields: title, description, tags, deferred date, due date, project link (navigable), attachments, comments, and metadata. All editable fields support click-to-edit.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-084: Action Detail Move Dropdown
**Priority:** High | **Area:** Next Actions

**Preconditions:** User is logged in and viewing an action detail page (/action/:id) for an action currently in the Next Actions list

**Steps:**
1. Navigate to the action detail page for a Next Actions item
2. Locate the Move dropdown/button
3. Click the Move dropdown to open it
4. Verify the dropdown displays valid destination options: Today, Calendar, Waiting For, Someday
5. Verify the current location (Next) is NOT shown as a destination option
6. Select "Today" from the dropdown
7. Verify the action is moved to the Today list
8. Verify the page updates to reflect the new state or navigates appropriately
9. Navigate to the Today page (/today) and verify the action appears there
10. Navigate back to the action detail and open the Move dropdown again
11. Verify "Today" is no longer a destination (since the action is now in Today) and "Next" is now available
12. Select "Calendar" from the dropdown
13. Verify a schedule dialog appears allowing the user to pick a date and optionally a time
14. Select a date and confirm
15. Verify the action is moved to the Calendar with the selected date
16. Navigate back to the action detail and move it again
17. Select "Waiting For" from the dropdown
18. Verify a waiting dialog appears allowing the user to specify who the action is waiting for
19. Fill in the waiting-for information and confirm
20. Verify the action is moved to Waiting For
21. Navigate back to the action detail and move it to "Someday"
22. Verify the action is moved to Someday without additional dialogs
23. Navigate to the Someday page and verify the action appears there

**Expected Result:** The Move dropdown shows all valid destinations except the current one. Moving to Today and Someday happens directly. Moving to Calendar triggers a schedule dialog for date selection. Moving to Waiting For triggers a dialog for specifying the waiting-for contact. The action appears in the correct destination after each move.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 6: Today

---

### TC-085: Add Today Action
**Priority:** High | **Area:** Today

**Preconditions:** User is logged in and on the Today page (/today)

**Steps:**
1. Navigate to the Today page (/today)
2. Click the "+" button to expand the collapsible add form
3. Verify the form expands with a title input and "Add" button
4. Leave the title input empty and verify the "Add" button is disabled
5. Type "Review morning emails" into the title input
6. Verify the "Add" button becomes enabled
7. Click the "Add" button
8. Verify the new action "Review morning emails" appears in the Today list
9. Verify a success toast is shown confirming creation
10. Verify the input field is cleared after successful creation
11. Verify the action was created with state TODAY (navigate to action detail and confirm)

**Expected Result:** Adding an action from the Today page creates it with state TODAY. The action appears in the Today list immediately with a success toast. The input clears for the next entry.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-086: Today Page Operations (Complete, Inline Edit, Trash, Drag Reorder, Tag Filter)
**Priority:** High | **Area:** Today

**Preconditions:** User is logged in, at least three actions exist on the Today page with various tags assigned

**Steps:**
1. Navigate to the Today page (/today)
2. **Complete:** Click the checkbox on the first action. Verify it is removed from the list and a success toast appears. Check the Completed page to confirm.
3. **Inline Edit:** Click the title of the second action. Verify it becomes editable. Change the text and press Enter. Verify the new title is saved. Click the title again, change text, press Escape. Verify the edit is cancelled. Click the title, change text, click elsewhere (blur). Verify the change is saved.
4. **Trash:** Hover over an action and click the trash icon. Verify a confirmation dialog appears. Click "Delete". Verify the action is removed and a success toast appears. Check the Trash page to confirm.
5. **Drag Reorder:** Note the order of remaining actions. Drag an action to a different position. Verify the new order is reflected. Reload the page and verify the order persists.
6. **Tag Filter:** Click the tag filter icon. Select a tag. Verify only matching actions are shown. Verify filter chips appear. Click X on a chip to remove it. Click "Clear all" to restore the full list.

**Expected Result:** All standard list operations (complete, inline edit, trash, drag reorder, tag filter) work identically on the Today page as they do on the Next Actions page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-087: Today Page Empty State
**Priority:** Medium | **Area:** Today

**Preconditions:** User is logged in and has no actions on the Today page

**Steps:**
1. Navigate to the Today page (/today)
2. Verify the page loads successfully with no action items displayed
3. Verify an empty state message is shown with text "No actions for today" (or similar)
4. Verify instructional text is displayed: "Move actions here to focus on what matters most today." (or similar guidance)
5. Verify the add action form (+) button is still accessible
6. Verify no "Load more" button is shown

**Expected Result:** When no today actions exist, the page shows "No actions for today" with instructional text about moving actions to focus on what matters. The add form remains accessible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-088: Today Items in Engage Dashboard
**Priority:** Medium | **Area:** Today

**Preconditions:** User is logged in and has at least 6 actions on the Today page

**Steps:**
1. Navigate to the Today page (/today) and confirm at least 6 actions are listed
2. Note the titles and order of the first 5 actions
3. Navigate to the Engage dashboard (/engage)
4. Locate the "Today" section on the engage page
5. Verify the Today section displays up to 5 today items
6. Verify the items shown match the first 5 from the Today page in the correct order
7. Verify there is a link or button to navigate to the full Today page (e.g., "View all" or section header is clickable)
8. Click the link to the full Today page
9. Verify navigation to /today with all items visible

**Expected Result:** The Engage dashboard shows a Today section with up to 5 today items matching the Today page. A link to the full Today page is available.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-089: Move Action to Today from Next Actions
**Priority:** High | **Area:** Today

**Preconditions:** User is logged in, at least one action exists in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the title of an action (e.g., "Prepare meeting notes")
3. Click the action to navigate to its detail page (/action/:id)
4. Click the Move dropdown
5. Verify "Today" is listed as a destination
6. Select "Today"
7. Verify the action's state changes to TODAY
8. Verify a success toast or visual confirmation is shown
9. Navigate to the Today page (/today)
10. Verify the action "Prepare meeting notes" now appears in the Today list
11. Navigate to the Next Actions page (/next)
12. Verify the action "Prepare meeting notes" is no longer in the Next Actions list

**Expected Result:** Moving an action from Next to Today removes it from the Next list and adds it to the Today list. The action detail reflects the new state.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-090: Today Page URL Direct Navigation
**Priority:** Low | **Area:** Today

**Preconditions:** User is logged in

**Steps:**
1. Open a new browser tab
2. Type the URL directly: [app-base-url]/today
3. Press Enter
4. Verify the Today page loads correctly
5. Verify the page header shows "Today" (or equivalent)
6. Verify the correct layout (DashboardLayout) is rendered with sidebar navigation
7. Verify the Today entry in the sidebar is highlighted/active
8. If actions exist, verify they are displayed correctly
9. If no actions exist, verify the empty state is shown

**Expected Result:** Navigating directly to /today loads the correct Today page within the dashboard layout, with the sidebar showing Today as the active section.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 7: Calendar

---

### TC-091: Calendar Default View is Month
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in, localStorage has no saved calendar view preference (clear localStorage or use incognito)

**Steps:**
1. Clear any localStorage entry for calendar view preference
2. Navigate to the Calendar page (/calendar)
3. Verify the calendar loads and the Month view is displayed by default
4. Verify the month name and year are shown in the header (e.g., "February 2026")
5. Verify the calendar grid shows a standard month layout with day cells
6. Verify the view mode toggle in the header has "Month" as the active/selected option
7. Verify week day headers are displayed (Mon, Tue, Wed, etc.)

**Expected Result:** When no view preference is saved, the Calendar page defaults to Month view showing the current month with a proper grid layout and day headers.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-092: Calendar View Mode Persistence
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and on the Calendar page

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Verify the current view mode (default: Month)
3. Switch to Week view by clicking the "Week" toggle button
4. Verify the Week view is now displayed
5. Navigate away from the Calendar page (e.g., go to /next)
6. Navigate back to the Calendar page (/calendar)
7. Verify the Calendar loads in Week view (the previously selected mode)
8. Switch to Day view
9. Close the browser tab and reopen the app
10. Navigate to the Calendar page
11. Verify the Calendar loads in Day view
12. Inspect localStorage to confirm the view preference is stored

**Expected Result:** The selected calendar view mode is saved to localStorage and restored when returning to the Calendar page, even after closing and reopening the browser.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-093: Calendar Day View Layout
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in, calendar business hours are configured (e.g., 9 AM to 5 PM)

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Switch to Day view by clicking the "Day" toggle button
3. Verify the Day view displays a 24-hour time grid with hourly slots
4. Verify the time labels are shown along the left side (00:00 through 23:00 or 12 AM through 11 PM depending on format setting)
5. Verify business hours (e.g., 9 AM to 5 PM) are visually highlighted or distinguished from non-business hours (different background color or shading)
6. Verify an all-day section is displayed above the time grid for all-day events/actions
7. Verify the current time is indicated with a horizontal line or marker (if viewing today)
8. Verify the date header shows the current day (e.g., "Thursday, February 27, 2026")
9. Scroll through the time grid to verify all 24 hours are accessible

**Expected Result:** Day view shows a full 24-hour time grid with hourly slots, business hours highlighted, an all-day section above the grid, and a current-time indicator for today's date.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-094: Calendar Day View - Scheduled Actions Rendered as Time Blocks
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in, at least one action exists with a specific date and time (e.g., today at 10:00 AM with 1-hour duration) and one all-day action

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Switch to Day view and navigate to the date with the scheduled action
3. Verify the timed action (e.g., 10:00 AM) is rendered as a block/card in the time grid
4. Verify the block is positioned vertically at the correct start time (10:00 AM row)
5. Verify the block's height corresponds to the action's duration (e.g., 1 hour takes one hour-slot height)
6. Verify the action title is visible within the block
7. Verify the all-day action is displayed in the all-day section above the time grid, not in the hourly slots
8. If multiple timed actions overlap, verify they are displayed side by side or with appropriate visual stacking

**Expected Result:** Timed actions appear as correctly positioned and sized blocks in the day view time grid. All-day actions appear in the all-day section. Overlapping actions are handled visually.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-095: Calendar Day View - Click Empty Time Slot to Quick-Add
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and viewing the Day view of the Calendar

**Steps:**
1. Navigate to the Calendar page (/calendar) and switch to Day view
2. Identify an empty time slot (e.g., 2:00 PM with no action scheduled)
3. Click on the empty 2:00 PM time slot
4. Verify a quick-add form or popover opens
5. Verify the form pre-fills the time as 2:00 PM (matching the clicked slot)
6. Verify the date is pre-filled with the currently viewed day
7. Type a title for the new action (e.g., "Team standup")
8. Confirm/submit the form
9. Verify the new action appears as a time block at the 2:00 PM position
10. Verify the action is saved (reload the page and confirm it persists)

**Expected Result:** Clicking an empty time slot in Day view opens a quick-add form pre-populated with the corresponding time and date. Submitting creates an action positioned at that time slot.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-096: Calendar Day View - Click Action to Navigate to Detail
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in and at least one action is scheduled on the day being viewed

**Steps:**
1. Navigate to the Calendar page (/calendar) and switch to Day view
2. Navigate to a date that has a scheduled action
3. Identify the action block in the time grid
4. Click on the action block
5. Verify the browser navigates to /action/:id for the clicked action
6. Verify the action detail page loads with the correct action information
7. Verify the scheduled date and time match what was shown in the calendar
8. Click the browser back button
9. Verify the user returns to the Calendar Day view at the same date

**Expected Result:** Clicking an action in the Day view navigates to the action detail page (/action/:id). Back navigation returns to the same calendar view and date.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-097: Calendar Week View Layout
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Switch to Week view by clicking the "Week" toggle button
3. Verify the Week view displays a 7-column grid, one column per day of the week
4. Verify each column has a day header showing the day name and date (e.g., "Mon 23", "Tue 24")
5. Verify each column contains a time grid with hourly slots (similar to Day view)
6. Verify an all-day section is displayed at the top spanning all 7 columns
7. Verify business hours are highlighted in each column
8. Verify the current day column is visually distinguished (e.g., highlighted header)
9. Verify the current time indicator is shown in today's column
10. Scroll horizontally if needed to verify all 7 days are visible or scrollable

**Expected Result:** Week view shows 7 day columns with time grids, an all-day section at the top, business hours highlighted, and the current day/time visually marked.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-098: Calendar Week View - Week Start Configuration
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and has access to calendar settings

**Steps:**
1. Navigate to Settings and locate the calendar configuration section
2. Set the week start to "Monday"
3. Save the settings
4. Navigate to the Calendar page (/calendar) and switch to Week view
5. Verify the first column (leftmost) is Monday and the last column is Sunday
6. Verify the day headers read: Mon, Tue, Wed, Thu, Fri, Sat, Sun (left to right)
7. Return to Settings
8. Change the week start to "Sunday"
9. Save the settings
10. Navigate to the Calendar Week view
11. Verify the first column is now Sunday and the last column is Saturday
12. Verify the day headers read: Sun, Mon, Tue, Wed, Thu, Fri, Sat (left to right)

**Expected Result:** The Week view respects the configured week start day. Changing between Monday and Sunday start reorders the columns accordingly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-099: Calendar Month View Layout
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in and some actions are scheduled on various dates in the current month

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Verify the Month view is displayed (default or switch to it)
3. Verify the calendar shows a grid of day cells for the entire month
4. Verify day numbers are shown in each cell
5. Verify cells for days outside the current month are visually dimmed or distinguished
6. Verify actions scheduled on specific dates show their titles within the corresponding day cells
7. Verify action titles are truncated if they are too long for the cell width
8. Verify days with multiple actions show multiple entries (possibly with a "+N more" indicator if overflow)
9. Verify weekday headers are shown at the top of the grid
10. Verify the current day is visually highlighted

**Expected Result:** Month view displays a calendar grid with day cells containing truncated action titles. Days outside the month are dimmed. The current day is highlighted. Overflow items may show a "+N more" indicator.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-100: Calendar Month View - Click Day Cell
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and viewing Month view with actions scheduled on at least one day

**Steps:**
1. Navigate to the Calendar page (/calendar) in Month view
2. Identify a day cell that has one or more scheduled actions
3. Click on the day cell (not on a specific action title)
4. Verify the view navigates to or displays that day's actions in detail (e.g., switches to Day view for that date, or opens a day popover)
5. Verify all actions for that day are visible
6. Click on a day cell with no actions
7. Verify the same navigation occurs showing an empty day view

**Expected Result:** Clicking a day cell in Month view shows the detailed view of that day's scheduled actions, either by switching to Day view or showing a day detail popover.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-101: Calendar Month View - Click Action Item
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in and viewing Month view with at least one action visible in a day cell

**Steps:**
1. Navigate to the Calendar page (/calendar) in Month view
2. Identify a day cell containing an action title
3. Click directly on the action title within the day cell
4. Verify the browser navigates to /action/:id for the clicked action
5. Verify the action detail page loads with the correct information
6. Click the browser back button
7. Verify the user returns to the Calendar Month view at the same month

**Expected Result:** Clicking an action title in a Month view day cell navigates to the action detail page. Back navigation returns to the Month view.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-102: Calendar Year View with Density Heat Map
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and has actions scheduled across multiple days throughout the year with varying density (some days have many actions, some have few, some have none)

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Switch to Year view by clicking the "Year" toggle button
3. Verify a 12-month grid is displayed showing all months of the current year
4. Verify each month shows a mini-calendar with day cells
5. Verify a density heat map is applied to day cells: days with more items have higher color intensity
6. Verify days with no actions have the lightest/no color
7. Verify days with few actions have a light color
8. Verify days with many actions have a darker/more intense color
9. Verify a legend or visual cue explains the color intensity scale (if present)
10. Verify the current day is identifiable in the year view

**Expected Result:** Year view shows a 12-month grid with density heat-map coloring on day cells. Color intensity increases with the number of scheduled items per day.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-103: Calendar Year View - Click Day to Navigate to Day View
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and viewing the Year view

**Steps:**
1. Navigate to the Calendar page (/calendar) and switch to Year view
2. Identify a specific day cell in any month (e.g., March 15)
3. Click on that day cell
4. Verify the calendar switches to Day view for the clicked date (March 15)
5. Verify the Day view header shows "March 15, 2026" (or appropriate format)
6. Verify any actions scheduled on that day are displayed
7. Click the browser back button or navigate back
8. Verify the user returns to the Year view

**Expected Result:** Clicking a day in Year view navigates to the Day view for that specific date, showing all scheduled actions for that day.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-104: Calendar Year View - Click Month to Navigate to Month View
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and viewing the Year view

**Steps:**
1. Navigate to the Calendar page (/calendar) and switch to Year view
2. Identify a month label/header (e.g., "April")
3. Click on the month label/header
4. Verify the calendar switches to Month view for the clicked month (April 2026)
5. Verify the Month view header shows "April 2026"
6. Verify the month grid displays the correct calendar for April 2026
7. Navigate back to Year view
8. Click a different month (e.g., "October")
9. Verify the Month view now shows October 2026

**Expected Result:** Clicking a month label/header in Year view navigates to the Month view for that specific month.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-105: Calendar Navigation Buttons (Previous/Next)
**Priority:** High | **Area:** Calendar

**Preconditions:** User is logged in and on the Calendar page

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. **Day view:** Switch to Day view. Note the current date. Click "Next". Verify the view advances by one day. Click "Previous". Verify it goes back one day to the original date. Click "Previous" again and verify it shows the day before the original.
3. **Week view:** Switch to Week view. Note the current week range. Click "Next". Verify the view advances by one week. Click "Previous" twice. Verify it goes back to the week before the original.
4. **Month view:** Switch to Month view. Note the current month (e.g., February 2026). Click "Next". Verify the view shows March 2026. Click "Previous" twice. Verify it shows January 2026.
5. **Year view:** Switch to Year view. Note the current year (2026). Click "Next". Verify the view shows 2027. Click "Previous" twice. Verify it shows 2025.
6. Verify the header updates correctly after each navigation to show the appropriate date/range

**Expected Result:** Previous/Next buttons advance the calendar by the appropriate unit for each view mode: 1 day (Day), 1 week (Week), 1 month (Month), 1 year (Year). The header reflects the current date/range.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-106: Calendar Today Button
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and on the Calendar page, currently navigated away from today's date

**Steps:**
1. Navigate to the Calendar page (/calendar) in Month view
2. Click "Next" several times to navigate to a future month (e.g., June 2026)
3. Verify the header shows the future month
4. Click the "Today" button
5. Verify the calendar immediately jumps back to the current month (February 2026)
6. Verify the current day is highlighted
7. Switch to Week view and navigate several weeks forward
8. Click "Today"
9. Verify the calendar returns to the current week containing today
10. Switch to Day view and navigate several days forward
11. Click "Today"
12. Verify the calendar returns to today's date
13. Switch to Year view and navigate to a different year
14. Click "Today"
15. Verify the calendar returns to the current year

**Expected Result:** The "Today" button always returns the calendar to the current date regardless of how far the user has navigated and regardless of the current view mode.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-107: Calendar View Mode Toggle Buttons
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and on the Calendar page

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Verify the header contains view mode toggle buttons: Day, Week, Month, Year, and Recurring
3. Verify exactly one button appears active/selected at a time (initially Month if no preference saved)
4. Click "Day" — verify the Day view renders and the Day button becomes active
5. Click "Week" — verify the Week view renders and the Week button becomes active
6. Click "Month" — verify the Month view renders and the Month button becomes active
7. Click "Year" — verify the Year view renders and the Year button becomes active
8. Click "Recurring" — verify the Recurring view renders and the Recurring button becomes active
9. Rapidly toggle between views and verify each transition is smooth without errors
10. Verify the date context is maintained when switching views (e.g., if viewing March in Month view, switching to Week shows a week in March)

**Expected Result:** Five toggle buttons are displayed in the calendar header. Each switches to the corresponding view with the active button visually indicated. Date context is preserved across view switches.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-108: Calendar Drag Reschedule
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in, at least one action is scheduled on the calendar, using Day or Week view

**Steps:**
1. Navigate to the Calendar page (/calendar) and switch to Day view
2. Identify a scheduled action block (e.g., at 10:00 AM)
3. Click and hold the action block
4. Drag it to a different time slot (e.g., 3:00 PM)
5. Release the mouse button
6. Verify the action block moves to the 3:00 PM position
7. Verify the action's scheduled time has been updated (navigate to action detail to confirm)
8. Switch to Week view
9. Identify a scheduled action on one day (e.g., Monday)
10. Drag the action to a different day (e.g., Wednesday at the same time)
11. Verify the action moves to the new day column
12. Reload the page and verify the new schedule persists
13. Navigate to the action detail page and verify the updated date and time

**Expected Result:** Dragging an action in Day view changes its time. Dragging in Week view can change both the day and time. Changes are saved to the backend and persist across page reloads.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-109: Calendar Recurring View
**Priority:** Medium | **Area:** Calendar

**Preconditions:** User is logged in and at least two recurring action templates have been created

**Steps:**
1. Navigate to the Calendar page (/calendar)
2. Click the "Recurring" toggle button in the view mode header
3. Verify the view switches to a list-style display of all recurring action templates
4. Verify each recurring template shows its title and recurrence pattern (e.g., "Daily", "Weekly on Monday", "Monthly on the 1st")
5. Verify the list includes all created recurring templates
6. Verify each template entry is clickable or has actions available (edit, delete)
7. Click on a recurring template to view or edit its details
8. Verify the recurrence details are displayed correctly

**Expected Result:** The Recurring view lists all recurring action templates with their titles and recurrence patterns. Templates are viewable and editable.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-110: Calendar Settings - Time Format (12h / 24h)
**Priority:** Low | **Area:** Calendar

**Preconditions:** User is logged in and has actions scheduled at various times

**Steps:**
1. Navigate to Settings and locate the calendar/time configuration
2. Set the time format to "24-hour"
3. Save the settings
4. Navigate to the Calendar page (/calendar) and switch to Day view
5. Verify time labels along the left side show 24-hour format (e.g., 00:00, 01:00, ..., 13:00, ..., 23:00)
6. Verify action blocks display times in 24-hour format (e.g., "14:00" instead of "2:00 PM")
7. Return to Settings
8. Change the time format to "12-hour"
9. Save the settings
10. Return to the Calendar Day view
11. Verify time labels show 12-hour format with AM/PM (e.g., 12:00 AM, 1:00 AM, ..., 1:00 PM, ..., 11:00 PM)
12. Verify action blocks display times in 12-hour format (e.g., "2:00 PM")
13. Switch to Week view and verify the time format is also applied there

**Expected Result:** The calendar respects the 12h/24h time format setting. Changing the setting updates time labels and action time displays in Day and Week views.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-111: Calendar Settings - Business Hours
**Priority:** Low | **Area:** Calendar

**Preconditions:** User is logged in

**Steps:**
1. Navigate to Settings and locate the calendar configuration section
2. Set business hours start to 8:00 AM and end to 6:00 PM
3. Save the settings
4. Navigate to the Calendar Day view
5. Verify the time slots from 8:00 AM to 6:00 PM are visually highlighted (e.g., different background color) compared to non-business hours
6. Verify time slots before 8:00 AM and after 6:00 PM are not highlighted
7. Switch to Week view
8. Verify business hours (8:00 AM to 6:00 PM) are highlighted in all 7 day columns
9. Return to Settings and change business hours to 9:00 AM to 5:00 PM
10. Return to the Calendar Day view
11. Verify the highlighted range has updated to 9:00 AM to 5:00 PM
12. Verify 8:00 AM is no longer highlighted and 5:00 PM - 6:00 PM is no longer highlighted

**Expected Result:** Business hours settings control which time slots are visually highlighted in Day and Week views. Changes to business hours immediately reflect in the calendar display.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-112: Calendar Settings - Business Days
**Priority:** Low | **Area:** Calendar

**Preconditions:** User is logged in

**Steps:**
1. Navigate to Settings and locate the calendar configuration section
2. Verify the default business days are Monday through Friday (selected/checked)
3. Verify Saturday and Sunday are not selected as business days
4. Save the settings (if not already default)
5. Navigate to the Calendar Week view
6. Verify Monday through Friday columns have business-hour highlighting
7. Verify Saturday and Sunday columns do NOT have business-hour highlighting (or are visually distinguished as non-business days)
8. Return to Settings
9. Deselect Friday and select Saturday (business days: Mon-Thu, Sat)
10. Save the settings
11. Return to the Calendar Week view
12. Verify Monday through Thursday and Saturday columns have business-hour highlighting
13. Verify Friday and Sunday columns do NOT have business-hour highlighting
14. Switch to Month view and verify non-business days have a visual distinction (e.g., dimmed columns or different cell styling)

**Expected Result:** Business days settings control which day columns receive business-hour highlighting in Week view and visual distinction in Month view. Changing business days updates the display immediately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 8: Projects

---

### TC-113: Add Project via Collapsible Form
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and on the Projects page (/projects)

**Steps:**
1. Navigate to the Projects page (/projects)
2. Click the "+" button to expand the collapsible add project form
3. Verify the form expands revealing two input fields: Title and Outcome, and an "Add" button
4. Verify the "Add" button is disabled when both fields are empty
5. Type "Launch new website" in the Title field only
6. Verify the "Add" button is still disabled (Outcome is required)
7. Clear the Title and type "Have a professional online presence" in the Outcome field only
8. Verify the "Add" button is still disabled (Title is required)
9. Type "Launch new website" in the Title field (both fields now filled)
10. Verify the "Add" button becomes enabled
11. Click the "Add" button
12. Verify the new project "Launch new website" appears in the projects list
13. Verify a success toast is shown confirming creation
14. Verify both input fields are cleared after successful creation
15. Click the "-" button to collapse the form
16. Verify the form collapses

**Expected Result:** The project add form requires both Title and Outcome before enabling the Add button. The project is created and appears in the list. Both fields clear after creation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-114: Project List Has No Checkbox
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and at least one project exists in the Projects list

**Steps:**
1. Navigate to the Projects page (/projects)
2. Observe the project items in the list
3. Verify that no checkbox is displayed next to any project item
4. Compare with the Next Actions page (/next) where items DO have checkboxes
5. Verify that the only way to complete a project is from the project detail page (not the list view)

**Expected Result:** Projects in the list view do not have checkboxes. Projects cannot be completed directly from the list view, unlike actions which have checkboxes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-115: Project List Operations (Tag Filter, Drag Reorder, Inline Title Edit, Trash)
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in, at least three projects exist with various tags assigned

**Steps:**
1. Navigate to the Projects page (/projects)
2. **Tag Filter:** Click the tag filter icon. Select a tag. Verify only projects with that tag are shown. Verify filter chips appear with X buttons. Click "Clear all" to restore the full list.
3. **Drag Reorder:** Note the order of projects. Drag a project to a different position. Verify the new order is reflected. Reload the page and verify the order persists.
4. **Inline Title Edit:** Click on a project's title. Verify it becomes editable. Change the text and press Enter. Verify the new title is saved. Click the title again, change it, press Escape. Verify the edit is cancelled. Click the title, change it, click elsewhere (blur). Verify the change is saved.
5. **Trash:** Hover over a project and click the trash icon. Verify a confirmation dialog appears. Click "Cancel" and verify the project remains. Click trash again and confirm deletion. Verify the project is removed and a success toast appears. Navigate to the Trash page to confirm.

**Expected Result:** Tag filtering, drag reorder, inline title editing (Enter saves, Escape cancels, blur saves), and trash with confirmation all work correctly on the Projects list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-116: Click to Navigate to Project Detail
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and at least one project exists in the Projects list

**Steps:**
1. Navigate to the Projects page (/projects)
2. Note the title of a project in the list
3. Click on the project item (not the title edit area or trash icon)
4. Verify the browser navigates to /project/:id
5. Verify the project detail page loads displaying the correct project information (title, outcome, actions, etc.)
6. Click the browser back button
7. Verify the user returns to the Projects list with all projects intact

**Expected Result:** Clicking a project in the list navigates to /project/:id showing the full project detail page. Back navigation returns to the Projects list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-117: Project Detail - Title and Outcome Editing
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and a project exists with title "Launch new website" and outcome "Have a professional online presence"

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Verify the project title "Launch new website" is displayed prominently
3. Click on the title text
4. Verify it becomes an editable auto-resize textarea
5. Clear the text and type "Redesign company website"
6. Click outside the textarea (blur) or press Enter/Tab
7. Verify the title saves as "Redesign company website"
8. Verify the textarea auto-resizes to fit the content (expands for longer text, shrinks for shorter)
9. Locate the outcome section
10. Verify the outcome text "Have a professional online presence" is displayed
11. Click on the outcome text
12. Verify it becomes an editable field
13. Clear it and verify a placeholder appears: "What does done look like?" (or similar)
14. Type "Modern, responsive website live with all content migrated"
15. Click outside to save
16. Verify the outcome updates
17. Reload the page and verify both the updated title and outcome persist

**Expected Result:** Title and outcome are both click-to-edit fields. The title uses an auto-resize textarea. The outcome field shows a placeholder "What does done look like?" when empty. Changes persist across reloads.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-118: Project Detail - Next Action Section
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and has two projects: one with a next action assigned, and one with no actions at all

**Steps:**
1. Navigate to the project detail page for the project WITH a next action
2. Locate the next action section
3. Verify the current next action is displayed as a card with a checkbox and an editable title
4. Verify a link or indicator showing "Next" (e.g., an arrow or label) is present on the next action card
5. Click the next action title to verify it is editable (inline edit)
6. Change the title and press Enter to save
7. Verify the title updates
8. Navigate to the project detail page for the project WITH NO actions
9. Locate the next action section
10. Verify a warning icon is displayed (e.g., an exclamation/alert icon)
11. Verify the text "What's the next physical step?" (or similar prompt) is shown
12. Verify this serves as a visual reminder that every project needs a next action

**Expected Result:** When a project has a next action, it is displayed as a card with checkbox, editable title, and "Next" indicator. When no next action exists, a warning icon and "What's the next physical step?" prompt is shown.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-119: Project Detail - Backlog Expand/Collapse
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and a project exists with one next action and at least 3 backlog actions

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Verify the next action is displayed at the top of the actions section
3. Locate the backlog expand toggle
4. Verify the toggle shows a count indicator (e.g., "+3" indicating 3 backlog items)
5. Click the expand toggle
6. Verify the backlog section expands to reveal all backlog actions
7. Verify each backlog action shows its title and a trash icon
8. Verify all backlog items are displayed in their priority order
9. Verify the backlog items are visually distinct from the next action (e.g., no checkbox, different styling)
10. Click the expand toggle again
11. Verify the backlog section collapses, hiding the backlog items
12. Verify the count indicator is still visible showing the number of backlog items

**Expected Result:** The backlog section is collapsible with an expand toggle showing the item count. When expanded, all backlog items are visible with titles and trash icons. Items are draggable (tested separately in TC-122).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-120: Project Detail - Add Action to Project
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and a project exists (with or without existing actions)

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Locate the quick-add input at the bottom of the action list section
3. Verify the input has a placeholder (e.g., "Add an action..." or similar)
4. Click the input and type "Draft wireframes for homepage"
5. Press Enter or click the add button
6. Verify the new action "Draft wireframes for homepage" appears in the project's action list
7. If the project had no actions before, verify this new action becomes the next action (with checkbox)
8. If the project already had a next action, verify the new action appears in the backlog
9. Add another action: "Set up hosting environment"
10. Verify it appears in the backlog (since a next action already exists)
11. Verify the input clears after each successful addition
12. Navigate to the Next Actions page (/next) and verify the next action for this project appears there (if it should based on the action's state)

**Expected Result:** The quick-add input creates new actions within the project. The first action added to a project without actions becomes the next action. Subsequent actions go to the backlog. Input clears after creation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-121: Project Detail - Complete Next Action Triggers Auto-Promotion
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and a project exists with one next action ("Draft wireframes") and at least two backlog actions ("Set up hosting" at position 1, "Write content" at position 2)

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Verify the current next action is "Draft wireframes"
3. Expand the backlog and verify the order: "Set up hosting" (first/top), "Write content" (second)
4. Click the checkbox on the next action "Draft wireframes"
5. Verify "Draft wireframes" is removed from the next action position
6. Verify a success toast appears (e.g., "Action completed")
7. Verify "Set up hosting" (the first backlog item, FIFO) is automatically promoted to the next action position
8. Verify "Set up hosting" now has a checkbox and is displayed as the current next action
9. Verify the backlog now shows only "Write content"
10. Verify the backlog count indicator updates (e.g., from "+2" to "+1")
11. Complete "Set up hosting" by clicking its checkbox
12. Verify "Write content" auto-promotes to next action
13. Verify the backlog is now empty
14. Complete "Write content"
15. Verify the project now shows the "What's the next physical step?" warning (no actions remaining)

**Expected Result:** Completing the next action automatically promotes the first backlog item (FIFO order) to become the new next action. The backlog count updates accordingly. When all actions are completed, the project shows the empty next-action warning.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-122: Project Detail - Reorder Backlog via Drag
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and a project exists with a next action and at least 3 backlog items (e.g., "Item A", "Item B", "Item C" in that order)

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Expand the backlog section
3. Note the order: Item A (position 1), Item B (position 2), Item C (position 3)
4. Click and hold Item C's drag handle
5. Drag Item C above Item A (to position 1)
6. Release the mouse button
7. Verify the backlog now shows: Item C, Item A, Item B
8. This means Item C will be the next to auto-promote when the current next action is completed
9. Reload the page and expand the backlog
10. Verify the reordered backlog persists: Item C, Item A, Item B
11. Complete the current next action
12. Verify Item C (now first in backlog) is promoted to next action
13. Verify the backlog shows: Item A, Item B

**Expected Result:** Backlog items can be reordered via drag and drop. The new order persists and determines the FIFO promotion sequence when the next action is completed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-123: Complete Project from Project Detail
**Priority:** High | **Area:** Projects

**Preconditions:** User is logged in and a project exists with a title and outcome

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Locate the "Complete" button or action (e.g., in the header or actions area)
3. Click "Complete"
4. Verify a confirmation may be shown (if applicable) and confirm
5. Verify a success toast appears (e.g., "Project completed")
6. Verify the user is redirected to the Projects list or the project is marked as completed
7. Navigate to the Projects page (/projects)
8. Verify the completed project is no longer in the active projects list
9. Navigate to the Completed page (/completed)
10. Verify the completed project appears in the completed items list

**Expected Result:** Completing a project from its detail page moves it from the active projects list to the completed items. A success toast confirms the action.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-124: Project Cannot Be Completed from List View
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and at least one project exists in the Projects list

**Steps:**
1. Navigate to the Projects page (/projects)
2. Inspect each project item in the list
3. Verify there is no checkbox on any project item (already verified in TC-114)
4. Verify there is no "Complete" button, icon, or menu option visible on hover or via right-click
5. Verify the only available actions on hover are inline title edit, trash icon, and drag handle
6. Verify there is no context menu or swipe action that allows completion
7. Navigate to the project detail page for any project
8. Verify the "Complete" option IS available on the detail page

**Expected Result:** Projects cannot be completed from the list view. The complete action is only available on the project detail page. The list view only supports inline editing, trash, and drag reorder.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-125: Move Project to Someday
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and a project exists in the active Projects list

**Steps:**
1. Navigate to the Projects page (/projects) and note the project title (e.g., "Launch new website")
2. Click on the project to navigate to its detail page (/project/:id)
3. Locate the Move dropdown/button
4. Click the Move dropdown to open it
5. Verify "Someday" is listed as a valid destination
6. Select "Someday"
7. Verify a success toast or visual confirmation is shown
8. Verify the user is redirected or the page updates to reflect the move
9. Navigate to the Projects page (/projects)
10. Verify "Launch new website" is no longer in the active projects list
11. Navigate to the Someday page (/someday)
12. Verify "Launch new website" appears in the Someday list

**Expected Result:** Moving a project to Someday from its detail page removes it from the active Projects list and places it in the Someday list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-126: Project Detail - Tags Editing
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and a project exists, some tag presets exist in the system

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. Locate the tags section
3. If no tags are assigned, verify a placeholder or "Add tags" prompt is shown
4. Click the tags section to enter edit mode
5. Verify a tag input field appears with autocomplete functionality
6. Start typing a tag name (e.g., "wor")
7. Verify autocomplete suggestions appear (e.g., "work")
8. Select "work" from the autocomplete
9. Verify "work" appears as a chip/tag on the project
10. Type another tag "personal" and press Enter to add it
11. Verify both "work" and "personal" are displayed as chips
12. Verify preset tags are available for quick selection (if tag presets feature is implemented)
13. Click the X on the "personal" chip
14. Verify "personal" is removed and only "work" remains
15. Click outside the tag editor to close it
16. Reload the page and verify "work" tag persists

**Expected Result:** Tags can be added via autocomplete or manual entry. Tags display as chips with X buttons for removal. Preset tags are available for quick selection. Changes persist across reloads.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-127: Project Detail - Description, Attachments, and Comments
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and a project exists

**Steps:**
1. Navigate to the project detail page (/project/:id)
2. **Description:**
   a. Locate the description section
   b. If empty, verify a placeholder or "Add description" prompt is shown
   c. Click the description area to enter edit mode
   d. Type "This project covers the full redesign of the company website including UX research, design, and development."
   e. Click outside to save
   f. Verify the description is displayed
   g. Click the description again, modify it, and save
   h. Verify the modification persists
3. **Attachments:**
   a. Locate the attachments section
   b. Upload a file (e.g., a PDF or image)
   c. Verify the attachment appears in the attachments list with its filename
   d. Upload additional files up to 10 total
   e. Verify all 10 attachments are displayed
   f. Attempt to upload an 11th file
   g. Verify the upload is rejected or a message indicates the maximum (10) has been reached
   h. Delete one attachment and verify it is removed
4. **Comments:**
   a. Locate the comments section
   b. Type a comment: "Initial project setup completed"
   c. Submit the comment
   d. Verify the comment appears with the user's name and a timestamp
   e. Add another comment: "Wireframes are in progress"
   f. Verify both comments are displayed in chronological order

**Expected Result:** Description supports click-to-edit with persistence. Attachments allow up to 10 files with upload, display, and delete. Comments support adding with author and timestamp display.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-128: Project Detail - Navigation Arrows (Position-Based)
**Priority:** Medium | **Area:** Projects

**Preconditions:** User is logged in and at least 4 projects exist in the Projects list (Project A at position 1, Project B at position 2, Project C at position 3, Project D at position 4)

**Steps:**
1. Navigate to the Projects page (/projects) and note the order of projects
2. Click on the first project (Project A) to open its detail page
3. Verify navigation arrows are displayed: First, Previous, Next, Last
4. Verify the "First" and "Previous" arrows are disabled or hidden (since this is the first project)
5. Verify the "Next" and "Last" arrows are enabled
6. Click "Next"
7. Verify the detail page now shows Project B
8. Verify the URL updates to /project/:projectB_id
9. Click "Next" again
10. Verify the detail page shows Project C
11. Click "Last"
12. Verify the detail page shows Project D (the last project)
13. Verify "Next" and "Last" arrows are now disabled or hidden
14. Click "Previous"
15. Verify the detail page shows Project C
16. Click "First"
17. Verify the detail page shows Project A
18. Verify the "First" and "Previous" arrows are disabled again

**Expected Result:** Position-based navigation arrows (First/Previous/Next/Last) allow sequential navigation through projects. Arrows at boundaries (first/last) are disabled. The URL updates to reflect the current project.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |


## Section 9: Waiting For

---

### TC-129: Add Waiting For Item
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and on the Waiting For page (/waiting)

**Steps:**
1. Locate the collapsible "Add" form at the top of the Waiting For page
2. Open the form by clicking/tapping the toggle
3. Observe the form fields: Title and "Waiting for..." are both visible and required
4. Leave both fields empty and attempt to click "Add"
5. Verify validation prevents submission
6. Enter a title such as "Report from John"
7. Leave "Waiting for..." empty and attempt to click "Add"
8. Verify validation still prevents submission
9. Enter "John" in the "Waiting for..." field
10. Click the "Add" button
11. Observe the newly created item appears in the Waiting For list

**Expected Result:** The item is created with state WAITING and the waiting_for field set to "John". The item appears in the Waiting For list immediately. Both title and waiting_for fields are required; the form cannot be submitted without both.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-130: Waiting For List - Checkbox Completion
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and on the Waiting For page with at least one waiting item visible

**Steps:**
1. Observe the Waiting For list contains at least one item
2. Verify each item has a visible checkbox to the left of the title
3. Click the checkbox on an item
4. Observe the system response

**Expected Result:** The item is marked as completed. A success toast appears confirming completion. The item disappears from the Waiting For list and now appears on the Completed page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-131: Waiting For List Operations - Tag Filter, Inline Edit, Trash, Drag Reorder
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and on the Waiting For page with at least three waiting items, some having tags assigned

**Steps:**
1. **Tag Filter:** Locate the tag filter control on the page. Select a specific tag. Verify only items with that tag are shown. Clear the filter and verify all items return.
2. **Inline Title Edit:** Click directly on the title text of a waiting item. Verify the title becomes an editable input field. Change the text to "Updated waiting title". Press Enter. Verify the title saves and displays the updated text. Click another item's title, change text, then press Escape. Verify the edit is cancelled and original title is restored.
3. **Trash with Confirmation:** Hover over an item to reveal the action buttons (on touch devices, actions should always be visible). Click the trash/delete button on an item. Verify a confirmation dialog appears asking to confirm deletion. Click "Cancel" and verify the item remains. Click trash again, confirm the deletion. Verify the item is removed from the list and a toast confirms the action.
4. **Drag Reorder:** Click and hold on an item's drag handle. Drag it above or below another item. Release. Verify the new order is reflected in the list. Refresh the page and verify the new order persists.

**Expected Result:** Tag filtering correctly narrows the list. Inline title editing saves on Enter and cancels on Escape. Trash shows a confirmation dialog before removing. Drag reorder changes item position and persists across page reloads.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-132: Click to Action Detail from Waiting For
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and on the Waiting For page with at least one waiting item

**Steps:**
1. Note the title and ID of a waiting item in the list
2. Click on the item (not the checkbox, not the title for inline edit -- click the navigable area)
3. Observe the browser URL changes
4. Verify the detail page loads

**Expected Result:** The browser navigates to /action/:id where :id corresponds to the clicked item. The action detail page loads showing the item's full details with WAITING state context, including the "Waiting for" information.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-133: Action Detail - Got It Button
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and viewing the detail page of an action with WAITING state (navigated from the Waiting For list)

**Steps:**
1. Verify the action detail page shows the item with WAITING state
2. Locate the "Got it" button on the detail page
3. Click "Got it"
4. Observe the system response
5. Navigate to the Next Actions page (/next)
6. Search for the item that was previously waiting

**Expected Result:** Clicking "Got it" removes the waiting_for status from the action. The action's state changes to NEXT. A success toast appears. The action now appears in the Next Actions list instead of the Waiting For list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-134: Action Detail - Waiting For Display
**Priority:** Medium | **Area:** Waiting For

**Preconditions:** User is logged in and has created multiple waiting items at different times: one created today, one created 3 days ago, one created approximately 2 weeks ago, one created approximately 1 month ago

**Steps:**
1. Navigate to the Waiting For page
2. Click on the item created today to open its detail
3. Verify the "Waiting for" section is visible on the detail page
4. Verify it shows the person/thing name that was entered in the waiting_for field
5. Verify the duration display shows "today" or equivalent for a same-day item
6. Go back and open the item created 3 days ago
7. Verify the duration shows approximately "3d"
8. Go back and open the item created ~2 weeks ago
9. Verify the duration shows approximately "2w"
10. Go back and open the item created ~1 month ago
11. Verify the duration shows approximately "1mo"

**Expected Result:** The "Waiting for" section on the action detail page displays the person or thing the user is waiting on, along with a human-readable relative duration since the waiting began (e.g., "today", "3d", "2w", "1mo"). The duration updates as time passes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-135: Waiting For - Done Button
**Priority:** High | **Area:** Waiting For

**Preconditions:** User is logged in and viewing the detail page of an action with WAITING state

**Steps:**
1. Verify the action detail page shows the item in WAITING state
2. Locate the "Done" button on the detail page
3. Click "Done"
4. Observe the system response
5. Navigate to the Completed page (/completed)
6. Search for the item

**Expected Result:** Clicking "Done" marks the action as completed. A success toast confirms the completion. The action disappears from the Waiting For list and appears on the Completed page with a pre-checked checkbox and the correct action type icon.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-136: Waiting For - Move Dropdown
**Priority:** Medium | **Area:** Waiting For

**Preconditions:** User is logged in and viewing the detail page of an action with WAITING state

**Steps:**
1. Verify the action detail page shows the item in WAITING state
2. Locate the "Move" dropdown control on the detail page
3. Click to open the Move dropdown
4. Observe the available destination options
5. Verify valid destinations are listed (e.g., Next Actions, Someday/Maybe, Trash)
6. Select a destination such as "Someday/Maybe"
7. Observe the system response
8. Navigate to the Someday/Maybe page and verify the item appears there
9. Repeat the test: create another waiting item, open its detail, use Move to send it to another valid destination

**Expected Result:** The Move dropdown displays valid destinations for a waiting item. Selecting a destination moves the item to that bucket. A success toast confirms the move and shows the destination. The item disappears from the Waiting For list and appears in the chosen destination.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-137: Waiting For Empty State
**Priority:** Low | **Area:** Waiting For

**Preconditions:** User is logged in and has no items in the Waiting For state (complete, trash, or move all waiting items first)

**Steps:**
1. Navigate to the Waiting For page (/waiting)
2. Verify no items are displayed in the list area
3. Observe the empty state UI

**Expected Result:** An appropriate empty state message is displayed, informing the user that there are no waiting items. The message should provide guidance or context about what the Waiting For bucket is for (e.g., items delegated to others or things the user is waiting on).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-138: Waiting For Pagination
**Priority:** Medium | **Area:** Waiting For

**Preconditions:** User is logged in and on the Waiting For page

**Steps:**
1. Create more than 10 waiting items by using the collapsible add form repeatedly (e.g., create 12-15 items with distinct titles like "Waiting item 1", "Waiting item 2", etc.)
2. Refresh the Waiting For page
3. Verify the initial load shows the first page of items (up to the page size limit)
4. Scroll to the bottom of the list
5. Locate and click the "Load more" button
6. Verify additional items load below the existing ones
7. Continue loading until all items are visible
8. Verify the total count of visible items matches the number created

**Expected Result:** The Waiting For list paginates correctly. The initial load shows the first batch of items. Clicking "Load more" fetches and appends additional items. All created items are eventually visible after loading all pages.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 10: Someday / Maybe

---

### TC-139: Add Someday Item
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and on the Someday/Maybe page (/someday)

**Steps:**
1. Locate the quick-add input at the top of the Someday/Maybe page (inline on desktop, floating button on mobile)
2. Enter a title such as "Learn Japanese"
3. Submit by pressing Enter or clicking the add button
4. Observe the list updates

**Expected Result:** A new Stuff item is created with state SOMEDAY. It appears in the Someday/Maybe list immediately with the inbox/stuff type icon prefix, indicating it is a Stuff item (not an action or project).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-140: Someday Mixed Types - Type Icon Prefix
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least one Stuff item (added directly), one Action (moved from Next via Move dropdown or clarified as someday), and one Project (moved to Someday)

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Observe the list of items
3. Identify the Stuff item and verify it displays an inbox/stuff icon prefix
4. Identify the Action item and verify it displays an arrow/action icon prefix
5. Identify the Project item and verify it displays a projects icon prefix
6. Verify each icon is visually distinct and clearly identifies the item type

**Expected Result:** The Someday/Maybe list correctly shows mixed item types. Each item has a type-specific icon prefix: Stuff items show the inbox icon, Actions show the arrow icon, and Projects show the projects icon. Users can easily distinguish between item types at a glance.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-141: Someday - No Checkbox
**Priority:** Medium | **Area:** Someday / Maybe

**Preconditions:** User is logged in and on the Someday/Maybe page with at least one item visible

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Observe the items in the list
3. Verify that no checkbox element is present on any list item
4. Attempt to find any way to complete an item directly from the list

**Expected Result:** Items in the Someday/Maybe list do not have checkboxes. There is no mechanism to complete items directly from this list view. Items must first be activated (moved to an active bucket) before they can be completed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-142: Someday - Activate Stuff Item
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least one Stuff item

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Identify a Stuff item (has inbox icon prefix)
3. Hover over the item to reveal action buttons (on touch devices, actions are always visible)
4. Locate and click the "Activate" button
5. Observe the system response
6. Verify the item disappears from the Someday/Maybe list
7. Navigate to the Inbox page (/inbox)
8. Verify the activated item now appears in the Inbox

**Expected Result:** Clicking "Activate" on a Stuff item moves it from Someday/Maybe to the Inbox. A success toast appears indicating the destination (e.g., "Moved to Inbox"). The item disappears from the Someday list and appears in the Inbox as a regular stuff item ready for clarification.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-143: Someday - Activate Action
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least one Action item

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Identify an Action item (has arrow icon prefix)
3. Hover over the item to reveal action buttons
4. Locate and click the "Activate" button
5. Observe the system response
6. Verify the item disappears from the Someday/Maybe list
7. Navigate to the Next Actions page (/next)
8. Verify the activated item now appears in the Next Actions list

**Expected Result:** Clicking "Activate" on an Action item moves it from Someday/Maybe to Next Actions. A success toast appears indicating the destination (e.g., "Moved to Next Actions"). The item appears in the Next Actions list as an actionable item.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-144: Someday - Activate Project
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least one Project item

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Identify a Project item (has projects icon prefix)
3. Hover over the item to reveal action buttons
4. Locate and click the "Activate" button
5. Observe the system response
6. Verify the item disappears from the Someday/Maybe list
7. Navigate to the Projects page (/projects)
8. Verify the activated project now appears in the Projects list

**Expected Result:** Clicking "Activate" on a Project item moves it from Someday/Maybe to Projects. A success toast appears indicating the destination (e.g., "Moved to Projects"). The project appears in the Projects list as an active project.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-145: Someday - Trash with Confirmation
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and on the Someday/Maybe page with at least one item visible

**Steps:**
1. Identify an item in the Someday/Maybe list
2. Note the item's title
3. Hover over the item to reveal action buttons
4. Click the trash/delete button
5. Verify a confirmation dialog appears (ConfirmDialog component)
6. Verify the dialog message asks for confirmation to delete the item
7. Click "Cancel" in the confirmation dialog
8. Verify the item remains in the list
9. Click the trash button again on the same item
10. Click "Confirm" (or equivalent confirm button text) in the confirmation dialog
11. Verify the item is removed from the Someday/Maybe list
12. Navigate to the Trash page (/trash) and verify the item appears there

**Expected Result:** Clicking trash triggers a confirmation dialog. Cancelling preserves the item. Confirming removes the item from the Someday/Maybe list and moves it to Trash. A success toast confirms the action.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-146: Someday - Correct Detail Navigation by Type
**Priority:** High | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least one Stuff item, one Action item, and one Project item

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Click on the Stuff item (navigable area, not the title for inline edit)
3. Verify the browser URL changes to /stuff/:id where :id is the stuff item's ID
4. Verify the Stuff detail page loads with the correct item data
5. Navigate back to the Someday/Maybe page
6. Click on the Action item
7. Verify the browser URL changes to /action/:id where :id is the action item's ID
8. Verify the Action detail page loads with the correct item data
9. Navigate back to the Someday/Maybe page
10. Click on the Project item
11. Verify the browser URL changes to /project/:id where :id is the project item's ID
12. Verify the Project detail page loads with the correct item data

**Expected Result:** Each item type navigates to its correct detail route: Stuff items go to /stuff/:id, Action items go to /action/:id, and Project items go to /project/:id. Each detail page loads the correct item data in the SOMEDAY state context.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-147: Someday - Tag Filtering
**Priority:** Medium | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains: at least one Stuff item (no tags possible), at least one Action with a tag (e.g., "@work"), at least one Action with a different tag (e.g., "@personal"), and at least one Project with a tag

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Locate the tag filter control
3. Verify all items are visible with no filter applied
4. Select the "@work" tag from the filter
5. Verify only Actions and Projects tagged with "@work" are shown
6. Verify Stuff items are hidden (since stuff cannot have tags)
7. Clear the tag filter
8. Verify all items reappear
9. Select the "@personal" tag
10. Verify the correct filtered subset is shown

**Expected Result:** The tag filter correctly filters the Someday/Maybe list. Only Actions and Projects with the selected tag are shown. Stuff items are excluded from tag filtering since Stuff has no metadata. Clearing the filter restores all items.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-148: Someday - Drag Reorder
**Priority:** Medium | **Area:** Someday / Maybe

**Preconditions:** User is logged in and the Someday/Maybe list contains at least three items

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Note the current order of items (e.g., Item A, Item B, Item C from top to bottom)
3. Click and hold the drag handle on Item C
4. Drag Item C above Item A
5. Release the drag
6. Verify the new order is Item C, Item A, Item B
7. Refresh the page (F5 or browser refresh)
8. Verify the order persists as Item C, Item A, Item B

**Expected Result:** Items can be reordered by dragging via their drag handle. The new order is reflected immediately in the UI. The reordered positions are persisted to the backend and survive a page refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-149: Someday - Inline Title Edit
**Priority:** Medium | **Area:** Someday / Maybe

**Preconditions:** User is logged in and on the Someday/Maybe page with at least one item

**Steps:**
1. Identify an item with a known title (e.g., "Original Title")
2. Click directly on the title text of the item
3. Verify the title becomes an editable input field with the current title as its value
4. Change the text to "Updated Someday Title"
5. Press Enter
6. Verify the title updates to "Updated Someday Title" and the input field reverts to display text
7. Click on the title again to enter edit mode
8. Change the text to "This should not save"
9. Press Escape
10. Verify the title reverts to "Updated Someday Title" (the previously saved value)
11. Verify the input field reverts to display text

**Expected Result:** Clicking the title enters inline edit mode. Pressing Enter saves the new title to the backend and updates the display. Pressing Escape cancels the edit and restores the previous title without making any API call.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-150: Someday Empty State
**Priority:** Low | **Area:** Someday / Maybe

**Preconditions:** User is logged in and has no items in the Someday/Maybe state (activate, trash, or move all someday items first)

**Steps:**
1. Navigate to the Someday/Maybe page (/someday)
2. Verify no items are displayed in the list area
3. Observe the empty state UI

**Expected Result:** An appropriate empty state message is displayed, informing the user there are no someday/maybe items. The message should provide context about what the Someday/Maybe bucket is for (e.g., items you might want to do in the future but are not committing to now).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 11: Reference (File Manager)

---

### TC-151: Reference Page Loads
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in

**Steps:**
1. Navigate to the Reference page (/reference)
2. Verify the page loads without errors
3. Verify the "Files" tab is active by default
4. Verify the toolbar is visible and contains:
   - Breadcrumb navigation (showing "Files" or root)
   - Search input field
   - "New Folder" button
   - "Upload" button
   - View toggle (List / Grid)
   - Storage quota display (used / total)
5. Verify the content area shows the root-level files and folders (or empty state if none exist)

**Expected Result:** The Reference page loads successfully with the Files tab active. The toolbar displays all expected controls: breadcrumb, search, New Folder button, Upload button, view mode toggle, and storage quota. The file listing area shows root-level content or an appropriate empty state.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-152: Create Folder
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page (/reference) at the root level

**Steps:**
1. Click the "New Folder" button in the toolbar
2. Verify a rename/creation modal dialog appears
3. Verify the name field is empty (no default name pre-filled)
4. Enter a folder name such as "Project Documents"
5. Click "Confirm" or press Enter to submit
6. Verify the modal closes
7. Verify the new folder "Project Documents" appears in the file listing with a folder icon
8. Try creating another folder with the same name to check for duplicate handling

**Expected Result:** Clicking "New Folder" opens a modal with an empty name field. Entering a name and confirming creates the folder, which immediately appears in the listing. The modal closes after successful creation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-153: Navigate Into Folder
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one folder created (e.g., "Project Documents")

**Steps:**
1. Verify the current view shows root-level content
2. Verify the URL is /reference (no folder query parameter)
3. Click on the "Project Documents" folder
4. Verify the view transitions to show the contents of that folder (or empty state if folder is empty)
5. Verify the browser URL updates to include a folder parameter (e.g., /reference?folder=<folder-id>)
6. Verify the breadcrumb updates to show "Files > Project Documents"
7. Verify the toolbar controls remain functional within the subfolder

**Expected Result:** Clicking a folder navigates into it, updating the view to show the folder's contents. The URL updates with the folder ID as a query parameter. The breadcrumb reflects the current folder hierarchy.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-154: Breadcrumb Navigation
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and has a nested folder structure: Root > "Project Documents" > "Q1 Reports"

**Steps:**
1. Navigate to the Reference page (/reference)
2. Click into "Project Documents" folder
3. Click into "Q1 Reports" subfolder
4. Verify the breadcrumb shows "Files > Project Documents > Q1 Reports"
5. Click "Project Documents" in the breadcrumb
6. Verify the view navigates back to the "Project Documents" folder level
7. Verify the breadcrumb now shows "Files > Project Documents"
8. Verify the URL updates accordingly
9. Click "Files" in the breadcrumb
10. Verify the view navigates back to the root level
11. Verify the breadcrumb shows only "Files"
12. Verify the URL is /reference (no folder parameter)

**Expected Result:** Each breadcrumb segment is clickable and navigates to that folder level. The view, URL, and breadcrumb all update consistently when a breadcrumb segment is clicked.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-155: Rename Folder
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one folder (e.g., "Project Documents")

**Steps:**
1. Locate the folder "Project Documents" in the file listing
2. Access the context menu for the folder (right-click or use the three-dot/kebab menu)
3. Select the "Rename" option
4. Verify a rename modal dialog appears with the current name "Project Documents" pre-filled
5. Clear the field and enter "Client Documents"
6. Click "Confirm" or press Enter
7. Verify the modal closes
8. Verify the folder name updates to "Client Documents" in the listing
9. Navigate into the renamed folder and verify breadcrumb shows the new name

**Expected Result:** The rename option is accessible via context menu. The rename modal pre-fills the current name. Confirming the rename updates the folder name in the listing and in breadcrumb navigation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-156: Delete Folder
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with a folder that contains at least one file or subfolder

**Steps:**
1. Locate the folder to delete (one that has contents inside)
2. Access the context menu for the folder
3. Select the "Delete" option
4. Verify a confirmation dialog appears
5. Verify the dialog includes a warning about the folder's contents being affected (e.g., "This folder and all its contents will be permanently deleted")
6. Click "Cancel" and verify the folder remains
7. Access the delete option again and click "Confirm"
8. Verify the folder disappears from the file listing
9. Verify the folder and its contents are permanently deleted (not in trash, or moved to reference trash depending on implementation)

**Expected Result:** Deleting a folder shows a confirmation dialog that warns about the folder's contents. Cancelling preserves the folder. Confirming permanently removes the folder and all of its nested contents.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-157: Upload File via Button
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with a small test file ready (e.g., a 1 MB image)

**Steps:**
1. Click the "Upload" button in the toolbar
2. Verify the OS file picker dialog opens
3. Select a test file (e.g., "test-image.png") and confirm
4. Observe the upload process:
   - Verify a 3px progress bar is visible during the upload
   - Verify a progress panel appears in the bottom-right corner showing upload status
5. Wait for the upload to complete
6. Verify the uploaded file appears in the file listing
7. Verify the progress panel auto-clears approximately 3 seconds after completion
8. Verify the storage quota updates to reflect the newly uploaded file

**Expected Result:** Clicking Upload opens the file picker. After selecting a file, upload begins with a visible 3px progress bar and a bottom-right progress panel. The file appears in the listing upon completion. The progress panel auto-dismisses after about 3 seconds. The storage quota refreshes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-158: Upload File via Drag and Drop
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page (desktop browser) with a file ready to drag from the OS file manager

**Steps:**
1. Open the OS file manager alongside the browser
2. Drag a test file from the OS file manager toward the Reference page area in the browser
3. Observe if a visual drop zone indicator appears when the file is hovering over the drop area
4. Drop the file onto the Reference page area
5. Verify the upload begins immediately
6. Verify a 3px progress bar appears
7. Verify the progress panel appears in the bottom-right corner
8. Wait for the upload to complete
9. Verify the file appears in the file listing
10. Verify the storage quota updates

**Expected Result:** Dragging a file onto the Reference area triggers an upload. A visual drop zone or highlight appears during the drag-over. The upload proceeds with progress indication (progress bar and bottom-right panel). The file appears in the listing after completion.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-159: Upload File Greater Than 50MB - Client-Side Rejection
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with a test file larger than 50 MB available

**Steps:**
1. Click the "Upload" button in the toolbar
2. Select the file that is larger than 50 MB
3. Observe the system response immediately after file selection
4. Verify no upload request is sent to the server (check network tab in browser DevTools)
5. Alternatively, try drag-and-dropping the >50 MB file onto the Reference page

**Expected Result:** The application rejects the file on the client side before any upload begins. An error message or toast is displayed informing the user that the file exceeds the maximum allowed size of 50 MB. No network request is made to the upload endpoint.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-160: File Preview - Image
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded image file (PNG, JPG, GIF, etc.)

**Steps:**
1. Locate an image file in the file listing
2. Click on the image file
3. Verify a preview modal opens
4. Verify the image renders correctly within the modal (not just a download link)
5. Verify the modal provides a way to close it (close button, click outside, or Escape key)
6. Close the modal and verify it dismisses properly

**Expected Result:** Clicking an image file opens a preview modal that renders the image in the browser. The image is displayed at an appropriate size within the modal. The modal can be closed via close button, clicking outside, or pressing Escape.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-161: File Preview - PDF
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded PDF file

**Steps:**
1. Locate a PDF file in the file listing
2. Click on the PDF file
3. Verify a preview modal opens
4. Verify the PDF renders within the browser (embedded viewer or iframe)
5. Verify pages are navigable if the PDF has multiple pages
6. Close the modal

**Expected Result:** Clicking a PDF file opens a preview modal that renders the PDF content in the browser. The user can view the PDF without downloading it. Multi-page PDFs allow page navigation. The modal can be closed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-162: File Preview - Text and JSON
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded text file (.txt) and one JSON file (.json)

**Steps:**
1. Locate a .txt file in the file listing
2. Click on the .txt file
3. Verify a preview modal opens showing the file contents as plain text
4. Verify the text is readable and properly formatted (preserves line breaks, whitespace)
5. Close the modal
6. Locate a .json file in the file listing
7. Click on the .json file
8. Verify a preview modal opens showing the JSON contents as plain text
9. Verify the JSON structure is readable
10. Close the modal

**Expected Result:** Clicking text or JSON files opens a preview modal that displays the file contents as plain text. The content preserves formatting, line breaks, and whitespace. Both file types are rendered in the browser without requiring a download.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-163: Download File
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded file

**Steps:**
1. Locate a file in the file listing
2. Find the download button/icon on the file item (may be in the context menu or visible as an action button)
3. Click the download button
4. Verify the browser initiates a file download
5. Verify the downloaded file matches the original file (correct name, correct content, correct size)

**Expected Result:** Clicking the download button triggers a browser download of the file. The file downloads with its correct original name and the content matches what was uploaded.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-164: Rename File
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded file (e.g., "report.pdf")

**Steps:**
1. Locate the file "report.pdf" in the file listing
2. Access the rename option (right-click context menu or kebab menu)
3. Select "Rename"
4. Verify a rename modal dialog appears with the current file name pre-filled (e.g., "report.pdf")
5. Clear the field and enter a new name (e.g., "annual-report.pdf")
6. Click "Confirm" or press Enter
7. Verify the modal closes
8. Verify the file name updates to "annual-report.pdf" in the listing

**Expected Result:** The rename modal shows the current file name. After entering a new name and confirming, the file name updates in the listing. The file remains in the same folder.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-165: Trash File
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least one uploaded file

**Steps:**
1. Locate a file in the file listing and note its name
2. Access the trash/delete option for the file (context menu or action button)
3. Click the trash/delete option
4. Verify a confirmation dialog appears
5. Click "Cancel" and verify the file remains
6. Click the trash option again and confirm
7. Verify the file disappears from the current file listing
8. Switch to the "Trash" tab on the Reference page
9. Verify the trashed file appears in the Reference trash listing
10. Verify the storage quota updates to reflect the change

**Expected Result:** Trashing a file shows a confirmation dialog. Confirming removes the file from the active listing and moves it to the Reference Trash tab. The storage quota refreshes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-166: Search Files
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with multiple files and folders across nested directories (e.g., Root: "readme.txt", "Project Documents" folder containing "notes.txt" and "budget.xlsx")

**Steps:**
1. Locate the search input field in the toolbar
2. Type "notes" into the search field
3. Wait at least 300 ms for the debounce to trigger
4. Observe the search results:
   - Verify folders are hidden from the results
   - Verify the search returns "notes.txt" even though it is inside the "Project Documents" subfolder (search is global)
5. Verify only matching files are shown
6. Clear the search input
7. Verify the view returns to the normal folder listing
8. Type a search term that matches no files (e.g., "zzzznonexistent")
9. Wait for the debounce
10. Verify an appropriate "no results" message is shown

**Expected Result:** The search input has a 300 ms debounce. Results show matching files globally across all folders. Folders are hidden during search. Clearing the search restores the normal folder view. Non-matching queries show an empty/no-results state.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-167: View Mode Toggle - List and Grid
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page with at least a few files and folders

**Steps:**
1. Observe the current view mode (default may be List or Grid)
2. Locate the view toggle control in the toolbar
3. Click to switch to Grid view (if currently in List view)
4. Verify the files and folders render in a grid/card layout
5. Click to switch to List view
6. Verify the files and folders render in a tabular/list layout
7. Close the browser tab
8. Open a new tab and navigate back to the Reference page
9. Verify the view mode persists (matches the last selection from step 5 or 3)
10. Open browser DevTools and check localStorage for the persisted view mode value

**Expected Result:** The view toggle switches between List and Grid display modes. Files and folders re-render in the chosen layout. The selected view mode is persisted to localStorage and restored on subsequent visits.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-168: Storage Quota Display
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page

**Steps:**
1. Locate the storage quota display in the toolbar
2. Verify it shows the format "used / total" (e.g., "12.5 MB / 1 GB")
3. Note the current "used" value
4. Upload a new file (e.g., a 2 MB file)
5. After the upload completes, verify the storage quota display updates to reflect the increased usage
6. Trash the file just uploaded
7. Verify the storage quota updates (decreases by the trashed file size)
8. Go to the Reference Trash tab and restore the file
9. Verify the storage quota increases again

**Expected Result:** The storage quota display shows used and total storage in a human-readable format. The quota refreshes automatically after uploads, trashing files, and restoring files, reflecting the current storage usage accurately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-169: Reference Pagination
**Priority:** Medium | **Area:** Reference / File Manager

**Preconditions:** User is logged in and on the Reference page in a folder that contains more than 20 files

**Steps:**
1. Navigate to the folder with >20 files
2. Verify the initial load displays up to 20 items
3. Scroll to the bottom of the file listing
4. Locate the "Load more" button
5. Click "Load more"
6. Verify additional files are appended below the existing ones
7. Continue clicking "Load more" until all files are loaded
8. Verify the total number of visible files matches the expected count
9. Verify the "Load more" button disappears or becomes disabled when all items are loaded

**Expected Result:** The Reference file listing uses offset-based pagination with 20 items per page. A "Load more" button appears when there are additional items. Clicking it fetches and appends the next batch. The button disappears when all items are loaded.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-170: Reference Trash Tab
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in, on the Reference page, and has at least one trashed file

**Steps:**
1. Navigate to the Reference page (/reference)
2. Locate the tab bar (Files tab and Trash tab)
3. Click the "Trash" tab
4. Verify the view switches to show the Reference Trash contents
5. Verify the trash listing is displayed as a tabular list
6. Verify each row shows at minimum: file name, file size, and action buttons (Restore, Permanent Delete)
7. Verify the trashed files correspond to files previously trashed from the Files tab

**Expected Result:** The Trash tab shows a tabular list of trashed reference files. Each entry displays the file name, size, and available actions (restore and permanent delete). The list accurately reflects all files that were trashed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-171: Reference Trash - Restore File
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in, on the Reference page Trash tab, with at least one trashed file that was originally in a known folder

**Steps:**
1. Navigate to the Reference Trash tab
2. Identify a trashed file and note which folder it was originally in
3. Click the "Restore" button on the trashed file
4. Verify the file disappears from the Trash tab listing
5. Switch to the "Files" tab
6. Navigate to the folder where the file was originally located
7. Verify the file is back in its original location
8. Verify the storage quota updates

**Expected Result:** Clicking "Restore" on a trashed file removes it from the Trash tab and returns it to its original folder location. The storage quota updates to reflect the restoration.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-172: Reference Trash - Permanent Delete and Empty Trash
**Priority:** High | **Area:** Reference / File Manager

**Preconditions:** User is logged in, on the Reference page Trash tab, with at least two trashed files

**Steps:**
1. **Permanent Delete Single File:**
   a. Navigate to the Reference Trash tab
   b. Identify a specific trashed file
   c. Click the "Permanent Delete" button (or equivalent) on that file
   d. Verify a confirmation dialog appears warning this action is irreversible
   e. Click "Cancel" and verify the file remains
   f. Click "Permanent Delete" again and confirm
   g. Verify the file is permanently removed from the Trash tab
   h. Verify the file cannot be found anywhere (not in Files tab, not in Trash)
2. **Empty Trash:**
   a. Verify there is at least one remaining trashed file
   b. Locate the "Empty Trash" button
   c. Click "Empty Trash"
   d. Verify a confirmation dialog appears with the message "This cannot be undone" or similar
   e. Click "Cancel" and verify the files remain
   f. Click "Empty Trash" again and confirm
   g. Verify all files are permanently removed from the Trash tab
   h. Verify the Trash tab shows empty state
3. **Mobile responsive check:**
   a. Resize the browser to a mobile viewport width (< 768px)
   b. Navigate to the Reference Trash tab (if any items remain, re-add some)
   c. Verify the file size column is hidden on mobile to save space

**Expected Result:** Permanent delete on a single file shows a confirmation (irreversible), then removes the file permanently. Empty Trash shows a confirmation with "This cannot be undone", then removes all trashed files permanently. On mobile viewports, the size column is hidden in the Trash tab.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 12: Completed Items

---

### TC-173: Completed Page Loads
**Priority:** High | **Area:** Completed Items

**Preconditions:** User is logged in and has at least one completed item (stuff, action, or project completed from their respective views)

**Steps:**
1. Navigate to the Completed page (/completed)
2. Verify the page loads without errors
3. Observe the list of completed items
4. Verify each item has a pre-checked (filled) checkbox
5. Verify each item displays a type icon indicating its original type:
   - Stuff items show the inbox/stuff icon
   - Actions show the arrow/action icon
   - Projects show the projects icon
6. Verify items display their titles correctly

**Expected Result:** The Completed page loads showing all completed items in a list. Each item has a pre-checked checkbox and a type icon identifying whether it is a completed Stuff, Action, or Project. Titles are displayed correctly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-174: Uncheck to Restore Completed Item
**Priority:** High | **Area:** Completed Items

**Preconditions:** User is logged in and on the Completed page with at least one completed Stuff item, one completed Action, and one completed Project

**Steps:**
1. Navigate to the Completed page (/completed)
2. Identify a completed Stuff item (inbox icon)
3. Uncheck its checkbox
4. Verify the item disappears from the Completed list
5. Navigate to the Inbox page (/inbox)
6. Verify the restored Stuff item appears in the Inbox
7. Return to the Completed page
8. Identify a completed Action (arrow icon)
9. Uncheck its checkbox
10. Verify the item disappears from the Completed list
11. Navigate to the Next Actions page (/next)
12. Verify the restored Action appears in Next Actions
13. Return to the Completed page
14. Identify a completed Project (projects icon)
15. Uncheck its checkbox
16. Verify the item disappears from the Completed list
17. Navigate to the Projects page (/projects)
18. Verify the restored Project appears in Projects

**Expected Result:** Unchecking a completed item restores it to its original bucket: Stuff returns to Inbox, Actions return to Next Actions, and Projects return to Projects. The item disappears from the Completed list upon unchecking.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-175: Completed Items Not Editable
**Priority:** Medium | **Area:** Completed Items

**Preconditions:** User is logged in and on the Completed page with at least one completed item

**Steps:**
1. Navigate to the Completed page (/completed)
2. Attempt to click on the title text of a completed item
3. Verify the title does NOT enter inline edit mode (no editable input appears)
4. Hover over the item
5. Verify no trash/delete button appears on hover
6. Verify no drag handle is present for reordering
7. Verify the only interactive element is the checkbox (for restoring)

**Expected Result:** Completed items are read-only in the list view. There is no inline title editing, no trash button, and no drag handle. The only interactive element is the checkbox for unchecking (restoring) the item.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-176: Completed Item Click - Navigate to Detail
**Priority:** Medium | **Area:** Completed Items

**Preconditions:** User is logged in and on the Completed page with at least one completed item

**Steps:**
1. Navigate to the Completed page (/completed)
2. Click on a completed item (the navigable area, not the checkbox)
3. Verify the browser navigates to the correct detail page based on item type:
   - Completed Stuff → /stuff/:id
   - Completed Action → /action/:id
   - Completed Project → /project/:id
4. Verify the detail page loads showing the item's data
5. Verify the detail page provides an "Undo" context or mechanism to undo completion
6. Verify the item is displayed in a completed/read-only state where appropriate

**Expected Result:** Clicking a completed item navigates to its correct detail page. The detail page shows the item data with an "Undo" option or context that allows the user to reverse the completion.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-177: Completed Pagination
**Priority:** Medium | **Area:** Completed Items

**Preconditions:** User is logged in and has many completed items (complete at least 15-20 items to exceed one page)

**Steps:**
1. Navigate to the Completed page (/completed)
2. Verify the initial load shows the first batch of completed items
3. Scroll to the bottom of the list
4. Locate the "Load more" button or observe if cursor-based pagination loads automatically
5. Click "Load more" (or trigger the next page load)
6. Verify additional completed items are appended to the list
7. Continue loading pages until all items are shown
8. Verify the pagination uses cursor-based logic (not offset-based) -- check network requests in DevTools for cursor parameters

**Expected Result:** The Completed page uses cursor-based pagination. Additional items load correctly when "Load more" is triggered. Items are appended to the existing list. All completed items are eventually accessible through pagination.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-178: Completed Empty State
**Priority:** Low | **Area:** Completed Items

**Preconditions:** User is logged in and has no completed items (restore all completed items first, or use a fresh account)

**Steps:**
1. Navigate to the Completed page (/completed)
2. Verify no items are displayed in the list
3. Observe the empty state UI
4. Verify the message reads "No completed items" or similar
5. Verify there is additional instructional text explaining what completed items are

**Expected Result:** When there are no completed items, the page displays "No completed items" along with instructional text. The empty state provides context about what will appear on this page (items you have completed from Inbox, Next Actions, or Projects).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-179: Completed Mixed Types Display
**Priority:** Medium | **Area:** Completed Items

**Preconditions:** User is logged in and has completed at least one Stuff item, one Action, and one Project

**Steps:**
1. Navigate to the Completed page (/completed)
2. Scan the list for different item types
3. Identify completed Stuff items and verify they display the inbox/stuff type icon
4. Identify completed Actions and verify they display the arrow/action type icon
5. Identify completed Projects and verify they display the projects type icon
6. Verify all three types coexist in the same list
7. Verify items are ordered consistently (e.g., by completion date, most recent first)

**Expected Result:** The Completed page shows a unified list of all completed items regardless of type. Stuff, Actions, and Projects are all present with their respective type icons clearly distinguishing them. Items are displayed in a consistent order.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 13: Trash

---

### TC-180: Trash Page Loads
**Priority:** High | **Area:** Trash

**Preconditions:** User is logged in and has at least one trashed item (trash an item from Inbox, Next Actions, or Projects)

**Steps:**
1. Navigate to the Trash page (/trash)
2. Verify the page loads without errors
3. Observe the list of trashed items
4. Verify each item has NO checkbox (items cannot be completed from trash)
5. Verify inline title editing is NOT available (titles are not clickable for editing)
6. Verify there is NO drag handle for reordering
7. Verify each item displays a type icon:
   - Trashed Stuff shows the inbox/stuff icon
   - Trashed Actions show the arrow/action icon
   - Trashed Projects show the projects icon
8. Verify the "Empty Trash" button is visible in the page header

**Expected Result:** The Trash page loads showing trashed items in a read-only list. Items have no checkbox, no inline editing, no drag handles, and display type-appropriate icons. The "Empty Trash" button is present in the header.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-181: Trash Items Not Clickable
**Priority:** Medium | **Area:** Trash

**Preconditions:** User is logged in and on the Trash page with at least one trashed item

**Steps:**
1. Navigate to the Trash page (/trash)
2. Observe the items in the list
3. Click on an item's title or body area
4. Verify the browser does NOT navigate to any detail page
5. Verify the URL remains /trash
6. Verify no modal or detail panel opens
7. Verify the cursor style does not indicate a clickable/link element (no pointer cursor on the title)

**Expected Result:** Items in the Trash list are not clickable for navigation. Clicking on a trashed item does nothing -- no detail navigation occurs, no modal opens, and the URL remains /trash. The items exist purely for restore or permanent deletion purposes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-182: Restore from Trash
**Priority:** High | **Area:** Trash

**Preconditions:** User is logged in and on the Trash page with at least one trashed item whose original bucket is known

**Steps:**
1. Navigate to the Trash page (/trash)
2. Identify a trashed item and note its title and type icon
3. Locate the "Restore" link button on the item
4. Click "Restore"
5. Verify the item disappears from the Trash list
6. Verify a success toast appears with the message "restored" or similar indicating the restoration
7. Navigate to the item's original bucket:
   - If it was Stuff (inbox icon), go to Inbox (/inbox)
   - If it was an Action (arrow icon), go to Next Actions (/next)
   - If it was a Project (projects icon), go to Projects (/projects)
8. Verify the restored item appears in the correct bucket

**Expected Result:** Clicking "Restore" on a trashed item removes it from the Trash and returns it to its original bucket. A success toast with "restored" confirms the action. The item is accessible again in its original location.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-183: Empty Trash Button - Enabled/Disabled State
**Priority:** Medium | **Area:** Trash

**Preconditions:** User is logged in

**Steps:**
1. Ensure the Trash has at least one item (trash an item if needed)
2. Navigate to the Trash page (/trash)
3. Locate the "Empty Trash" button in the page header
4. Verify the button is enabled (clickable, not greyed out) since there are items in trash
5. Restore all items from the trash one by one until the trash is empty
6. Verify the "Empty Trash" button becomes disabled (greyed out, not clickable) when the trash is empty
7. Trash a new item
8. Return to the Trash page
9. Verify the "Empty Trash" button is enabled again

**Expected Result:** The "Empty Trash" button is enabled when there are items in the trash and disabled (greyed out) when the trash is empty. The button's state dynamically reflects whether the trash contains items.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-184: Empty Trash Confirmation and Permanent Deletion
**Priority:** High | **Area:** Trash

**Preconditions:** User is logged in and on the Trash page with at least two trashed items

**Steps:**
1. Navigate to the Trash page (/trash)
2. Note the number and titles of trashed items
3. Click the "Empty Trash" button
4. Verify a confirmation dialog appears
5. Verify the dialog includes the message "This cannot be undone" or similar warning about irreversibility
6. Click "Cancel"
7. Verify all trashed items remain in the list (nothing was deleted)
8. Click the "Empty Trash" button again
9. Click "Confirm" (or equivalent) in the confirmation dialog
10. Verify all items are permanently removed from the Trash list
11. Verify the Trash page now shows the empty state
12. Navigate to Inbox, Next Actions, Projects, and Completed to verify the permanently deleted items do not appear anywhere

**Expected Result:** "Empty Trash" triggers a confirmation dialog with an irreversibility warning ("This cannot be undone"). Cancelling preserves all items. Confirming permanently deletes all trashed items -- they are removed from the system entirely and cannot be found in any view.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-185: Trash Pagination
**Priority:** Medium | **Area:** Trash

**Preconditions:** User is logged in and has many trashed items (trash at least 15-20 items to exceed one page)

**Steps:**
1. Navigate to the Trash page (/trash)
2. Verify the initial load shows the first batch of trashed items
3. Scroll to the bottom of the list
4. Locate the "Load more" button
5. Click "Load more"
6. Verify additional trashed items are appended to the list
7. Continue loading pages until all items are shown
8. Verify cursor-based pagination is used (check network requests in DevTools for cursor parameters rather than offset/page numbers)

**Expected Result:** The Trash page uses cursor-based pagination. Additional items load correctly when "Load more" is clicked. Items are appended to the existing list without duplicates. All trashed items are accessible through pagination.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-186: Trash Empty State
**Priority:** Low | **Area:** Trash

**Preconditions:** User is logged in and has no items in trash (restore or permanently delete all trashed items)

**Steps:**
1. Navigate to the Trash page (/trash)
2. Verify no items are displayed in the list
3. Observe the empty state UI
4. Verify the message reads "Trash is empty" or similar
5. Verify there is additional instructional text explaining what the Trash is for
6. Verify the "Empty Trash" button is disabled

**Expected Result:** When there are no trashed items, the page displays "Trash is empty" along with instructional text explaining that deleted items will appear here and can be restored. The "Empty Trash" button is disabled.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-187: Trash Item from Inbox - Verify Round Trip
**Priority:** High | **Area:** Trash

**Preconditions:** User is logged in and has at least one Stuff item in the Inbox

**Steps:**
1. Navigate to the Inbox page (/inbox)
2. Note the title of a Stuff item (e.g., "Call dentist")
3. Hover over the item to reveal action buttons
4. Click the trash/delete button
5. Verify the confirmation dialog appears
6. Confirm the deletion
7. Verify the item disappears from the Inbox
8. Verify a success toast confirms the action
9. Navigate to the Trash page (/trash)
10. Verify the item "Call dentist" appears in the Trash list with the inbox/stuff type icon
11. Click "Restore" on the item
12. Verify the item disappears from the Trash
13. Navigate back to the Inbox page (/inbox)
14. Verify "Call dentist" is back in the Inbox

**Expected Result:** A Stuff item trashed from the Inbox appears in Trash with the correct type icon. Restoring it returns it to the Inbox. The full round trip (Inbox -> Trash -> Inbox) works correctly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-188: Trash Item from Next Actions - Verify Round Trip
**Priority:** High | **Area:** Trash

**Preconditions:** User is logged in and has at least one Action in the Next Actions list

**Steps:**
1. Navigate to the Next Actions page (/next)
2. Note the title of an Action item (e.g., "Buy groceries")
3. Hover over the item to reveal action buttons
4. Click the trash/delete button
5. Verify the confirmation dialog appears
6. Confirm the deletion
7. Verify the item disappears from Next Actions
8. Verify a success toast confirms the action
9. Navigate to the Trash page (/trash)
10. Verify the item "Buy groceries" appears in the Trash list with the arrow/action type icon
11. Click "Restore" on the item
12. Verify the item disappears from the Trash
13. Navigate back to the Next Actions page (/next)
14. Verify "Buy groceries" is back in the Next Actions list

**Expected Result:** An Action trashed from Next Actions appears in Trash with the correct type icon. Restoring it returns it to Next Actions. The full round trip (Next Actions -> Trash -> Next Actions) works correctly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |


## Section 14: Engage (Dashboard Overview)

---

### TC-189: Engage Page Loads as Default Landing Page
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User has a verified account and is logged in. At least one action exists in any bucket.

**Steps:**
1. Log in with valid credentials
2. Observe the URL after login completes
3. Verify the browser navigates to `/engage`
4. Verify the page title or heading displays "Engage" or "Dashboard"
5. Log out, then log in again
6. Verify `/engage` is the landing page on subsequent logins as well

**Expected Result:** After successful login, the user is redirected to `/engage` by default. The Engage dashboard page renders without errors and displays the dashboard layout with sections for Today, Next Actions, Waiting For, and any applicable nudges.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-190: Overdue Alert Displays with Count and View Button
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 3 actions exist with due dates set to past dates (e.g., yesterday, two days ago, one week ago).

**Steps:**
1. Navigate to `/engage`
2. Observe the top of the dashboard for an overdue alert
3. Verify the alert has a red border or red-accented styling making it visually distinct as a warning
4. Verify the alert is styled as a sticky element (remains visible when scrolling)
5. Verify the alert text reads "N overdue items need attention" where N matches the number of actions with past due dates
6. Verify a "View" button is present within the alert
7. Click the "View" button
8. Verify the browser navigates to `/today`
9. On the `/today` page, verify that the overdue items are visible (sorted at top or highlighted)

**Expected Result:** A red-bordered sticky alert appears at the top of the Engage dashboard showing the correct count of overdue items. Clicking "View" navigates to `/today` where those overdue items can be seen and acted upon.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-191: Overdue Count Aggregates Items from Multiple Buckets
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. The following overdue items exist: 2 actions in Next with past due dates, 1 action in Today with a past due date, 1 action in Calendar with a past due date, 1 action in Waiting For with a past due date. Total overdue = 5.

**Steps:**
1. Create or ensure 2 actions that appear in Next Actions and have due dates in the past
2. Create or ensure 1 action that appears in Today with a due date in the past
3. Create or ensure 1 action that appears in Calendar with a due date in the past
4. Create or ensure 1 action assigned as Waiting For with a due date in the past
5. Navigate to `/engage`
6. Observe the overdue alert
7. Verify the count displayed is 5 (the sum of all overdue items across all buckets)
8. Complete one of the overdue actions from the Next bucket
9. Refresh the Engage dashboard
10. Verify the overdue count decreases to 4

**Expected Result:** The overdue count on the Engage dashboard aggregates overdue items from Next, Today, Calendar, and Waiting For buckets. The total count accurately reflects the sum across all these sources and updates when items are completed or removed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-192: Today Section Displays Header with Count, View All Link, and Up to 5 Items
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 7 actions exist with today's date as the due date.

**Steps:**
1. Navigate to `/engage`
2. Locate the "TODAY" section on the dashboard
3. Verify the section header reads "TODAY" (in uppercase or styled prominently)
4. Verify a count badge or number appears next to the header showing the total number of today items (e.g., "7")
5. Verify a "View all" link is displayed adjacent to the header
6. Count the items displayed in the Today section
7. Verify no more than 5 items are shown in this section
8. Verify the items shown are the most relevant (e.g., earliest due time first, or highest priority)
9. Click the "View all" link
10. Verify the browser navigates to `/today`
11. On `/today`, verify all 7 items are visible

**Expected Result:** The Today section displays "TODAY" as its header with a count of total items and a "View all" link pointing to `/today`. The section shows a maximum of 5 items. Clicking "View all" navigates to the full Today page where all items are listed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-193: Today Section - Complete Item Inline
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 2 actions exist with today's date as the due date and are visible in the Engage dashboard Today section.

**Steps:**
1. Navigate to `/engage`
2. Locate the Today section
3. Note the count of items displayed in the section header
4. Identify the first item in the Today section
5. Note the item's title
6. Click the checkbox next to the first item
7. Verify the item shows a completion animation (e.g., strikethrough, fade-out)
8. Verify the item is removed from the Today section after the animation
9. Verify the count in the section header decreases by 1
10. Navigate to `/completed`
11. Verify the completed item appears in the Completed list
12. Navigate back to `/engage`
13. Verify the item is no longer in the Today section

**Expected Result:** Clicking the checkbox on an item in the Today section of the Engage dashboard marks it as completed. The item is removed from the section, the count updates, and the item appears in the Completed page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-194: Next Actions Section Displays Header with Count, View All Link, and Up to 5 Items
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 8 actions exist that qualify as Next Actions (no due date, not delegated, not deferred, not someday).

**Steps:**
1. Navigate to `/engage`
2. Locate the "NEXT ACTIONS" section on the dashboard
3. Verify the section header reads "NEXT ACTIONS"
4. Verify a count badge or number appears next to the header showing the total number of next actions (e.g., "8")
5. Verify a "View all" link is displayed adjacent to the header
6. Count the items displayed in the Next Actions section
7. Verify no more than 5 items are shown in this section
8. Click the "View all" link
9. Verify the browser navigates to `/next`
10. On `/next`, verify all 8 items are visible

**Expected Result:** The Next Actions section displays "NEXT ACTIONS" as its header with a total count and a "View all" link pointing to `/next`. The section shows a maximum of 5 items. Clicking "View all" navigates to the full Next Actions page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-195: Waiting For Section Displays Header with Count, View All Link, and Up to 5 Items
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 6 actions exist with the `waiting_for` field set (delegated actions).

**Steps:**
1. Navigate to `/engage`
2. Locate the "WAITING FOR" section on the dashboard
3. Verify the section header reads "WAITING FOR"
4. Verify a count badge or number appears next to the header showing the total number of waiting-for items (e.g., "6")
5. Verify a "View all" link is displayed adjacent to the header
6. Count the items displayed in the Waiting For section
7. Verify no more than 5 items are shown in this section
8. Click the "View all" link
9. Verify the browser navigates to `/waiting-for`
10. On `/waiting-for`, verify all 6 items are visible

**Expected Result:** The Waiting For section displays "WAITING FOR" as its header with a total count and a "View all" link pointing to `/waiting-for`. The section shows a maximum of 5 items. Clicking "View all" navigates to the full Waiting For page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-196: Inbox Nudge Displays with Count and Link to Clarify
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 4 stuff items exist in the Inbox that have not been clarified.

**Steps:**
1. Navigate to `/engage`
2. Locate the nudge area on the dashboard (typically below the overdue alert or in a nudges section)
3. Verify a nudge is displayed with text "4 items in inbox to clarify" (or the correct count matching items in inbox)
4. Verify the nudge contains a clickable link or is itself clickable
5. Click the nudge link
6. Verify the browser navigates to `/inbox?clarify=1`
7. Verify the Inbox page loads with the clarify flow initiated (e.g., ClarifyPanel opens for the first item)
8. Navigate back to `/engage`
9. Clarify all inbox items (transform them into actions or delete them)
10. Navigate to `/engage`
11. Verify the inbox nudge is no longer displayed

**Expected Result:** When unclarified stuff items exist in the Inbox, the Engage dashboard shows a nudge with the count and a link to `/inbox?clarify=1`. Clicking the link opens the Inbox with clarification started. When the inbox is empty, the nudge disappears.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-197: Stuck Projects Nudge Displays When Projects Lack Next Action
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. 3 projects exist, and 2 of them have no next action assigned (stuck projects).

**Steps:**
1. Navigate to `/engage`
2. Locate the nudge area on the dashboard
3. Verify a nudge is displayed with text "2 projects need a next action" (or the correct count)
4. Verify the nudge contains a clickable link
5. Click the nudge link
6. Verify the browser navigates to `/projects`
7. On the Projects page, verify the stuck projects are identifiable (e.g., highlighted or flagged)
8. Add a next action to one of the stuck projects
9. Navigate back to `/engage`
10. Verify the stuck projects nudge count decreases to 1
11. Add a next action to the remaining stuck project
12. Navigate to `/engage`
13. Verify the stuck projects nudge is no longer displayed

**Expected Result:** When projects exist without a next action, a nudge appears on the Engage dashboard with the count and a link to `/projects`. The nudge updates or disappears as projects gain next actions.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-198: Review Nudge Displays Last Reviewed Information
**Priority:** Medium | **Area:** Engage Dashboard

**Preconditions:** User is logged in. Weekly Review feature is enabled in settings. User has items in various buckets. User has either never performed a review or last reviewed several days ago.

**Steps:**
1. Ensure the Weekly Review feature is enabled in user settings
2. Navigate to `/engage` without having ever completed a review
3. Verify a review nudge is displayed with text "Never reviewed"
4. Verify the nudge contains a clickable link
5. Click the nudge link
6. Verify the browser navigates to `/review`
7. Complete a full weekly review (check all 6 steps and click "Complete Review")
8. Navigate back to `/engage`
9. Verify the review nudge now shows "Last reviewed today" or "Last reviewed 0 days ago"
10. Wait 3 days (or simulate the passage of time)
11. Navigate to `/engage`
12. Verify the review nudge shows "Last reviewed 3 days ago"

**Expected Result:** A review nudge appears on the Engage dashboard showing how long ago the last review was completed, or "Never reviewed" if no review has been done. The nudge links to `/review`. The days-ago count updates accurately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-199: Context Filter on Dashboard Filters All Sections Simultaneously
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. Multiple actions exist across Today, Next Actions, and Waiting For sections. Some actions have the tag `@office`, others have `@home`, and some have no tags.

**Steps:**
1. Navigate to `/engage`
2. Note the items displayed in Today, Next Actions, and Waiting For sections
3. Locate the global context filter in the sidebar (below Dashboard link)
4. Select the `@office` context tag
5. Verify the Today section now only shows items tagged with `@office`
6. Verify the Next Actions section now only shows items tagged with `@office`
7. Verify the Waiting For section now only shows items tagged with `@office`
8. Verify the section counts update to reflect only the filtered items
9. Change the context filter to `@home`
10. Verify all three sections update simultaneously to show only `@home` items
11. Clear the context filter
12. Verify all sections return to showing all items regardless of tags

**Expected Result:** Setting a global context tag filters all dashboard sections (Today, Next Actions, Waiting For) simultaneously. Only items matching the selected context tag are displayed. Counts update accordingly. Clearing the filter restores all items.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-200: Dashboard Empty State with Context Filter Active
**Priority:** Medium | **Area:** Engage Dashboard

**Preconditions:** User is logged in. Actions exist in various buckets but none are tagged with `@calls`.

**Steps:**
1. Navigate to `/engage`
2. Verify items are visible in the dashboard sections
3. Set the global context filter to `@calls`
4. Verify the Today section shows an empty state message such as "No actions for this context"
5. Verify the Next Actions section shows a similar empty state message
6. Verify the Waiting For section shows a similar empty state message
7. Verify no overdue alert is shown (since no filtered items are overdue)
8. Verify no error messages or broken UI elements appear
9. Clear the context filter
10. Verify items reappear in all sections

**Expected Result:** When a context filter is applied that matches no items, all dashboard sections display "No actions for this context" (or similar) instead of their normal item lists. The UI remains clean and usable without errors.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-201: Dashboard Fully Empty State for New Account
**Priority:** Medium | **Area:** Engage Dashboard

**Preconditions:** A brand new user account with no stuff, actions, projects, or any other items.

**Steps:**
1. Register a new account
2. Complete login
3. Verify the browser navigates to `/engage`
4. Verify no Today, Next Actions, or Waiting For sections are displayed (or they are hidden)
5. Verify no overdue alert is shown
6. Verify no nudges are displayed (no inbox items, no stuck projects)
7. Verify a welcome empty state is displayed with text "Ready to get things done?" or similar motivational message
8. Verify a "Go to Inbox" button is present
9. Click the "Go to Inbox" button
10. Verify the browser navigates to `/inbox`
11. Verify the Inbox page loads correctly, ready for the user to add their first stuff item

**Expected Result:** A new account with no data sees a friendly empty state on the Engage dashboard with the message "Ready to get things done?" and a "Go to Inbox" button. Clicking the button navigates to the Inbox to begin the GTD workflow.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-202: Dashboard Drag Reorder Within Today and Next Sections
**Priority:** Medium | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 3 items exist in the Today section and at least 3 items exist in the Next Actions section on the Engage dashboard.

**Steps:**
1. Navigate to `/engage`
2. In the Today section, note the order of items (e.g., Item A, Item B, Item C)
3. Click and hold Item C in the Today section
4. Drag Item C above Item A
5. Release the drag
6. Verify the Today section now shows Item C, Item A, Item B
7. Refresh the page
8. Verify the reordered Today items persist (Item C, Item A, Item B)
9. In the Next Actions section, note the order of items (e.g., Item X, Item Y, Item Z)
10. Click and hold Item Y in the Next Actions section
11. Drag Item Y below Item Z
12. Release the drag
13. Verify the Next Actions section now shows Item X, Item Z, Item Y
14. Navigate away from `/engage` and return
15. Verify the reordered Next Actions items persist

**Expected Result:** Items within the Today and Next Actions sections on the Engage dashboard can be dragged and dropped to reorder. The new order persists after page refresh and navigation. Drag handles or visual cues are present to indicate draggability.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-203: Dashboard Item Click Navigates to Correct Detail Page
**Priority:** High | **Area:** Engage Dashboard

**Preconditions:** User is logged in. At least 1 action exists in each section: Today (an action with due date today), Next Actions (a standalone action), Waiting For (a delegated action). At least 1 action belongs to a project.

**Steps:**
1. Navigate to `/engage`
2. In the Today section, click on an item's title (not the checkbox)
3. Verify the browser navigates to the action detail page (e.g., `/action/:id`)
4. Verify the correct action details are displayed
5. Navigate back to `/engage`
6. In the Next Actions section, click on an item's title
7. Verify the browser navigates to the action detail page for that item
8. Navigate back to `/engage`
9. In the Waiting For section, click on an item's title
10. Verify the browser navigates to the action detail page for that item
11. Navigate back to `/engage`
12. If a project-linked action is displayed, click it
13. Verify it navigates to the action detail page (not the project page)

**Expected Result:** Clicking on any item's title in any dashboard section navigates to the correct detail page for that action. The detail page displays the full information for the clicked item.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 15: Weekly Review

---

### TC-204: Review Page Accessible When Weekly Review Is Enabled
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review feature is enabled in user settings.

**Steps:**
1. Navigate to user settings
2. Verify the Weekly Review toggle is set to enabled
3. Navigate to `/review` by entering the URL directly
4. Verify the page loads without errors
5. Verify the Weekly Review page content is displayed (title, steps, etc.)
6. Navigate to the sidebar
7. Verify a "Review" or "Weekly Review" link is visible in the sidebar navigation
8. Click the sidebar Review link
9. Verify the browser navigates to `/review`
10. Verify the page renders the same content as when accessed directly

**Expected Result:** When Weekly Review is enabled in settings, the `/review` page is accessible both via direct URL navigation and via the sidebar link. The page loads and renders all review content without errors.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-205: Review Page Hidden When Weekly Review Is Disabled
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review feature is currently enabled.

**Steps:**
1. Navigate to user settings
2. Toggle the Weekly Review feature to disabled
3. Save the settings
4. Navigate to the sidebar
5. Verify the "Review" or "Weekly Review" link is no longer visible in the sidebar navigation
6. Attempt to navigate directly to `/review` by entering the URL in the browser
7. Verify the user is redirected away from `/review` (e.g., to `/engage` or a 404 page)
8. Verify no error page or broken content is displayed
9. Re-enable the Weekly Review feature in settings
10. Verify the sidebar link reappears and `/review` is accessible again

**Expected Result:** When Weekly Review is disabled in settings, the sidebar navigation hides the Review link, and navigating directly to `/review` redirects the user or shows an appropriate message. Re-enabling the feature restores access.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-206: Review Page Header Displays Title and Last Review Date
**Priority:** Medium | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled in settings.

**Steps:**
1. Navigate to `/review` without having ever completed a review
2. Verify the page heading displays "Weekly Review"
3. Verify a last review date indicator is displayed showing "Never reviewed"
4. Complete a full weekly review (all 6 steps checked, click "Complete Review")
5. Navigate away from `/review` and then return to `/review`
6. Verify the last review date indicator now shows "Last reviewed: today" or "Last reviewed: 0 days ago"
7. Wait 1 day (or simulate the passage of time if possible)
8. Navigate to `/review`
9. Verify the indicator shows "Last reviewed: 1 day ago"
10. Wait until 7 days have passed since the review
11. Navigate to `/review`
12. Verify the indicator shows "Last reviewed: 7 days ago"

**Expected Result:** The Review page displays "Weekly Review" as its heading. The last review date is shown, displaying "Never reviewed" for users who have not completed a review, and "Last reviewed: N days ago" for users who have. The day count updates accurately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-207: Setup Tip on First Visit Suggests Recurring Weekly Reminder
**Priority:** Medium | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has never visited the Review page before.

**Steps:**
1. Navigate to `/review` for the first time
2. Verify a tip or callout is displayed suggesting the user set up a recurring weekly reminder
3. Verify the tip contains a "Create reminder" button
4. Click the "Create reminder" button
5. Verify a recurring action is created with the following defaults: recurrence set to weekly on Fridays, scheduled time 9:00 AM, duration 60 minutes
6. Verify a success toast or confirmation is shown indicating the reminder was created
7. Navigate to the Calendar or Recurring Actions view
8. Verify the recurring weekly review reminder appears in the list with the correct recurrence rule (weekly, Fridays, 9 AM, 60 min)
9. Navigate back to `/review`
10. Verify the setup tip is no longer displayed (since the reminder was created)

**Expected Result:** On the first visit to the Review page, a helpful tip suggests creating a recurring weekly reminder. Clicking "Create reminder" generates a recurring action with weekly Friday 9 AM 60-minute defaults. After creation, the tip is dismissed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-208: Setup Tip Is Dismissible and Stays Dismissed Across Sessions
**Priority:** Low | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has never visited the Review page before (setup tip is visible).

**Steps:**
1. Navigate to `/review` for the first time
2. Verify the setup tip is displayed
3. Locate the dismiss button (e.g., an X icon or "Dismiss" link on the tip)
4. Click the dismiss button
5. Verify the tip disappears from the page
6. Refresh the page
7. Verify the tip does not reappear after refresh
8. Log out of the account
9. Log back in
10. Navigate to `/review`
11. Verify the tip does not reappear after re-login
12. Clear browser cache (but not server-side data)
13. Log in again and navigate to `/review`
14. Verify the tip remains dismissed (dismissal is stored server-side or in persistent storage)

**Expected Result:** The setup tip can be dismissed by clicking a dismiss control. Once dismissed, the tip stays hidden across page refreshes and login sessions, indicating the dismissal state is persisted.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-209: Review Page Displays All 6 Steps with Correct Details
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. Items exist in Inbox (3 items), Next Actions (5 items), Waiting For (2 items), Projects (4 projects), Someday/Maybe (6 items), and Calendar (8 items).

**Steps:**
1. Navigate to `/review`
2. Verify 6 review steps are displayed in order:
   - Step 1: "Empty Inbox"
   - Step 2: "Review Next Actions"
   - Step 3: "Review Waiting For"
   - Step 4: "Review Projects"
   - Step 5: "Review Someday/Maybe"
   - Step 6: "Review Calendar"
3. For each step, verify the following elements are present:
   a. A title matching the step name
   b. A hint or description explaining what to do in this step
   c. A count badge showing the number of items in that bucket (3, 5, 2, 4, 6, 8 respectively)
   d. A "Go" link or button
4. Verify the count badges accurately reflect the current item counts in each bucket
5. Add a new stuff item to the Inbox
6. Refresh the Review page
7. Verify the Inbox step count badge updates to 4

**Expected Result:** All 6 review steps are displayed with their title, descriptive hint, accurate count badge, and a "Go" link. Count badges dynamically reflect the current number of items in each respective bucket.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-210: Review Step Go Links Navigate to Correct Pages
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. Items exist in all 6 buckets.

**Steps:**
1. Navigate to `/review`
2. Click the "Go" link on the "Empty Inbox" step
3. Verify the browser navigates to `/inbox`
4. Navigate back to `/review`
5. Click the "Go" link on the "Review Next Actions" step
6. Verify the browser navigates to `/next`
7. Navigate back to `/review`
8. Click the "Go" link on the "Review Waiting For" step
9. Verify the browser navigates to `/waiting-for`
10. Navigate back to `/review`
11. Click the "Go" link on the "Review Projects" step
12. Verify the browser navigates to `/projects`
13. Navigate back to `/review`
14. Click the "Go" link on the "Review Someday/Maybe" step
15. Verify the browser navigates to `/someday`
16. Navigate back to `/review`
17. Click the "Go" link on the "Review Calendar" step
18. Verify the browser navigates to `/calendar`

**Expected Result:** Each "Go" link on the review steps navigates to the correct corresponding page: Inbox -> `/inbox`, Next Actions -> `/next`, Waiting For -> `/waiting-for`, Projects -> `/projects`, Someday/Maybe -> `/someday`, Calendar -> `/calendar`.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-211: Start Review Enables Checkboxes
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has not started a review session.

**Steps:**
1. Navigate to `/review`
2. Observe the 6 review steps
3. Verify that the checkboxes next to each step are disabled or not interactive (greyed out)
4. Locate the "Start Review" button
5. Click "Start Review"
6. Verify the checkboxes next to each step become enabled and interactive
7. Click the checkbox for "Empty Inbox"
8. Verify the checkbox is checked and a visual indicator (e.g., checkmark, strikethrough, or highlight) confirms the step is marked as done
9. Verify the other 5 checkboxes remain unchecked but are still enabled

**Expected Result:** Before clicking "Start Review," the step checkboxes are disabled. After clicking "Start Review," all checkboxes become enabled and interactive, allowing the user to check off steps as they complete them.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-212: Review Progress Counter Updates as Steps Are Checked
**Priority:** Medium | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has clicked "Start Review" and checkboxes are enabled.

**Steps:**
1. Navigate to `/review`
2. Click "Start Review"
3. Verify the progress counter displays "0 of 6 complete"
4. Check the "Empty Inbox" checkbox
5. Verify the progress counter updates to "1 of 6 complete"
6. Check the "Review Next Actions" checkbox
7. Verify the progress counter updates to "2 of 6 complete"
8. Check the "Review Waiting For" checkbox
9. Verify the progress counter updates to "3 of 6 complete"
10. Uncheck the "Review Waiting For" checkbox
11. Verify the progress counter reverts to "2 of 6 complete"
12. Re-check the "Review Waiting For" checkbox
13. Check the "Review Projects" checkbox
14. Verify the progress counter updates to "4 of 6 complete"
15. Check the "Review Someday/Maybe" checkbox
16. Verify the progress counter updates to "5 of 6 complete"
17. Check the "Review Calendar" checkbox
18. Verify the progress counter updates to "6 of 6 complete"

**Expected Result:** The progress counter accurately reflects the number of checked steps out of 6 total. It increments when a step is checked and decrements when a step is unchecked. It updates in real time without requiring a page refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-213: Complete Review Saves Review Date After All Steps Checked
**Priority:** High | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has clicked "Start Review" and all 6 checkboxes are checked.

**Steps:**
1. Navigate to `/review`
2. Click "Start Review"
3. Check all 6 step checkboxes
4. Verify the "Complete Review" button is now enabled
5. Click "Complete Review"
6. Verify a success message or toast is displayed confirming the review is complete (e.g., "Weekly review completed")
7. Verify the review date is saved (the last reviewed indicator updates to show today's date)
8. Verify the page resets to its initial state (checkboxes unchecked and disabled, "Start Review" button visible again)
9. Navigate away from `/review` to `/engage`
10. Verify the review nudge on the Engage dashboard reflects the updated review date (e.g., "Last reviewed: today")
11. Navigate back to `/review`
12. Verify the header shows the updated last review date

**Expected Result:** After checking all 6 steps and clicking "Complete Review," the review date is saved and persisted. A success confirmation is shown. The page resets for the next review session. The last reviewed date updates across the application.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-214: Complete Review Button Disabled Until All 6 Steps Are Checked
**Priority:** Medium | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. User has clicked "Start Review."

**Steps:**
1. Navigate to `/review`
2. Click "Start Review"
3. Verify the "Complete Review" button is disabled (greyed out, not clickable)
4. Check steps 1 through 5 (leave step 6 unchecked)
5. Verify the "Complete Review" button is still disabled
6. Try clicking the disabled "Complete Review" button
7. Verify nothing happens (no review is completed, no error)
8. Check step 6 (all 6 now checked)
9. Verify the "Complete Review" button becomes enabled
10. Uncheck step 3
11. Verify the "Complete Review" button becomes disabled again
12. Re-check step 3
13. Verify the "Complete Review" button is enabled again

**Expected Result:** The "Complete Review" button is disabled unless all 6 review steps are checked. It dynamically enables and disables as steps are checked and unchecked. Clicking the disabled button has no effect.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-215: Review Page Mobile Layout Hides Hint Text
**Priority:** Low | **Area:** Weekly Review

**Preconditions:** User is logged in. Weekly Review is enabled. Device is a mobile phone or browser is resized to mobile viewport width (< 768px).

**Steps:**
1. Resize the browser to a mobile viewport width (e.g., 375px wide) or use a mobile device
2. Navigate to `/review`
3. Verify the page loads correctly and is usable on the smaller screen
4. Observe the 6 review steps
5. Verify that the hint/description text for each step is hidden on mobile
6. Verify the step titles are still visible
7. Verify the count badges are still visible
8. Verify the "Go" links are still accessible
9. Verify the "Start Review" button is visible and clickable
10. Verify the checkboxes are large enough to tap on mobile
11. Resize the browser to a desktop viewport width (e.g., 1280px)
12. Verify the hint text reappears for each step

**Expected Result:** On mobile viewports, the review step hint text is hidden to conserve space while all other functional elements (titles, count badges, Go links, checkboxes, buttons) remain visible and usable. On desktop viewports, the hint text is visible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 16: Recurring Actions

---

### TC-216: Access Recurring Actions from Calendar View
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. At least 3 recurring action templates exist.

**Steps:**
1. Navigate to `/calendar`
2. Locate a "Recurring" tab, toggle, or sub-navigation within the Calendar view
3. Click to switch to the Recurring view
4. Verify a list of recurring action templates is displayed
5. Verify each template shows its title and a summary of its recurrence rule (e.g., "Every day", "Every week on Mon, Wed")
6. Verify the count of displayed templates matches the expected number (3)
7. Verify the list is scrollable if more templates exist than fit on screen

**Expected Result:** Within the Calendar page, the user can access a Recurring view that displays a list of all recurring action templates with their titles and recurrence rule summaries.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-217: Create New Recurring Action with All Required Fields
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the Calendar Recurring view.

**Steps:**
1. Navigate to `/recurring/new`
2. Verify the creation form is displayed with the following fields:
   a. Title (text input)
   b. Recurrence rule (frequency selector and options)
   c. Scheduled time (time picker)
   d. Duration (duration input, e.g., in minutes)
3. Enter a title: "Weekly team standup"
4. Set the recurrence rule to Weekly, select Monday and Wednesday
5. Set the scheduled time to 10:00 AM
6. Set the duration to 30 minutes
7. Save the recurring action
8. Verify a success confirmation is shown
9. Verify the new recurring template appears in the Recurring list
10. Click on the newly created template
11. Verify all entered values are correctly displayed (title, weekly on Mon/Wed, 10:00 AM, 30 min)

**Expected Result:** The `/recurring/new` page presents a form with Title, Recurrence rule, Scheduled time, and Duration fields. After filling in all fields and saving, the recurring action template is created and appears in the list with correct details.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-218: Recurrence Rule - Daily Frequency with Interval
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form.

**Steps:**
1. Navigate to `/recurring/new`
2. In the recurrence rule section, select frequency "Daily"
3. Verify an interval field appears allowing input of a number between 1 and 99
4. Set the interval to 1
5. Verify the human-readable summary reads "Every day"
6. Change the interval to 2
7. Verify the summary updates to "Every 2 days"
8. Change the interval to 7
9. Verify the summary updates to "Every 7 days"
10. Try entering 0 in the interval field
11. Verify validation prevents 0 (minimum is 1)
12. Try entering 100 in the interval field
13. Verify validation prevents values above 99 (maximum is 99)
14. Set the interval to 3
15. Fill in the remaining required fields (title, time, duration) and save
16. Verify the saved template shows "Every 3 days" as its recurrence rule

**Expected Result:** The Daily frequency option allows setting an interval between 1 and 99 days. The human-readable summary dynamically updates to reflect the selected interval (e.g., "Every day", "Every 2 days"). Values outside the 1-99 range are rejected by validation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-219: Recurrence Rule - Weekly Frequency with Multiple Day Selection
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form.

**Steps:**
1. Navigate to `/recurring/new`
2. In the recurrence rule section, select frequency "Weekly"
3. Verify day-of-week selectors appear for Mon, Tue, Wed, Thu, Fri, Sat, Sun
4. Verify an interval field appears (every N weeks)
5. Set interval to 1 and select Monday only
6. Verify the summary reads "Every week on Mon"
7. Also select Wednesday and Friday
8. Verify the summary updates to "Every week on Mon, Wed, Fri"
9. Change the interval to 2
10. Verify the summary updates to "Every 2 weeks on Mon, Wed, Fri"
11. Deselect all days
12. Verify validation requires at least one day to be selected (e.g., a warning or the save button is disabled)
13. Select only Sunday
14. Verify the summary reads "Every 2 weeks on Sun"
15. Fill in the remaining required fields and save
16. Verify the saved template shows the correct weekly recurrence rule

**Expected Result:** The Weekly frequency allows selecting one or more days of the week and an interval in weeks. The human-readable summary dynamically reflects the chosen days and interval. At least one day must be selected for a valid rule.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-220: Recurrence Rule - Monthly Frequency with Day of Month
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form.

**Steps:**
1. Navigate to `/recurring/new`
2. In the recurrence rule section, select frequency "Monthly"
3. Verify a day-of-month selector appears allowing values 1 through 31
4. Set the day of month to 1
5. Verify the human-readable summary reads "Every month on the 1st"
6. Change the day to 15
7. Verify the summary updates to "Every month on the 15th"
8. Change the day to 31
9. Verify the summary updates to "Every month on the 31st"
10. Verify a note or tooltip indicates that months with fewer days will use the last day of the month (e.g., February 28/29 for day 31)
11. Fill in the remaining required fields and save
12. Verify the saved template shows the correct monthly recurrence rule

**Expected Result:** The Monthly frequency allows selecting a day of month between 1 and 31. The human-readable summary uses ordinal formatting (1st, 2nd, 3rd, etc.). Months shorter than the selected day gracefully handle by using the last available day.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-221: Recurrence Rule - Yearly Frequency with Month and Day
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form.

**Steps:**
1. Navigate to `/recurring/new`
2. In the recurrence rule section, select frequency "Yearly"
3. Verify month and day selectors appear
4. Select month "January" and day 1
5. Verify the human-readable summary reads "Every year on Jan 1"
6. Change to month "March" and day 15
7. Verify the summary updates to "Every year on Mar 15"
8. Change to month "December" and day 25
9. Verify the summary updates to "Every year on Dec 25"
10. Select month "February" and day 29
11. Verify the summary reads "Every year on Feb 29" and note that leap year handling applies
12. Fill in the remaining required fields and save
13. Verify the saved template shows the correct yearly recurrence rule

**Expected Result:** The Yearly frequency allows selecting a month and day of month. The human-readable summary displays in "Every year on Mon DD" format. The form accepts February 29 with the understanding that it applies on leap years.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-222: End Condition - Never (No End Date)
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form with a recurrence rule configured.

**Steps:**
1. Navigate to `/recurring/new`
2. Configure a recurrence rule (e.g., Daily, every 1 day)
3. Locate the end condition selector
4. Select "Never" as the end condition
5. Verify no end date field or occurrence count field is displayed
6. Verify the summary does not include any end information (or explicitly states "No end date")
7. Fill in the remaining required fields and save
8. Open the saved recurring template
9. Verify the end condition is set to "Never" and no end date is stored

**Expected Result:** Selecting "Never" as the end condition hides any end date or occurrence count inputs. The recurring action is set to repeat indefinitely with no termination.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-223: End Condition - After N Occurrences
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form with a recurrence rule configured.

**Steps:**
1. Navigate to `/recurring/new`
2. Configure a recurrence rule (e.g., Weekly on Monday)
3. Locate the end condition selector
4. Select "After" as the end condition
5. Verify an occurrences count input field appears
6. Enter 10 in the occurrences field
7. Verify the summary includes information about ending after 10 occurrences
8. Try entering 0
9. Verify validation rejects 0 (minimum is 1)
10. Try entering 1000
11. Verify validation rejects values above 999 (maximum is 999)
12. Set the value to 5
13. Fill in the remaining required fields and save
14. Open the saved recurring template
15. Verify the end condition shows "After 5 occurrences"

**Expected Result:** The "After N occurrences" end condition allows setting a count between 1 and 999. Validation enforces the range. The saved template correctly reflects the occurrence limit.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-224: End Condition - Until Specific Date
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. User is on the recurring action creation or edit form with a recurrence rule configured.

**Steps:**
1. Navigate to `/recurring/new`
2. Configure a recurrence rule (e.g., Monthly on the 1st)
3. Locate the end condition selector
4. Select "Until" as the end condition
5. Verify a date picker or date input field appears
6. Select a date 6 months from today
7. Verify the summary includes the end date (e.g., "until Aug 27, 2026")
8. Try selecting a date in the past
9. Verify validation rejects past dates (the end date must be in the future)
10. Select a valid future date (e.g., December 31, 2026)
11. Fill in the remaining required fields and save
12. Open the saved recurring template
13. Verify the end condition shows "Until Dec 31, 2026"

**Expected Result:** The "Until" end condition allows selecting a future date via a date picker. Past dates are rejected by validation. The saved template correctly displays the end date.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-225: Edit Recurring Action Template
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. A recurring action template exists with title "Daily standup", recurrence "Every day", time 9:00 AM, duration 15 minutes.

**Steps:**
1. Navigate to the Recurring list in the Calendar view
2. Click on the "Daily standup" template
3. Verify the browser navigates to `/recurring/:id`
4. Verify the template details are displayed: title "Daily standup", "Every day", 9:00 AM, 15 min
5. Click on the title "Daily standup"
6. Verify the title becomes editable (inline edit mode)
7. Change the title to "Morning standup"
8. Press Enter or click away to save
9. Verify the title updates to "Morning standup"
10. Edit the description field (if present) and add "Team sync meeting"
11. Change the recurrence rule from Daily to Weekly on Mon-Fri
12. Change the scheduled time to 10:30 AM
13. Change the duration to 30 minutes
14. Save all changes
15. Navigate away and return to `/recurring/:id`
16. Verify all changes persisted: "Morning standup", Weekly Mon-Fri, 10:30 AM, 30 min, description "Team sync meeting"

**Expected Result:** The recurring template detail page allows editing all fields: title (click-to-edit inline), description, recurrence rule, scheduled time, and duration. All changes persist after saving and navigating away.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-226: Active Instance Badge on Recurring Detail Page
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. A recurring action template exists and has spawned an active action instance (a concrete action that exists in Next Actions, Today, or Calendar).

**Steps:**
1. Navigate to the Recurring list and select the recurring template that has an active instance
2. Verify the detail page loads at `/recurring/:id`
3. Locate the "Active instance" badge on the page
4. Verify the badge is visible and clearly labeled (e.g., "Active instance" with a link or button)
5. Click the "Active instance" badge or link
6. Verify the browser navigates to the detail page of the currently spawned action instance (e.g., `/action/:actionId`)
7. Verify the action detail page shows the correct action with its title matching the recurring template
8. Navigate back to the recurring template detail page
9. Complete the active action instance
10. Return to the recurring template detail page
11. Verify the "Active instance" badge updates or disappears (depending on whether a new instance was auto-spawned)

**Expected Result:** The recurring template detail page displays an "Active instance" badge that links to the currently spawned action. Clicking it navigates to the action's detail page. The badge reflects the current state of spawned instances.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-227: Spawn Next Action Instance Manually
**Priority:** Medium | **Area:** Recurring Actions

**Preconditions:** User is logged in. A recurring action template exists. No active instance currently exists for this template (or the current instance has been completed).

**Steps:**
1. Navigate to the Recurring list and select a recurring template
2. Verify the detail page loads at `/recurring/:id`
3. Locate the "Spawn next" button
4. Click "Spawn next"
5. Verify a success confirmation is displayed (e.g., toast message "Next instance created")
6. Verify the "Active instance" badge appears (or updates) on the detail page, linking to the new action
7. Click the "Active instance" link
8. Verify a new action has been created with the recurring template's title, scheduled time, and duration
9. Verify the action's due date corresponds to the next occurrence per the recurrence rule
10. Navigate back to the recurring template detail page
11. Try clicking "Spawn next" again while an active instance already exists
12. Verify appropriate behavior (either prevented with a message like "Active instance already exists", or a second instance is created at the following occurrence)

**Expected Result:** Clicking "Spawn next" manually creates the next action instance based on the recurrence rule. The new action appears with the correct title, time, duration, and due date. The "Active instance" badge updates to link to the new action.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-228: Trash Recurring Action Template
**Priority:** High | **Area:** Recurring Actions

**Preconditions:** User is logged in. A recurring action template named "Old recurring task" exists.

**Steps:**
1. Navigate to the Recurring list
2. Verify "Old recurring task" is listed
3. Click on "Old recurring task" to open its detail page
4. Locate the Trash or Delete button
5. Click the Trash button
6. If a confirmation dialog appears, verify it warns about deleting the template
7. Confirm the deletion
8. Verify a success confirmation is displayed (e.g., "Recurring action deleted")
9. Verify the browser navigates back to the Recurring list (or the list updates)
10. Verify "Old recurring task" is no longer in the Recurring list
11. Navigate to `/trash`
12. Verify the recurring template appears in the Trash
13. If an active instance existed for the template, verify the behavior of that instance (it may remain as a standalone action or be trashed as well, depending on design)

**Expected Result:** Clicking Trash on a recurring template removes it from the Recurring list and moves it to the Trash. A confirmation dialog may appear before deletion. The template is recoverable from the Trash page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 17: Context Tags & Filtering

---

### TC-229: Tag Input - Add Tag by Pressing Enter or Comma
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. An action detail page is open (e.g., `/action/:id`).

**Steps:**
1. Navigate to an action's detail page
2. Locate the tag input field
3. Click into the tag input field
4. Type `@office`
5. Press Enter
6. Verify `@office` appears as a chip/badge inside or below the tag input
7. Verify the text input is cleared
8. Type `@home`
9. Press the comma key (`,`)
10. Verify `@home` appears as a second chip
11. Verify the text input is cleared (and no trailing comma in the input)
12. Type `urgent`
13. Press Enter
14. Verify `urgent` appears as a third chip
15. Verify all three tags (`@office`, `@home`, `urgent`) are displayed as chips
16. Refresh the page
17. Verify all three tags persist after refresh

**Expected Result:** Tags can be added by typing text and pressing Enter or the comma key. Each tag appears as a chip/badge. The input clears after each tag is added. Tags persist after page refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-230: Tag Input - Autocomplete Suggests Previously Used Tags
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Tags `@office`, `@home`, `@calls`, `energy:high`, and `project-alpha` have been used on other actions. User is on an action detail page with the tag input field.

**Steps:**
1. Click into the tag input field
2. Type `@`
3. Verify a dropdown appears with suggestions matching `@` prefix: `@office`, `@home`, `@calls`
4. Verify the dropdown contains only tags that start with `@`
5. Clear the input and type `@of`
6. Verify the dropdown narrows to show `@office`
7. Clear the input and type `ener`
8. Verify the dropdown shows `energy:high`
9. Clear the input and type `proj`
10. Verify the dropdown shows `project-alpha`
11. Click on `project-alpha` in the dropdown
12. Verify `project-alpha` is added as a chip
13. Clear the input and type `@of`
14. Verify the dropdown shows `@office`
15. Press Enter or click `@office`
16. Verify `@office` is added as a chip
17. Type `@of` again
18. Verify `@office` no longer appears in suggestions (already added)

**Expected Result:** The tag input provides autocomplete suggestions from all previously used tags across the user's account. Suggestions filter as the user types. Selecting a suggestion adds it as a chip. Tags already added to the current item are excluded from suggestions.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-231: Tag Input - Remove Tag via Backspace and via X Button
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. An action detail page is open with 3 tags already added: `@office`, `@home`, `urgent`.

**Steps:**
1. Navigate to the action detail page
2. Verify the three tags are displayed as chips: `@office`, `@home`, `urgent`
3. Click into the tag input field (the text input should be empty)
4. Verify the cursor is in the input field with no text
5. Press Backspace
6. Verify the last tag (`urgent`) is removed
7. Verify only `@office` and `@home` remain as chips
8. Press Backspace again
9. Verify `@home` is removed
10. Verify only `@office` remains
11. Now locate the X (close) button on the `@office` chip
12. Click the X button on the `@office` chip
13. Verify `@office` is removed
14. Verify no tags remain
15. Refresh the page
16. Verify no tags are displayed (removal persisted)

**Expected Result:** Tags can be removed in two ways: pressing Backspace on an empty tag input removes the last tag, and clicking the X button on any chip removes that specific tag. Removals persist after page refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-232: Tag Input - Keyboard Navigation of Suggestion Dropdown
**Priority:** Medium | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Multiple previously used tags exist: `@office`, `@home`, `@calls`, `@anywhere`. User is on an action detail page.

**Steps:**
1. Click into the tag input field
2. Type `@`
3. Verify the suggestion dropdown appears with multiple matches (e.g., `@office`, `@home`, `@calls`, `@anywhere`)
4. Press the Down Arrow key
5. Verify the first suggestion (`@office` or first in list) is highlighted
6. Press the Down Arrow key again
7. Verify the second suggestion is highlighted
8. Press the Up Arrow key
9. Verify the first suggestion is highlighted again
10. Press the Down Arrow key until the last suggestion is highlighted
11. Press the Down Arrow key once more
12. Verify the highlight wraps to the first suggestion (or stays on the last)
13. With a suggestion highlighted, press Enter
14. Verify the highlighted tag is added as a chip
15. Type `@` again to re-open the dropdown
16. Press Escape
17. Verify the suggestion dropdown closes
18. Verify the text `@` remains in the input field
19. Verify the input field retains focus

**Expected Result:** The suggestion dropdown supports keyboard navigation with Up/Down Arrow keys to highlight suggestions. Enter selects the highlighted suggestion. Escape closes the dropdown without adding a tag. Navigation is intuitive and accessible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-233: Tag Input - Preset Chips Displayed and Clickable
**Priority:** Medium | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. User is on an action detail page with the tag input visible.

**Steps:**
1. Locate the tag input area on the action detail page
2. Verify preset chips are displayed below (or near) the input field
3. Verify the following preset chips are shown: `@computer`, `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`
4. Click the `@computer` preset chip
5. Verify `@computer` is added as a tag chip on the item
6. Verify the `@computer` preset chip is visually distinguished (e.g., dimmed or removed from presets) to indicate it has been added
7. Click the `energy:high` preset chip
8. Verify `energy:high` is added as a tag chip
9. Click the `min:5` preset chip
10. Verify `min:5` is added as a tag chip
11. Verify three tags now appear on the item: `@computer`, `energy:high`, `min:5`
12. Refresh the page
13. Verify the three tags persist
14. Verify the preset chips that have been added are appropriately indicated (dimmed, hidden, or marked as already applied)

**Expected Result:** Preset tag chips are displayed near the tag input as quick-add shortcuts. Clicking a preset adds it as a tag. All default presets (`@computer`, `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`) are present. Added presets are visually distinguished.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-234: Tags Cannot Be Added to Stuff Items
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. At least one stuff item exists in the Inbox. At least one action exists (for comparison).

**Steps:**
1. Navigate to `/inbox`
2. Click on a stuff item to open its detail page (`/stuff/:id`)
3. Inspect the detail page for any tag input field
4. Verify that no tag input, tag chips, or tagging UI is present on the stuff detail page
5. Verify there is no way to add tags to a stuff item (no hidden input, no tag section)
6. Navigate to an action detail page (`/action/:id`)
7. Verify the tag input field IS present on the action detail page
8. Navigate to a project detail page (`/project/:id`)
9. Verify the tag input field IS present on the project detail page
10. Return to the stuff detail page
11. Confirm again that tagging is not available for stuff

**Expected Result:** Stuff items (raw inbox items) do not have a tag input or any tagging capability. Tags are only available on actions and projects, consistent with the GTD rule that stuff has no metadata until clarified.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-235: Per-Page Tag Filter on List Pages
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Multiple actions exist with various tags: some with `@office`, some with `@home`, some with `energy:high`, some with no tags. Actions span Next, Today, Waiting For, Projects, and Someday views.

**Steps:**
1. Navigate to `/next`
2. Locate the filter icon (e.g., funnel icon) at the top of the page
3. Click the filter icon
4. Verify a dropdown appears with a list of checkable tags (showing all tags used on items in this view)
5. Check the `@office` tag
6. Verify the list filters to show only actions tagged with `@office`
7. Verify the selected tag appears as a chip with an X button (to remove the filter)
8. Check the `energy:high` tag as well
9. Verify the list now shows actions that have either `@office` OR `energy:high` (or both, depending on filter logic)
10. Verify both selected tags are shown as chips
11. Click the X on the `@office` chip
12. Verify only `energy:high` filter remains active
13. Click "Clear all"
14. Verify all filters are removed and all items are shown again
15. Repeat steps 2-14 on `/today`, `/waiting-for`, `/projects`, and `/someday` pages
16. Verify the tag filter works consistently across all five pages

**Expected Result:** Each list page (Next, Today, Waiting For, Projects, Someday) has a filter icon that opens a dropdown with checkable tags. Multiple tags can be selected. Selected tags appear as removable chips. A "Clear all" option removes all filters. The item list updates to show only matching items.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-236: Context Filter Located in Sidebar Below Dashboard Link
**Priority:** Medium | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. The sidebar is visible (desktop layout or mobile sidebar opened).

**Steps:**
1. Navigate to any page within the dashboard layout
2. Observe the sidebar navigation
3. Locate the Dashboard (or Engage) link in the sidebar
4. Verify the context filter is positioned directly below the Dashboard link
5. Verify the context filter is visually distinguishable from navigation links (e.g., styled as a filter control, not a navigation item)
6. Verify the context filter is present and in the same position on all dashboard pages (navigate to `/next`, `/today`, `/projects` and check each time)
7. On mobile, open the sidebar
8. Verify the context filter is in the same relative position (below the Dashboard link)

**Expected Result:** The global context filter is consistently located in the sidebar, positioned directly below the Dashboard link. It is visible on all dashboard pages and maintains its position across desktop and mobile layouts.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-237: Context Filter Single-Select Toggle Behavior
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Tags `@office`, `@home`, and `@calls` have been used on various actions.

**Steps:**
1. Locate the context filter in the sidebar
2. Verify no context is currently selected (no active filter)
3. Click on `@office` in the context filter
4. Verify `@office` is now active (highlighted, selected)
5. Verify the dashboard/current page filters to show only `@office` items
6. Click on `@home` in the context filter
7. Verify `@home` is now active and `@office` is deselected (single-select behavior)
8. Verify the page updates to show only `@home` items
9. Click on `@home` again (the currently active tag)
10. Verify `@home` is deselected and the context filter is cleared
11. Verify the page returns to showing all items (no context filter)
12. Click on `@calls`
13. Verify `@calls` is active
14. Try to select `@office` at the same time
15. Verify `@calls` is deselected and `@office` becomes active (only one can be selected at a time)

**Expected Result:** The context filter operates as a single-select toggle. Only one context tag can be active at a time. Selecting a different tag deselects the previous one. Clicking the active tag again clears the filter entirely.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-238: Context Filter Active Chip Displayed in Sidebar
**Priority:** Medium | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Tags have been used on actions. The sidebar is visible.

**Steps:**
1. Locate the context filter in the sidebar
2. Verify no chip is displayed when no context is active
3. Select `@office` from the context filter
4. Verify a chip appears in the sidebar showing `@office` as the active context
5. Verify the chip is visually styled as a tag chip (e.g., with background color, rounded corners)
6. Verify the chip has an X or close button to clear the filter
7. Navigate to different pages (`/next`, `/today`, `/projects`)
8. Verify the chip remains visible in the sidebar on all pages
9. Click the X button on the chip
10. Verify the context filter is cleared and the chip disappears
11. Select a different context tag (`@home`)
12. Verify the chip updates to show `@home`

**Expected Result:** When a context filter is active, a styled chip is displayed in the sidebar showing the selected tag. The chip persists across page navigation. It includes a close button to clear the filter. The chip updates when the selection changes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-239: Context Filter Applies Globally Across Multiple Pages
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Actions exist in Next, Today, Waiting For, Projects, and Someday views with various tags. At least some items in each view have the tag `@office` and some do not.

**Steps:**
1. Set the global context filter to `@office` in the sidebar
2. Navigate to `/next`
3. Verify only actions tagged with `@office` are displayed
4. Note the count of items shown
5. Navigate to `/today`
6. Verify only today actions tagged with `@office` are displayed
7. Navigate to `/waiting-for`
8. Verify only waiting-for actions tagged with `@office` are displayed
9. Navigate to `/projects`
10. Verify only projects tagged with `@office` are displayed
11. Navigate to `/someday`
12. Verify only someday items tagged with `@office` are displayed
13. Navigate to `/engage`
14. Verify all Engage dashboard sections (Today, Next Actions, Waiting For) are filtered to `@office`
15. Clear the context filter
16. Navigate through each page again
17. Verify all pages now show all items regardless of tags

**Expected Result:** The global context filter simultaneously applies to Next, Today, Waiting For, Projects, Someday, and the Engage dashboard. All pages show only items matching the selected context tag. Clearing the filter restores full visibility across all pages.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-240: Context Filter Interaction with Per-Page Tag Filter
**Priority:** High | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Actions on the Next page have tags: some `@office`, some `@office` + `energy:high`, some `@home` + `energy:high`, some with only `energy:low`.

**Steps:**
1. Set the global context filter in the sidebar to `@office`
2. Navigate to `/next`
3. Verify only `@office` items are shown
4. Open the per-page tag filter (filter icon)
5. Verify `@office` appears as a pre-applied chip that is non-removable (cannot be unchecked or has no X button)
6. Verify other tags (e.g., `energy:high`, `energy:low`) are available to check
7. Check `energy:high` in the per-page filter
8. Verify the list now shows only items tagged with both `@office` AND `energy:high`
9. Verify the `@office` chip remains as a non-removable pre-applied filter
10. Verify the `energy:high` chip appears as a removable filter
11. Click X on the `energy:high` chip
12. Verify the list returns to showing all `@office` items
13. Try to remove the `@office` pre-applied chip
14. Verify it cannot be removed from the per-page filter (must be changed via the global context filter in the sidebar)
15. Clear the global context filter in the sidebar
16. Verify the pre-applied `@office` chip disappears from the per-page filter
17. Verify the page now shows all items

**Expected Result:** When a global context filter is active, it appears as a pre-applied, non-removable chip in the per-page tag filter. Additional per-page filters can be applied on top of the context filter. The context filter can only be changed via the sidebar, not from the per-page filter controls.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-241: Custom Tag Presets Modified via Settings
**Priority:** Low | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. Default presets exist: `@computer`, `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`.

**Steps:**
1. Navigate to user settings
2. Locate the tag presets configuration section
3. Verify the default presets are listed: `@computer`, `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`
4. Remove the `@computer` preset
5. Add a new custom preset: `@errands`
6. Save the settings
7. Navigate to an action detail page
8. Locate the tag input and preset chips area
9. Verify `@computer` is no longer shown as a preset chip
10. Verify `@errands` is now shown as a preset chip
11. Verify the remaining original presets are still shown: `@office`, `@home`, `@calls`, `@anywhere`, `energy:high`, `energy:low`, `min:5`, `min:30`
12. Click the `@errands` preset chip
13. Verify `@errands` is added as a tag to the action
14. Navigate to a different action detail page
15. Verify the updated presets are consistent across all action detail pages

**Expected Result:** Users can customize tag presets in Settings by removing defaults and adding custom tags. Changes are reflected in the TagInput preset chips across all action and project detail pages immediately after saving.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-242: Tags Are Lowercased and Trimmed on Input
**Priority:** Medium | **Area:** Context Tags & Filtering

**Preconditions:** User is logged in. User is on an action detail page with the tag input visible.

**Steps:**
1. Click into the tag input field
2. Type ` MyTag ` (with leading and trailing spaces)
3. Press Enter
4. Verify the tag is added as a chip displaying `mytag` (lowercased and trimmed)
5. Type `URGENT`
6. Press Enter
7. Verify the tag is added as a chip displaying `urgent` (lowercased)
8. Type `  @Office  `
9. Press comma
10. Verify the tag is added as a chip displaying `@office` (lowercased and trimmed)
11. Type `Energy:HIGH`
12. Press Enter
13. Verify the tag is added as a chip displaying `energy:high` (lowercased)
14. Refresh the page
15. Verify all tags are stored and displayed in lowercase trimmed form: `mytag`, `urgent`, `@office`, `energy:high`
16. Click into the tag input and type `mytag`
17. Verify the autocomplete does not suggest `mytag` again (already exists on this item) or that adding it is prevented as a duplicate

**Expected Result:** All tags are automatically lowercased and trimmed of whitespace before being stored. Input like ` MyTag ` becomes `mytag`. This normalization happens consistently whether tags are entered via typing, presets, or autocomplete. Duplicate detection works on the normalized form.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |


## Section 18: Attachments

---

### TC-243: Upload Attachment via Button
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An action, project, or stuff item exists. User is on the detail page of that item.

**Steps:**
1. Navigate to the detail page of an existing action (or project or stuff item).
2. Locate the attachments section on the detail page.
3. Click the "Attach a file..." button.
4. In the file picker dialog, select a valid file (e.g., a 500 KB PNG image).
5. Observe the upload progress indicator.
6. Wait for the upload to complete.

**Expected Result:** A file picker dialog opens upon clicking the button. After selecting a file, a progress bar or spinner is displayed during the upload. Once complete, the file appears in the attachment list with its name, size, file type icon, and action buttons (download, delete). No error toast is shown.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-244: Upload Attachment via Drag-Drop
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An action, project, or stuff item exists. User is on the detail page of that item. A file is accessible on the desktop or file manager.

**Steps:**
1. Navigate to the detail page of an existing action.
2. Open a file manager window alongside the browser.
3. Select a file (e.g., a 200 KB PDF document) from the file manager.
4. Drag the file over the attachment section of the detail page.
5. Observe the drop zone visual feedback (highlight or border change).
6. Drop the file onto the attachment section.
7. Observe the upload progress indicator.
8. Wait for the upload to complete.

**Expected Result:** When dragging over the attachment section, a visual drop zone indicator appears (e.g., dashed border or highlighted area). After dropping, a progress bar or spinner is displayed during upload. Once complete, the file appears in the attachment list with correct metadata. No error toast is shown.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-245: Attachment Display
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with at least three attachments of different types: an image (PNG), a document (PDF), and a large file (e.g., 2.5 MB ZIP).

**Steps:**
1. Navigate to the detail page of the item with attachments.
2. Locate the attachments section.
3. For each attachment, verify the file type icon corresponds to the MIME type (e.g., image icon for PNG, document icon for PDF, archive icon for ZIP).
4. Verify each attachment displays a truncated file name if the name is long (hover to see full name via tooltip).
5. Verify each attachment displays the file size in human-readable format (B for bytes, KB for kilobytes, MB for megabytes, GB for gigabytes).
6. On desktop, hover over an attachment and verify the download button appears.
7. On desktop, hover over an attachment and verify the delete button appears.
8. On a touch device (or using device emulation), verify download and delete buttons are always visible without hover.

**Expected Result:** Each attachment row displays a MIME-based file type icon, a truncated file name (with tooltip for full name), a human-readable file size, and action buttons. On desktop, download and delete buttons appear on hover. On touch devices, these buttons are always visible.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-246: Attachment Preview - Image
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with an image attachment (e.g., PNG, JPG, or GIF).

**Steps:**
1. Navigate to the detail page of the item with the image attachment.
2. Click on the image attachment file name or thumbnail.
3. Observe the preview modal that opens.
4. Verify the image is rendered within the modal.
5. Verify the modal can be closed by clicking the close button, clicking outside the modal, or pressing Escape.

**Expected Result:** A preview modal opens displaying the image rendered at an appropriate size within the viewport. The modal has a close mechanism. The image is clearly visible and not distorted.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-247: Attachment Preview - PDF
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with a PDF attachment.

**Steps:**
1. Navigate to the detail page of the item with the PDF attachment.
2. Click on the PDF attachment file name.
3. Observe the preview behavior.
4. Verify the PDF is rendered in the browser (either in a modal with embedded viewer or in a new browser tab).

**Expected Result:** The PDF is rendered and viewable in the browser. The user can scroll through pages of the PDF. The content is legible and correctly displayed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-248: Attachment Preview - Text/JSON
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with a plain text file (.txt) and a JSON file (.json) as attachments.

**Steps:**
1. Navigate to the detail page of the item with the text and JSON attachments.
2. Click on the text file attachment.
3. Verify the plain text content is displayed in a preview modal or viewer.
4. Close the preview.
5. Click on the JSON file attachment.
6. Verify the JSON content is displayed as plain text in a preview modal or viewer.

**Expected Result:** Both text and JSON files are displayed as plain text content in a readable format. The content is not corrupted or truncated. The preview can be closed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-249: Download Attachment
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with at least one attachment.

**Steps:**
1. Navigate to the detail page of the item with an attachment.
2. On desktop, hover over the attachment to reveal action buttons.
3. Click the download button on the attachment.
4. Observe the browser's download behavior.
5. Verify the file is downloaded to the local machine.
6. Open the downloaded file and verify it is not corrupted.

**Expected Result:** Clicking the download button triggers a browser file download. The downloaded file has the correct file name, correct file size, and is not corrupted. The file opens successfully in an appropriate application.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-250: Delete Attachment
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with at least one attachment.

**Steps:**
1. Navigate to the detail page of the item with an attachment.
2. Note the current number of attachments displayed.
3. On desktop, hover over the attachment to reveal the delete button.
4. Click the delete button.
5. Verify a confirmation dialog appears asking to confirm deletion.
6. Click "Cancel" and verify the attachment is still present.
7. Click the delete button again.
8. In the confirmation dialog, click "Confirm" (or "Delete").
9. Observe the attachment list immediately.

**Expected Result:** A confirmation dialog appears before deletion. Cancelling preserves the attachment. Confirming removes the attachment optimistically (immediately removed from the UI before the server responds). The attachment count decreases by one. A success toast may appear confirming deletion. Refreshing the page confirms the attachment is permanently removed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-251: Upload File Exceeding 50MB Limit
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An item detail page is open. A file larger than 50 MB is available on the local machine.

**Steps:**
1. Navigate to the detail page of an existing action.
2. Click the "Attach a file..." button.
3. Select a file that is larger than 50 MB (e.g., a 60 MB video file).
4. Observe the application behavior immediately after selection.

**Expected Result:** The upload is rejected on the client side before any network request is made. An error toast or inline error message is displayed indicating the file exceeds the maximum allowed size (e.g., "File too large. Maximum size is 50 MB."). No upload progress bar appears. The attachment list remains unchanged.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-252: Attachment Limit of 10
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with exactly 9 attachments already uploaded.

**Steps:**
1. Navigate to the detail page of the item with 9 attachments.
2. Verify the attachment count displays "9 / 10".
3. Upload a 10th attachment via the "Attach a file..." button.
4. Wait for the upload to complete.
5. Verify the attachment count now displays "10 / 10".
6. Verify a notice appears stating "Attachment limit reached (10/10)" or similar.
7. Verify the "Attach a file..." button is hidden or disabled.
8. Verify the drag-drop zone is no longer active.
9. Attempt to upload an 11th file by any means available.

**Expected Result:** After the 10th attachment is uploaded, the count displays "10 / 10". A notice indicates the attachment limit has been reached. Upload controls (button and drag-drop zone) are hidden or disabled. No further uploads can be initiated from the client side.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-253: Attachment Count Display
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item exists with varying numbers of attachments.

**Steps:**
1. Navigate to the detail page of an item with 0 attachments.
2. Verify the attachment count displays "0 / 10".
3. Upload one attachment.
4. Verify the count updates to "1 / 10".
5. Upload two more attachments.
6. Verify the count updates to "3 / 10".
7. Delete one attachment.
8. Verify the count updates to "2 / 10".

**Expected Result:** The attachment count is always visible in the format "N / 10" where N is the current number of attachments. The count updates in real time as attachments are added or removed.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-254: Attachment HTTP 409 Error
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item has reached the attachment limit of 10 on the server side, but the client UI has not yet refreshed to reflect this (e.g., another session added the 10th file).

**Steps:**
1. Open the detail page of an item that shows 9 attachments (stale client state).
2. Attempt to upload a file via the "Attach a file..." button.
3. Wait for the server to respond.
4. Observe the error handling.

**Expected Result:** The server returns HTTP 409 Conflict. The application displays an error toast with the message "Attachment limit reached" or similar. The attachment list refreshes to show the current server state (10 attachments). Upload controls become hidden or disabled.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-255: Attachment HTTP 413 Error
**Priority:** Medium | **Area:** Attachments

**Preconditions:** User is logged in. An item detail page is open. A file that passes client-side validation but exceeds server-side limits is available (e.g., exactly at the boundary or the user's storage quota is nearly full).

**Steps:**
1. Navigate to the detail page of an existing action.
2. Attempt to upload a file that the server will reject as too large (HTTP 413).
3. Wait for the server to respond.
4. Observe the error handling.

**Expected Result:** The server returns HTTP 413 Payload Too Large. The application displays an error toast with the message "File too large or storage quota exceeded" or similar. The attachment list remains unchanged. The upload controls remain available for a smaller file.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-256: Attachments on All Detail Types
**Priority:** High | **Area:** Attachments

**Preconditions:** User is logged in. At least one stuff item, one action, and one project exist.

**Steps:**
1. Navigate to the detail page of a stuff item.
2. Verify the attachments section is present.
3. Upload a file and verify it appears in the attachment list.
4. Navigate to the detail page of an action.
5. Verify the attachments section is present.
6. Upload a file and verify it appears in the attachment list.
7. Navigate to the detail page of a project.
8. Verify the attachments section is present.
9. Upload a file and verify it appears in the attachment list.

**Expected Result:** The attachments section is present and fully functional on all three detail page types: Stuff detail, Action detail, and Project detail. Upload, display, preview, download, and delete all work identically across all detail types.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 19: Comments

---

### TC-257: Add Comment - Focus and Expand Behavior
**Priority:** High | **Area:** Comments

**Preconditions:** User is logged in. An item detail page (action, project, or stuff) is open.

**Steps:**
1. Navigate to the detail page of an existing action.
2. Locate the comments section.
3. Observe the "Add a comment..." placeholder text area. Verify it appears as a single-row collapsed input.
4. Click on the "Add a comment..." placeholder.
5. Verify the textarea receives focus.
6. Verify the textarea expands from 1 row to 3 rows in height.
7. Verify "Cancel" and "Save" buttons appear below the textarea.

**Expected Result:** Clicking the placeholder focuses the textarea, which expands from a single row to three rows. Cancel and Save action buttons become visible below the textarea. The placeholder text disappears and the cursor is positioned in the textarea ready for input.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-258: Save Comment
**Priority:** High | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open. The comment textarea is focused and expanded.

**Steps:**
1. Click on the "Add a comment..." placeholder to expand the textarea.
2. Type the following text: "This is a test comment for verification purposes."
3. Click the "Save" button.
4. Observe the comment list below the input area.
5. Verify the new comment appears in the list.
6. Verify the comment displays an avatar (initial-based, circular).
7. Verify the comment displays a relative timestamp reading "Just now".
8. Verify the comment text is displayed inside a rounded bubble or card.
9. Verify the textarea collapses back to its single-row placeholder state.

**Expected Result:** The comment is saved and immediately appears in the comment list. It shows the user's initial-based avatar, the text "Just now" as the timestamp, and the comment text within a rounded bubble. The textarea resets to its collapsed placeholder state.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-259: Cancel Comment
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open.

**Steps:**
1. Click on the "Add a comment..." placeholder to expand the textarea.
2. Type the text: "This comment will be cancelled."
3. Click the "Cancel" button.
4. Verify the textarea text is cleared.
5. Verify the textarea collapses back to its single-row placeholder state.
6. Verify no new comment appears in the comment list.
7. Click on the placeholder again to expand the textarea.
8. Type the text: "This comment will also be cancelled."
9. Press the Escape key.
10. Verify the textarea text is cleared and the form collapses.

**Expected Result:** Both clicking Cancel and pressing Escape clear the textarea content and collapse the form back to its placeholder state. No comment is added to the list in either case.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-260: Comment Character Counter
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open.

**Steps:**
1. Click on the "Add a comment..." placeholder to expand the textarea.
2. Type a short text (e.g., 10 characters: "Hello test").
3. Verify a character counter is displayed showing "10 / 2000".
4. Verify the counter text is in the default (secondary) color.
5. Type additional text until the count reaches 1800 characters.
6. Verify the counter color changes to a secondary/warning color at or above 1800.
7. Continue typing until the count reaches 2000 characters.
8. Verify the counter color changes to red at or above 2000.
9. Type one more character to reach 2001.
10. Verify the counter displays "2001 / 2000" in red.
11. Verify the "Save" button is disabled.

**Expected Result:** The character counter displays "N / 2000" and updates in real time. Below 1800 characters, the counter uses the default secondary color. At 1800 and above, it changes to a warning/secondary color. At 2000 and above, it turns red. The Save button is disabled when the count exceeds 2000.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-261: Comment Display Order
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open with no existing comments.

**Steps:**
1. Add a comment with text: "First comment".
2. Wait a few seconds.
3. Add a comment with text: "Second comment".
4. Wait a few seconds.
5. Add a comment with text: "Third comment".
6. Observe the order of comments in the comment list.
7. Verify "Third comment" appears at the top of the list.
8. Verify "Second comment" appears below "Third comment".
9. Verify "First comment" appears at the bottom of the list.

**Expected Result:** Comments are displayed in reverse chronological order (newest first). The most recently added comment appears at the top of the comment list.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-262: Comment Timestamp Display
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item has comments with varying ages: one just posted, one posted a few minutes ago, one posted yesterday, one posted 5 days ago, and one posted more than a week ago (this may require pre-seeding data or waiting between comment creation).

**Steps:**
1. Navigate to the detail page of the item with multiple comments.
2. Locate the comment posted moments ago. Verify its timestamp reads "Just now".
3. Locate the comment posted a few minutes ago. Verify its timestamp reads something like "3 minutes ago".
4. Locate the comment posted yesterday. Verify its timestamp reads "Yesterday".
5. Locate the comment posted 5 days ago. Verify its timestamp reads "5 days ago".
6. Locate the comment posted more than a week ago. Verify its timestamp displays a formatted date (e.g., "Feb 20, 2026" or similar locale-appropriate format).

**Expected Result:** Timestamps use relative format for recent comments ("Just now", "X minutes ago", "Yesterday", "X days ago") and switch to a formatted absolute date for comments older than approximately one week.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-263: Comment Avatar
**Priority:** Low | **Area:** Comments

**Preconditions:** User is logged in. An item has at least one comment.

**Steps:**
1. Navigate to the detail page of the item with comments.
2. For each comment, locate the avatar displayed to the left of (or above) the comment bubble.
3. Verify the avatar is circular and approximately 28px in diameter.
4. Verify the avatar displays the user's initial(s) (e.g., first letter of the user's name or email).
5. Verify the avatar has a background color and the initial is legible against it.

**Expected Result:** Each comment displays a 28px circular avatar with the commenter's initial(s). The avatar is consistently styled across all comments.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-264: Comments Not Editable or Deletable
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item has at least one comment posted by the current user.

**Steps:**
1. Navigate to the detail page of the item with comments.
2. Hover over a comment (on desktop).
3. Verify no edit button, pencil icon, or inline edit affordance appears.
4. Verify no delete button, trash icon, or remove affordance appears.
5. Right-click on the comment text (if applicable).
6. Verify no custom context menu with edit/delete options appears.
7. Long-press on the comment (on touch device).
8. Verify no edit or delete options appear.

**Expected Result:** Comments are create-only. There are no edit or delete controls, icons, or options available on any comment regardless of interaction method (hover, click, right-click, long-press).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-265: Comment Limit of 50
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item exists with exactly 49 comments (may require pre-seeding via API or repeated manual entry).

**Steps:**
1. Navigate to the detail page of the item with 49 comments.
2. Verify the comment input is available.
3. Add a 50th comment with text: "This is the 50th comment."
4. Verify the comment is saved and appears in the list.
5. Verify a notice appears stating "Comment limit reached (50/50)" or similar.
6. Verify the "Add a comment..." input form is hidden or disabled.
7. Attempt to find any way to add a 51st comment.

**Expected Result:** After the 50th comment is added, a notice indicates the comment limit has been reached. The comment input form is hidden or disabled, preventing any further comment creation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-266: Comments on All Detail Types
**Priority:** High | **Area:** Comments

**Preconditions:** User is logged in. At least one stuff item, one action, and one project exist.

**Steps:**
1. Navigate to the detail page of a stuff item.
2. Verify the comments section is present with the "Add a comment..." placeholder.
3. Add a comment and verify it appears in the list.
4. Navigate to the detail page of an action.
5. Verify the comments section is present with the "Add a comment..." placeholder.
6. Add a comment and verify it appears in the list.
7. Navigate to the detail page of a project.
8. Verify the comments section is present with the "Add a comment..." placeholder.
9. Add a comment and verify it appears in the list.

**Expected Result:** The comments section is present and fully functional on all three detail page types: Stuff detail, Action detail, and Project detail. Adding, displaying, and all comment behaviors work identically across all detail types.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-267: Comment with Maximum Length
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open.

**Steps:**
1. Click on the "Add a comment..." placeholder to expand the textarea.
2. Paste or type exactly 2000 characters of text.
3. Verify the character counter displays "2000 / 2000".
4. Verify the counter is displayed in red (at the threshold).
5. Verify the "Save" button is still enabled.
6. Click "Save".
7. Verify the comment is saved successfully and appears in the list.
8. Click on the placeholder again to expand the textarea.
9. Paste or type exactly 2001 characters of text.
10. Verify the character counter displays "2001 / 2000" in red.
11. Verify the "Save" button is disabled.

**Expected Result:** A comment with exactly 2000 characters can be saved successfully. At 2001 characters, the Save button is disabled. The boundary is strictly enforced at 2000 characters.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-268: Comment Empty Save Prevention
**Priority:** Medium | **Area:** Comments

**Preconditions:** User is logged in. An item detail page is open.

**Steps:**
1. Click on the "Add a comment..." placeholder to expand the textarea.
2. Do not type any text (leave the textarea empty).
3. Observe the "Save" button state.
4. Verify the "Save" button is disabled.
5. Click the "Save" button (if clickable despite being disabled).
6. Verify no empty comment is added to the list.
7. Type a single space character.
8. Verify the "Save" button remains disabled (whitespace-only should not be accepted).
9. Type a valid character (e.g., "A").
10. Verify the "Save" button becomes enabled.

**Expected Result:** The Save button is disabled when the textarea is empty or contains only whitespace. No empty or whitespace-only comments can be submitted. The Save button enables only when at least one non-whitespace character is present.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 20: Settings

---

### TC-269: Settings Page Loads
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in.

**Steps:**
1. Navigate to /settings via the browser URL bar or a settings link in the application.
2. Wait for the page to fully load.
3. Verify the Account section is visible (showing email, change password option).
4. Verify the Sessions section is visible (showing active sessions list).
5. Verify the Application section is visible (showing new items position setting).
6. Verify the Tags section is visible (showing quick-add presets).
7. Verify the Calendar section is visible (showing week start, time format, business hours, business days).
8. Verify the Review section is visible (showing weekly review toggle).
9. Verify the About section is visible (showing version and debug mode toggle).

**Expected Result:** The settings page loads completely with all sections visible: Account, Sessions, Application, Tags, Calendar, Review, and About. No loading errors occur.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-270: Settings Auto-Save
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "Week starts on" setting in the Calendar section.
3. Change the value (e.g., from Monday to Sunday).
4. Observe the control immediately after changing it.
5. Verify a spinning overlay or indicator appears on or near the control.
6. Verify pointer events are disabled on the control during the save (the control should not respond to additional clicks).
7. Wait for the save to complete (spinner disappears).
8. Refresh the page.
9. Verify the setting persists with the new value.

**Expected Result:** Changing any setting triggers an immediate auto-save. A spinning overlay appears on the control during the save, and pointer events are disabled to prevent double-changes. After the save completes, the spinner disappears and the control becomes interactive again. The setting persists across page refreshes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-271: Settings Offline Fallback
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The user has previously visited /settings so localStorage contains cached settings.

**Steps:**
1. Open browser developer tools and go to the Network tab.
2. Simulate a slow network connection (e.g., throttle to "Slow 3G").
3. Navigate to /settings.
4. Observe the page immediately upon navigation.
5. Verify the settings values appear instantly from localStorage cache (no loading spinner for the entire page).
6. Wait for the API response to arrive.
7. Verify the settings values update if the API response contains different values than the cached ones.
8. Disable network throttling.

**Expected Result:** Settings load immediately from localStorage, providing instant display without waiting for the API. When the API response arrives, any differences overwrite the cached values. The user sees no blank or loading state for the settings values.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-272: Account - Email Display
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in with a known email address (e.g., testuser@example.com).

**Steps:**
1. Navigate to /settings.
2. Locate the Account section.
3. Verify the user's email address is displayed (e.g., "testuser@example.com").
4. Verify the email is displayed as read-only text (not an editable input field).
5. Attempt to click on the email text.
6. Verify no edit mode or input field appears.

**Expected Result:** The user's email is displayed as read-only text in the Account section. It cannot be edited or modified from this page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-273: Change Password - Open Modal
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "Change password" button or link in the Account section.
3. Click the "Change password" button.
4. Verify a modal dialog opens.
5. On desktop, verify the modal is centered on the screen with a maximum width of approximately 400px.
6. On mobile (or using device emulation), verify the modal opens as a full-screen overlay.
7. Verify the modal contains fields for: Current password, New password, Confirm new password.
8. Verify the modal has Submit and Cancel buttons.

**Expected Result:** Clicking "Change password" opens a modal dialog. On desktop it is centered with a max width of 400px. On mobile it is full-screen. The modal contains the required password fields and action buttons.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-274: Change Password - Success
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in. The change password modal is open. The user knows their current password.

**Steps:**
1. Open the change password modal.
2. Enter the correct current password in the "Current password" field.
3. Enter a valid new password that meets requirements in the "New password" field (e.g., "NewP@ssw0rd123").
4. Enter the same new password in the "Confirm new password" field.
5. Click the "Submit" or "Change Password" button.
6. Wait for the server response.
7. Verify a success message is displayed.
8. Verify the success message includes the count of revoked sessions (e.g., "Password changed. 2 other sessions have been revoked.").
9. Verify the modal closes.

**Expected Result:** The password is changed successfully. A success message is displayed that includes the number of revoked sessions. The modal closes. The user can log in with the new password.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-275: Change Password - Wrong Current Password
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in. The change password modal is open.

**Steps:**
1. Open the change password modal.
2. Enter an incorrect current password in the "Current password" field (e.g., "WrongPassword123").
3. Enter a valid new password in the "New password" field.
4. Enter the matching new password in the "Confirm new password" field.
5. Click the "Submit" or "Change Password" button.
6. Wait for the server response.
7. Verify an error message is displayed stating "Current password is incorrect" or similar.
8. Verify the modal remains open.
9. Verify the user can correct the current password and retry.

**Expected Result:** The server returns HTTP 401. An error message "Current password is incorrect" is displayed. The modal stays open for the user to retry with the correct current password.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-276: Change Password - Weak New Password
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The change password modal is open.

**Steps:**
1. Open the change password modal.
2. Enter the correct current password in the "Current password" field.
3. Enter a weak new password that does not meet requirements in the "New password" field (e.g., "123").
4. Enter the same weak password in the "Confirm new password" field.
5. Click the "Submit" or "Change Password" button.
6. Wait for the server response.
7. Verify an error message is displayed stating "New password does not meet requirements" or similar.
8. Verify the modal remains open.

**Expected Result:** The server returns HTTP 400. An error message "New password does not meet requirements" is displayed. The modal stays open for the user to enter a stronger password.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-277: Sessions - List Display
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in with at least two active sessions (e.g., logged in from both a desktop browser and a mobile device).

**Steps:**
1. Navigate to /settings.
2. Locate the Sessions section.
3. Verify a list of active sessions is displayed.
4. For each session, verify the following information is shown:
   a. A device icon (phone emoji for mobile, laptop emoji for desktop).
   b. The device name or browser/OS description.
   c. The IP address of the session.
   d. The "last active" time (relative or absolute timestamp).
5. Verify all known active sessions are listed.

**Expected Result:** All active sessions are displayed in a list. Each session entry shows a device icon (phone or laptop emoji), device name, IP address, and last active time.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-278: Sessions - Current Session Badge
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open with the Sessions section visible.

**Steps:**
1. Navigate to /settings.
2. Locate the Sessions section.
3. Identify the session entry corresponding to the current browser session.
4. Verify it is marked with a "Current" badge or label that visually distinguishes it from other sessions.
5. Verify no other session entries have the "Current" badge.

**Expected Result:** The current session is clearly marked with a "Current" badge. Only one session has this badge, and it corresponds to the browser/device currently being used.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-279: Sessions - End Current Session
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open with the Sessions section visible.

**Steps:**
1. Navigate to /settings.
2. Locate the current session entry (marked with "Current" badge).
3. Click the "End" button on the current session.
4. Verify a confirmation dialog appears warning that ending the current session will log the user out.
5. Click "Confirm" or the equivalent confirmation button.
6. Verify the user is logged out.
7. Verify the browser redirects to /login.

**Expected Result:** Clicking "End" on the current session shows a confirmation dialog. Confirming logs the user out and redirects them to the /login page.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-280: Sessions - End Other Session
**Priority:** High | **Area:** Settings

**Preconditions:** User is logged in with at least two active sessions. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate a session entry that is NOT marked as "Current".
3. Click the "End" button on that session.
4. Verify a confirmation dialog appears with a message indicating the session "will be signed out within the next hour" or similar.
5. Click "Confirm" or the equivalent confirmation button.
6. Verify the session is removed from the list.
7. Verify the current session remains active (the user is not logged out).
8. On the other device/browser, verify the session is eventually invalidated (within the stated timeframe).

**Expected Result:** Clicking "End" on another session shows a confirmation dialog mentioning the delayed sign-out. Confirming removes the session from the list immediately. The current session remains unaffected. The other session is revoked server-side.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-281: Sessions - End Others Bulk Action
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in with at least three active sessions. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the Sessions section.
3. Count the number of sessions listed (e.g., 3 sessions).
4. Verify an "End Others" button is visible (should appear when more than 1 session exists).
5. Click the "End Others" button.
6. Verify a confirmation dialog appears mentioning the count of sessions that will be ended (e.g., "End 2 other sessions?").
7. Click "Confirm" or the equivalent confirmation button.
8. Verify all sessions except the current one are removed from the list.
9. Verify only the current session (with "Current" badge) remains.
10. Verify the user is NOT logged out.

**Expected Result:** The "End Others" button triggers a confirmation dialog showing the count of sessions to be revoked. Confirming removes all sessions except the current one. The user remains logged in.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-282: Sessions - Error State
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The sessions API endpoint is temporarily unavailable or returns an error.

**Steps:**
1. Simulate a network failure or server error for the sessions API endpoint (e.g., block the request in DevTools or configure the server to return HTTP 500).
2. Navigate to /settings.
3. Locate the Sessions section.
4. Verify an error message is displayed (e.g., "Failed to load sessions" or similar).
5. Verify a "Retry" button is displayed alongside the error message.
6. Restore the network connection or server functionality.
7. Click the "Retry" button.
8. Verify the sessions list loads successfully.

**Expected Result:** When sessions fail to load, an error message and a "Retry" button are displayed instead of the sessions list. Clicking "Retry" attempts to reload the sessions and succeeds when the service is available.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-283: Application - New Items Position
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "New items position" setting in the Application section.
3. Set the value to "End".
4. Wait for the auto-save to complete.
5. Navigate to /inbox.
6. Add a new stuff item via Quick Add or the inbox input.
7. Verify the new item appears at the end (bottom) of the list.
8. Navigate back to /settings.
9. Change the "New items position" setting to "Beginning".
10. Wait for the auto-save to complete.
11. Navigate to /inbox.
12. Add another new stuff item.
13. Verify the new item appears at the beginning (top) of the list.

**Expected Result:** When set to "End", new items appear at the bottom of lists. When set to "Beginning", new items appear at the top of lists. The setting applies consistently across inbox, next actions, and other list views.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-284: Tags - Quick-Add Presets
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the Tags section.
3. Verify default tag presets are displayed as read-only chips (e.g., common GTD context tags).
4. Click on the tag presets area to edit.
5. Verify a TagInput component appears (or the chips become editable), allowing the user to add and remove tags.
6. Add a new tag by typing a tag name and pressing Comma or Enter.
7. Verify the new tag appears as a chip.
8. Remove an existing tag by clicking its remove (X) button.
9. Click outside the TagInput area (focus-out / blur).
10. Verify the changes are saved automatically.
11. Refresh the page and verify the updated tags persist.

**Expected Result:** Tag presets are displayed as read-only chips. Clicking activates the TagInput editor. Tags can be added (via comma or Enter) and removed (via X button). Blurring the input triggers an auto-save. Changes persist across page refreshes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-285: Calendar - Week Starts On
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open. The user has access to the calendar view.

**Steps:**
1. Navigate to /settings.
2. Locate the "Week starts on" setting in the Calendar section.
3. Set the value to "Monday".
4. Wait for the auto-save to complete.
5. Navigate to the Calendar page.
6. Verify the calendar displays Monday as the first day of the week.
7. Navigate back to /settings.
8. Change the "Week starts on" setting to "Sunday".
9. Wait for the auto-save to complete.
10. Navigate to the Calendar page.
11. Verify the calendar displays Sunday as the first day of the week.

**Expected Result:** The calendar view updates to reflect the selected first day of the week. Monday-start shows Mon-Sun ordering. Sunday-start shows Sun-Sat ordering.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-286: Calendar - Time Format
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open. The user has actions with specific times on the calendar.

**Steps:**
1. Navigate to /settings.
2. Locate the "Time format" setting in the Calendar section.
3. Set the value to "24h".
4. Wait for the auto-save to complete.
5. Navigate to the Calendar page.
6. Verify all time displays use 24-hour format (e.g., "14:00" instead of "2:00 PM").
7. Navigate back to /settings.
8. Change the "Time format" setting to "12h".
9. Wait for the auto-save to complete.
10. Navigate to the Calendar page.
11. Verify all time displays use 12-hour format with AM/PM (e.g., "2:00 PM" instead of "14:00").

**Expected Result:** Time displays throughout the calendar and time-related UI elements switch between 24-hour and 12-hour format based on the setting.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-287: Calendar - Business Hours
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "Business hours" setting in the Calendar section.
3. Set the start hour to 9 and the end hour to 17 (9 AM to 5 PM).
4. Wait for the auto-save to complete.
5. Navigate to the Calendar page (day or week view).
6. Verify hours 9:00 through 17:00 are visually highlighted or distinguished from non-business hours.
7. Verify hours outside this range (e.g., 6:00-8:59 and 17:01-22:00) are not highlighted.
8. Navigate back to /settings.
9. Change business hours to 8 start, 18 end.
10. Navigate to the Calendar page.
11. Verify the highlighted range updates to 8:00-18:00.

**Expected Result:** Business hours are visually highlighted in the calendar day/week view. The highlighted range matches the configured start and end hours. Non-business hours are visually distinct (e.g., dimmer or different background).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-288: Calendar - Business Days
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "Business days" setting in the Calendar section.
3. Verify day buttons are displayed for each day of the week (Mon-Sun or Sun-Sat).
4. Click on "Saturday" to select it as a business day (if not already selected).
5. Verify the "Saturday" button becomes highlighted (e.g., blue background).
6. Click on "Sunday" to deselect it as a business day (if currently selected).
7. Verify the "Sunday" button becomes un-highlighted.
8. Wait for the auto-save to complete.
9. Navigate to the Calendar page (week view).
10. Verify Saturday is displayed with business-day styling and Sunday with non-business-day styling.

**Expected Result:** Business day buttons toggle on click. Selected days are highlighted in blue. Deselected days are un-highlighted. The calendar view reflects the selected business days with appropriate visual styling.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-289: Review Toggle
**Priority:** Medium | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the "Weekly Review" toggle in the Review section.
3. Note the current state of the toggle (on or off).
4. If the toggle is on, observe the sidebar and verify a "Review" item is visible.
5. Toggle the "Weekly Review" to off.
6. Wait for the auto-save to complete.
7. Observe the sidebar.
8. Verify the "Review" item is no longer visible in the sidebar.
9. Toggle the "Weekly Review" back to on.
10. Wait for the auto-save to complete.
11. Verify the "Review" item reappears in the sidebar.

**Expected Result:** Toggling the Weekly Review setting on shows the "Review" item in the sidebar. Toggling it off hides the "Review" item from the sidebar. The change takes effect immediately after auto-save completes.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-290: About - Version and Debug Mode
**Priority:** Low | **Area:** Settings

**Preconditions:** User is logged in. The settings page is open.

**Steps:**
1. Navigate to /settings.
2. Locate the About section.
3. Verify a version number is displayed (e.g., "v1.0.0" or similar).
4. Locate the "Debug Mode" toggle.
5. Verify Debug Mode is off by default.
6. Toggle Debug Mode on.
7. Verify a debug overlay appears on the screen showing:
   a. Application version.
   b. Base URL (API domain).
   c. Auth state (logged in/out, token info).
   d. Window dimensions (width x height).
8. Resize the browser window and verify the window dimensions update in real time.
9. Toggle Debug Mode off.
10. Verify the debug overlay disappears.

**Expected Result:** The About section displays the application version. Enabling Debug Mode shows a persistent overlay with version, base URL, auth state, and window dimensions. The overlay updates dynamically. Disabling Debug Mode removes the overlay.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 21: Quick Add

---

### TC-291: Quick Add Collapsed State
**Priority:** High | **Area:** Quick Add

**Preconditions:** User is logged in. The application is in its default state (Quick Add is not expanded).

**Steps:**
1. Log in and navigate to any page within the application.
2. Locate the Quick Add button in the top navigation bar.
3. Verify the button displays a "+" icon.
4. Verify the button displays the label "Quick Add" next to the icon.
5. On mobile (or using device emulation with a narrow viewport), verify the "Quick Add" text label is hidden and only the "+" icon is visible.
6. On desktop (wide viewport), verify both the "+" icon and the "Quick Add" label are visible.

**Expected Result:** The Quick Add button is present in the top nav with a "+" icon. On desktop, the "Quick Add" label is visible alongside the icon. On mobile, only the "+" icon is shown (label hidden to save space).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-292: Quick Add Expand
**Priority:** High | **Area:** Quick Add

**Preconditions:** User is logged in. Quick Add is in collapsed state.

**Steps:**
1. Locate the Quick Add button in the top navigation bar.
2. Click the Quick Add button.
3. Verify an input field appears (expanding from or replacing the button).
4. Verify the input field receives focus automatically (cursor is blinking inside the input).
5. Verify a placeholder text is shown in the input (e.g., "What's on your mind?" or similar).

**Expected Result:** Clicking the Quick Add button reveals a text input field that is auto-focused. The input has placeholder text and is ready for the user to type immediately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-293: Quick Add Submit
**Priority:** High | **Area:** Quick Add

**Preconditions:** User is logged in. Quick Add is expanded and the input field is focused.

**Steps:**
1. Click the Quick Add button to expand it.
2. Type a title for a new item: "Buy groceries for dinner".
3. Press the Enter key.
4. Verify the input field clears (text is removed).
5. Verify the input field remains expanded and focused (stays open for multi-capture).
6. Navigate to /inbox.
7. Verify the item "Buy groceries for dinner" appears in the inbox list.
8. Navigate back to the previous page.
9. Type another title: "Call the dentist".
10. Press Enter.
11. Navigate to /inbox.
12. Verify "Call the dentist" also appears in the inbox.

**Expected Result:** Pressing Enter submits the item title, which is added to the inbox as a new stuff item. The input clears but remains expanded and focused, allowing the user to quickly add multiple items in succession without re-opening Quick Add.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-294: Quick Add Collapse
**Priority:** Medium | **Area:** Quick Add

**Preconditions:** User is logged in. Quick Add is expanded and the input field is focused.

**Steps:**
1. Click the Quick Add button to expand it.
2. Type some text: "Partial text".
3. Press the Escape key.
4. Verify the input text is cleared.
5. Verify the Quick Add collapses back to its button state.
6. Click the Quick Add button to expand it again.
7. Type some text: "More partial text".
8. Click somewhere outside the Quick Add input (blur the input).
9. Verify the input text is cleared.
10. Verify the Quick Add collapses back to its button state.
11. Navigate to /inbox and verify neither "Partial text" nor "More partial text" was added.

**Expected Result:** Both pressing Escape and blurring the input cause the Quick Add to collapse and clear any entered text. No item is created from the unsaved text.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-295: Quick Add Mobile Layout
**Priority:** Medium | **Area:** Quick Add

**Preconditions:** User is logged in. Viewing the application on a mobile device or using browser device emulation with a mobile viewport width (e.g., 375px).

**Steps:**
1. On a mobile viewport, locate the Quick Add "+" button in the top nav.
2. Tap the "+" button.
3. Verify the input field expands to fill the full width of the top navigation bar.
4. Verify the expanded input appears as a fixed-positioned overlay within the top nav area.
5. Verify the input is auto-focused and the keyboard opens (on a real device).
6. Type a title and press Enter (or the keyboard submit button).
7. Verify the item is added and the input clears.
8. Press Escape or tap outside to collapse.
9. Verify the Quick Add returns to its collapsed "+" icon state.

**Expected Result:** On mobile, the Quick Add input expands to fill the entire top navigation width as a fixed-positioned overlay. It functions correctly for adding items and collapses properly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-296: Quick Add from Any Page
**Priority:** High | **Area:** Quick Add

**Preconditions:** User is logged in.

**Steps:**
1. Navigate to /next (Next Actions page).
2. Use Quick Add to add an item titled "Quick add from next page".
3. Navigate to /inbox and verify "Quick add from next page" appears there.
4. Navigate to /projects (Projects page).
5. Use Quick Add to add an item titled "Quick add from projects page".
6. Navigate to /inbox and verify "Quick add from projects page" appears there.
7. Navigate to /calendar (Calendar page).
8. Use Quick Add to add an item titled "Quick add from calendar page".
9. Navigate to /inbox and verify "Quick add from calendar page" appears there.
10. Navigate to /settings.
11. Use Quick Add to add an item titled "Quick add from settings page".
12. Navigate to /inbox and verify "Quick add from settings page" appears there.

**Expected Result:** Regardless of which page the user is on, Quick Add always creates a new stuff item in the inbox. Items do not appear in the current page's list (unless the current page is the inbox) -- they always go to inbox as raw unclarified stuff.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 22: Drag & Drop

---

### TC-297: Within-List Reorder - Desktop
**Priority:** High | **Area:** Drag & Drop

**Preconditions:** User is logged in on a desktop browser. A list (e.g., inbox) contains at least 3 items.

**Steps:**
1. Navigate to /inbox (or /next, /today, or another list view).
2. Verify there are at least 3 items: Item A (position 1), Item B (position 2), Item C (position 3).
3. Click and hold on Item A's drag handle (or the item itself if the entire row is draggable).
4. Drag Item A downward to position 3 (below Item C).
5. During the drag, verify a ghost placeholder appears at the target position indicating where the item will be placed.
6. During the drag, verify a smooth animation occurs (approximately 150ms transition).
7. Release the mouse button to drop Item A at position 3.
8. Verify the new order is: Item B (position 1), Item C (position 2), Item A (position 3).
9. Refresh the page.
10. Verify the new order persists after refresh (the reorder was saved to the server).

**Expected Result:** Dragging an item within a list smoothly animates (150ms) and shows a ghost placeholder at the drop position. The new order is applied immediately and persisted to the server.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-298: Within-List Reorder - Touch
**Priority:** High | **Area:** Drag & Drop

**Preconditions:** User is logged in on a touch device (or using touch emulation). A list contains at least 3 items.

**Steps:**
1. Navigate to /inbox (or another list view) on a touch device.
2. Verify there are at least 3 items in the list.
3. Long-press (touch and hold for at least 150ms) on an item.
4. After the long-press delay, verify the item enters drag mode (visual feedback such as lifting or shadow).
5. While still touching, drag the item to a new position.
6. Verify the ghost placeholder and animation work similarly to desktop.
7. Release the touch to drop the item.
8. Verify the item is in its new position.
9. Refresh the page and verify the new order persists.

**Expected Result:** Long-pressing (150ms delay) on a touch device initiates drag mode. The item can be dragged to a new position with visual feedback. The reorder is saved and persists after refresh.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-299: Cross-Component Drag to Sidebar Destinations
**Priority:** High | **Area:** Drag & Drop

**Preconditions:** User is logged in on desktop. The sidebar is visible. A list (e.g., inbox) contains at least one item.

**Steps:**
1. Navigate to /inbox.
2. Click and hold on an item in the list.
3. Drag the item to the "Next" item in the sidebar.
4. Verify the sidebar "Next" item highlights as a valid drop target.
5. Drop the item on "Next".
6. Verify the item is removed from the inbox and moved to the Next Actions list.
7. Navigate to /next and verify the item appears there.
8. Repeat the process by dragging an item from a list to "Today" in the sidebar. Verify the item moves to Today.
9. Repeat by dragging an item to "Someday" in the sidebar. Verify the item moves to Someday.
10. Repeat by dragging an item to "Completed" in the sidebar. Verify the item is marked as completed.
11. Repeat by dragging an item to "Trash" in the sidebar. Verify the item is moved to trash.

**Expected Result:** Items can be dragged from any list and dropped onto sidebar navigation items (Next, Today, Someday, Completed, Trash) to move or transition the item accordingly. The sidebar item highlights as a valid drop target during hover.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-300: Cross-Component Drag to Calendar Sidebar
**Priority:** Medium | **Area:** Drag & Drop

**Preconditions:** User is logged in on desktop. The sidebar is visible. A list contains at least one item.

**Steps:**
1. Navigate to /inbox or /next.
2. Click and hold on an item in the list.
3. Drag the item to the "Calendar" item in the sidebar.
4. Verify the sidebar "Calendar" item highlights as a valid drop target.
5. Drop the item on "Calendar".
6. Verify a date/time modal opens, prompting the user to select a date and optionally a time for the item.
7. Select a date (e.g., tomorrow) and optionally a time (e.g., 10:00 AM).
8. Confirm the selection.
9. Verify the item is moved to the calendar with the specified date/time.
10. Navigate to /calendar and verify the item appears on the selected date.

**Expected Result:** Dropping an item on the Calendar sidebar item opens a date/time selection modal. After selecting a date and confirming, the item is assigned that date and appears in the calendar view.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-301: Cross-Component Drag to Waiting For Sidebar
**Priority:** Medium | **Area:** Drag & Drop

**Preconditions:** User is logged in on desktop. The sidebar is visible. A list contains at least one item.

**Steps:**
1. Navigate to /inbox or /next.
2. Click and hold on an item in the list.
3. Drag the item to the "Waiting For" item in the sidebar.
4. Verify the sidebar "Waiting For" item highlights as a valid drop target.
5. Drop the item on "Waiting For".
6. Verify a waiting-for modal opens, prompting the user to specify who/what the item is waiting for.
7. Fill in the waiting-for details (e.g., "John to review the proposal").
8. Confirm the selection.
9. Verify the item is moved to the Waiting For list with the specified delegation info.

**Expected Result:** Dropping an item on the Waiting For sidebar item opens a modal for specifying waiting-for details. After confirming, the item is assigned the waiting_for attribute and appears in the Waiting For view.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-302: Cross-Component Drag to Projects Sidebar
**Priority:** Medium | **Area:** Drag & Drop

**Preconditions:** User is logged in on desktop. The sidebar is visible. A list contains at least one item.

**Steps:**
1. Navigate to /inbox or /next.
2. Click and hold on an item in the list.
3. Drag the item to the "Projects" item in the sidebar.
4. Verify the sidebar "Projects" item highlights as a valid drop target.
5. Drop the item on "Projects".
6. Verify an outcome modal opens, prompting the user to define the project outcome or select an existing project.
7. Enter a project outcome (e.g., "Plan team offsite").
8. Confirm the selection.
9. Verify the item is transformed into or associated with a project.
10. Navigate to /projects and verify the project appears.

**Expected Result:** Dropping an item on the Projects sidebar item opens an outcome modal for defining or selecting a project. After confirming, the item is associated with the project and appears in the Projects view.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-303: Cross-Component Drag to Reference Sidebar
**Priority:** Medium | **Area:** Drag & Drop

**Preconditions:** User is logged in on desktop. The sidebar is visible. The inbox contains at least one stuff item and the next list contains at least one action.

**Steps:**
1. Navigate to /inbox.
2. Click and hold on a stuff item.
3. Drag the stuff item to the "Reference" item in the sidebar.
4. Verify the sidebar "Reference" item highlights as a valid drop target.
5. Drop the stuff item on "Reference".
6. Verify the stuff item is accepted and moved to the Reference view.
7. Navigate to /reference and verify the item appears there.
8. Navigate to /next.
9. Click and hold on an action item.
10. Drag the action item to the "Reference" item in the sidebar.
11. Verify the drop is rejected (e.g., the "Reference" item does not highlight, or a visual rejection indicator appears).
12. Release the item.
13. Verify the action item remains in its original position in the next list.

**Expected Result:** Stuff items can be dragged to Reference and are accepted. Action items dragged to Reference are rejected because actions are actionable items and cannot be stored as reference material. The rejection is visually indicated.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-304: Drag Hint on First Visit
**Priority:** Low | **Area:** Drag & Drop

**Preconditions:** User is logged in. The user has never visited the inbox (or the specific list page) before (fresh account or cleared localStorage).

**Steps:**
1. Clear localStorage for the application (or use a fresh account).
2. Navigate to /inbox (or another list page with items).
3. Verify a "Drag to reorder" hint overlay appears.
4. Verify the hint includes a wiggle animation on one of the list items (demonstrating the drag gesture).
5. Observe the hint for a few seconds.
6. Verify the hint is non-blocking (does not prevent interaction with the list).

**Expected Result:** On the first visit to a list page, a "Drag to reorder" hint overlay appears with a wiggle animation demonstrating the drag-and-drop gesture. The hint does not block user interaction.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-305: Drag Hint Dismissed After First Drag
**Priority:** Low | **Area:** Drag & Drop

**Preconditions:** User is logged in. The drag hint overlay is visible on a list page.

**Steps:**
1. Navigate to a list page where the drag hint is visible (first visit).
2. Verify the drag hint overlay is displayed.
3. Perform a drag operation (click and hold an item, drag it to a new position, and drop it).
4. Verify the drag hint overlay disappears after the first successful drag.
5. Navigate away from the page and return.
6. Verify the drag hint does not reappear.
7. Open browser DevTools and inspect localStorage.
8. Verify a key exists indicating the hint has been dismissed for this list type.
9. Navigate to a different list page (e.g., /next if the hint was on /inbox).
10. Verify the drag hint appears on this new list page (hints are per list type).

**Expected Result:** The drag hint is dismissed after the first drag operation and the dismissal is persisted to localStorage per list type. The hint does not reappear on the same list type but still appears on other list types that have not yet been used.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-306: Overdue Item Highlighting
**Priority:** High | **Area:** Drag & Drop

**Preconditions:** User is logged in. An action exists with a due_date set to a date in the past (e.g., yesterday).

**Steps:**
1. Navigate to /next (or any list view where the overdue action appears).
2. Locate the overdue action item.
3. Verify the item has a red left border (visually distinct from non-overdue items).
4. Verify the item has a light red background.
5. Navigate to /today.
6. Verify the same overdue item displays with the red left border and light red background.
7. Navigate to /calendar.
8. Verify the overdue item is highlighted similarly in the calendar view.
9. Create a new action with a due_date set to tomorrow.
10. Verify this future-dated action does NOT have the red left border or light red background.

**Expected Result:** Actions with a due_date in the past are visually highlighted with a red left border and light red background across all list views. Actions with future due dates are not highlighted.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 23: Public Pages

---

### TC-307: Landing Page - Hero Section
**Priority:** High | **Area:** Public Pages

**Preconditions:** User is not logged in (or logged out). Browser is open.

**Steps:**
1. Navigate to / (the root URL of the application).
2. Verify the landing page loads.
3. Verify a hero section is displayed at the top with a dark background.
4. Verify the hero heading reads: "Capture. Clarify. Organize. Reflect. Engage." (or the exact configured heading text).
5. Verify a subtitle is displayed below the heading describing the product.
6. Verify two CTA (call-to-action) buttons are present: "Start Free" and "Learn More".
7. Click "Start Free" and verify it navigates to the registration or sign-up page.
8. Navigate back to /.
9. Click "Learn More" and verify it scrolls down to or navigates to a section with more information.

**Expected Result:** The landing page hero section has a dark background, the heading "Capture. Clarify. Organize. Reflect. Engage.", a subtitle, and two CTA buttons ("Start Free" and "Learn More") that function correctly.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-308: Landing Page - How It Works Section
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll down to the "How It Works" section.
2. Verify a 3-step flow is displayed: Capture, Clarify, and Engage (or equivalent step names).
3. Verify each step has a numbered circle (1, 2, 3).
4. On desktop, verify the steps are arranged horizontally with a connector line between them.
5. On mobile (or narrow viewport), verify the steps are arranged vertically.
6. Verify each step has a brief description text.

**Expected Result:** The "How It Works" section displays a 3-step flow (Capture, Clarify, Engage) with numbered circles. On desktop, steps are horizontal with connector lines. On mobile, steps are vertical.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-309: Landing Page - Features Section
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll down to the Features section.
2. Verify 9 feature cards are displayed.
3. Verify each feature card has an icon and a title/description.
4. On desktop (wide viewport), verify the cards are in a 3-column grid layout.
5. On tablet (medium viewport), verify the cards are in a 2-column grid layout.
6. On mobile (narrow viewport), verify the cards are in a single-column layout.

**Expected Result:** Nine feature cards are displayed with icons in a responsive grid: 3 columns on desktop, 2 columns on tablet, and 1 column on mobile.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-310: Landing Page - Why Us Section
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll down to the "Why Us" section.
2. Verify 3 items are displayed:
   a. "Pure GTD" - emphasizing adherence to GTD methodology.
   b. "Minimalist Design" - emphasizing simplicity.
   c. "Cross-Platform" - emphasizing multi-device support.
3. Verify each item has a heading and a brief description.

**Expected Result:** The "Why Us" section displays three value propositions: Pure GTD, Minimalist Design, and Cross-Platform, each with a heading and description.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-311: Landing Page - Testimonial Section
**Priority:** Low | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll down to the testimonial or founder's quote section.
2. Verify a quote is displayed in a styled block (e.g., large quotation marks, italicized text, or a card).
3. Verify the quote is attributed to the founder (name and/or title displayed).

**Expected Result:** A founder's quote section is displayed with a styled quote block and attribution.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-312: Landing Page - Book Section
**Priority:** Low | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll down to the book section.
2. Verify an image of the GTD book cover is displayed.
3. Verify a link or button labeled "Get the Book on Amazon" (or similar) is present.
4. Click the "Get the Book on Amazon" link.
5. Verify it opens in a new tab and navigates to the Amazon product page for the GTD book.

**Expected Result:** The book section displays the GTD book cover image and a link to Amazon. Clicking the link opens the Amazon page in a new tab.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-313: Landing Page - CTA Banner
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** User is on the landing page /.

**Steps:**
1. Navigate to / and scroll to the bottom of the page (above the footer).
2. Verify a blue banner section is displayed.
3. Verify the banner contains the text "Ready to Get Things Done?" or similar call-to-action heading.
4. Verify a "Start Free" button is present on the banner.
5. Click the "Start Free" button.
6. Verify it navigates to the registration or sign-up page.

**Expected Result:** A blue CTA banner is displayed near the bottom of the landing page with the heading "Ready to Get Things Done?" and a "Start Free" button that navigates to registration.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-314: Pricing Page - Monthly/Yearly Toggle
**Priority:** High | **Area:** Public Pages

**Preconditions:** User is not logged in (or logged out). Browser is open.

**Steps:**
1. Navigate to /pricing.
2. Verify the pricing page loads.
3. Verify a Monthly/Yearly toggle is present at the top of the pricing section.
4. Verify the default selection is "Yearly".
5. Verify a "Save 20%" badge is displayed near the Yearly option.
6. Note the prices displayed for each tier (they should reflect yearly pricing).
7. Toggle to "Monthly".
8. Verify the prices update to reflect monthly pricing (higher per-month cost).
9. Verify the "Save 20%" badge remains visible (indicating the savings on yearly).
10. Toggle back to "Yearly".
11. Verify the prices revert to yearly pricing.

**Expected Result:** The pricing page defaults to Yearly billing with a "Save 20%" badge. Toggling between Monthly and Yearly updates the displayed prices accordingly. The toggle is smooth and prices update immediately.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-315: Pricing Page - Three Tiers
**Priority:** High | **Area:** Public Pages

**Preconditions:** User is on the pricing page /pricing.

**Steps:**
1. Navigate to /pricing.
2. Verify 3 pricing tiers are displayed: Free, Pro, and Business.
3. For the Free tier:
   a. Verify the price is displayed as $0 or "Free".
   b. Verify a list of included features is shown.
   c. Verify a CTA button is present (e.g., "Get Started").
4. For the Pro tier:
   a. Verify the price is displayed with the correct monthly or yearly amount.
   b. Verify it is marked as "Most Popular" with a visual badge or highlight.
   c. Verify a list of included features is shown (more than Free).
   d. Verify a CTA button is present (e.g., "Start Free Trial" or "Subscribe").
5. For the Business tier:
   a. Verify the price is displayed with the correct monthly or yearly amount.
   b. Verify a list of included features is shown (more than Pro).
   c. Verify a CTA button is present (e.g., "Contact Sales" or "Subscribe").
6. Click each CTA button and verify it navigates to the appropriate page (signup, checkout, or contact).

**Expected Result:** Three pricing tiers (Free, Pro, Business) are displayed with correct prices, feature lists, and CTA buttons. The Pro tier is marked as "Most Popular".

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-316: Pricing Page - Feature Comparison Table
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** User is on the pricing page /pricing.

**Steps:**
1. Navigate to /pricing and scroll down to the feature comparison section.
2. Verify a comparison table is displayed.
3. Verify the table has 16 rows of features.
4. Verify each row shows the feature name and availability across Free, Pro, and Business tiers (e.g., checkmarks, dashes, or specific values).
5. On desktop, verify the comparison is displayed as a full table with columns for each tier.
6. On mobile (or narrow viewport), verify the comparison is displayed as cards (one card per feature showing availability across tiers).
7. Verify all 16 feature rows are visible (scrolling if necessary).

**Expected Result:** A 16-row feature comparison is displayed. On desktop, it renders as a full table. On mobile, it renders as per-feature cards. All features and their tier availability are clearly indicated.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-317: Help Page
**Priority:** Low | **Area:** Public Pages

**Preconditions:** Browser is open.

**Steps:**
1. Navigate to /help.
2. Verify the page loads.
3. Verify a heading "Help & Resources" (or similar) is displayed.
4. Verify a placeholder message "Coming soon." is displayed.
5. Verify no broken layout or error states.

**Expected Result:** The help page displays a "Help & Resources" heading and a "Coming soon." placeholder message. The page is properly styled with no layout issues.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-318: Legal Pages
**Priority:** Medium | **Area:** Public Pages

**Preconditions:** Browser is open.

**Steps:**
1. Navigate to /legal/terms.
2. Verify the Terms of Service page loads with placeholder content.
3. Verify the page has a proper heading (e.g., "Terms of Service").
4. Navigate to /legal/privacy.
5. Verify the Privacy Policy page loads with placeholder content.
6. Verify the page has a proper heading (e.g., "Privacy Policy").
7. Navigate to /legal (without specifying terms or privacy).
8. Verify the browser redirects to /legal/terms.
9. Verify the URL in the address bar reads /legal/terms after redirect.

**Expected Result:** /legal/terms and /legal/privacy load with placeholder content and proper headings. Navigating to /legal redirects to /legal/terms.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 24: Shared UI Behaviors

---

### TC-319: Error Toast
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in.

**Steps:**
1. Trigger an error condition (e.g., disconnect from the network and attempt an action, or call an invalid API endpoint).
2. Verify a red toast notification appears at the bottom of the screen.
3. Verify the toast contains an error message describing the issue.
4. Wait 5 seconds without interacting with the toast.
5. Verify the toast auto-dismisses after approximately 5 seconds.
6. Trigger another error.
7. When the red toast appears, click on it immediately.
8. Verify the toast dismisses immediately upon click (before the 5-second timeout).

**Expected Result:** Error toasts appear in red at the bottom of the screen with a descriptive message. They auto-dismiss after 5 seconds or can be dismissed immediately by clicking.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-320: Success Toast
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. At least one action item exists.

**Steps:**
1. Navigate to /next.
2. Complete an action item (e.g., click the checkbox).
3. Verify a green toast notification appears at the bottom of the screen.
4. Verify the toast contains a success message (e.g., "Item completed" or similar).
5. Wait 3 seconds.
6. Verify the toast auto-dismisses after approximately 3 seconds.

**Expected Result:** Success toasts appear in green at the bottom of the screen with a success message. They auto-dismiss after 3 seconds.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-321: Toast Maximum of 5
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A way to trigger multiple errors rapidly exists (e.g., multiple failed API calls).

**Steps:**
1. Rapidly trigger more than 5 errors in quick succession (e.g., by making multiple failing requests).
2. Observe the toast area at the bottom of the screen.
3. Count the number of visible toasts.
4. Verify that no more than 5 toasts are visible at any one time.
5. Verify that the oldest toast is dropped (removed) when a 6th toast is triggered.

**Expected Result:** A maximum of 5 toasts are displayed simultaneously. When a new toast exceeds the limit, the oldest toast is removed to make room.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-322: Toast Deduplication
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A way to trigger the same error twice exists.

**Steps:**
1. Trigger a specific error (e.g., a network timeout error) that produces a toast with a specific message.
2. Verify one toast appears with that message.
3. Immediately trigger the exact same error again (same message text).
4. Verify that only one toast with that message remains visible (no duplicate toast added).
5. Trigger a different error with a different message.
6. Verify a second, distinct toast appears alongside the first.

**Expected Result:** Duplicate toasts with the same message are deduplicated -- only one instance of the same message is shown. Different messages create separate toasts.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-323: Toast Positioning and Animation
**Priority:** Low | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in.

**Steps:**
1. Trigger an error to display a toast.
2. Verify the toast appears at the bottom-center of the screen.
3. Verify the toast is fixed-positioned (scrolling the page does not move the toast).
4. Observe the toast entrance animation.
5. Verify the toast slides in from below and fades in simultaneously.
6. Wait for the toast to auto-dismiss.
7. Observe the exit animation.
8. Verify the toast fades out and/or slides out smoothly.

**Expected Result:** Toasts are fixed-positioned at the bottom-center of the screen. They enter with a combined fade and slide-up animation and exit with a corresponding fade/slide-out animation.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-324: Confirmation Dialog
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. An item exists that can be deleted.

**Steps:**
1. Navigate to a list page with at least one item.
2. Trigger a delete action on an item (e.g., click the trash icon or delete button).
3. Verify a modal dialog appears.
4. Verify the modal has a title (e.g., "Delete").
5. Verify the modal has a message explaining the action (e.g., "Are you sure you want to delete this item?").
6. Verify the modal has a "Confirm" (or "Delete") button and a "Cancel" button.
7. Click "Cancel".
8. Verify the modal closes and the item is not deleted.
9. Trigger the delete action again.
10. Click "Confirm" (or "Delete").
11. Verify the modal closes and the item is deleted.

**Expected Result:** The confirmation dialog displays with a title, descriptive message, and Confirm/Cancel buttons. Cancelling preserves the item. Confirming executes the action.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-325: GTD Tips Display and Dismissal
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. The user has not previously dismissed the GTD tip for the inbox page (fresh account or cleared localStorage).

**Steps:**
1. Clear any localStorage entries related to GTD tip dismissals (or use a fresh account).
2. Navigate to /inbox.
3. Verify a GTD tip banner is displayed with a blue or grey left border.
4. Verify the tip contains instructional text relevant to the inbox (e.g., explaining GTD inbox processing).
5. Locate the dismiss button (X icon) on the tip.
6. Click the X button to dismiss the tip.
7. Verify the tip disappears.
8. Navigate away from /inbox and then return.
9. Verify the tip does not reappear (dismissal is persisted).
10. Open browser DevTools and check localStorage for a key indicating the tip was dismissed.

**Expected Result:** GTD tips appear as a banner with a colored left border and instructional text. Clicking the X dismisses the tip permanently. The dismissal is persisted to localStorage so the tip does not reappear.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-326: Inline Title Editing
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A list page with at least one item is open.

**Steps:**
1. Navigate to /inbox (or any list page with items).
2. Click on the title text of an item.
3. Verify an auto-sizing input field replaces the title text.
4. Verify the input field contains the current title text and is focused.
5. Modify the title text (e.g., append " - edited").
6. Press Enter.
7. Verify the input field reverts to the title display showing the updated text.
8. Verify the update is applied optimistically (immediately visible without waiting for server response).
9. Click on the title of another item to edit it.
10. Modify the text.
11. Click somewhere else on the page (blur the input).
12. Verify the title saves on blur.
13. Click on the title of another item to edit it.
14. Modify the text.
15. Press Escape.
16. Verify the edit is cancelled and the original title is restored.

**Expected Result:** Clicking a title activates an inline auto-sizing input. Enter and blur save the changes (optimistic update). Escape cancels the edit and restores the original title.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-327: Cursor Pagination (Load More)
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A list (e.g., inbox) contains more than 10 items.

**Steps:**
1. Add at least 15 items to the inbox.
2. Navigate to /inbox.
3. Verify the first page of items loads (up to 10 items visible).
4. Scroll to the bottom of the list.
5. Verify a "Load more" button is displayed at the bottom.
6. Click the "Load more" button.
7. Verify additional items are loaded and appended below the existing items.
8. Verify the previously loaded items remain in place (no re-rendering or jumping).
9. If more items remain, verify the "Load more" button is still visible.
10. Continue clicking "Load more" until all items are loaded.
11. Verify the "Load more" button disappears when there are no more items to load.

**Expected Result:** Lists with more than 10 items show a "Load more" button at the bottom. Clicking it loads the next page of items appended to the existing list. The button disappears when all items are loaded.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-328: Per-Item Loading Spinner
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A list page with at least one item is open.

**Steps:**
1. Navigate to /next (or any list page with items).
2. Trigger an action on an item that requires a server call (e.g., click the checkbox to complete, or click the trash icon to delete).
3. Immediately observe the item's action buttons area.
4. Verify a spinning ring (loading spinner) replaces the action buttons on that specific item.
5. Verify other items in the list are NOT affected (their action buttons remain visible and interactive).
6. Wait for the server response.
7. Verify the spinner disappears and the item is updated (moved, completed, or deleted as appropriate).

**Expected Result:** When an action is triggered on an item, a spinning ring replaces its action buttons while the request is in progress. Only the affected item shows the spinner; other items remain interactive.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-329: Empty States
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. Various lists are empty (no items in inbox, next, today, projects, etc.).

**Steps:**
1. Navigate to /inbox with no items.
2. Verify an empty state is displayed with: an icon (illustrative graphic), a message (e.g., "Your inbox is empty"), and instructional text explaining what to do.
3. Navigate to /next with no next actions.
4. Verify an appropriate empty state for the next actions list.
5. Navigate to /today with no today items.
6. Verify an appropriate empty state for the today list.
7. Navigate to /projects with no projects.
8. Verify an appropriate empty state for the projects list.
9. Navigate to /someday with no someday items.
10. Verify an appropriate empty state for the someday list.
11. Navigate to /reference with no reference items.
12. Verify an appropriate empty state for the reference list.
13. Navigate to /completed with no completed items.
14. Verify an appropriate empty state.
15. Navigate to /trash with no trash items.
16. Verify an appropriate empty state.

**Expected Result:** Each empty list page displays a visually distinct empty state with an icon, a descriptive message, and instructional text. The content is relevant to the specific list type.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-330: Overdue Highlighting in All List Views
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. An action exists with a due_date set in the past.

**Steps:**
1. Navigate to /next.
2. Locate the overdue action.
3. Verify it has a red left border.
4. Navigate to /today.
5. Locate the overdue action.
6. Verify it has a red left border.
7. Navigate to /calendar.
8. Locate the overdue action on the calendar.
9. Verify it is highlighted with overdue styling.
10. Create an action with a due_date set to today.
11. Verify this action does NOT have overdue styling (it is due today, not overdue).
12. Create an action with no due_date.
13. Verify this action does NOT have overdue styling.

**Expected Result:** Items with past due dates display a red left border in all list views (next, today, calendar). Items due today or with no due date do not receive overdue styling.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-331: Detail Page Navigation Arrows
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in. A list contains at least 4 items (e.g., inbox with items A, B, C, D in order).

**Steps:**
1. Navigate to /inbox.
2. Click on the first item (Item A) to open its detail page.
3. Verify navigation arrows are displayed: First, Prev, Next, Last.
4. Verify "First" and "Prev" are disabled (already on the first item).
5. Click "Next".
6. Verify the detail page now shows Item B.
7. Click "Next" again.
8. Verify the detail page now shows Item C.
9. Click "Last".
10. Verify the detail page now shows Item D (the last item).
11. Verify "Next" and "Last" are disabled (already on the last item).
12. Click "Prev".
13. Verify the detail page now shows Item C.
14. Click "First".
15. Verify the detail page now shows Item A.

**Expected Result:** Detail page navigation arrows (First, Prev, Next, Last) navigate sequentially through the items in the list. Boundary arrows are disabled when at the first or last item.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-332: Mobile Sidebar Drawer
**Priority:** High | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in on a mobile device or using browser device emulation with a mobile viewport.

**Steps:**
1. On a mobile viewport, verify the sidebar is not visible by default.
2. Locate the hamburger menu icon in the top navigation bar.
3. Tap the hamburger icon.
4. Verify the sidebar slides in from the left as a drawer overlay.
5. Verify a semi-transparent overlay covers the rest of the page behind the drawer.
6. Tap on a navigation item in the drawer (e.g., "Next").
7. Verify the drawer closes and the page navigates to /next.
8. Tap the hamburger icon again to open the drawer.
9. Tap on the overlay area (outside the drawer).
10. Verify the drawer closes.

**Expected Result:** On mobile, the sidebar is hidden behind a hamburger menu. Tapping the hamburger opens a slide-in drawer with a backdrop overlay. Tapping a nav item or the overlay closes the drawer.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-333: Mobile Bottom Sheets
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in on a mobile device or using browser device emulation.

**Steps:**
1. On a mobile viewport, navigate to a page with a dropdown menu or select component (e.g., a settings page with a dropdown, or a clarify panel with options).
2. Tap on the dropdown trigger.
3. Verify the options do NOT appear as a traditional dropdown positioned below the trigger.
4. Verify instead a bottom action sheet slides up from the bottom of the screen.
5. Verify the bottom sheet has a backdrop overlay.
6. Select an option from the bottom sheet.
7. Verify the bottom sheet closes and the selection is applied.
8. Open the bottom sheet again.
9. Tap the backdrop overlay.
10. Verify the bottom sheet closes without making a selection.

**Expected Result:** On mobile, dropdown menus render as bottom action sheets that slide up from the bottom of the screen with a backdrop overlay. Selecting an option or tapping the backdrop closes the sheet.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-334: Mobile Action Buttons Always Visible
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in on a touch device or using browser device emulation with touch enabled.

**Steps:**
1. On a touch device, navigate to a list page with items (e.g., /inbox).
2. Observe the action buttons on each list item (e.g., trash, clarify, complete icons).
3. Verify the action buttons are always visible on each item without requiring hover.
4. Verify on a desktop (non-touch) browser, action buttons are hidden by default and only appear on hover.
5. On the touch device, tap an action button to confirm it is functional.

**Expected Result:** On touch devices, action buttons on list items are always visible (no hover required). On desktop, action buttons appear only on hover. Both behaviors are functional.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-335: Keyboard Shortcuts
**Priority:** Medium | **Area:** Shared UI Behaviors

**Preconditions:** User is logged in on a desktop browser. Various pages and modals are accessible.

**Steps:**
1. Navigate to /inbox.
2. Open the Quick Add input.
3. Type a title and press Enter.
4. Verify the item is submitted (Enter = submit).
5. Open a modal dialog (e.g., confirmation dialog or clarify panel).
6. Press Escape.
7. Verify the modal closes (Escape = cancel/close).
8. Open the clarify panel for a stuff item.
9. If a multi-step flow, advance to the second step.
10. Press Backspace (when no text input is focused).
11. Verify the clarify panel navigates back to the previous step (Backspace = clarify back).
12. In an autocomplete or dropdown field, press the Up and Down arrow keys.
13. Verify the arrow keys navigate through the autocomplete suggestions.
14. In a tag input field, type a tag name and press Comma.
15. Verify pressing Comma commits the tag (creates a tag chip).

**Expected Result:** Keyboard shortcuts function as follows: Enter submits, Escape cancels/closes, Backspace navigates back in clarify flow, Arrow keys navigate autocomplete suggestions, Comma commits a tag in tag inputs.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

## Section 25: Public Footer

---

### TC-336: Footer Content
**Priority:** Medium | **Area:** Public Footer

**Preconditions:** User is on any public page (landing, pricing, help, or legal pages).

**Steps:**
1. Navigate to / (landing page).
2. Scroll to the bottom of the page to locate the footer.
3. Verify the footer contains the following columns/sections:
   a. **Brand**: Displays the application logo and name.
   b. **Product**: Contains links for "Features" and "Pricing".
   c. **Support**: Contains a link for "Help & FAQ".
   d. **Legal**: Contains links for "Terms" and "Privacy".
4. Verify all text is legible and properly styled.
5. Navigate to /pricing and verify the same footer appears.
6. Navigate to /help and verify the same footer appears.

**Expected Result:** The footer is present on all public pages and contains four sections: Brand (logo + name), Product (Features, Pricing), Support (Help & FAQ), and Legal (Terms, Privacy).

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-337: Footer Links
**Priority:** Medium | **Area:** Public Footer

**Preconditions:** User is on a public page with the footer visible.

**Steps:**
1. Navigate to / and scroll to the footer.
2. Click the "Features" link in the Product column.
3. Verify it navigates to the features section or page (e.g., scrolls to features on the landing page or navigates to a /features route).
4. Navigate back to the footer.
5. Click the "Pricing" link.
6. Verify it navigates to /pricing.
7. Navigate back to the footer.
8. Click the "Help & FAQ" link in the Support column.
9. Verify it navigates to /help.
10. Navigate back to the footer.
11. Click the "Terms" link in the Legal column.
12. Verify it navigates to /legal/terms.
13. Navigate back to the footer.
14. Click the "Privacy" link in the Legal column.
15. Verify it navigates to /legal/privacy.

**Expected Result:** Each footer link navigates to the correct page: Features goes to the features section/page, Pricing to /pricing, Help & FAQ to /help, Terms to /legal/terms, and Privacy to /legal/privacy.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |

---

### TC-338: Footer Responsive Layout
**Priority:** Medium | **Area:** Public Footer

**Preconditions:** User is on a public page with the footer visible. Browser DevTools is available for viewport resizing.

**Steps:**
1. Navigate to / and scroll to the footer.
2. Set the browser viewport to a desktop width (e.g., 1200px or wider).
3. Verify the footer displays 4 columns side by side (Brand, Product, Support, Legal).
4. Resize the viewport to a tablet width (e.g., 768px).
5. Verify the footer displays 2 columns (e.g., Brand + Product on one row, Support + Legal on the next row).
6. Resize the viewport to a mobile width (e.g., 375px).
7. Verify the footer displays 1 column (all sections stacked vertically).
8. Verify all content remains readable and properly spaced in each layout.

**Expected Result:** The footer is responsive: 4 columns on desktop, 2 columns on tablet, and 1 column on mobile. All content is properly aligned and readable at each breakpoint.

| Date | P/F | Comment |
|------|-----|---------|
|      |     |         |
|      |     |         |
|      |     |         |
