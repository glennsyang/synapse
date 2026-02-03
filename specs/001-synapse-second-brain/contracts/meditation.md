# Meditation API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02

## Overview

Meditation routine library (predefined + user-created), scheduling with reminders, completion tracking, and mood ratings.

---

## Routine Library

### GET `/meditation`

View meditation routine library.

**Load Function**: `src/routes/(app)/meditation/+page.server.ts`

**Query Parameters**:

- `mood` (optional): Filter by mood tag (`Anxious`, `Low Energy`, `Focused`, `Pre-Sleep`, `General`)
- `type` (optional): Filter by type (`predefined`, `user-created`, `all`) - default: `all`

**Response**:

```typescript
{
	routines: Array<{
		id: string; // UUID
		title: string;
		description: string | null;
		link_url: string;
		duration_minutes: number;
		mood_tags: string[]; // ["Anxious", "Focused"]
		is_predefined: boolean;
		created_at: string;
	}>;
	schedules: Array<{
		id: string; // UUID
		routine_id: string; // UUID
		cadence: 'daily' | 'weekly' | 'custom';
		days_of_week: number[] | null;
		time: string;
		enabled: boolean;
	}>;
}
```

**Business Logic**:

1. Query `meditation_routines` for user (user_id) and predefined (user_id IS NULL)
2. Apply filters (mood, type)
3. Parse `mood_tags` JSON
4. Fetch all schedules for user
5. Return routines + schedules

---

### GET `/meditation/[id]`

Get single routine detail.

**Load Function**: `src/routes/(app)/meditation/[id]/+page.server.ts`

**Response**:

```typescript
{
  routine: {
    id: string;  // UUID
    title: string;
    description: string | null;
    link_url: string;
    duration_minutes: number;
    mood_tags: string[];
    is_predefined: boolean;
  };
  sessions: Array<{
    id: string;  // UUID
    completed_at: string;
    mood_rating: number | null;
    notes: string | null;
  }>;
  schedule: {
    id: string;  // UUID
    cadence: string;
    days_of_week: number[] | null;
    time: string;
    enabled: boolean;
  } | null;
}
```

**Business Logic**:

1. Query routine by ID
2. If is_predefined=false, verify user_id matches current user
3. Fetch all sessions for this routine + user
4. Fetch schedule for this routine + user (if exists)
5. Return routine + sessions + schedule

---

### POST `/meditation`

Create user-created routine.

**Form Action**: `?/createRoutine`

**Request Body**:

```typescript
{
	title: string;
	description: string;
	link_url: string;
	duration_minutes: number;
	mood_tags: string; // Comma-separated: "Anxious,Focused"
}
```

**Validation Schema**:

```typescript
const createRoutineSchema = z.object({
	title: z.string().min(1).max(100),
	description: z.string().optional(),
	link_url: z.string().url('Invalid URL'),
	duration_minutes: z.number().int().positive(),
	mood_tags: z.string().min(1) // Will parse into array
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /meditation/[id]
```

**Business Logic**:

1. Validate form data
2. Get user ID
3. Parse `mood_tags` into JSON array
4. Validate mood tags against allowed values: `Anxious`, `Low Energy`, `Focused`, `Pre-Sleep`, `General`
5. Insert into `meditation_routines` with `is_predefined=0`
6. Redirect to routine detail

---

### PUT `/meditation/[id]`

Update user-created routine.

**Form Action**: `?/updateRoutine`

**Business Logic**:

1. Validate form data
2. Verify routine is user-created and belongs to user
3. Parse mood_tags
4. Update `meditation_routines`
5. Redirect to routine detail

---

### DELETE `/meditation/[id]`

Delete user-created routine.

**Form Action**: `?/deleteRoutine`

**Business Logic**:

1. Verify routine is user-created and belongs to user
2. Delete from `meditation_routines` (cascades to schedules and sessions)
3. Redirect to meditation library

---

## Scheduling & Reminders

### POST `/meditation/[id]/schedule`

Create or update schedule for a routine.

**Form Action**: `?/createSchedule`

**Request Body**:

```typescript
{
	cadence: 'daily' | 'weekly' | 'custom';
	days_of_week: string; // Comma-separated numbers: "0,1,5" (Sun,Mon,Fri)
	time: string; // HH:MM
}
```

**Validation Schema**:

```typescript
const createScheduleSchema = z.object({
	cadence: z.enum(['daily', 'weekly', 'custom']),
	days_of_week: z.string().optional(), // Required for weekly/custom
	time: z.string().regex(/^\d{2}:\d{2}$/)
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /meditation/[id]
```

**Business Logic**:

1. Validate form data
2. Get user ID and routine ID
3. Parse `days_of_week` into JSON array
4. Upsert into `meditation_schedules` (replace existing schedule for this routine+user)
5. Set `enabled=1`
6. Redirect to routine detail

---

### PUT `/meditation/schedules/[id]`

Update schedule.

**Form Action**: `?/updateSchedule`

---

### POST `/meditation/schedules/[id]/toggle`

Toggle schedule enabled/disabled.

**Form Action**: `?/toggleSchedule`

**Business Logic**:

1. Get schedule by ID
2. Verify belongs to user
3. Toggle `enabled` (0 → 1 or 1 → 0)
4. Update `meditation_schedules`
5. Redirect to meditation library

---

### DELETE `/meditation/schedules/[id]`

Delete schedule.

**Form Action**: `?/deleteSchedule`

---

## Session Tracking

### POST `/meditation/[id]/complete`

Mark routine as completed (log session).

**Form Action**: `?/completeSession`

**Request Body**:

```typescript
{
	mood_rating: number; // 1-5, optional
	notes: string; // Optional
}
```

**Validation Schema**:

```typescript
const completeSessionSchema = z.object({
	mood_rating: z.number().int().min(1).max(5).optional(),
	notes: z.string().optional()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /meditation/history
```

**Business Logic**:

1. Validate form data
2. Get user ID and routine ID
3. Insert into `meditation_sessions` with `completed_at=now()`
4. Redirect to meditation history

---

### GET `/meditation/history`

View meditation session history.

**Load Function**: `src/routes/(app)/meditation/history/+page.server.ts`

**Response**:

```typescript
{
	sessions: Array<{
		id: string; // UUID
		routine: {
			id: string; // UUID
			title: string;
			duration_minutes: number;
		};
		completed_at: string;
		mood_rating: number | null;
		notes: string | null;
	}>;
}
```

**Business Logic**:

1. Query `meditation_sessions` for user
2. Join with `meditation_routines` to get routine title
3. Order by `completed_at` DESC
4. Return sessions with routine details

---

### DELETE `/meditation/sessions/[id]`

Delete session log.

**Form Action**: `?/deleteSession`

---

## Reminder Notifications

**Background Job**: Daily cron at user's scheduled times

**Logic**:

1. Query `meditation_schedules` where `enabled=1`
2. For each schedule, check if today matches cadence/days_of_week
3. If match, send notification at scheduled time
4. Notification includes: routine title, duration, link

**Missed Session Nudge**:

1. If scheduled time passed and no session logged for today → send gentle nudge
2. Check: `meditation_sessions` with `completed_at` on schedule's date
3. If none found, send notification: "You missed your {routine} session today"

**Implementation Options**:

- fly.io scheduled task (cron)
- In-app notification (banner/toast)
- Future: Email/push notifications

---

## Predefined Routines

Seed data for initial routines:

```typescript
const predefinedRoutines = [
	{
		title: '5-Minute Breath Awareness',
		description: 'Focus on your breath to center your mind',
		link_url: 'https://example.com/breath-awareness',
		duration_minutes: 5,
		mood_tags: ['Focused', 'General']
	},
	{
		title: 'Body Scan for Sleep',
		description: 'Progressive relaxation for better sleep',
		link_url: 'https://example.com/body-scan',
		duration_minutes: 15,
		mood_tags: ['Pre-Sleep']
	},
	{
		title: 'Anxiety Relief Breathing',
		description: '4-7-8 breathing technique for anxiety',
		link_url: 'https://example.com/anxiety-relief',
		duration_minutes: 10,
		mood_tags: ['Anxious']
	},
	{
		title: 'Morning Energy Boost',
		description: 'Energizing visualization for the day ahead',
		link_url: 'https://example.com/energy-boost',
		duration_minutes: 8,
		mood_tags: ['Low Energy']
	},
	{
		title: 'Mindful Walking',
		description: 'Walking meditation for active mindfulness',
		link_url: 'https://example.com/walking',
		duration_minutes: 10,
		mood_tags: ['General']
	}
];
```

**Migration**: Insert into `meditation_routines` with `user_id=NULL` and `is_predefined=1`

---

## UI Components

### RoutineLibrary.svelte

- Grid of routine cards
- Filter by mood tags (dropdown or chips)
- Filter by type (predefined vs user-created)
- Click card → navigate to detail

### RoutineCard.svelte

- Display title, duration, mood tags
- "Schedule" button → open schedule modal
- "Complete Now" button → mark as completed
- Edit/Delete buttons (user-created only)

### RoutineForm.svelte

- Fields: title, description, link_url, duration, mood_tags
- Mood tags as multi-select checkboxes
- Submit → create or update routine

### ScheduleForm.svelte

- Fields: cadence, days_of_week, time
- Days of week as checkboxes (for weekly/custom)
- Time picker
- Submit → create or update schedule

### SessionLog.svelte

- List of completed sessions
- Each row: routine title, date/time, mood rating, notes
- Delete button per session

---

## Example Flow

**Browse Routines**:

1. User navigates to `/meditation`
2. Load function fetches predefined + user-created routines
3. User filters by mood: "Anxious"
4. Reloads with `?mood=Anxious`
5. Click routine → navigate to `/meditation/[id]`

**Create Routine**:

1. User at `/meditation` clicks "Create Routine"
2. Navigate to `/meditation/new`
3. Form: title, description, link, duration, mood tags
4. Submits → POST `/meditation?/createRoutine`
5. Server validates, inserts routine
6. Redirects to `/meditation/[id]`

**Schedule Routine**:

1. User at `/meditation/[id]` clicks "Schedule"
2. Modal opens with schedule form
3. Selects: daily, time 07:00
4. Submits → POST `/meditation/[id]/schedule?/createSchedule`
5. Server inserts/updates schedule
6. Modal closes, schedule badge appears on routine card

**Complete Session**:

1. User receives reminder notification at 07:00
2. Clicks "Complete Now" on routine card
3. Modal opens: mood rating (1-5), notes (optional)
4. Submits → POST `/meditation/[id]/complete?/completeSession`
5. Server logs session with timestamp
6. Redirects to `/meditation/history`
7. Session appears in history log

**View History**:

1. User navigates to `/meditation/history`
2. Load function fetches all sessions for user
3. Display as table: Date, Routine, Duration, Mood, Notes
4. User can delete session if logged by mistake
