# Todos API Contract

**Feature**: Synapse Second-Brain App  
**Date**: 2026-02-02

## Overview

Todo management with projects, tags, priorities, states, and sub-steps. Supports list, grid, and kanban views.

---

## Endpoints

### GET `/todos`

List all todos with optional filters.

**Load Function**: `src/routes/(app)/todos/+page.server.ts`

**Query Parameters**:

- `cadence` (optional): Filter by cadence (`daily`, `weekly`, `monthly`)
- `project` (optional): Filter by project ID
- `state` (optional): Filter by state (`new`, `in_progress`, `blocked`, `done`)
- `priority` (optional): Filter by priority (1-4)
- `tag` (optional): Filter by tag
- `view` (optional): View mode (`list`, `grid`, `kanban`) - default: `list`

**Response**:

```typescript
{
	todos: Array<{
		id: string; // UUID
		title: string;
		description: string | null;
		cadence: 'daily' | 'weekly' | 'monthly';
		project: {
			id: string; // UUID
			name: string;
			color: string | null;
		} | null;
		tags: string[] | null;
		due_date: string | null;
		state: 'new' | 'in_progress' | 'blocked' | 'done';
		priority: 1 | 2 | 3 | 4;
		sub_steps: Array<{
			title: string;
			completed: boolean;
		}> | null;
		created_at: string;
		updated_at: string;
		completed_at: string | null;
	}>;
	projects: Array<{
		id: string; // UUID
		name: string;
		color: string | null;
	}>;
}
```

**Business Logic**:

1. Get user ID from `locals.user`
2. Query `todo_items` with filters and join with `projects`
3. Parse JSON fields (tags, sub_steps)
4. Order by priority ASC, due_date ASC
5. Also fetch all user projects for filter dropdown
6. Return todos + projects

---

### GET `/todos/[id]`

Get single todo.

**Load Function**: `src/routes/(app)/todos/[id]/+page.server.ts`

**Response**:

```typescript
{
  todo: {
    id: string;  // UUID
    title: string;
    description: string | null;
    cadence: string;
    project: { ... } | null;
    tags: string[] | null;
    due_date: string | null;
    state: string;
    priority: number;
    sub_steps: object[] | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  };
  projects: Array<{ id, name, color }>;
}
```

**Error Response** (HTTP 404):

```typescript
{
	error: 'Todo not found';
}
```

---

### POST `/todos`

Create new todo.

**Form Action**: `?/create`

**Request Body** (Form Data):

```typescript
{
	title: string;
	description: string; // Optional
	cadence: 'daily' | 'weekly' | 'monthly';
	project_id: string; // UUID        // Optional
	tags: string; // Comma-separated, optional
	due_date: string; // YYYY-MM-DD, optional
	priority: 1 | 2 | 3 | 4; // Default: 2
}
```

**Validation Schema** (Zod):

```typescript
const createTodoSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200),
	description: z.string().optional(),
	cadence: z.enum(['daily', 'weekly', 'monthly']),
	project_id: z.number().int().positive().optional(),
	tags: z.string().optional(),
	due_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	priority: z.number().int().min(1).max(4).default(2)
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /todos/[id]
```

**Error Response** (HTTP 400):

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
2. Get user ID
3. Parse tags string into JSON array
4. Verify project_id belongs to user (if provided)
5. Insert into `todo_items` with state='new'
6. Redirect to todo detail

---

### PUT `/todos/[id]`

Update todo.

**Form Action**: `?/update`

**Request Body** (Form Data):

```typescript
{
	title: string;
	description: string;
	cadence: string;
	project_id: string; // UUID
	tags: string;
	due_date: string;
	state: 'new' | 'in_progress' | 'blocked' | 'done';
	priority: number;
	sub_steps: string; // JSON string of array
}
```

**Validation Schema**:

```typescript
const updateTodoSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().optional(),
	cadence: z.enum(['daily', 'weekly', 'monthly']),
	project_id: z.number().int().positive().optional(),
	tags: z.string().optional(),
	due_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	state: z.enum(['new', 'in_progress', 'blocked', 'done']),
	priority: z.number().int().min(1).max(4),
	sub_steps: z.string().optional() // Will parse as JSON
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /todos/[id]
```

**Business Logic**:

1. Validate form data
2. Verify todo belongs to user
3. Parse tags and sub_steps
4. If state changed to 'done', set `completed_at` to now
5. If state changed from 'done' to other, set `completed_at` to null
6. Update `todo_items` with new `updated_at`
7. Redirect to detail

---

### DELETE `/todos/[id]`

Delete todo.

**Form Action**: `?/delete`

**Success Response** (HTTP 303 redirect):

```
Location: /todos
```

**Business Logic**:

1. Verify todo belongs to user
2. Delete from `todo_items`
3. Redirect to todos list

---

## Project Management

### GET `/todos/projects`

List all projects.

**Load Function**: `src/routes/(app)/todos/projects/+page.server.ts`

**Response**:

```typescript
{
	projects: Array<{
		id: string; // UUID
		name: string;
		color: string | null;
		todo_count: number; // Count of todos in this project
	}>;
}
```

---

### POST `/todos/projects`

Create new project.

**Form Action**: `?/createProject`

**Request Body**:

```typescript
{
	name: string;
	color: string; // Hex color, optional
}
```

**Validation Schema**:

```typescript
const createProjectSchema = z.object({
	name: z.string().min(1).max(100),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
});
```

**Success Response** (HTTP 303 redirect):

```
Location: /todos/projects
```

**Business Logic**:

1. Validate form data
2. Get user ID
3. Check if project name already exists for user → error
4. Insert into `projects`
5. Redirect to projects list

---

### PUT `/todos/projects/[id]`

Update project.

**Form Action**: `?/updateProject`

**Request Body**:

```typescript
{
	name: string;
	color: string;
}
```

**Success Response** (HTTP 303 redirect):

```
Location: /todos/projects
```

---

### DELETE `/todos/projects/[id]`

Delete project.

**Form Action**: `?/deleteProject`

**Success Response** (HTTP 303 redirect):

```
Location: /todos/projects
```

**Business Logic**:

1. Verify project belongs to user
2. Set `project_id = NULL` for all todos in this project
3. Delete from `projects`
4. Redirect to projects list

---

## Sub-Steps Management

Sub-steps are managed as JSON array within the todo:

**Structure**:

```typescript
sub_steps: Array<{
	title: string;
	completed: boolean;
}>;
```

**Add Sub-Step** (form action `?/addSubStep`):

1. Parse existing sub_steps JSON
2. Append new step: `{ title, completed: false }`
3. Update todo with new JSON

**Toggle Sub-Step** (form action `?/toggleSubStep`):

1. Parse sub_steps JSON
2. Find step by index, toggle `completed`
3. Update todo with modified JSON

**Delete Sub-Step** (form action `?/deleteSubStep`):

1. Parse sub_steps JSON
2. Remove step by index
3. Update todo with modified JSON

---

## View Modes

### List View

- Table/list layout with TanStack Table
- Columns: Title, Project, Tags, Priority, State, Due Date
- Sortable by all columns
- Filterable by project, state, priority, tag

### Grid View

- Card layout (responsive grid)
- Each card shows: Title, Project, Priority badge, State badge, Due date
- Click card → navigate to detail

### Kanban View

- Columns for each state: New, In Progress, Blocked, Done
- Drag-and-drop to change state (future enhancement)
- Cards show: Title, Project, Priority badge, Due date
- Initially: use server-side state update, no drag-drop

---

## UI Components

### TodoList.svelte

- TanStack Table integration
- Columns, sorting, filtering
- Row click → navigate to detail

### TodoGrid.svelte

- Responsive grid of TodoCard components
- Filters as dropdowns/chips

### TodoKanban.svelte

- Four columns (state-based)
- Cards grouped by state
- Future: Drag-and-drop with `svelte-dnd-action`

### TodoCard.svelte

- Display title, project, priority, state
- Color-coded priority badge (1=red, 2=orange, 3=yellow, 4=green)
- Due date with overdue warning

### TodoForm.svelte

- Fields: title, description, cadence, project, tags, due_date, priority
- Sub-steps section (add/remove dynamically)
- State selector (edit mode only)
- Submit → create or update

### ProjectForm.svelte

- Fields: name, color picker
- Submit → create or update project

---

## Filtering Logic

**By Cadence**:

```sql
WHERE cadence = ?
```

**By Project**:

```sql
WHERE project_id = ?
```

**By State**:

```sql
WHERE state = ?
```

**By Priority**:

```sql
WHERE priority = ?
```

**By Tag**:

```sql
WHERE tags LIKE '%"tagname"%'
```

**By Due Date** (overdue):

```sql
WHERE due_date < date('now') AND state != 'done'
```

---

## Example Flow

**Create Todo**:

1. User at `/todos` clicks "New Todo"
2. Navigate to `/todos/new`
3. Fill form: title, cadence, project, priority
4. Submit → POST `/todos?/create`
5. Server validates, inserts todo
6. Redirect to `/todos/[id]`

**View Todos**:

1. User navigates to `/todos`
2. Default: list view, all cadences
3. User filters: cadence=daily, state=in_progress
4. Reload with query params
5. User switches to kanban view → reload with `?view=kanban`

**Update Todo State**:

1. User at `/todos/[id]` changes state dropdown to "done"
2. Submit form → PUT `/todos/[id]?/update`
3. Server sets `completed_at` to now
4. Redirect to `/todos/[id]`

**Manage Sub-Steps**:

1. User at `/todos/[id]` adds sub-step: "Research options"
2. Submit → POST `/todos/[id]?/addSubStep`
3. Server parses JSON, appends step, updates todo
4. Reload page, new step appears
5. User toggles checkbox → POST `/todos/[id]?/toggleSubStep`
6. Server toggles `completed` flag, updates todo
