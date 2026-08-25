# External API (`/api/v1`)

A small JSON API for driving Synapse from outside the web UI — a personal AI assistant, a
script, or a future mobile client. Authenticated with API keys, not session cookies, so an
external tool never needs your personal login.

## Authentication

Every request must include:

```
Authorization: Bearer <key>
```

- The key is **only** ever read from the `Authorization` header. It is never accepted as a
  query parameter, and a browser session cookie is never accepted as a fallback — the two
  auth paths are fully independent.
- Keys are created and revoked from **Admin → API Keys** (`/admin`) in the web UI, by an
  admin account. The plaintext key is shown exactly once, at creation time — only a hash is
  stored, so if you lose it you'll need to revoke it and create a new one.
- Each key is scoped to a specific set of permissions (see below) and can optionally expire.
- Each key has its own rate limit; repeated requests beyond it return `429`.

## Scopes

| Scope            | Grants                                                 |
| ---------------- | ------------------------------------------------------ |
| `tasks:read`     | `GET /api/v1/tasks`, `GET /api/v1/tasks/{id}`          |
| `tasks:write`    | `POST /api/v1/tasks`, `PATCH /api/v1/tasks/{id}`       |
| `mood:read`      | `GET /api/v1/mood`                                     |
| `mood:write`     | `POST /api/v1/mood`                                    |
| `workouts:read`  | `GET /api/v1/workouts`, `GET /api/v1/workouts/{id}`    |
| `workouts:write` | `POST /api/v1/workouts`, `PATCH /api/v1/workouts/{id}` |
| `meals:read`     | `GET /api/v1/meals`, `GET /api/v1/meals/{id}`          |
| `meals:write`    | `POST /api/v1/meals`, `PATCH /api/v1/meals/{id}`       |
| `visits:read`    | `GET /api/v1/visits`, `GET /api/v1/visits/{id}`        |
| `visits:write`   | `POST /api/v1/visits`, `PATCH /api/v1/visits/{id}`     |
| `people:read`    | `GET /api/v1/people`                                   |

A key only needs the scopes for the endpoints it's meant to call — pick the narrowest set
that covers the intended use. `people:read` exists mainly to resolve a `personId` for the
visits endpoints — a visit is tied to an existing person record, not a free-text name.

## Response shape

Every response is one of exactly two shapes:

```jsonc
// Success
{ "data": /* endpoint-specific payload */ }

// Failure
{ "error": { "code": "some_code", "message": "Human-readable explanation" } }
```

| HTTP status | `error.code`                                             | Meaning                                                                                                                                                                              |
| ----------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 401         | `missing_header` / `invalid_scheme` / `malformed_header` | No `Authorization` header, wrong scheme, or malformed value                                                                                                                          |
| 401         | `invalid_api_key`                                        | Key doesn't exist, is disabled, expired, or lacks the scope the endpoint requires (deliberately indistinguishable from an unknown key, so a caller can't probe which reason applies) |
| 404         | `not_found`                                              | The record doesn't exist, or doesn't belong to this key's user                                                                                                                       |
| 429         | `rate_limited`                                           | This key's rate limit or request quota was exceeded — wait and retry                                                                                                                 |
| 400         | `validation_failed`                                      | Request body or query parameters failed validation                                                                                                                                   |
| 400         | `invalid_json`                                           | Request body wasn't valid JSON                                                                                                                                                       |
| 500         | `internal_error`                                         | Something went wrong server-side; check the server logs                                                                                                                              |

Every write — successful or failed — is recorded in an internal audit log with the key that
made it, so activity from an external tool is traceable if something looks wrong.

## CORS

No `Access-Control-Allow-Origin` header is ever returned. This API is for server-to-server
or script use (curl, a backend job, an assistant's tool call) — not for calling directly
from browser JavaScript on another site.

## Endpoints

### Tasks

`GET /api/v1/tasks` — requires `tasks:read`. Query params (all optional): `state`
(`new`/`in_progress`/`on_hold`/`blocked`/`done`), `priority` (1-4), `limit` (1-200, default 50).

`GET /api/v1/tasks/{id}` — requires `tasks:read`.

`POST /api/v1/tasks` — requires `tasks:write`. Body:

```bash
curl -X POST -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{
    "title": "Renew passport",
    "description": "Expires next spring",
    "tags": ["errands", "urgent"],
    "dueDate": "2026-09-01",
    "priority": 2,
    "state": "new"
  }' \
  "https://synapse.example.com/api/v1/tasks"
```

`PATCH /api/v1/tasks/{id}` — requires `tasks:write`. Body is a partial update (any subset of
the `POST` fields). Returns `200` with the updated task.

### Mood

`GET /api/v1/mood` — requires `mood:read`. Query params: `startDate`/`endDate`
(`YYYY-MM-DD`, must be given together).

`POST /api/v1/mood` — requires `mood:write`. There's at most one mood log per day, so this
always creates-or-updates the entry for `date`:

```bash
curl -X POST -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{ "date": "2026-08-25", "mood": "happy", "notes": "Slept well" }' \
  "https://synapse.example.com/api/v1/mood"
```

### Workouts

`GET /api/v1/workouts` — requires `workouts:read`. Query params: `startDate`/`endDate`,
`type`, `limit` (1-200, default 50).

`GET /api/v1/workouts/{id}` — requires `workouts:read`. Returns the workout with its
`exercises` array.

`POST /api/v1/workouts` — requires `workouts:write`. Body:

```bash
curl -X POST -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{
    "date": "2026-08-25",
    "time": "07:30",
    "type": "strength",
    "durationMinutes": 45,
    "exercises": [{ "exerciseName": "Squat", "sets": 3, "reps": 5, "weightLbs": 185 }]
  }' \
  "https://synapse.example.com/api/v1/workouts"
```

`PATCH /api/v1/workouts/{id}` — requires `workouts:write`. Passing `exercises` replaces the
workout's full exercise list.

### Meals

`GET /api/v1/meals` — requires `meals:read`. Query params: `startDate`/`endDate`,
`timeOfDay` (`breakfast`/`lunch`/`dinner`/`snack`), `limit` (1-200, default 50).

`GET /api/v1/meals/{id}` — requires `meals:read`.

`POST /api/v1/meals` — requires `meals:write`. Body:

```bash
curl -X POST -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{ "date": "2026-08-25", "timeOfDay": "lunch", "description": "Chicken salad", "caloriesEstimate": 450 }' \
  "https://synapse.example.com/api/v1/meals"
```

`PATCH /api/v1/meals/{id}` — requires `meals:write`.

### People

`GET /api/v1/people` — requires `people:read`. Query params: `includeArchived` (`true`/`false`,
default `false`). Returns `{ id, name, isArchived, scheduledVisitDate }` for each person — use
the `id` as `personId` when creating a visit.

```bash
curl -H "Authorization: Bearer sk_live_xxx" "https://synapse.example.com/api/v1/people"
```

### Visits

`GET /api/v1/visits` — requires `visits:read`. Query params: `personId` (optional), `limit`
(1-200, default 50).

`GET /api/v1/visits/{id}` — requires `visits:read`.

`POST /api/v1/visits` — requires `visits:write`. Body:

```bash
curl -X POST -H "Authorization: Bearer sk_live_xxx" -H "Content-Type: application/json" \
  -d '{
    "personId": "abc123",
    "date": "2026-08-25",
    "companions": ["Alex"],
    "notes": "Coffee catch-up",
    "followUpDate": "2026-09-25"
  }' \
  "https://synapse.example.com/api/v1/visits"
```

`PATCH /api/v1/visits/{id}` — requires `visits:write`.

## Out of scope

- OAuth2/third-party app authorization — API keys are enough for a single-user "give my own
  tool a key" setup
- Write access to user/auth-management endpoints
- Webhooks
- Delete endpoints — delete records from the web UI
