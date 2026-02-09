# Journal API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02

## Overview

Journal entries with tags, location, and optional weather metadata. All endpoints require authentication.

---

## Endpoints

### GET `/journal`

List all journal entries for authenticated user.

**Load Function**: `src/routes/(app)/journal/+page.server.ts`

**Query Parameters**:

- `tag` (optional): Filter by tag (e.g., `?tag=reflection`)
- `startDate` (optional): Filter by date range start (YYYY-MM-DD)
- `endDate` (optional): Filter by date range end (YYYY-MM-DD)
- `limit` (optional): Max entries to return (default: 50)

**Response**:

```typescript
{
	entries: Array<{
		id: string; // UUID
		date: string; // YYYY-MM-DD
		content: string;
		tags: string[] | null;
		location: string | null;
		weather: {
			temp?: number;
			condition?: string;
		} | null;
		created_at: string;
		updated_at: string;
	}>;
}
```

**Business Logic**:

1. Get user ID from `locals.user`
2. Query `journal_entries` with filters
3. Parse JSON fields (tags, weather)
4. Order by date DESC
5. Return entries

---

### GET `/journal/[id]`

Get single journal entry.

**Load Function**: `src/routes/(app)/journal/[id]/+page.server.ts`

**Path Parameters**:

- `id`: Entry ID

**Response**:

```typescript
{
  entry: {
    id: string;  // UUID
    date: string;
    content: string;
    tags: string[] | null;
    location: string | null;
    weather: object | null;
    created_at: string;
    updated_at: string;
  };
}
```

**Error Response** (HTTP 404):

```typescript
{
	error: 'Entry not found';
}
```

**Business Logic**:

1. Get user ID from `locals.user`
2. Query entry by ID and user_id
3. If not found or user_id mismatch → 404
4. Parse JSON fields
5. Return entry

---

### POST `/journal`

Create new journal entry.

**Form Action**: `?/create`

**Request Body** (Form Data):

```typescript
{
	date: string; // YYYY-MM-DD
	content: string; // Min 1 char
	tags: string; // Comma-separated tags (optional)
	location: string; // Optional, auto-filled if available
	weather_temp: number; // Optional
	weather_condition: string; // Optional
}
```

**Validation Schema** (Zod):

```typescript
const createJournalSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	content: z.string().min(1, 'Content is required'),
	tags: z.string().optional(),
	location: z.string().optional(),
	weather_temp: z.number().optional(),
	weather_condition: z.string().optional()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /journal/[id]
```

**Error Response** (HTTP 400):

```typescript
{
  form: {
    valid: false,
    errors: {
      date?: string[],
      content?: string[]
    }
  }
}
```

**Business Logic**:

1. Validate form data with Zod
2. Get user ID from `locals.user`
3. Parse tags string into JSON array
4. Build weather JSON object if temp/condition provided
5. Insert into `journal_entries` table
6. Redirect to entry detail page

---

### PUT `/journal/[id]`

Update existing journal entry.

**Form Action**: `?/update`

**Path Parameters**:

- `id`: Entry ID

**Request Body** (Form Data):

```typescript
{
	date: string;
	content: string;
	tags: string;
	location: string;
	weather_temp: number;
	weather_condition: string;
}
```

**Validation Schema**: Same as create

**Success Response** (HTTP 303 redirect):

```
Location: /journal/[id]
```

**Error Response** (HTTP 400 or 404):

```typescript
{
  form: {
    valid: false,
    errors: { ... }
  }
}
```

**Business Logic**:

1. Validate form data
2. Verify entry belongs to user
3. Parse tags and weather
4. Update `journal_entries` with new `updated_at`
5. Redirect to entry detail

---

### DELETE `/journal/[id]`

Delete journal entry.

**Form Action**: `?/delete`

**Path Parameters**:

- `id`: Entry ID

**Success Response** (HTTP 303 redirect):

```
Location: /journal
```

**Error Response** (HTTP 404):

```typescript
{
	error: 'Entry not found';
}
```

**Business Logic**:

1. Verify entry belongs to user
2. Delete from `journal_entries`
3. Redirect to journal list

---

## UI Components

### EntryList.svelte

- Display entries as cards
- Filter by tag (dropdown or chips)
- Date range picker
- Pagination (load more)

### EntryForm.svelte

- Date picker (default: today)
- Textarea for content
- Tag input (chips, comma-separated)
- Location input (auto-fill with geolocation API)
- Weather input (optional: temp + condition dropdown)
- Submit → create or update

### EntryCard.svelte

- Display date, content preview (truncated)
- Show tags as chips
- Show location + weather icon
- Click → navigate to detail page

---

## Geolocation & Weather Integration

### Client-side Geolocation

```typescript
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition((position) => {
		// Reverse geocode lat/lng to location string
		// Set location field value
	});
}
```

### Weather API (Optional)

- Fetch from OpenWeatherMap or similar
- Requires API key (environment variable)
- Triggered automatically if location detected
- Store temp + condition in weather JSON

---

## Search & Filter

**Tag Filter**:

```sql
SELECT * FROM journal_entries
WHERE user_id = ? AND tags LIKE '%"reflection"%'
ORDER BY date DESC;
```

**Date Range Filter**:

```sql
SELECT * FROM journal_entries
WHERE user_id = ?
  AND date >= ?
  AND date <= ?
ORDER BY date DESC;
```

**Full-text Search** (future enhancement):

```sql
-- Requires FTS5 virtual table
CREATE VIRTUAL TABLE journal_fts USING fts5(content, content=journal_entries);
```

---

## Example Flow

**Create Entry**:

1. User navigates to `/journal/new`
2. Form auto-fills: date (today), location (geolocation)
3. User writes content, adds tags
4. Submits form → POST `/journal?/create`
5. Server validates, inserts entry
6. Redirects to `/journal/[id]`

**View Entries**:

1. User navigates to `/journal`
2. Load function fetches entries (latest 50)
3. User filters by tag → reload with query param
4. Click entry → navigate to `/journal/[id]`

**Edit Entry**:

1. User at `/journal/[id]` clicks edit
2. Navigate to `/journal/[id]/edit`
3. Form pre-fills with existing data
4. User modifies content/tags
5. Submits form → PUT `/journal/[id]?/update`
6. Server validates, updates entry
7. Redirects to `/journal/[id]`

**Delete Entry**:

1. User at `/journal/[id]` clicks delete
2. Confirm dialog
3. Submits form → DELETE `/journal/[id]?/delete`
4. Server deletes entry
5. Redirects to `/journal`
