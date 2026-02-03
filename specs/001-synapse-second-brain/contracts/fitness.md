# Fitness & Nutrition API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02

## Overview

Fitness and nutrition tracking with workouts, meals, weight tracking, goals, reminders, and visualizations.

---

## Weight Tracking

### GET `/fitness/weight`

View weight history and chart.

**Load Function**: `src/routes/(app)/fitness/weight/+page.server.ts`

**Response**:

```typescript
{
  entries: Array<{
    id: string;  // UUID
    date: string;
    time: string | null;
    weight_lbs: number;
    created_at: string;
  }>;
  goalWeight: {
    target_weight_lbs: number;
    set_date: string;
  } | null;
  stats: {
    currentWeight: number | null;
    startWeight: number | null;
    remainingToGoal: number | null;
    trend: 'up' | 'down' | 'stable';
  };
}
```

**Business Logic**:

1. Fetch all weight entries for user, order by date DESC
2. Fetch goal weight
3. Calculate stats: current (latest entry), start (oldest entry), remaining (current - goal)
4. Calculate trend (compare last 7 days to previous 7 days)
5. Return entries + goal + stats

---

### POST `/fitness/weight`

Log new weight entry.

**Form Action**: `?/logWeight`

**Request Body**:

```typescript
{
	date: string; // YYYY-MM-DD
	time: string; // HH:MM, optional
	weight_lbs: number; // Positive number
}
```

**Validation Schema**:

```typescript
const logWeightSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
	weight_lbs: z.number().positive('Weight must be positive')
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/weight
```

---

### POST `/fitness/weight/goal`

Set goal weight.

**Form Action**: `?/setGoal`

**Request Body**:

```typescript
{
	target_weight_lbs: number;
}
```

**Validation Schema**:

```typescript
const setGoalSchema = z.object({
	target_weight_lbs: z.number().positive()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/weight
```

**Business Logic**:

1. Validate form data
2. Get user ID
3. Upsert into `goal_weights` (replace existing goal)
4. Set `set_date` to today
5. Redirect to weight page

---

## Workout Tracking

### GET `/fitness/workouts`

List all workouts.

**Load Function**: `src/routes/(app)/fitness/workouts/+page.server.ts`

**Query Parameters**:

- `type` (optional): Filter by type (`strength`, `cardio`, `yoga`, `other`)
- `startDate`, `endDate` (optional): Date range

**Response**:

```typescript
{
	workouts: Array<{
		id: string; // UUID
		date: string;
		time: string | null;
		type: 'strength' | 'cardio' | 'yoga' | 'other';
		duration_minutes: number | null;
		notes: string | null;
		exercises: Array<{
			id: string; // UUID
			exercise_name: string;
			sets: number | null;
			reps: number | null;
			weight_lbs: number | null;
		}> | null; // Only for strength workouts
	}>;
}
```

**Business Logic**:

1. Query `workout_logs` with filters
2. For strength workouts, join with `workout_exercises`
3. Group exercises by workout
4. Order by date DESC
5. Return workouts with nested exercises

---

### GET `/fitness/workouts/[id]`

Get single workout with exercises.

**Load Function**: `src/routes/(app)/fitness/workouts/[id]/+page.server.ts`

**Response**:

```typescript
{
  workout: {
    id: string;  // UUID
    date: string;
    time: string | null;
    type: string;
    duration_minutes: number | null;
    notes: string | null;
    exercises: Array<{ ... }> | null;
  };
}
```

---

### POST `/fitness/workouts`

Log new workout.

**Form Action**: `?/logWorkout`

**Request Body**:

```typescript
{
	date: string;
	time: string;
	type: 'strength' | 'cardio' | 'yoga' | 'other';
	duration_minutes: number;
	notes: string;

	// For strength workouts:
	exercises: string; // JSON string of array
}
```

**Validation Schema**:

```typescript
const logWorkoutSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/)
		.optional(),
	type: z.enum(['strength', 'cardio', 'yoga', 'other']),
	duration_minutes: z.number().int().positive().optional(),
	notes: z.string().optional(),
	exercises: z.string().optional() // Will parse as JSON for strength
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/workouts/[id]
```

**Business Logic**:

1. Validate form data
2. Insert into `workout_logs`
3. If type='strength' and exercises provided:
   - Parse exercises JSON array
   - Insert each exercise into `workout_exercises`
4. Redirect to workout detail

**Exercises JSON Format**:

```json
[
	{ "exercise_name": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
	{ "exercise_name": "Squats", "sets": 4, "reps": 8, "weight_lbs": 185 }
]
```

---

### PUT `/fitness/workouts/[id]`

Update workout.

**Form Action**: `?/updateWorkout`

**Business Logic**:

1. Validate form data
2. Verify workout belongs to user
3. Update `workout_logs`
4. If exercises changed (strength):
   - Delete existing exercises
   - Insert new exercises
5. Redirect to workout detail

---

### DELETE `/fitness/workouts/[id]`

Delete workout (cascades to exercises).

**Form Action**: `?/deleteWorkout`

---

## Workout Reminders

### GET `/fitness/reminders`

List all workout reminders.

**Load Function**: `src/routes/(app)/fitness/reminders/+page.server.ts`

**Response**:

```typescript
{
	reminders: Array<{
		id: string; // UUID
		workout_type: string;
		cadence: 'daily' | 'weekly' | 'custom';
		days_of_week: number[] | null; // [0-6, Sunday=0]
		time: string; // HH:MM
		enabled: boolean;
	}>;
}
```

---

### POST `/fitness/reminders`

Create workout reminder.

**Form Action**: `?/createReminder`

**Request Body**:

```typescript
{
	workout_type: string;
	cadence: 'daily' | 'weekly' | 'custom';
	days_of_week: string; // Comma-separated numbers, e.g., "1,3,5"
	time: string; // HH:MM
}
```

**Validation Schema**:

```typescript
const createReminderSchema = z.object({
	workout_type: z.string().min(1),
	cadence: z.enum(['daily', 'weekly', 'custom']),
	days_of_week: z.string().optional(),
	time: z.string().regex(/^\d{2}:\d{2}$/)
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/reminders
```

**Business Logic**:

1. Validate form data
2. Parse `days_of_week` into JSON array
3. Insert into `workout_reminders` with `enabled=1`
4. Redirect to reminders list

---

### PUT `/fitness/reminders/[id]`

Update reminder or toggle enabled.

**Form Action**: `?/updateReminder` or `?/toggleReminder`

---

### DELETE `/fitness/reminders/[id]`

Delete reminder.

**Form Action**: `?/deleteReminder`

---

## Meal Tracking

### GET `/fitness/meals`

List all meals for a date (or date range).

**Load Function**: `src/routes/(app)/fitness/meals/+page.server.ts`

**Query Parameters**:

- `date` (optional): Filter by date (default: today)

**Response**:

```typescript
{
  meals: Array<{
    id: string;  // UUID
    date: string;
    time_of_day: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    calories_estimate: number | null;
  }>;
  dailyTarget: {
    target_calories: number;
  } | null;
  dailyTotal: number; // Sum of calories for the date
  progress: number;   // (dailyTotal / target) * 100
}
```

**Business Logic**:

1. Query `meal_logs` for date
2. Fetch `daily_calorie_targets` for user
3. Calculate `dailyTotal` (sum of calories_estimate)
4. Calculate progress percentage
5. Return meals + target + totals

---

### POST `/fitness/meals`

Log new meal.

**Form Action**: `?/logMeal`

**Request Body**:

```typescript
{
	date: string;
	time_of_day: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	description: string;
	calories_estimate: number;
}
```

**Validation Schema**:

```typescript
const logMealSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time_of_day: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
	description: z.string().min(1),
	calories_estimate: z.number().int().positive().optional()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/meals?date=[date]
```

---

### PUT `/fitness/meals/[id]`

Update meal.

**Form Action**: `?/updateMeal`

---

### DELETE `/fitness/meals/[id]`

Delete meal.

**Form Action**: `?/deleteMeal`

---

## Daily Calorie Target

### POST `/fitness/meals/target`

Set daily calorie target.

**Form Action**: `?/setTarget`

**Request Body**:

```typescript
{
	target_calories: number;
}
```

**Validation Schema**:

```typescript
const setTargetSchema = z.object({
	target_calories: z.number().int().positive()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /fitness/meals
```

**Business Logic**:

1. Upsert into `daily_calorie_targets` (replace existing)
2. Set `effective_date` to today
3. Redirect to meals page

---

## Visualizations

### Weight Over Time Chart

**Component**: `WeightChart.svelte`

**Data**:

```typescript
{
  labels: string[]; // Dates (YYYY-MM-DD)
  data: number[];   // Weight values
  goal: number | null; // Goal weight (horizontal line)
}
```

**Chart Type**: Line chart (Chart.js)

**Features**:

- X-axis: Date
- Y-axis: Weight (lbs)
- Goal line (dashed horizontal)
- Trend line (optional: linear regression)

---

### Calorie Progress Bar

**Component**: `CalorieProgress.svelte`

**Data**:

```typescript
{
	consumed: number;
	target: number;
	percentage: number;
}
```

**UI**:

- Progress bar (Tailwind or Shadcn)
- Color-coded: green (<100%), yellow (100-110%), red (>110%)
- Text: "1200 / 2000 cal (60%)"

---

### Workout Volume Trend

**Component**: `WorkoutVolumeChart.svelte` (future enhancement)

**Data**: Sum of (sets × reps × weight) per week

**Chart Type**: Bar chart

---

## Example Flow

**Log Weight**:

1. User navigates to `/fitness/weight`
2. Clicks "Log Weight"
3. Form auto-fills: date (today)
4. User enters weight
5. Submits → POST `/fitness/weight?/logWeight`
6. Server inserts weight entry
7. Redirects to `/fitness/weight`, chart updates

**Set Goal Weight**:

1. User at `/fitness/weight` clicks "Set Goal"
2. Modal or inline form
3. User enters target weight
4. Submits → POST `/fitness/weight/goal?/setGoal`
5. Server upserts goal
6. Redirects, "Remaining to Goal" updates

**Log Workout**:

1. User navigates to `/fitness/workouts/new`
2. Selects type: "Strength"
3. Adds exercises dynamically:
   - Exercise name, sets, reps, weight
4. Submits → POST `/fitness/workouts?/logWorkout`
5. Server inserts workout + exercises
6. Redirects to `/fitness/workouts/[id]`

**Create Reminder**:

1. User navigates to `/fitness/reminders`
2. Clicks "New Reminder"
3. Form: workout type, cadence, days, time
4. Submits → POST `/fitness/reminders?/createReminder`
5. Server inserts reminder
6. Redirects to reminders list

**Log Meal**:

1. User navigates to `/fitness/meals`
2. Clicks "Log Meal"
3. Form: time of day, description, calories
4. Submits → POST `/fitness/meals?/logMeal`
5. Server inserts meal
6. Redirects, progress bar updates

**Set Calorie Target**:

1. User at `/fitness/meals` clicks "Set Target"
2. Enters target calories
3. Submits → POST `/fitness/meals/target?/setTarget`
4. Server upserts target
5. Redirects, progress bar appears
