# P2 — Team & Collaboration: High-Level Solution

## 1. Core Concept

**Team tier** users can build a network of **connections** — other WNA users they collaborate with. Connections are bidirectional: one user invites another by email, the invitee accepts, and both sides can delegate actions and share projects with each other. There is no "team" entity — connections are flat, peer-to-peer relationships (like a friend/contact list).

**Two features built on connections:**
- **Delegation** — fire and forget. Assigner delegates an action → it lands in the receiver's Inbox as normal Stuff → receiver clarifies and handles it however they want → assigner only sees "waiting / done" and any results. The assigner has no visibility into how the receiver organizes their work.
- **Shared Projects** — the project owner shares a personal project with specific connections, assigning each a per-project role (write or read-only). Shared backlog with self-assignment. No Next Action rule. Each member can self-assign one action at a time. All members see progress, assignments, and completed tasks. Write members can edit descriptions/attachments; all members can comment.

**GTD alignment**: Delegation and shared projects are additive. Personal GTD stays untouched — inbox, next actions, tags, someday, personal projects all remain fully private. Shared projects have different rules than personal projects (no Next Action, no auto-promotion) because collaborative work is inherently parallel.

---

## 2. Domain Model

### New Entities

| Entity | Purpose |
|--------|---------|
| **UserConnection** | Bidirectional relationship between two Team tier users. Fields: inviter_id, invitee_email, invitee_id, token, status (pending/accepted/declined/removed), created_at, accepted_at. Either side can delegate and share. Either side can remove the connection. |
| **ProjectMember** | Join table: project_id, user_id, role (owner/write/read-only). Per-project access control for shared projects. Role is set when adding a member to a project and can be changed later by the project owner. |
| **Notification** | **Unified with existing `notification_log`** — no separate entity. Existing columns (`id`, `user_id`, `event`, `type`, `channel`, `status`, `idempotency_key`, `recipient`, `subject`, `error_detail`, `created_at`, `sent_at`) plus P2 additions: `message` (text shown in-app), `entity_type` (action/stuff/project/connection), `entity_id`, `read` (boolean). In-app notifications are rows with `channel='in_app'`; email notifications have `channel='email'`. Same event can produce both an email and an in-app row with the same `idempotency_key`. |

### Modified Entities

| Entity | Changes |
|--------|---------|
| **Stuff** | Add `delegated_from_user_id` (nullable), `delegated_from_action_id` (nullable). Only populated for delegated items. Hidden metadata — not visible as editable fields, don't affect clarify flow. |
| **Action** | Add `delegated_from_user_id` (nullable), `delegated_from_action_id` (nullable). Carried forward when Stuff transforms into Action. Used to notify assigner on completion. Add `assigned_to` (nullable) for shared project actions. Add `waiting_for_user_id` (nullable) for connection-based delegation — links the assigner's Waiting For to a real user (coexists with existing `waiting_for` text field for non-connection delegation). |
| **Project** | Add `delegated_from_user_id` (nullable), `delegated_from_action_id` (nullable). Carried forward when Stuff transforms into Project. Add `shared` (boolean) — if true, this is a shared project with members in ProjectMember. |

### Key Design Decisions

- **Personal GTD stays untouched** — connections are additive. Inbox, Next Actions, Someday, Tags, etc. remain fully personal and private.
- **Delegation is a black box** — the assigner sees only their Waiting For item (waiting → done) and any result info (comments). Zero visibility into how the receiver organizes the delegated work.
- **Delegated items are normal Stuff** — they land in the receiver's Inbox and go through the standard Clarify flow. No special flow. The receiver can Action it, Project it, Someday it, or Trash it. If they trash it, the assigner's Waiting For stays open — that's real life.
- **Shared projects are different from personal projects** — no Next Action rule, no auto-promotion, no recurrence. Shared backlog with self-assignment. Each user can have one assigned action at a time per shared project.
- **Per-project roles** — the project owner sets each member's access level (write or read-only) when adding them to the project, and can change it later. Roles are per-project, not global.
- **Tags are always private** — even on shared project actions, your tags are only visible to you. Other members cannot see your tags. Each member can set their own tags on shared project actions (private, not visible to others).
- **You can only delegate to your connections. You cannot delegate to yourself.**
- **Share with specific connections** — when sharing a project, the owner picks individual connections and assigns each a per-project role. Only those members see the project (not all connections).

---

## 3. Delegation Flow

### How It Works

1. **Assigner** has an action and delegates it to a connection (via Clarify "delegate" substep or from Action Detail)
2. **Assigner's action** moves to Waiting For with `waiting_for` set to the real user's name, `waiting_for_user_id` set to the user's ID
3. **Receiver** gets a new Stuff item in their Inbox with title, description, and hidden meta (`delegated_from_user_id`, `delegated_from_action_id`)
4. **Receiver clarifies normally** — "Is this actionable?" → Action / Project / Someday / Reference / Trash. Standard GTD flow, no special handling
5. **Whatever the receiver creates** (Action or Project) carries the delegation meta forward as a hidden link
6. **When the receiver completes** the resulting Action or Project:
   - System writes a comment on the assigner's original action (prefilled "Done." — receiver can extend, e.g., "Done. Report is on your desk.")
   - Assigner's Waiting For item resolves
   - Assigner gets a notification

### Delegation + Projects

- **Personal project Next Action**: can be delegated. The action stays as the project's Next Action but moves to Waiting For state. You're blocked on this project until the delegation resolves. No auto-promotion.
- **Shared project assigned action**: can be delegated. The action stays assigned to you but moves to Waiting For state. You're blocked on this shared project — can't claim another backlog action until the delegation resolves. The shared project view shows "assigned to you, waiting on [name]."
- **Self-delegation is blocked** — you cannot delegate to yourself. The connection picker does not show yourself.

### Delegation Chains

Re-delegation is allowed. If Alice delegates to Bob, and Bob delegates to Carol:
- Carol completes → Bob's Waiting For resolves (Bob gets notified)
- Bob must then complete his action → Alice's Waiting For resolves (Alice gets notified)
- Each link is independent. Bob is still responsible to Alice, even if he sub-contracted to Carol.

### What the Assigner Sees

Only their Waiting For item: who it's delegated to (real user name for connection delegation, free text for non-connection), how long it's been waiting, and whether it's done. When done — a comment with results. Nothing else. They don't know or care if the receiver turned it into a project with 20 sub-actions.

### What the Receiver Sees

A normal Stuff item in their Inbox. The only visual difference: a small indicator showing who delegated it (e.g., "From: Alice"). They process it like any other inbox item.

### Edge Cases

- **Receiver trashes it**: Assigner's Waiting For stays open. Real life — people ignore requests. Assigner can follow up manually.
- **Receiver puts it in Someday**: Same — assigner's Waiting For stays open. Receiver might activate it later.
- **Receiver sends it to Reference**: Delegation link is lost (Reference is not completable). Assigner's Waiting For stays open forever. Same as trash — expected behavior.
- **Receiver turns it into a Project**: The delegation link lives on the Project. When the *project* is completed, the assigner gets notified. Individual actions within the project don't trigger notifications.
- **Assigner wants to cancel**: No recall. You cannot pull Stuff out of someone else's inbox. You can only manually resolve your own Waiting For item. The receiver's inbox item keeps its `delegated_from_action_id` — if the receiver later completes it, the system will still write a comment on the assigner's action (informational), but the Waiting For state won't change since it was already manually resolved.
- **Connection removed while delegation pending**: Assigner's Waiting For stays open, receiver's Stuff stays in their inbox. Removing a connection does not cancel in-flight delegations.

---

## 4. Shared Projects

### How It Works

1. Any Team tier user creates a personal project, then **shares it** with specific connections via `POST /v1/project/{id}/share`, specifying which connections to add and their roles. The user becomes the project owner.
2. Only the selected connections see the shared project in their Projects list (alongside personal projects, marked with a shared badge)
3. The project has a **backlog** of unassigned actions — write members can create new actions and reorder the backlog
4. Each write member can **self-assign one backlog action at a time** — this becomes their "next action" for this project and appears in their personal Next Actions
5. A member must complete, trash, or unassign their current action before claiming another
6. All members can see: who's working on what, completed tasks (who completed them). Write members can edit descriptions/attachments on any action. All members (including read-only) can add comments.

### How Shared Projects Differ from Personal Projects

| | Personal Project | Shared Project |
|--|--|--|
| Next Action rule | Exactly one, auto-promotes from backlog | None — each member has their own assigned action (max one) |
| Backlog | Ordered, FIFO auto-promotion | Ordered, manually claimed by write members |
| Ownership | Everything is yours | Actions are assigned/unassigned. Only assigned user can modify protected fields. |
| Tags | Yours | Private per user — others can't see your tags. Each member has own tags per action. |
| Visibility | Only you | Only project members (selected connections). Write members edit descriptions/attachments. All can comment. |
| Completion | You decide | Only project owner can complete/archive |
| Completed tasks | Visible (new feature for personal projects too) | Visible with who completed them |
| Recurrence | Supported | Not supported — no recurrence on shared project actions |
| Calendar/Today | Via due date | Same — assigned actions with due dates appear in your Calendar/Today |

### Per-Project Roles

The project owner sets each member's access level when adding them to the project. Roles can be changed later by the owner.

| Role | Can do |
|------|--------|
| **Owner** | Everything + complete/archive project + manage member roles + add/remove members + convert project |
| **Write** (default) | Create/reorder backlog actions, self-assign, edit descriptions/attachments, add comments |
| **Read-only** | View everything + add comments only. Cannot create/reorder backlog, self-assign, or edit descriptions/attachments. |

A connection can be Write on "Website Redesign" but Read-only on "Finance Audit."

### Assignment Rules

- **One at a time**: A user can only have one assigned action per shared project. Must finish (complete/trash) or unassign before claiming another.
- **Assigned = yours**: Once assigned, the action behaves like your own — appears in your Next Actions, you can edit it, add your private tags, set due dates, defer it, etc. If it has a due date, it shows in your Calendar/Today. Same rules as any personal action.
- **Delegation while assigned**: You can delegate your assigned action to a connection. Your action stays assigned to you but moves to Waiting For state. You're blocked on this project until the delegation resolves — you can't claim another backlog action.
- **Shared fields**: Write members can edit attachments, descriptions, and add comments on any action in the shared project (assigned or not). Read-only members can only add comments.
- **Protected fields**: Only the assigned user can modify title, tags, due date, status (complete/trash/unassign). For unassigned backlog actions, write members can edit all fields (title, description, everything). Protected fields rule only kicks in once someone claims the action.
- **Unassign**: You can unassign your action — it returns to the backlog for someone else to claim.
- **Trash is final**: If you trash your assigned action, it's trashed. It does not return to the backlog.

### Backlog Rules

- **Write members can create**: Write members can add new actions to the backlog.
- **Write members can reorder**: Write members can reorder the backlog list.
- **Backlog = unassigned only**: The backlog contains only actions not assigned to anyone.
- **No recurrence**: Shared project actions cannot have recurrence rules.
- **No cross-project moves**: Actions cannot be moved between personal and shared projects (or between shared projects). To add something to a shared project, create a new action in its backlog.

### Member Removal

- **Connection removed or member removed from project**: Their in-progress assigned actions return to the backlog. Completed actions stay as completed.
- **Last non-owner member removed**: Shared project automatically converts back to a personal project (auto-conversion rules apply).
- **User deleted**: Their completed actions are also deleted from the shared project. Comments they left on other members' actions stay, attributed to "Deleted User."

### Project Lifecycle

- Only the **project owner** (creator) can complete or archive the shared project.
- Owner manages project-level fields (title, outcome).
- Outcome is mandatory for shared projects (same as personal projects — GTD rule).
- Owner can add new connections to the project at any time, setting their role.
- Owner can change any member's role at any time.

### Project Conversion

**Personal → Shared:**
- Owner specifies which connections to add and their roles.
- Owner's current Next Action becomes their assigned action in the shared project. Backlog stays as backlog.
- If the Next Action is in Waiting For or deferred state, it stays in that state as the owner's assigned action. Only one active action per user per project — states are compatible.
- Natural 1:1 mapping.

**Shared → Personal:**
- Owner can force conversion at any time.
- Other members' assigned actions are auto-unassigned back to the backlog.
- Owner's assigned action becomes the Next Action. If the owner has no assigned action, the system auto-promotes the first backlog item to Next Action. If the backlog is also empty, the user is prompted to create one.
- Backlog stays. Members lose access to the project.

**Auto-conversion:**
- When all non-owner members are removed (or remove themselves), the shared project automatically converts back to a personal project.
- If the owner has no assigned action during auto-conversion, the system auto-promotes the first backlog item to Next Action. If the backlog is empty, the user is prompted to create one.

---

## 5. Completed Tasks on Projects (Both Personal and Shared)

New feature for **all projects** (not just shared):
- Users can view completed tasks within a project
- On shared projects: shows who completed each task
- On personal projects: shows completion history

---

## 6. Permission Model

### Per-Project Roles (set by project owner when adding members)

| Role | Can do |
|------|--------|
| **Owner** | Everything + complete/archive project + manage member roles + add/remove members + convert project type |
| **Write** (default) | Create/reorder backlog, self-assign actions, edit descriptions/attachments, add comments |
| **Read-only** | View everything + add comments only |

There are no global/connection-level roles. All permissions are per-project. Any Team tier user can share their own project with their connections — this is not role-gated.

---

## 7. UI Changes

| Area | Change |
|------|--------|
| **Settings** | New "Connections" tab: invite connections by email, manage connections, view pending invitations |
| **Clarify Panel** | Delegate substep: connection picker dropdown (does not show yourself). Free text remains for non-connection delegation. |
| **Action Detail** | "Delegate to" option with connection picker |
| **Waiting For** | Shows real user name/avatar for connection delegations. Free text for non-connection. Resolved items show completion comment. |
| **Inbox** | Delegated items show small "From: [name]" indicator |
| **Projects List** | Shared projects appear alongside personal projects with a shared badge |
| **Project Detail (shared)** | Backlog with "Assign to me" button (write members). Current assignments visible (including waiting state). Completed tasks with who did it. Write members edit descriptions/attachments. All members can comment. Per-member role management for project owner. Add/remove members. |
| **Project Detail (all)** | New "Completed" section showing completed tasks |
| **Notifications** | Badge/toast for all meaningful actions: delegated to you, delegation completed, connection invite, shared project changes |

**What does NOT change**: Sidebar structure, dashboard layout, Today, Calendar, Engage, Tags — all unchanged and fully private. Weekly Review skips shared projects for the "ensure next action" check. Assigned shared project actions with due dates appear in Calendar/Today like any personal action.

---

## 8. Backend API Endpoints (New)

```
# Connections
POST   /v1/connections/invite              # Invite connection by email
GET    /v1/connections                      # List accepted connections
GET    /v1/connections/pending              # List pending invitations (sent + received)
DELETE /v1/connections/{id}                 # Remove connection
POST   /v1/connections/invite/{token}/accept   # Accept invitation
POST   /v1/connections/invite/{token}/decline  # Decline invitation

# Delegation
POST   /v1/action/{id}/delegate            # Delegate action to a connection
                                            # → moves original to Waiting For
                                            # → creates Stuff in receiver's Inbox
                                            # → blocks self-delegation

# Shared projects (created via conversion, not directly)
GET    /v1/project/{id}/completed           # List completed actions for a project (personal or shared)

# Self-assignment
POST   /v1/action/{id}/assign              # Assign backlog action to yourself
POST   /v1/action/{id}/unassign            # Unassign your action (returns to backlog)

# Project members (shared projects only)
GET    /v1/project/{id}/members             # List project members with roles
POST   /v1/project/{id}/members             # Add member (connection) with role
PATCH  /v1/project/{id}/members/{uid}       # Set member role (write/read-only)
DELETE /v1/project/{id}/members/{uid}       # Remove member from project
                                            # → their assigned action returns to backlog

# Project conversion
POST   /v1/project/{id}/share              # Convert personal → shared (with initial members + roles)
POST   /v1/project/{id}/unshare            # Convert shared → personal (force)

# Notifications
GET    /v1/notifications                    # User's notifications
POST   /v1/notifications/{id}/read          # Mark as read
GET    /v1/notifications/unread-count       # Badge count
```

---

## 9. User Stories

### Epic 1: Connections

| # | Story | Priority |
|---|-------|----------|
| T-1 | As a Team tier user, I can invite another user by email to become my connection | Must |
| T-2 | As an invited user, I receive an email and can accept/decline the connection invitation | Must |
| T-3 | As a Team tier user, I can view my list of connections | Must |
| T-4 | As a user, I can remove a connection (either side can remove) | Must |
| T-5 | As the system, when a connection is removed, the removed user's assigned actions in shared projects return to the backlog, and they are removed from project members | Must |
| T-6 | As an invited non-WNA user, I receive an email with a registration link; the invitation stays pending until I register and accept | Should |
| T-7 | As a user, I can view pending invitations I've sent and received | Should |

### Epic 2: Delegation

| # | Story | Priority |
|---|-------|----------|
| T-8 | As a user, I can delegate an action to a connection — the action moves to my Waiting For and a new Stuff item appears in the receiver's Inbox | Must |
| T-9 | As a receiver, I see delegated items in my Inbox as normal Stuff with a "From: [name]" indicator | Must |
| T-10 | As a receiver, I clarify delegated Stuff exactly like any other Stuff — Action, Project, Someday, Reference, or Trash | Must |
| T-11 | As a receiver, when I complete the resulting Action or Project, the assigner is automatically notified and their Waiting For resolves with a prefilled "Done." comment | Must |
| T-12 | As an assigner, I see a completion comment on my original action with any result info from the receiver | Must |
| T-13 | As a user during Clarify, the "delegate" substep shows a connection picker (myself excluded) alongside free text for non-connection delegation | Should |
| T-14 | As an assigner, I can see who I delegated to (real user name for connections, free text for non-connection) and how long ago in my Waiting For list | Must |
| T-15 | As a user, I cannot delegate to myself — the system prevents it | Must |
| T-16 | As a user, I cannot recall a delegation — I can only manually resolve my Waiting For if I change my mind | Must |

### Epic 3: Shared Projects

| # | Story | Priority |
|---|-------|----------|
| T-17 | As a Team tier user, I can share my personal project with specific connections — each gets a role (write/read-only) and sees the project in their Projects list with a shared badge | Must |
| T-18 | As the project owner, I can add more connections to the project at any time, setting their role | Must |
| T-19 | As a write member, I can create new actions in the shared project's backlog | Must |
| T-20 | As a write member, I can reorder the shared project's backlog | Must |
| T-21 | As a write member, I can self-assign one backlog action at a time — it appears in my personal Next Actions | Must |
| T-22 | As a project member, I must complete, trash, or unassign my current action before claiming another from the same shared project | Must |
| T-23 | As a project member, I can unassign my action — it returns to the backlog | Must |
| T-24 | As a project member, if I trash my assigned action, it is permanently trashed (does not return to backlog) | Must |
| T-25 | As a write member, I can edit descriptions and attachments on any action. As any member, I can add comments. | Must |
| T-26 | As a project member, I can see who is working on which action (including if they're waiting/blocked) and view completed tasks with who completed them | Must |
| T-27 | As the project owner, only I can complete or archive the shared project | Must |
| T-28 | As a project member, when I am removed from the project, my uncompleted assigned actions return to the backlog | Must |
| T-29 | As a project owner, I can set each member's role to write or read-only per project | Must |
| T-30 | As a read-only member, I can view everything and add comments, but cannot create/reorder backlog or self-assign | Must |
| T-31 | As a project owner, I can force-convert a shared project back to personal — other members' assigned actions return to backlog | Must |
| T-32 | As the system, when all non-owner members are removed from a shared project, it auto-converts back to a personal project | Must |
| T-33 | As a project owner, when I remove a member from the project, their in-progress action returns to backlog | Must |
| T-34 | As a project member, I can delegate my assigned shared project action to a connection — my action stays assigned to me in Waiting For state and I'm blocked on this project until the delegation resolves | Must |
| T-35 | As a project member, my assigned action with a due date appears in my Calendar/Today like any personal action | Must |

### Epic 4: Completed Tasks on Projects

| # | Story | Priority |
|---|-------|----------|
| T-36 | As a user, I can view completed tasks within any project (personal or shared) | Must |
| T-37 | As a user, on shared projects I can see who completed each task | Must |

### Epic 5: Notifications

| # | Story | Priority |
|---|-------|----------|
| T-38 | As a user, I receive in-app notifications for meaningful per-item events: delegation sent/completed, connection invitations, project-needs-next-action, shared project changes (Phase 2) | Must |
| T-39 | As a user, I see a notification badge in the top nav when I have unread notifications | Must |
| T-40 | As a user, I can configure notification preferences (email, in-app, per event type) | Should |

**In-app channel scope (Phase 1):** `delegated_to_you`, `delegation_completed`, `connection_invite`, `project_needs_next_action`. Bulk digest events (`task_due_today`, `daily_next_actions`) are email-only — they contain rolled-up summaries that would be noise as per-item in-app notifications. Phase 2 will add shared-project events (`action_assigned`, `member_added`, etc.).

### Epic 6: Weekly Review

| # | Story | Priority |
|---|-------|----------|
| T-41 | As a user, my Weekly Review skips shared projects for the "ensure next action" check (shared projects have no Next Action rule) | Must |
| T-42 | As a user, my Weekly Review includes reviewing delegated actions in Waiting For (already part of standard review) | Should |

### Epic 7: Tier Limits

| # | Story | Priority |
|---|-------|----------|
| T-43 | As the system, I enforce team tier limits (1 GB storage per user, 50 MB attachments) | Must |
| T-44 | As the system, only Team tier users can accept connection invitations — Free/Pro users must upgrade first | Must |
| T-45 | As the system, if a user downgrades from Team tier, they are auto-removed from all connections (removal cascade applies — assigned actions return to backlog in shared projects) and lose access to all shared functionality | Must |

### Epic 8: Admin App

| # | Story | Priority |
|---|-------|----------|
| T-46 | As an admin, I can view all connections and shared projects for oversight and support | Should |
| T-47 | As an admin, I can manage connections and shared projects if something goes wrong | Should |

---

## 10. Implementation Phases

**Phase 1 — Connections & Delegation** (T-1 through T-4, T-6, T-7, T-8 through T-12, T-14 through T-16, T-38, T-39, T-43, T-44, T-45)
Connection management (invite, accept, decline, remove, list), delegation flow (Stuff creation in receiver's inbox, Waiting For integration with `waiting_for_user_id`, completion notification, self-delegation block, no recall), in-app notifications, tier enforcement, downgrade auto-removal.

**Phase 2 — Shared Projects** (T-5, T-17 through T-35, T-36, T-37, T-41)
Project sharing (via conversion with specific connections and roles), backlog management, self-assignment, per-project roles, delegation of assigned actions, completed tasks view (for all projects), auto-conversion, connection removal cascade to shared projects.

**Phase 3 — Polish** (T-13, T-40, T-42, T-46, T-47)
Clarify integration (connection picker), notification preferences, weekly review, admin app oversight.

---

## 11. Key Technical Considerations

- **No GTD rule changes for personal items**: Delegated items are normal Stuff. Clarify flow is unchanged. Personal projects keep all standard GTD rules (one Next Action, auto-promotion).
- **Shared projects are architecturally different**: No Next Action, no auto-promotion, no recurrence. Backlog is a shared list. Self-assigned actions are shared references (not copies) — the same entity appears in the user's Next Actions and in the shared project view. Assigned actions with due dates appear in Calendar/Today.
- **Delegation is a black box**: Assigner sees Waiting For (waiting → done + comment). Zero visibility into receiver's internal organization. Self-delegation is blocked. No recall mechanism.
- **Delegation chains**: Re-delegation is allowed. Each link is independent. Alice → Bob → Carol: Carol completes → Bob notified. Bob then completes → Alice notified. Each completion triggers one link up the chain.
- **Tags are always private**: Even on shared project actions, tags are per-user and invisible to other members. Backend must store tags per-user per-action for shared project actions (not on the action entity itself). When a user unassigns an action, their tags are discarded. Each member can set their own tags on shared project actions (private, no inheritance to other members).
- **Waiting For dual fields**: `waiting_for` (text) stays for non-connection delegation. `waiting_for_user_id` (nullable) added for connection delegation — links to real user for avatar, name, and completion sync.
- **Backward compatibility**: Existing text-based `waiting_for` stays for non-connection delegation. Connection delegation sets both `waiting_for` (user's name) and `waiting_for_user_id` (user's ID).
- **Data isolation**: Personal items are never exposed. Delegation creates a *copy* (new Stuff) in the receiver's system. Shared project actions are shared references visible to all project members — descriptions, attachments, and comments editable by write members; title, tags, due date, status only by the assigned user.
- **Completion sync**: Any completion event (checkbox, "Do it now" in Clarify, complete Action, complete Project) checks if the entity has `delegated_from_action_id`. If yes → write comment on assigner's original action (prefilled "Done."), resolve assigner's Waiting For, send notification.
- **Concurrent assignment**: Self-assignment uses optimistic locking — first-come-first-served if two members try to claim the same backlog action simultaneously.
- **Per-project roles**: Stored in ProjectMember join table (project_id, user_id, role). Role is set when adding a member to the project (default is "write"). Project owner can change any member's role at any time.
- **Project conversion**: Personal → shared: specify connections and their roles. Next Action (even if waiting/deferred) → assigned action, backlog → backlog. Shared → personal: forces unassignment of other members' actions. When last non-owner member is removed, auto-convert back to personal.
- **No cross-project moves**: Actions cannot be moved between personal and shared projects, or between shared projects. Same rule as between personal projects.
- **Existing API changes required**: `/v1/nextActions` must include shared project assigned actions. `/v1/projects` must include shared projects the user is a member of. Calendar/Today endpoints must include shared project assigned actions with due dates. These are changes to existing endpoints, not new ones.
- **Team tier required**: Only Team tier users can accept connection invitations and participate in collaboration features. If a user downgrades from Team tier, all their connections are removed — standard removal cascade applies (assigned actions return to backlog, shared project auto-conversion triggers if they were the last non-owner member). Invitations to non-WNA users include a registration link; invitation stays pending until they register and upgrade to Team tier.
- **Shared projects are always created via conversion**: User creates a personal project, then shares it with specific connections. There is no separate "create shared project" action. Any Team tier user can share their own project.
- **Auto-promotion on conversion**: When a shared project converts to personal (auto-conversion or forced) and the owner has no assigned action, the system auto-promotes the first backlog item to Next Action. If backlog is empty, the user is prompted.
- **Deleted user comments**: When a user is deleted, their comments on other members' actions stay, attributed to "Deleted User."
- **Real-time**: Notifications and shared project state will benefit from WebSocket (currently polling). Can start with polling and upgrade later.
- **Connection removal cascade**: When a connection is removed, for each shared project where both users are members: the removed user's assigned action returns to backlog, they are removed from project_member. If this was the last non-owner member, auto-conversion triggers.
