# Tasks API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-03-08

## Overview

Kanban-focused task management with tags, priorities, due dates, and workflow states.

---

## Routes And Actions

### GET `/tasks`

Load the task board with optional filters.

**Load Function**: `src/routes/(app)/tasks/+page.server.ts`

**Query Parameters**:

- `state` (optional): Filter by workflow state (`new`, `in_progress`, `on_hold`, `blocked`, `done`)
- `priority` (optional): Filter by priority (`1`, `2`, `3`, `4`)
- `tag` (optional): Filter by tag value

**Response**:

```typescript
{
	tasks: Array<{
		id: string;
		title: string;
		description: string | null;
		dueDate: string | null;
		state: 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done';
		priority: 1 | 2 | 3 | 4;
		tags: string[] | null;
		createdAt: string;
		updatedAt: string;
		completedAt: string | null;
	}>;
	allTags: string[];
}
```

**Business Logic**:

1. Require an authenticated user.
2. Query the `tasks` table for the current user.
3. Apply optional state and priority filters in SQL.
4. Apply optional tag filtering after parsing stored JSON tags.
5. Order results by `priority`, `dueDate`, and `createdAt`.
6. Return the parsed task list plus all unique tags for filter UI.

---

### POST `/tasks?/updateState`

Update a task's workflow state from the Kanban board.

**Action**: `updateState`

**Request Body**:

```typescript
{
	id: string; // UUID
	state: 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done';
}
```

**Validation Schema**:

```typescript
const updateTaskStateSchema = z.object({
	id: z.uuid(),
	state: z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done'])
});
```

**Business Logic**:

1. Validate the task ID and target state.
2. Verify the task belongs to the authenticated user.
3. Update `state` and `updatedAt`.
4. Set `completedAt` when moving into `done`.
5. Clear `completedAt` when moving out of `done`.

---

### GET `/tasks/new`

Load the task creation form.

**Load Function**: `src/routes/(app)/tasks/new/+page.server.ts`

**Response**:

```typescript
{
	form: SuperValidated<CreateTaskSchema>;
}
```

---

### POST `/tasks/new`

Create a new task.

**Action**: `default`

**Request Body**:

```typescript
{
	title: string;
	description?: string;
	tags?: string; // Comma-separated
	dueDate?: string; // YYYY-MM-DD
	priority: 1 | 2 | 3 | 4;
	state?: 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done';
}
```

**Validation Schema**:

```typescript
const createTaskSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().max(5000).optional(),
	tags: z.string().optional(),
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1).max(4),
	state: z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']).default('new')
});
```

**Success Response**:

```text
303 See Other -> /tasks
```

**Business Logic**:

1. Validate form data.
2. Convert the comma-separated tag string to JSON for persistence.
3. Insert into `tasks` with the authenticated user's ID.
4. Redirect back to the task board.

---

### GET `/tasks/[id]/edit`

Load the edit form for a single task.

**Load Function**: `src/routes/(app)/tasks/[id]/edit/+page.server.ts`

**Response**:

```typescript
{
	task: {
		id: string;
		title: string;
		description: string | null;
		dueDate: string | null;
		state: string;
		priority: number;
		tags: string | null;
		createdAt: string;
		updatedAt: string;
		completedAt: string | null;
	};
	form: SuperValidated<UpdateTaskSchema>;
}
```

**Error Handling**:

- Redirect to `/tasks` when the task does not exist or does not belong to the current user.

---

### POST `/tasks/[id]/edit?/update`

Update an existing task.

**Action**: `update`

**Request Body**:

```typescript
{
	title: string;
	description?: string | null;
	tags?: string | null;
	dueDate?: string | null;
	priority?: 1 | 2 | 3 | 4;
	state?: 'new' | 'in_progress' | 'on_hold' | 'blocked' | 'done';
}
```

**Business Logic**:

1. Validate the submitted task data.
2. Verify ownership.
3. Update only the provided fields.
4. Maintain `completedAt` based on transitions into or out of `done`.
5. Redirect to `/tasks` after a successful update.

---

### POST `/tasks/[id]/edit?/delete`

Delete an existing task.

**Action**: `delete`

**Business Logic**:

1. Verify ownership.
2. Delete the task from `tasks`.
3. Redirect to `/tasks`.