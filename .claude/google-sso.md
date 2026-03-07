# Google SSO & API Integration

## Google Cloud Console Setup

### 1. OAuth Consent Screen
- **APIs & Services → OAuth consent screen**
- User type: External
- App name, support email, developer email
- Scopes to add:
  - `openid`, `email`, `profile` — SSO (login)
  - `https://www.googleapis.com/auth/calendar` — Google Calendar (sensitive scope, requires verification)
  - `https://www.googleapis.com/auth/drive.file` — Google Drive (sensitive scope, requires verification)
- Add test users while in testing mode
- Publish app when ready for production

### 2. Enable APIs
- **APIs & Services → Library**
- Enable **Google Calendar API**
- Enable **Google Drive API**

### 3. Create Credentials
- **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
- Application type: Web application
- Name: "WNA Web"
- Authorized JavaScript origins:
  - `https://dev.whatsnextaction.com`
  - `https://www.whatsnextaction.com`
- Authorized redirect URIs:
  - `https://dev.whatsnextaction.com`
  - `https://www.whatsnextaction.com`
- Copy the **Client ID** (e.g., `123456789-abcdef.apps.googleusercontent.com`)

## Frontend Integration

### SSO (Login) — ID Token Flow

Used for login only. Lightweight, no extra permissions.

```js
google.accounts.id.initialize({
  client_id: 'YOUR_CLIENT_ID',
  callback: handleLogin  // receives Google ID token
})
```

### Incremental Authorization — OAuth Token Flow

Request additional permissions only when the user needs them (better UX).

```js
// Example: user clicks "Connect Calendar"
const client = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_CLIENT_ID',
  scope: 'https://www.googleapis.com/auth/calendar',
  callback: handleCalendarAccess  // receives access token
})

client.requestAccessToken()
```

Same pattern for Drive — just change the scope.

## Backend Integration

### Google Auth Hook (e.g., POST /v1/user/google-auth)

1. Receive Google ID token from frontend
2. Verify token: `GET https://oauth2.googleapis.com/tokeninfo?id_token=<token>`
3. Google responds with: `{ "email", "sub" (Google user ID), "name" }`
4. Find or create user in database by email/google_id
5. Generate app JWT pair
6. Return `{ "auth_token", "refresh_token" }` — same as normal login

### Calendar/Drive API Calls

- Frontend gets access token from Google OAuth flow
- Backend stores the access token and uses it to call Google APIs on behalf of user
- Alternative: frontend calls Google APIs directly (simpler but less secure)

## Authorization Strategy

Use **incremental authorization** — don't request all permissions at once:

1. **Login** — only SSO scopes (`openid`, `email`, `profile`)
2. **Calendar sync** — request calendar scope when user opts in
3. **Drive access** — request drive scope when user needs it

Users are more likely to approve permissions when they understand why they're needed.
