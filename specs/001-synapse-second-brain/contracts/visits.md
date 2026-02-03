# Visits API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02

## Overview

Track visits to people with status indicators (green/yellow/red) based on time since last visit, and reminders for upcoming status transitions.

---

## People Management

### GET `/visits`

List all people with visit status.

**Load Function**: `src/routes/(app)/visits/+page.server.ts`

**Query Parameters**:

- `status` (optional): Filter by status (`green`, `yellow`, `red`)

**Response**:

```typescript
{
	people: Array<{
		id: string; // UUID
		name: string;
		lastVisit: {
			date: string;
			companions: string[] | null;
		} | null;
		status: 'green' | 'yellow' | 'red' | 'none'; // 'none' if no visits yet
		daysSinceLastVisit: number | null;
		daysUntilStatusChange: number | null; // Days until yellow or red
		created_at: string;
	}>;
}
```

**Business Logic**:

1. Query `people` for user
2. For each person, query latest visit from `visits`
3. Calculate `daysSinceLastVisit` (today - last visit date)
4. Calculate status:
   - No visits: `none`
   - 0–<6 months: `green`
   - 6–<12 months: `yellow`
   - ≥12 months: `red`
5. Calculate `daysUntilStatusChange`:
   - Green: days until 6 months
   - Yellow: days until 12 months
   - Red: null
6. Order by status (red, yellow, green, none), then by daysSinceLastVisit DESC
7. Return people with status calculations

---

### GET `/visits/[personId]`

Get person detail with visit history.

**Load Function**: `src/routes/(app)/visits/[personId]/+page.server.ts`

**Response**:

```typescript
{
	person: {
		id: string; // UUID
		name: string;
		status: 'green' | 'yellow' | 'red' | 'none';
		daysSinceLastVisit: number | null;
	}
	visits: Array<{
		id: string; // UUID
		date: string;
		time: string | null;
		companions: string[] | null;
		notes: string | null;
		follow_up_date: string | null;
		created_at: string;
	}>;
}
```

**Business Logic**:

1. Query person by ID, verify belongs to user
2. Calculate status from latest visit
3. Query all visits for person, order by date DESC
4. Parse `companions` JSON
5. Return person + visits

---

### POST `/visits/people`

Add new person.

**Form Action**: `?/addPerson`

**Request Body**:

```typescript
{
	name: string;
}
```

**Validation Schema**:

```typescript
const addPersonSchema = z.object({
	name: z.string().min(1).max(100)
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /visits/[personId]
```

**Business Logic**:

1. Validate form data
2. Get user ID
3. Check if person name already exists for user → error (optional: allow duplicates)
4. Insert into `people`
5. Redirect to person detail

---

### PUT `/visits/people/[personId]`

Update person name.

**Form Action**: `?/updatePerson`

**Request Body**:

```typescript
{
	name: string;
}
```

---

### DELETE `/visits/people/[personId]`

Delete person (cascades to visits).

**Form Action**: `?/deletePerson`

**Business Logic**:

1. Verify person belongs to user
2. Delete from `people` (cascades to `visits` via foreign key)
3. Redirect to `/visits`

---

## Visit Tracking

### POST `/visits/[personId]/log`

Log new visit.

**Form Action**: `?/logVisit`

**Request Body**:

```typescript
{
	date: string; // YYYY-MM-DD
	time: string; // HH:MM, optional
	companions: string; // Comma-separated names, optional
	notes: string; // Optional
	follow_up_date: string; // YYYY-MM-DD, optional
}
```

**Validation Schema**:

```typescript
const logVisitSchema = z
	.object({
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		time: z
			.string()
			.regex(/^\d{2}:\d{2}$/)
			.optional(),
		companions: z.string().optional(),
		notes: z.string().optional(),
		follow_up_date: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional()
	})
	.refine(
		(data) => {
			if (data.follow_up_date && data.date) {
				return new Date(data.follow_up_date) >= new Date(data.date);
			}
			return true;
		},
		{
			message: 'Follow-up date must be on or after visit date',
			path: ['follow_up_date']
		}
	);
```

**Success Response** (HTTP 303 redirect):

```
Location: /visits/[personId]
```

**Business Logic**:

1. Validate form data
2. Get user ID and person ID
3. Verify person belongs to user
4. Parse `companions` into JSON array (split by comma, trim)
5. Insert into `visits`
6. Redirect to person detail (status will update automatically)

---

### PUT `/visits/[visitId]`

Update visit.

**Form Action**: `?/updateVisit`

**Business Logic**:

1. Validate form data
2. Verify visit belongs to user (check person_id → user_id)
3. Parse companions
4. Update `visits` with new `updated_at`
5. Redirect to person detail

---

### DELETE `/visits/[visitId]`

Delete visit.

**Form Action**: `?/deleteVisit`

**Business Logic**:

1. Verify visit belongs to user
2. Delete from `visits`
3. Redirect to person detail (status may change after deletion)

---

## Status Calculation

**Helper Function**:

```typescript
function calculateVisitStatus(lastVisitDate: string | null): {
	status: 'green' | 'yellow' | 'red' | 'none';
	daysSince: number | null;
	daysUntilChange: number | null;
} {
	if (!lastVisitDate) {
		return { status: 'none', daysSince: null, daysUntilChange: null };
	}

	const today = new Date();
	const lastVisit = new Date(lastVisitDate);
	const daysSince = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
	const monthsSince = daysSince / 30.44; // Average days per month

	let status: 'green' | 'yellow' | 'red';
	let daysUntilChange: number | null;

	if (monthsSince < 6) {
		status = 'green';
		daysUntilChange = Math.ceil(182.5 - daysSince); // ~6 months
	} else if (monthsSince < 12) {
		status = 'yellow';
		daysUntilChange = Math.ceil(365 - daysSince); // ~12 months
	} else {
		status = 'red';
		daysUntilChange = null;
	}

	return { status, daysSince, daysUntilChange };
}
```

**Note**: Use `differenceInMonths` from `date-fns` for more accurate month calculations.

---

## Reminder Notifications

**Background Job**: Daily cron at 9:00 AM user local time

**Logic**:

1. Query all people for all users
2. For each person, get latest visit
3. Calculate `daysUntilChange`
4. If `daysUntilChange <= 7` AND reminder not sent in last 7 days:
   - Send notification: "Reminder: {name} will turn {yellow/red} in {days} days"
   - Log notification in `visit_notifications` table (future enhancement)
5. If person is already red and no visits in last 30 days:
   - Send reminder: "You haven't visited {name} in over a year"

**Notification Table** (future enhancement):

```typescript
export const visitNotifications = sqliteTable('visit_notifications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	user_id: integer('user_id')
		.notNull()
		.references(() => users.id),
	person_id: integer('person_id')
		.notNull()
		.references(() => people.id),
	notification_type: text('notification_type').notNull(), // 'warning_7_days' | 'overdue'
	sent_at: text('sent_at').notNull(),
	created_at: text('created_at').notNull().default("datetime('now')")
});
```

---

## UI Components

### PersonList.svelte

- List/grid of person cards
- Each card shows: name, status badge, days since last visit
- Filter by status (dropdown or tabs)
- Click card → navigate to person detail

### PersonCard.svelte

- Display name prominently
- Status badge (green/yellow/red with icons/colors)
- Last visit date
- Days since last visit
- "Log Visit" quick action button

### StatusBadge.svelte

- Color-coded badge:
  - Green: bg-green-100, text-green-800
  - Yellow: bg-yellow-100, text-yellow-800
  - Red: bg-red-100, text-red-800
  - None: bg-gray-100, text-gray-800
- Icon (optional):
  - Green: ✓
  - Yellow: ⚠
  - Red: ✗

### VisitForm.svelte

- Fields: date, time, companions, notes, follow_up_date
- Date picker (default: today)
- Companions as comma-separated input (with chips preview)
- Notes textarea
- Follow-up date picker
- Submit → create or update visit

### VisitHistory.svelte

- Table of visits for a person
- Columns: Date, Companions, Notes, Follow-up, Actions
- Row click → expand to show full notes
- Edit/Delete buttons per visit

---

## Example Flow

**Add Person**:

1. User at `/visits` clicks "Add Person"
2. Modal or navigate to `/visits/new`
3. Form: name
4. Submits → POST `/visits/people?/addPerson`
5. Server inserts person
6. Redirects to `/visits/[personId]` (status: none)

**Log Visit**:

1. User at `/visits/[personId]` clicks "Log Visit"
2. Modal opens with visit form
3. Form: date (today), companions ("Alice, Bob"), notes
4. Submits → POST `/visits/[personId]/log?/logVisit`
5. Server inserts visit
6. Modal closes, status updates to green
7. Visit appears in history table

**View Status**:

1. User navigates to `/visits`
2. Load function calculates status for all people
3. People sorted by status (red first)
4. User sees:
   - John: Red badge, 400 days since last visit
   - Mary: Yellow badge, 210 days since last visit
   - Alice: Green badge, 30 days since last visit

**Receive Reminder**:

1. Background job runs at 9:00 AM
2. Checks: Mary's last visit was 203 days ago (7 days until yellow→red)
3. Sends notification: "Reminder: Mary will turn red in 7 days"
4. User sees in-app notification banner
5. Clicks notification → navigate to `/visits/[maryId]`
6. User logs new visit → status stays yellow (resets clock)

**Filter by Status**:

1. User at `/visits` selects "Red" filter
2. Reloads with `?status=red`
3. Load function filters people where status='red'
4. Only red-status people displayed

**Edit Visit**:

1. User at `/visits/[personId]` clicks edit on a visit
2. Modal opens with pre-filled form
3. User changes notes, adds follow-up date
4. Submits → PUT `/visits/[visitId]?/updateVisit`
5. Server updates visit
6. Modal closes, history refreshes

**Delete Visit**:

1. User at visit history clicks delete on most recent visit
2. Confirm dialog
3. Submits → DELETE `/visits/[visitId]?/deleteVisit`
4. Server deletes visit
5. Status recalculates based on new latest visit (may change color)
6. History refreshes
