# P1 — Email to Inbox: High-Level Solution

## Context

**Email to Inbox** is a P1 Pro feature from the backend roadmap (E1-E3). Users get a unique email address; forwarding emails to it creates Stuff items in their GTD Inbox. This spec covers all three repos (wna_backend, wna_web, wna_deploy).

**Existing design notes** from `wna_backend/.claude/roadmap.md`: Zoho catch-all on `inbox.whatsnextaction.com`, IMAP poller, `stuff-{hash}@` addressing, 50 emails/day rate limit.

---

## 1. Core Concept

Every Pro and Team tier user gets a unique email address (e.g., `stuff-a3f8c1d9e4b2@inbox.whatsnextaction.com`). Anything sent to that address is automatically converted into a Stuff item in the user's Inbox — subject becomes the title, body becomes the description, attachments are preserved (within tier limits).

**GTD alignment**: David Allen's methodology starts with **Capture** — get everything out of your head and into a trusted system. Email is where a huge volume of "stuff" originates. Email to Inbox removes the friction of manual copy/paste: forward an email and it appears in your Inbox. From there, the standard Clarify flow applies — the user processes it like any other Stuff item.

**How it fits**: Purely additive. Emails create Stuff items. Stuff has no metadata — exactly like items from Quick Add. The user must Clarify them through the standard flow. Nothing about Clarify, Organize, Reflect, or Engage changes.

---

## 2. Architecture

### New Microservice: `email_service`

A full **C++ Drogon microservice**, consistent with all other WNA backend services. Runs on port **1500** internally (like user_service, core_service, etc.), exposed via router_service.

**Owns**:
- **Hash database** — `inbox_email_hash` table mapping user hashes to user IDs
- **Email log database** — `inbox_email_log` table for audit trail and idempotency
- **IMAP connection** — persistent connection to Zoho via IMAP IDLE
- **User-facing API** — generate/view/regenerate inbox email address
- **Email processing** — parsing, cleaning, creating Stuff via HMAC call to core_service

**Does NOT own**:
- Stuff items (core_service owns those — email_service creates them via HMAC)
- User data (user_service owns that — email_service looks up tier info via HMAC)

```
                     Internet
                        |
           ┌────────────┴────────────┐
           |     GCE Ingress (TLS)   |
           └──┬──────┬──────┬───┬────┘
              |      |      |   |
         web  |  router:80  | admin:80
         main |   └──┬────┘  |  └──┬──┘
              |      |       |     |
       user:1500  core:1500  |  admin:1500
           |        |        |     |
           |   email:1500 ◄──┘     |
           |     |    |            |
           |     |    └── IMAP IDLE ──► Zoho (imap.zoho.com:993)
           |     |
           └─────┴──── RabbitMQ ──► notification:1500 ──► SMTP
```

### Database: `wna_email_db`

New PostgreSQL database owned by email_service.

**Tables**:

```sql
-- User inbox email addresses
CREATE TABLE inbox_email_address (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    hash            VARCHAR(12) NOT NULL UNIQUE,
    emails_today    INTEGER NOT NULL DEFAULT 0,
    regen_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbox_email_hash ON inbox_email_address(hash);

-- Audit trail for all processed inbound emails
CREATE TABLE inbox_email_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,                          -- nullable (null if hash lookup failed)
    from_address    VARCHAR(500),
    to_address      VARCHAR(500) NOT NULL,
    subject         VARCHAR(1000),
    message_id      VARCHAR(500) NOT NULL,          -- RFC 2822 Message-ID for idempotency
    status          VARCHAR(20) NOT NULL,            -- processed, failed, rate_limited, unknown_hash
    error_detail    TEXT,
    stuff_id        UUID,                           -- set on successful stuff creation
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index: same email CC'd to multiple WNA users creates separate log entries
CREATE UNIQUE INDEX idx_inbox_email_log_msg_user ON inbox_email_log(message_id, COALESCE(user_id, id));
```

### Key Design Decisions

- **email_service owns its own domain** — hashes, email log, IMAP connection, and email processing all live in one service. Clean separation from user_service and core_service.
- **Stuff creation goes through core_service** — email_service calls core_service via HMAC to create Stuff items. Preserves ownership: core_service owns Stuff.
- **Tier info from user_service** — email_service calls user_service via HMAC to check tier, storage limits. email_service does not duplicate user data.
- **Rate counter in email_service DB** — `emails_today` on `inbox_email_address`. Checked and incremented atomically during hash lookup. Reset daily by internal cron endpoint.
- **Lazy hash generation** — not generated at registration. Generated when user first clicks "Generate Address" in Settings. Avoids entries for users who never use the feature.
- **JWT validation** — user-facing endpoints validate JWT tokens independently (using `jwt::identity` from backend_common), same as all other services. Extracts `user_id` from token subject claim.
- **Tier check on user-facing endpoints** — `generate`, `regenerate`, and `GET inbox-email` all call user_service via HMAC (`GET /internal/v1/user/{id}/tier`) to verify user is Pro/Team. Returns 403 for Free tier.
- **Drogon-native** — uses Drogon's HTTP framework for API endpoints, Trantor's TcpClient for IMAP IDLE connection, same patterns as all other services.
- **GDPR / user deletion** — email_service exposes `DELETE /internal/inbox-email/{user_id}` for user purge cascade. user_service calls this during `purge_deleted_users` cron (same pattern as notification_service cleanup).
- **Secrets in K8s Secrets** — Zoho IMAP credentials and HMAC signing key stored in secret.json (mounted from K8s Secret). Never hardcoded.

---

## 3. IMAP Client: Trantor TcpClient + mailio for MIME

### Why Custom IMAP over Trantor

No existing C++ library supports IDLE + async + production quality for Drogon:

| Library | IDLE | Async | MIME Parse | License | Maintained | Verdict |
|---------|------|-------|------------|---------|------------|---------|
| libcurl | No | Partial | No (send only) | MIT | Active | No IDLE, no MIME parsing |
| VMime | No | No | Excellent | GPL | Low | No IDLE, GPL license |
| mailio | No | No | Good | MIT | Moderate | No IDLE — but good MIME parser |
| libetpan | Yes | fd-based | Yes | BSD-3 | Dormant (2021) | IDLE works but unmaintained, risky |
| **Trantor TcpClient** | **Native fit** | **Event-loop** | Needs lib | **Built-in** | **Active** | **Best fit for Drogon** |

**Chosen approach**: **Trantor TcpClient** for IMAP transport + **mailio** (MIT, C++17, Boost) for MIME parsing.

### Trantor TcpClient for IMAP

Drogon's Trantor networking library provides an async TcpClient with TLS support. IMAP IDLE maps naturally to its event-loop callback model:

- `setMessageCallback` fires when server pushes data (IDLE notifications)
- `connection()->send()` sends IMAP commands (`IDLE\r\n`, `DONE\r\n`, `FETCH ...\r\n`)
- `enableSSL()` handles TLS for imaps:993
- Built-in reconnection support via `enableRetry()`

**IMAP commands to implement** (~1000-1500 LOC):

| Command | Purpose |
|---------|---------|
| `LOGIN` | Authenticate with Zoho |
| `SELECT INBOX` | Open mailbox |
| `SEARCH UNSEEN` | Find unprocessed messages (startup catch-up) |
| `FETCH` | Get headers + body for processing |
| `STORE +FLAGS (\Seen)` | Mark processed |
| `COPY` / `MOVE` | Move to Failed/RateLimited folders |
| `IDLE` | Enter push mode — server notifies on new mail |
| `DONE` | Exit IDLE to process new messages |
| `LOGOUT` | Clean disconnect |

**Response parser**: Handle tagged responses (`a001 OK`), untagged `* N EXISTS`, continuation `+`, and literal `{n}` blocks. Line-based text protocol.

### mailio for MIME Parsing

**mailio** (MIT license, C++17) handles MIME parsing after IMAP FETCH returns raw email content:
- Multipart message parsing (text/plain, text/html, attachments)
- Base64 and quoted-printable decoding
- Character set conversion (ISO-8859-1, Windows-1252, etc. → UTF-8)
- Attachment extraction (filename, content-type, size, binary data)

Dependencies: Boost >= 1.81, OpenSSL (both already in the backend stack).

### Fallback: libetpan

If Trantor TcpClient IMAP implementation proves too costly, **libetpan** (BSD-3) is the fallback. Has IDLE + MIME + all IMAP commands. fd-based IDLE can integrate with Drogon's event loop via `mailimap_idle_get_fd()`. Risk: dormant since 2021.

---

## 4. Email Processing Flow

### End-to-End Flow

```
1. User forwards email to stuff-a3f8c1d9e4b2@inbox.whatsnextaction.com
2. Email arrives at Zoho Mail (MX for inbox.whatsnextaction.com)
3. Zoho catch-all stores it in catchall@whatsnextaction.com mailbox
4. email_service receives IMAP IDLE notification (near real-time)
5. email_service sends DONE, then FETCH for new messages
6. email_service parses To/CC/Delivered-To headers → extracts stuff-{hash}
7. email_service looks up hash in its own DB (inbox_email_address table)
   → Gets user_id, checks rate limit, increments emails_today
8. email_service calls user_service via HMAC: GET /internal/v1/user/{id}/tier
   → Gets tier, storage_used, storage_limit, max_attachment_size
9. email_service parses email body (mailio MIME) → plain text, attachments
10. email_service calls core_service via HMAC: POST /internal/v1/stuff
    → Creates Stuff item (title=subject, description=body, source=email)
11. email_service writes inbox_email_log entry (status=processed, stuff_id)
12. email_service marks IMAP message as SEEN
13. email_service re-issues IDLE → waits for next notification
```

### Field Mapping

| Email Field | Stuff Field | Rules |
|-------------|-------------|-------|
| **Subject** | `title` | Trimmed. If empty: "(No subject)". Max 500 chars (truncated). Strip "Re:", "Fwd:", "FW:" prefixes (recursive). |
| **Body (plain text)** | `description` | Prefer `text/plain` part. If only HTML: convert to plain text (strip tags, preserve line breaks). Max 10,000 chars (truncated with "... [truncated]"). Strip email signatures and quoted reply content. |
| **Body (HTML)** | `description` | Fallback only — converted to plain text. Never stored as raw HTML. |
| **Attachments** | Stuff attachments | See Attachment Handling below. |
| **From / Date** | Not stored on Stuff | Logged in inbox_email_log for audit only. |

### Attachment Handling

| Rule | Detail |
|------|--------|
| **Tier limits apply** | Pro: max 20 MB/attachment, 250 MB total. Team: max 50 MB/attachment, 1 GB/user total. |
| **Per-email limit** | Max 10 attachments. Extras silently dropped with note in description. |
| **Oversized attachment** | Skipped. Note appended: "[Note: attachment 'file.pdf' (15 MB) skipped — exceeds your plan's limit.]" Stuff still created. |
| **Storage quota exceeded** | All attachments skipped. Note appended: "[Note: attachments skipped — storage full.]" Stuff still created. |
| **Inline images** | Content-Disposition: inline images (logos, signatures) skipped. Only Content-Disposition: attachment processed. |

### Reply Chain & Signature Stripping

Quoted content is stripped using these heuristics:
1. Lines starting with `>` (standard quoting)
2. Lines matching `On <date>, <name> wrote:` (Gmail/Apple Mail)
3. Lines matching `From: ... Sent: ... To: ... Subject:` block (Outlook)
4. Content below `-- \n` (signature delimiter)
5. Common mobile signatures ("Sent from my iPhone", "Get Outlook for")

Only the most recent message body is kept.

### CC/BCC Behavior

email_service scans `To:`, `CC:`, and `Delivered-To:` headers for matching `stuff-{hash}@inbox.whatsnextaction.com` patterns. If multiple valid hashes found (email sent to multiple WNA users), a separate Stuff item is created for each user.

### Error Handling

| Error Condition | Behavior |
|-----------------|----------|
| **Unknown hash** | Message → "Failed" folder. Log `status=unknown_hash`. No bounce sent. |
| **Rate limit exceeded** (>50/day) | Message → "RateLimited" folder. Log `status=rate_limited`. Re-checked next day. |
| **Free tier / disabled / deleted user** | Message → "Failed" folder. Log `status=failed`. |
| **core_service unavailable** | Message left UNSEEN. Retry on next IDLE cycle. After 3 retries → "Failed" folder. |
| **Malformed email** | Stuff created with "(Unparseable email)" title, empty description. Logged. |
| **Spam** | Zoho spam filter handles first-line defense. email_service only reads INBOX, ignores Spam folder. |

---

## 5. IMAP IDLE Lifecycle

### Connection Flow

```
1. Connect to Zoho IMAP (TLS via Trantor TcpClient)
2. Authenticate (LOGIN)
3. SELECT INBOX
4. SEARCH UNSEEN → process any missed messages (catch up after restart)
5. Issue IDLE → connection enters push mode
6. Server sends "* N EXISTS" when new mail arrives
7. Send DONE to exit IDLE → FETCH + process new messages
8. Re-issue IDLE → go to step 6
```

### Connection Health Management

| Concern | Strategy |
|---------|----------|
| **IDLE timeout** | RFC 2177 recommends re-issuing IDLE every 29 min. email_service sends DONE and re-issues IDLE on a 25-minute timer even if no new mail arrives. |
| **Connection drop** | Detected via Trantor socket error callback. Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 60s). Log each reconnection. |
| **Zoho maintenance** | Same as connection drop — automatic reconnection. |
| **Process crash** | K8s Deployment restarts the pod. On startup, step 4 catches up on UNSEEN messages. |
| **Liveness probe** | Drogon HTTP endpoint `/health` returns 200 if IMAP connection alive and last activity <5 min ago. K8s restarts pod if probe fails. |
| **Graceful shutdown** | On SIGTERM, send DONE → LOGOUT → exit. |

### Fallback: Polling Mode

If IMAP IDLE proves problematic with Zoho, email_service can fall back to a **polling loop**: sleep 60s → SEARCH UNSEEN → process → repeat. Same processing logic, different loop. Toggled via config flag (`IMAP_MODE=idle|poll`).

---

## 6. Infrastructure

### DNS Setup

| Record | Type | Value |
|--------|------|-------|
| `inbox.whatsnextaction.com` | MX | `mx.zoho.com` (pri 10), `mx2.zoho.com` (pri 20) |
| `inbox.whatsnextaction.com` | TXT | `v=spf1 include:zoho.com ~all` |
| `inbox.whatsnextaction.com` | TXT | Zoho DKIM key |

### Zoho Mail Configuration

| Setting | Value |
|---------|-------|
| **Domain** | `inbox.whatsnextaction.com` (alias domain in Zoho) |
| **Catch-all** | All mail to `*@inbox.whatsnextaction.com` → `catchall@whatsnextaction.com` |
| **IMAP** | Enabled for catch-all account, app-specific password for email_service |
| **Folders** | INBOX (incoming), Failed (unknown hash/errors), RateLimited (over quota) |
| **Retention** | SEEN messages deleted after 30 days |

### Environment-Specific

| Environment | Setup |
|-------------|-------|
| **Local dev** | Mailpit (SMTP :1025, Web UI :8025, IMAP :1143). email_service connects to Mailpit IMAP. Poll mode recommended (Mailpit IDLE support varies). |
| **Dev (GKE)** | Separate subdomain `inbox-dev.whatsnextaction.com`. email_service with IMAP IDLE. |
| **Production** | `inbox.whatsnextaction.com`. email_service with IMAP IDLE. |

---

## 7. Security

### Hash Generation

| Property | Detail |
|----------|--------|
| **Algorithm** | `HMAC-SHA256(user_id, INBOX_EMAIL_SECRET)` — first 12 hex chars |
| **Secret** | 64-char random hex string in K8s Secret |
| **Entropy** | 12 hex chars = 48 bits = 281 trillion values. Not brute-forceable at email delivery speeds. |
| **Format** | `stuff-{12_hex}@inbox.whatsnextaction.com` |

### Rate Limiting

| Limit | Value |
|-------|-------|
| Per user per day | 50 emails |
| Global throughput | Natural backpressure from processing speed. Excess queues in Zoho IMAP. |
| Daily reset | Cron endpoint `POST /cron/reset-daily-email-counters` resets all `emails_today` counters to 0 at midnight UTC. |

### Spam Protection

| Layer | Protection |
|-------|------------|
| Zoho spam filter | First-line. Spam → Spam folder (email_service ignores). |
| Hash obscurity | Address must be known to sender. |
| Rate limit | 50/day prevents abuse if address leaks. |
| Address regeneration | User can regenerate at any time (old immediately invalid). |
| No auto-reply | Never sends replies. Prevents backscatter and confirms nothing to spammers. |

### Address Regeneration

1. User clicks "Regenerate" → confirmation dialog
2. New hash: `HMAC-SHA256(user_id + regen_count, INBOX_EMAIL_SECRET)` — `regen_count` incremented
3. Old hash overwritten — immediately invalid
4. User must update forwarding rules

### Non-Existent Hash

Silent drop. Logged as `unknown_hash`. No bounce email (prevents enumeration).

---

## 8. UI Changes (Frontend — wna_web)

Minimal frontend changes — only the Settings page is affected.

| Area | Change |
|------|--------|
| **Settings Page** | New "Email to Inbox" section. Pro/Team: shows address + copy + regenerate. Free: locked with upgrade prompt. |

### Settings Section Detail (Pro/Team, address generated)

```
Email to Inbox
├─ Your inbox address
│   ┌─────────────────────────────────────────────────┬────────┐
│   │ stuff-a3f8c1d9e4b2@inbox.whatsnextaction.com    │  Copy  │
│   └─────────────────────────────────────────────────┴────────┘
│   Forward any email to this address and it will appear in your Inbox.
│
└─ Regenerate address
    [Regenerate]  (ghost button)
    "Generate a new address if your current one receives unwanted emails."
```

**Copy behavior**: Copies to clipboard, button text → "Copied!" for 2 seconds.

**Regenerate confirmation** (uses `confirmModel`):
- Title: "Regenerate inbox address?"
- Message: "Your current address will stop working immediately. You'll need to update it in any email clients or forwarding rules."
- Confirm: "Regenerate" / Cancel: "Cancel"

**First-time state** (Pro/Team, no address yet):
```
Email to Inbox
├─ Forward any email to your WNA inbox address and it will appear as a new item.
└─ [Generate Address]  (primary button)
```

**Free tier state**:
- Lock icon + "Email to Inbox is available on Pro and Team plans." + Upgrade button (→ UpgradeModal)

---

## 9. Backend API Endpoints

### User-Facing (via router_service → email_service)

```
GET  /v1/user/inbox-email            # Get inbox email address + usage
                                      # → { email, emails_today, daily_limit, created_at }
                                      # 404 if not generated, 403 if Free tier

POST /v1/user/inbox-email/generate   # Generate address (first time)
                                      # → { email }. 409 if exists, 403 if Free

POST /v1/user/inbox-email/regenerate # Regenerate address
                                      # → { email }. 403 if Free, 404 if no address
```

### Internal HMAC (email_service → user_service)

```
GET  /internal/v1/user/{id}/tier     # Get user tier + storage limits
                                      # → { tier, storage_used, storage_limit,
                                      #     max_attachment_size, active }
                                      # email_service calls this during email processing
                                      # to check if user is active and get tier limits
```

### Internal HMAC (email_service → core_service)

```
POST /internal/v1/stuff              # Create Stuff on behalf of user
                                      # Body: { user_id, title, description, source,
                                      #         attachments: [{ filename, content_type,
                                      #         size, data (base64) }] }
                                      # → { id }
```

### Internal HMAC (user_service → email_service, for GDPR purge)

```
DELETE /internal/inbox-email/{user_id}  # Delete user's inbox email address + log entries
                                         # Called by user_service during purge_deleted_users cron
                                         # Same cascade pattern as notification_service cleanup
```

### Cron (email_service, called by K8s CronJob)

```
POST /cron/reset-daily-email-counters  # Reset all emails_today counters to 0
                                        # Called by K8s CronJob at midnight UTC
                                        # Follows existing /cron/* endpoint pattern
```

### Admin (via admin_service → email_service via HMAC)

Admin endpoints live in **admin_service** (consistent with existing pattern where admin_service is the single admin gateway). admin_service proxies to email_service via HMAC internally.

```
# admin_service user-facing endpoints:
GET  /admin/inbox-email/users/{id}   # User's inbox email config + usage
GET  /admin/inbox-email/stats        # Global stats (active addresses, processed/failed today)

# email_service internal endpoints (called by admin_service via HMAC):
GET  /internal/inbox-email/users/{id}  # Returns address, emails_today, regen_count, created_at
GET  /internal/inbox-email/stats       # Returns total_active, processed_today, failed_today
```

---

## 10. User Stories

### Epic 1: Address Management

| # | Story | Priority |
|---|-------|----------|
| E-1 | As a Pro/Team user, I can generate my unique inbox email address from Settings | Must |
| E-2 | As a Pro/Team user, I can view and copy my inbox email address | Must |
| E-3 | As a Pro/Team user, I can regenerate my address with confirmation | Must |
| E-4 | As a Free user, I see a locked section with upgrade prompt | Must |
| E-5 | As a Pro/Team user, I see my daily usage (e.g., "12 of 50") | Should |
| E-6 | As a user who downgrades to Free, my address is deactivated | Must |

### Epic 2: Email Processing

| # | Story | Priority |
|---|-------|----------|
| E-7 | As a user, when I forward an email, a Stuff item appears with subject as title (near real-time via IMAP IDLE) | Must |
| E-8 | As a user, the Stuff description contains plain-text body with reply chains stripped | Must |
| E-9 | As a user, email attachments within tier limits are preserved on the Stuff item | Must |
| E-10 | As a user, oversized attachments are skipped with a note; Stuff still created | Must |
| E-11 | As the system, duplicate emails are prevented via Message-ID idempotency | Must |
| E-12 | As the system, rate limit of 50/day enforced, excess → RateLimited folder | Must |
| E-13 | As the system, unknown hashes silently dropped (no bounce), logged | Must |
| E-14 | As the system, retries on core_service unavailability (up to 3 cycles) | Must |
| E-15 | As the system, all emails logged in inbox_email_log | Must |

### Epic 3: email_service Microservice

| # | Story | Priority |
|---|-------|----------|
| E-16 | As the platform, email_service is a C++ Drogon microservice with its own PostgreSQL database | Must |
| E-17 | As the platform, email_service maintains persistent IMAP IDLE connection to Zoho with automatic reconnection | Must |
| E-18 | As the platform, email_service catches up on UNSEEN messages after restart | Must |
| E-19 | As the platform, email_service uses Trantor TcpClient for async IMAP and mailio for MIME parsing | Must |
| E-20 | As the platform, email_service authenticates to user_service and core_service via HMAC | Must |
| E-21 | As the platform, email_service has a /health endpoint for K8s liveness probe | Must |
| E-22 | As the platform, email_service supports poll fallback mode via config flag | Should |

### Epic 4: Infrastructure

| # | Story | Priority |
|---|-------|----------|
| E-23 | As the platform, inbox.whatsnextaction.com has MX → Zoho with catch-all | Must |
| E-24 | As the platform, dev uses Mailpit IMAP for testing | Must |

### Epic 5: Security & GDPR

| # | Story | Priority |
|---|-------|----------|
| E-25 | As the system, hashes are HMAC-SHA256 with server secret, not guessable | Must |
| E-26 | As the system, no bounce/auto-reply ever sent | Must |
| E-27 | As the system, when a user is purged (GDPR), their inbox_email_address and inbox_email_log entries are deleted via cascade call from user_service | Must |
| E-28 | As the system, hash collision on generation is retried up to 3 times with different input | Must |

### Epic 6: Admin & Monitoring

| # | Story | Priority |
|---|-------|----------|
| E-29 | As an admin, I can view a user's inbox email and daily usage | Should |
| E-30 | As an admin, I can view global Email to Inbox stats | Should |
| E-31 | As the platform, email_service health and processing metrics are monitored | Should |

### Epic 7: Future Polish (Out of Scope for Now)

Deferred:
- Stuff from email shows a small email icon badge
- Inbox empty state mentions Email to Inbox
- Pricing page includes Email to Inbox row
- Help FAQ covers Email to Inbox

---

## 11. Implementation Phases

**Phase 1 — email_service + Core Pipeline** (E-1, E-2, E-7, E-8, E-11–E-13, E-15–E-21, E-23, E-25, E-26, E-27, E-28)
New email_service microservice (Drogon, own DB, JWT validation, HMAC identity). IMAP IDLE via Trantor TcpClient. MIME parsing via mailio. Hash generation + lookup + collision retry. Tier check on user-facing endpoints. Internal HMAC endpoints to user_service (tier) and core_service (stuff creation with `add_to_top=true`). inbox_email_log with idempotency. Rate limiting. GDPR purge endpoint. DNS + Zoho catch-all. Router service routing update (specific pattern before generic). HMAC key mesh update across all services. Frontend: Settings section (generate + display + copy). Text only, no attachments yet.

**Phase 2 — Attachments & Tiers** (E-4, E-6, E-9, E-10)
MIME attachment extraction via mailio. Tier-based size/quota enforcement (via user_service tier info). Description notes for skipped attachments. Free tier lockout. Downgrade handling (address stays in DB, tier check rejects).

**Phase 3 — Regeneration & Admin** (E-3, E-29, E-30)
Regenerate endpoint + confirmation dialog. Admin endpoints (in admin_service, proxied to email_service via HMAC).

**Phase 4 — Polish & Monitoring** (E-14, E-22, E-24, E-31)
Retry logic. Poll fallback mode. Mailpit IMAP in dev (`--enable-imap` flag). Health metrics.

---

## 12. Key Technical Considerations

### Service Architecture

- **email_service is a full Drogon microservice** — same patterns as user_service, core_service, etc. CMake build, vcpkg dependencies, Drogon controllers, JSON config, K8s Deployment.
- **JWT validation** — user-facing endpoints validate JWT using `jwt::identity` from backend_common. Requires `jwt.secret` in secret.json (same shared secret as all services).
- **Single replica** — only 1 pod reads from the catch-all mailbox. Multiple replicas would process the same emails. Sequential processing within the event loop — one email at a time.
- **Email size limit** — skip messages >25 MB total (Zoho's own limit). Prevents memory issues from enormous emails.

### IMAP & MIME

- **IMAP transport via Trantor TcpClient** — Drogon's built-in async TCP client. TLS support via `enableSSL()`. Event-loop callbacks naturally support IMAP IDLE push. ~1000-1500 LOC for the IMAP command/response layer.
- **IMAP MOVE fallback** — MOVE is an extension (RFC 6851). If Zoho doesn't support it, fall back to `COPY` + `STORE +FLAGS (\Deleted)` + `EXPUNGE` to move messages to Failed/RateLimited folders.
- **MIME parsing via mailio** — MIT license, C++17, Boost-based (Boost already in stack). Handles multipart, base64, quoted-printable, charset conversion, attachment extraction. **Must be added to vcpkg.json** (not currently a dependency).
- **Fallback: libetpan** — if Trantor IMAP proves too costly, libetpan (BSD-3) has IDLE + MIME. fd-based IDLE integrates with Drogon's event loop. Risk: dormant since 2021.
- **Email body format** — always plain text in Stuff `description`. HTML converted to plain text via tag stripping. No markdown.
- **Zoho IMAP auth** — uses app-specific password with plain LOGIN command. Zoho supports this when 2FA is enabled on the catch-all account.

### Inter-Service Communication

- **Stuff creation via HMAC to core_service** — `POST /internal/v1/stuff` with `user_id`, `add_to_top=true` (email-captured items appear at top of inbox), attachments as base64. Preserves service ownership.
- **Tier info via HMAC to user_service** — email_service does not store tier data. Calls `GET /internal/v1/user/{id}/tier` during email processing AND on user-facing endpoints (generate/get/regenerate return 403 for Free tier).
- **GDPR cascade** — user_service calls `DELETE /internal/inbox-email/{user_id}` during purge cron. email_service deletes `inbox_email_address` + `inbox_email_log` entries for that user.

### HMAC Key Setup

email_service needs a full HMAC identity integrated into the existing key mesh:

```
email_service secret.json:
  hmac.receiver.keys: { "wna_router": "<router-secret>", "wna_admin": "<admin-secret>", "wna_user": "<user-secret>" }
  hmac.sender: { id: "wna_email", secret: "<email-secret>" }

Updates to other services:
  user_service  → hmac.receiver.keys: add "wna_email": "<email-secret>"
  core_service  → hmac.receiver.keys: add "wna_email": "<email-secret>"
  router_service → services config: add "email": { url: "http://email-service:1500", connections: 4, max_queue_size: 1000 }
  admin_service  → hmac.receiver.keys: no change (admin calls email_service, not the other way)
```

### Router Service Routing

Router uses regex patterns in `services.cpp`. Adding email_service requires:
- New regex `/v1/user/inbox-email(.*)` → email_service. **Must be registered before** the existing `/v1/user/(.*)` → user_service pattern (more specific first).
- No admin routing change needed — admin endpoints stay in admin_service (which calls email_service via HMAC internally).

### Config File Structure

```json
// email_service config.json
{
  "app": { "threads_num": 2, "enable_server_header": false },
  "listeners": [{ "address": "0.0.0.0", "port": 1500, "https": false }],
  "db_clients": [{ "name": "default", "rdbms": "postgresql",
    "host": "localhost", "port": 5432, "dbname": "wna_email_db",
    "connection_number": 4, "auto": false }],
  "log": { "log_level": "DEBUG" },
  "custom_config": {
    "hmac": { "receiver": { "clock_skew_seconds": 300 } },
    "services": {
      "user": { "url": "http://localhost:8001", "connections": 4, "max_queue_size": 1000 },
      "core": { "url": "http://localhost:8002", "connections": 4, "max_queue_size": 1000 }
    },
    "imap": { "host": "localhost", "port": 1143, "mode": "poll",
              "idle_reissue_seconds": 1500, "reconnect_max_seconds": 60 },
    "inbox": { "domain": "inbox.whatsnextaction.com", "daily_limit": 50 }
  }
}

// email_service secret.json
{
  "db_clients": [{ "user": "wna_email", "passwd": "<generated>" }],
  "custom_config": {
    "jwt": { "issuer": "wna", "audience": "wna", "secret": "<shared-jwt-secret>" },
    "hmac": {
      "receiver": { "keys": { "wna_router": "<router-secret>", "wna_admin": "<admin-secret>", "wna_user": "<user-secret>" } },
      "sender": { "id": "wna_email", "secret": "<email-secret>" }
    },
    "imap": { "username": "<zoho-imap-user>", "password": "<zoho-app-password>" },
    "inbox": { "email_secret": "<64-char-hex-for-hash-generation>" }
  }
}
```

### Hash Collision Handling

12 hex chars = 48 bits. Collision probability negligible at <1M users (~10^-9). If `UNIQUE` constraint fails during insert, retry with `HMAC-SHA256(user_id + attempt_counter, secret)`, up to 3 attempts.

### Stuff `source` Column Migration

```sql
-- core_service migration: add source column to item_meta
ALTER TABLE item_meta ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'manual';
```

Existing `GET /v1/inbox` response will include the `source` field once serialization is updated. Frontend can use it later for email badge (deferred).

### Downgrade Handling

When a user downgrades from Pro/Team to Free:
- **Address row stays in DB** (not deleted) — reactivates if user re-upgrades
- **User-facing endpoints** (`GET /v1/user/inbox-email`) check tier via user_service HMAC call → return 403 for Free
- **Email processing** — step 8 checks tier → rejects with `status=failed` if Free. Email moved to Failed folder.
- **Frontend** — Settings page hides Email to Inbox section for Free tier (same as first-time Free state)

### Notifications

No in-app notification when an email is captured. The user forwarded the email themselves — they know it's coming. This matches Quick Add behavior (no notification on manual capture).

### Mailpit IMAP

Current docker-compose only exposes SMTP (:1025) and Web UI (:8025). To enable IMAP for email_service dev testing:
```yaml
mailpit:
  image: axllent/mailpit:latest
  command: ["--enable-imap"]
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
    - "1143:1143"   # IMAP
```

### Daily Counter Reset

K8s CronJob calls `POST http://email-service:1500/cron/reset-daily-email-counters` at midnight UTC using `curlimages/curl:latest` (matches existing cron pattern in `cronjobs.yaml`).

### Testing

- **Unit tests**: hash generation, hash collision retry, IMAP response parsing (tagged, untagged, literals), email body cleaning, reply chain stripping, subject prefix stripping
- **Integration**: Mailpit IMAP in dev (poll mode). Send test emails via Mailpit API, verify Stuff creation.
- **E2E**: real email to `inbox-dev.whatsnextaction.com`, verify Stuff appears in user's Inbox

---

## 13. Changes per Repository

### wna_backend

| Service | Changes |
|---------|---------|
| **email_service** (new) | New Drogon microservice. Own DB (`wna_email_db`): `inbox_email_address`, `inbox_email_log` tables. JWT validation via `jwt::identity`. IMAP IDLE client via Trantor TcpClient. MIME parsing via mailio (add to vcpkg.json). User-facing endpoints: `GET/POST /v1/user/inbox-email*` (with tier check via HMAC to user_service). Internal: `DELETE /internal/inbox-email/{user_id}` (GDPR purge), `GET/GET /internal/inbox-email/*` (admin proxy), `/cron/reset-daily-email-counters`. HMAC client calls to user_service and core_service. Config/secret: see Config File Structure section. |
| **core_service** | New internal HMAC endpoint: `POST /internal/v1/stuff` (accepts `user_id`, `add_to_top`, base64 attachments). DB migration: `ALTER TABLE item_meta ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'manual'`. |
| **user_service** | New internal HMAC endpoint: `GET /internal/v1/user/{id}/tier` (returns tier, storage_used, storage_limit, max_attachment_size, active). Add email_client to purge cascade: calls `DELETE /internal/inbox-email/{user_id}` during `purge_deleted_users` cron. HMAC receiver keys: add `wna_email`. |
| **router_service** | Add email_service to `services` config. Add regex `/v1/user/inbox-email(.*)` → email_service **before** existing `/v1/user/(.*)` → user_service pattern. HMAC sender key shared with email_service. |
| **admin_service** | New proxy endpoints: `GET /admin/inbox-email/users/{id}`, `GET /admin/inbox-email/stats` — calls email_service internal endpoints via HMAC. HMAC sender key added to email_service receiver. |
| **notification_service** | No changes. |
| **backend_common** | New `email_client` class for HMAC calls to email_service (GDPR purge). HMAC client helpers for new internal endpoints. |

### wna_web

Minimal changes — only Settings page.

| Area | Changes |
|------|---------|
| **apiClient.js** | `getInboxEmail()`, `generateInboxEmail()`, `regenerateInboxEmail()` |
| **SettingsPage.vue** | New "Email to Inbox" card section with tier-conditional rendering (generate/display/copy/regenerate). |

### wna_deploy

| Area | Changes |
|------|---------|
| **DNS** | MX + SPF + DKIM records for `inbox.whatsnextaction.com` |
| **K8s Secrets** | `email-service-secret`: secret.json (DB creds, JWT secret, HMAC keys, IMAP creds, inbox email secret). Also update user-service-secret, core-service-secret, router-service-secret, admin-service-secret to include `wna_email` HMAC key. |
| **K8s Deployment** | `email-service-deployment.yaml`: 1 replica, Drogon on port 1500, readinessProbe `/health` (delay 5s, period 10s), livenessProbe `/readiness` (delay 15s, period 20s), `runAsUser: 1000`, env from Secrets + ConfigMaps |
| **K8s Service** | `email-service-service.yaml`: ClusterIP exposing port 1500 |
| **K8s CronJob** | Add to `cronjobs.yaml`: `reset-daily-email-counters` (schedule `0 0 * * *`, target `POST http://email-service:1500/cron/reset-daily-email-counters`, using `curlimages/curl:latest`) |
| **ConfigMaps** | `email-service-configmap.yaml`: config.json (see Config File Structure section) |
| **DB init** | `backend/db_tools/sql/email_service/000_create_db.sql` + `001_init.sql` for `wna_email_db` |
| **core_service migration** | `backend/db_tools/sql/core_service/00N_add_source_column.sql`: `ALTER TABLE item_meta ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'manual'` |
| **Mailpit** (dev) | Add `command: ["--enable-imap"]` and port `1143:1143` to Mailpit in docker-compose |
| **setup_secrets.sh** | Add email_service secret generation: IMAP username/password prompts, INBOX_EMAIL_SECRET via `openssl rand -hex 32`, email_service HMAC sender key |
| **Monitoring** | Prometheus scrape config for email_service /metrics endpoint |

---

## Resolved Decisions

1. **Email provider**: Zoho catch-all (confirmed)
2. **Architecture**: New `email_service` Drogon microservice with own DB — owns hashes, email log, IMAP connection
3. **Delivery model**: IMAP IDLE (push, near real-time) as primary, with poll fallback via config flag
4. **IMAP client**: Trantor TcpClient (Drogon built-in async TCP) for IMAP transport
5. **MIME parsing**: mailio (MIT, C++17, Boost-based) — must be added to vcpkg.json
6. **IMAP fallback**: libetpan (BSD-3) if Trantor implementation proves too costly
7. **Secrets**: Full secret.json with DB creds, JWT secret, HMAC keys, IMAP creds, inbox email secret
8. **JWT validation**: Independent validation using `jwt::identity` from backend_common
9. **Admin routing**: Admin endpoints stay in admin_service (proxied to email_service via HMAC) — consistent with existing pattern
10. **Router routing**: Specific `/v1/user/inbox-email*` pattern registered before generic `/v1/user/*`
11. **GDPR**: email_service exposes `DELETE /internal/inbox-email/{user_id}` for purge cascade from user_service
12. **Cron pattern**: `/cron/reset-daily-email-counters` using existing `curlimages/curl` CronJob pattern
13. **Stuff position**: Email-captured items appear at top of inbox (`add_to_top=true`)
14. **Downgrade**: Address row stays in DB (reactivates on re-upgrade), tier check rejects at API + processing
15. **Notifications**: No notification on email capture (matches Quick Add behavior)
16. **Frontend scope**: Minimal — Settings page only (generate/display/copy/regenerate address)
17. **Polish items**: Deferred to future iterations
