# Data Model

**Feature**: Synapse Second-Brain App  
**Branch**: 001-synapse-second-brain  
**Date**: 2026-02-02

This document defines the database schema using Drizzle ORM conventions for SQLite.

---

## Schema Conventions

- **Primary Keys**: UUID v4 stored as text (e.g., `id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID())`)
- **Foreign Keys**: Named as `{table}_id` (e.g., `user_id`, `project_id`), stored as text (UUIDs)
- **Timestamps**: `created_at`, `updated_at` as ISO 8601 text strings
- **Booleans**: Stored as integers (0 = false, 1 = true)
- **Arrays/Objects**: Stored as JSON text
- **Enums**: Stored as text with check constraints
- **Authentication**: Better-auth manages user/session/account/verification tables

---

## Entity Definitions

### 1. Better-Auth Tables

Better-auth automatically creates and manages these tables via the Drizzle adapter:

```typescript
// These are managed by better-auth - DO NOT manually create
// Reference: https://www.better-auth.com/docs/adapters/drizzle

// user table (managed by better-auth)
export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// session table (managed by better-auth)
export const session = sqliteTable('session', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// account table (managed by better-auth)
export const account = sqliteTable('account', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }),
	password: text('password'), // For email/password authentication
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// verification table (managed by better-auth)
export const verification = sqliteTable('verification', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
});
```

**Notes**:

- Better-auth creates these tables automatically when configured with Drizzle adapter
- Do not modify these schemas manually - follow better-auth documentation
- The `user.id` is used as foreign key in all application tables below
- Email verification and password reset flows are handled by better-auth

---

### 2. EmailNotification

Tracks sent email notifications to prevent duplicates and enable audit trail.

```typescript
export const emailNotifications = sqliteTable('email_notifications', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	notification_type: text('notification_type').notNull(), // 'workout_reminder' | 'meditation_reminder' | 'visit_warning'
	entity_id: text('entity_id'), // ID of related workout_reminder, meditation_schedule, or person
	sent_at: text('sent_at').notNull(),
	email_subject: text('email_subject').notNull(),
	created_at: text('created_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `notification_type`: Type of notification sent
- `entity_id`: Optional reference to the entity that triggered the notification
- `sent_at`: When email was sent (ISO 8601 timestamp)
- `email_subject`: Subject line of sent email
- `created_at`: Record creation timestamp

**Indexes**:

- Composite index on `(user_id, notification_type, sent_at)` for deduplication queries
- Index on `entity_id` for entity-specific lookups

---

### 3. JournalEntry

Daily journal entries with optional metadata.

```typescript
export const journalEntries = sqliteTable('journal_entries', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD format
	content: text('content').notNull(),
	tags: text('tags'), // JSON array of strings
	location: text('location'), // Optional location string
	weather: text('weather'), // Optional weather JSON object
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `date`: Entry date (YYYY-MM-DD)
- `content`: Journal entry text
- `tags`: JSON array of tag strings (e.g., `["reflection", "gratitude"]`)
- `location`: Optional location (e.g., "San Francisco, CA")
- `weather`: Optional weather JSON (e.g., `{"temp": 72, "condition": "Sunny"}`)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp (for sync)

**Indexes**:

- Composite index on `(user_id, date)` for fast lookups
- Index on `updated_at` for sync queries

---

### 4. Project

User-defined project grouping for todos.

```typescript
export const projects = sqliteTable('projects', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color'), // Optional hex color for UI
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `name`: Project name (e.g., "Work", "Health", "Synapse Dev")
- `color`: Optional hex color for UI display (e.g., "#3B82F6")
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, name)` to prevent duplicates

---

### 5. TodoItem

Task with cadence, project assignment, and rich metadata.

```typescript
export const todoItems = sqliteTable('todo_items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	project_id: text('project_id').references(() => projects.id, {
		onDelete: 'set null'
	}),
	title: text('title').notNull(),
	description: text('description'),
	cadence: text('cadence').notNull(), // 'daily' | 'weekly' | 'monthly'
	due_date: text('due_date'), // Optional YYYY-MM-DD
	state: text('state').notNull().default('new'), // 'new' | 'in_progress' | 'blocked' | 'done'
	priority: integer('priority').notNull().default(2), // 1-4 (1=highest)
	tags: text('tags'), // JSON array of strings
	sub_steps: text('sub_steps'), // JSON array of {title: string, completed: boolean}
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')"),
	completed_at: text('completed_at')
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `project_id`: Optional foreign key to projects (UUID)
- `title`: Todo title
- `description`: Optional detailed description
- `cadence`: Task frequency (`daily`, `weekly`, `monthly`)
- `due_date`: Optional due date (YYYY-MM-DD)
- `state`: Lifecycle state (`new`, `in_progress`, `blocked`, `done`)
- `priority`: Priority level (1-4, where 1 is highest)
- `tags`: JSON array of tag strings (e.g., `["#urgent", "#waiting"]`)
- `sub_steps`: JSON array of sub-step objects (e.g., `[{title: "Research", completed: false}]`)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp
- `completed_at`: Completion timestamp (null if not done)

**Indexes**:

- Composite index on `(user_id, cadence, state)` for filtered views
- Index on `due_date` for reminders
- Index on `updated_at` for sync

---

### 6. WorkoutLog

Exercise session record.

```typescript
export const workoutLogs = sqliteTable('workout_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time: text('time'), // Optional HH:MM
	type: text('type').notNull(), // 'strength' | 'cardio' | 'yoga' | 'other'
	duration_minutes: integer('duration_minutes'),
	notes: text('notes'),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `date`: Workout date (YYYY-MM-DD)
- `time`: Optional workout time (HH:MM)
- `type`: Workout type (`strength`, `cardio`, `yoga`, `other`)
- `duration_minutes`: Optional duration in minutes
- `notes`: Optional notes
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, date)` for date-based queries

---

### 7. WorkoutExercise

Individual exercise within a strength workout.

```typescript
export const workoutExercises = sqliteTable('workout_exercises', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	workout_log_id: text('workout_log_id')
		.notNull()
		.references(() => workoutLogs.id, { onDelete: 'cascade' }),
	exercise_name: text('exercise_name').notNull(),
	sets: integer('sets'),
	reps: integer('reps'),
	weight_lbs: integer('weight_lbs'),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `workout_log_id`: Foreign key to workout_logs (UUID)
- `exercise_name`: Name of exercise (e.g., "Bench Press")
- `sets`: Number of sets
- `reps`: Number of reps per set
- `weight_lbs`: Weight in pounds
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Index on `workout_log_id`

---

### 8. MealLog

Meal record with calorie tracking.

```typescript
export const mealLogs = sqliteTable('meal_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time_of_day: text('time_of_day').notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
	description: text('description').notNull(),
	calories_estimate: integer('calories_estimate'),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `date`: Meal date (YYYY-MM-DD)
- `time_of_day`: Meal category (`breakfast`, `lunch`, `dinner`, `snack`)
- `description`: Meal description
- `calories_estimate`: Optional calorie estimate
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, date)` for daily summaries

---

### 9. WeightEntry

Weight tracking record.

```typescript
export const weightEntries = sqliteTable('weight_entries', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time: text('time'), // Optional HH:MM
	weight_lbs: integer('weight_lbs').notNull(),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `date`: Entry date (YYYY-MM-DD)
- `time`: Optional time of measurement (HH:MM)
- `weight_lbs`: Weight in pounds
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, date)` for trend queries

---

### 10. GoalWeight

Target weight for user.

```typescript
export const goalWeights = sqliteTable('goal_weights', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	target_weight_lbs: integer('target_weight_lbs').notNull(),
	set_date: text('set_date').notNull(), // YYYY-MM-DD
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table (unique)
- `target_weight_lbs`: Goal weight in pounds
- `set_date`: Date goal was set (YYYY-MM-DD)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Unique index on `user_id` (one active goal per user)

---

### 11. WorkoutReminder

Recurring workout reminder schedule.

```typescript
export const workoutReminders = sqliteTable('workout_reminders', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	workout_type: text('workout_type').notNull(),
	cadence: text('cadence').notNull(), // 'daily' | 'weekly' | 'custom'
	days_of_week: text('days_of_week'), // JSON array of numbers 0-6 (Sunday=0)
	time: text('time').notNull(), // HH:MM
	enabled: integer('enabled').notNull().default(1),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `workout_type`: Type of workout to remind for
- `cadence`: Reminder frequency (`daily`, `weekly`, `custom`)
- `days_of_week`: JSON array for weekly cadence (e.g., `[1, 3, 5]` for Mon/Wed/Fri)
- `time`: Reminder time (HH:MM)
- `enabled`: Whether reminder is active (0 or 1)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Index on `(user_id, enabled)` for active reminder queries

---

### 12. DailyCalorieTarget

Daily calorie goal.

```typescript
export const dailyCalorieTargets = sqliteTable('daily_calorie_targets', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	target_calories: integer('target_calories').notNull(),
	effective_date: text('effective_date').notNull(), // YYYY-MM-DD
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `target_calories`: Daily calorie goal
- `effective_date`: Date target takes effect (YYYY-MM-DD)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Unique index on `user_id` (one active target per user)

---

### 13. MeditationRoutine

Predefined or user-created meditation routine.

```typescript
export const meditationRoutines = sqliteTable('meditation_routines', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	link_url: text('link_url').notNull(),
	duration_minutes: integer('duration_minutes').notNull(),
	mood_tags: text('mood_tags').notNull(), // JSON array: ["Anxious", "Focused", etc.]
	is_predefined: integer('is_predefined').notNull().default(0),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table (null for predefined routines)
- `title`: Routine title
- `description`: Optional description
- `link_url`: External link to guided meditation
- `duration_minutes`: Duration in minutes
- `mood_tags`: JSON array of mood tags (e.g., `["Anxious", "Low Energy"]`)
- `is_predefined`: Whether this is a system-provided routine (0 or 1)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Index on `user_id`
- Index on `is_predefined` for filtering

**Mood Tag Options**: `Anxious`, `Low Energy`, `Focused`, `Pre-Sleep`, `General`

---

### 14. MeditationSchedule

Recurring meditation reminder.

```typescript
export const meditationSchedules = sqliteTable('meditation_schedules', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	routine_id: text('routine_id')
		.notNull()
		.references(() => meditationRoutines.id, { onDelete: 'cascade' }),
	cadence: text('cadence').notNull(), // 'daily' | 'weekly' | 'custom'
	days_of_week: text('days_of_week'), // JSON array of numbers 0-6
	time: text('time').notNull(), // HH:MM
	enabled: integer('enabled').notNull().default(1),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `routine_id`: Foreign key to meditation_routines (UUID)
- `cadence`: Schedule frequency (`daily`, `weekly`, `custom`)
- `days_of_week`: JSON array for weekly cadence (e.g., `[0, 6]` for Sun/Sat)
- `time`: Scheduled time (HH:MM)
- `enabled`: Whether schedule is active (0 or 1)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, enabled)`
- Index on `routine_id`

---

### 15. MeditationSession

Completed meditation session log.

```typescript
export const meditationSessions = sqliteTable('meditation_sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	routine_id: text('routine_id')
		.notNull()
		.references(() => meditationRoutines.id, { onDelete: 'cascade' }),
	completed_at: text('completed_at').notNull(),
	mood_rating: integer('mood_rating'), // 1-5 post-meditation mood
	notes: text('notes'),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `routine_id`: Foreign key to meditation_routines (UUID)
- `completed_at`: Completion timestamp
- `mood_rating`: Optional post-meditation mood (1-5 scale)
- `notes`: Optional reflection notes
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, completed_at)` for history queries
- Index on `routine_id`

---

### 16. Person

Individual to track visits with.

```typescript
export const people = sqliteTable('people', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `user_id`: Foreign key to better-auth user table
- `name`: Person's name
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(user_id, name)` to prevent duplicates

---

### 17. Visit

Visit record with companions and follow-up tracking.

```typescript
export const visits = sqliteTable('visits', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	person_id: text('person_id')
		.notNull()
		.references(() => people.id, { onDelete: 'cascade' }),
	user_id: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	time: text('time'), // Optional HH:MM
	companions: text('companions'), // JSON array of name strings
	notes: text('notes'),
	follow_up_date: text('follow_up_date'), // Optional YYYY-MM-DD
	created_at: text('created_at').notNull().default("datetime('now')"),
	updated_at: text('updated_at').notNull().default("datetime('now')")
});
```

**Fields**:

- `id`: Unique identifier (UUID)
- `person_id`: Foreign key to people (UUID)
- `user_id`: Foreign key to better-auth user table
- `date`: Visit date (YYYY-MM-DD)
- `time`: Optional visit time (HH:MM)
- `companions`: JSON array of companion names (e.g., `["Alice", "Bob"]`)
- `notes`: Optional visit notes
- `follow_up_date`: Optional follow-up date (YYYY-MM-DD)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Indexes**:

- Composite index on `(person_id, date)` for visit history
- Index on `user_id`
- Index on `updated_at` for sync

---

## Relationships

```
user (better-auth) (1) ──< (*) session (better-auth)
user (better-auth) (1) ──< (*) account (better-auth)
user (better-auth) (1) ──< (*) journalEntries
user (better-auth) (1) ──< (*) projects
user (better-auth) (1) ──< (*) todoItems
user (better-auth) (1) ──< (*) emailNotifications
projects (1) ──< (*) todoItems
user (better-auth) (1) ──< (*) workoutLogs
workoutLogs (1) ──< (*) workoutExercises
user (better-auth) (1) ──< (*) mealLogs
user (better-auth) (1) ──< (*) weightEntries
user (better-auth) (1) ─── (1) goalWeights
user (better-auth) (1) ──< (*) workoutReminders
user (better-auth) (1) ─── (1) dailyCalorieTargets
user (better-auth) (1) ──< (*) meditationRoutines
user (better-auth) (1) ──< (*) meditationSchedules
meditationRoutines (1) ──< (*) meditationSchedules
meditationRoutines (1) ──< (*) meditationSessions
user (better-auth) (1) ──< (*) meditationSessions
user (better-auth) (1) ──< (*) people
people (1) ──< (*) visits
user (better-auth) (1) ──< (*) visits
```

**Note**: All `user` references point to the better-auth `user` table (not a custom `users` table).

---

## Sync Strategy

All user-owned tables include `updated_at` timestamps for conflict resolution:

- Client sends changes with `updated_at`
- Server compares with stored `updated_at`
- Last-write-wins: keep record with latest timestamp
- Return merged state to client

**Sync Tables**: All application tables except better-auth managed tables (user, session, account, verification)

**UUID Benefits for Sync**:

- Client-generated UUIDs prevent ID collisions in offline scenarios
- No need for server-side ID allocation before syncing
- Simplifies offline-first architecture with IndexedDB

---

## Next Steps

- Implement Drizzle schema in `src/lib/server/db/schema.ts`
- Configure better-auth with Drizzle adapter (tables created automatically)
- Create initial migration for application tables with `drizzle-kit generate:sqlite`
- Apply migration with `drizzle-kit push:sqlite`
- Seed predefined meditation routines with UUID IDs
