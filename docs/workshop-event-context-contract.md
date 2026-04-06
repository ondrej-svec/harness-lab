# Workshop Event Context Contract

This document defines the day-one contract for participant event access across the dashboard and `workshop-skill/`.

## Auth States

### 1. Public mode

Available without event login:
- public participant dashboard surface
- public-safe dashboard content
- local/fallback `workshop-skill` behavior
- setup, reference, and bundled project brief content

Not available:
- real event-private participant data
- team repo registry
- live checkpoint state

### 2. Participant-authenticated mode

Unlocked by redeeming the shared event code into a short-lived participant session.

Available:
- authenticated core bundle
- on-demand participant team/runtime lookups

### 3. Facilitator mode

Separate auth path.

Available:
- admin surface
- write operations
- facilitator-only views and monitoring

## Authenticated Core Bundle

Day-one shape:

- `event.title`
- `event.subtitle`
- `event.currentPhaseLabel`
- `event.dateRange`
- `event.city`
- `agenda`
- `briefs`
- `challenges`
- `keyLinks`
- `announcements`

Design rule:
- small enough to fetch immediately after login
- rich enough to make `/workshop` and the participant dashboard feel live

## On-Demand Participant Lookups

Fetched only when requested:

- `teams[].id`
- `teams[].name`
- `teams[].city`
- `teams[].repoUrl`
- `teams[].checkpoint`

These remain outside the core bundle because they are more privacy-sensitive and more volatile.

## API Endpoints

### Event access

- `POST /api/event-access/redeem`
- `POST /api/event-access/logout`

### Participant event context

- `GET /api/event-context/core`
- `GET /api/event-context/teams`

### Existing facilitator routes

Current admin/facilitator write routes remain under existing admin protection and must not be unlocked by participant auth.

## Skill Command Mapping

| Command | Scope | Notes |
|---------|-------|-------|
| `/workshop` | Public first, authenticated when available | Must state clearly whether it is using fallback/public-only data or live event context |
| `/workshop login` | Participant-auth bootstrap | Redeems the shared event code into a short-lived participant session |
| `/workshop logout` | Participant-auth teardown | Clears the active participant session |
| `/workshop setup` | Public | Always available |
| `/workshop brief` | Public first, authenticated when available | Public brief content stays available; event-specific assignment can be layered later |
| `/workshop challenges` | Public first, authenticated when available | Public deck stays available; live completion context can be layered later |
| `/workshop team` | Participant-authenticated | Repo URLs and live checkpoint state are not public by default |
| `/workshop help` | Public first, authenticated when available | Coaching stays useful in fallback mode |
| `/workshop reference` | Public | Always available |
| `/workshop analyze` | Public/local | Works against the participant repo even without live event access |

## Error States

- `invalid_code`
- `expired_code`
- `expired_session`
- `participant event access required`
- `fallback mode`

## Session Transport Rules

- dashboard participant sessions are stored in a server-issued HTTP-only cookie
- skill-side session persistence should stay minimal and prefer renewable short-lived tokens over long-lived bearer state
- the event code must not be reused as the live bearer credential after redemption

## Logging Expectations

The private workshop-instance layer should log at least:

- redemption attempts
- successful session creation
- session expiry or invalidation
- failed protected lookups
- event-code rotation events
