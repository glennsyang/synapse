# Synapse Refactoring Action Plan

**Generated**: February 11, 2026  
**Status**: Ready for Implementation  
**Version**: 1.0

## Executive Summary

This document provides a comprehensive, prioritized action plan for refactoring the Synapse codebase based on analysis of:

- Duplicate code patterns
- Code structure and architecture
- Unused exports and dead code
- Error handling consistency
- Security vulnerabilities

**Overall Assessment**: The codebase is functional and follows good patterns in many areas, but has significant opportunities for improvement in DRY principles, architectural separation, and consistency.

---

## Priority Matrix

| Priority          | Critical Issues | High Issues | Medium Issues | Low Issues | Total  |
| ----------------- | --------------- | ----------- | ------------- | ---------- | ------ |
| **P0 (Critical)** | 0               | 2           | 0             | 0          | 2      |
| **P1 (High)**     | 0               | 5           | 8             | 0          | 13     |
| **P2 (Medium)**   | 0               | 0           | 12            | 6          | 18     |
| **P3 (Low)**      | 0               | 0           | 3             | 8          | 11     |
| **Total**         | 0               | 7           | 23            | 14         | **44** |

---

## P0: Critical Security Issues (IMMEDIATE ACTION REQUIRED)

### None Identified ✅

The application has no critical security vulnerabilities that expose user data or allow unauthorized access.

---

## P1: High Priority Refactoring (Target: Week 1-2)

### 1.1 Security: Fix Authorization Bypass in Routine Query

**Category**: Security  
**Severity**: HIGH  
**Impact**: Information disclosure  
**Effort**: 5 minutes  
**Files**: `src/routes/(app)/meditation/routines/[id]/+page.server.ts`

**Issue**: The `updateRoutine` action queries routines without verifying user ownership, allowing authenticated users to access other users' routine data.

**Current Code**:

```typescript
const routine = await db.query.meditationRoutines.findFirst({
	where: eq(meditationRoutines.id, params.id) // ❌ No userId filter
});
```

**Fix**:

```typescript
const routine = await db.query.meditationRoutines.findFirst({
	where: and(eq(meditationRoutines.id, params.id), eq(meditationRoutines.userId, locals.user.id))
});
```

**Action Items**:

- [ ] Update meditation routine query to include userId filter
- [ ] Audit all similar queries across codebase for same issue
- [ ] Add integration test to verify authorization checks

---

### 1.2 Security: Implement Rate Limiting on Sync API

**Category**: Security  
**Severity**: HIGH  
**Impact**: Resource exhaustion, data exfiltration  
**Effort**: 2 hours  
**Files**: `src/routes/api/sync/+server.ts`

**Issue**: The `/api/sync` endpoint has no dedicated rate limiting and accepts unlimited payload sizes.

**Recommendations**:

1. Add rate limiting: 10 requests per 5 minutes per user
2. Implement max payload size: 100 changes per sync request
3. Add validation for sync payload structure

**Action Items**:

- [ ] Install rate limiting middleware (e.g., `@upstash/ratelimit` or custom)
- [ ] Add request body size validation
- [ ] Add integration tests for rate limit behavior
- [ ] Document sync API limits in `/docs/API.md`

---

### 1.3 Code Quality: Use Audit Field Utilities Throughout

**Category**: Code Quality  
**Severity**: HIGH  
**Impact**: Inconsistent audit trails, maintenance burden  
**Effort**: 4 hours  
**Files**: 30+ route handlers (all CRUD operations)

**Issue**: `withAuditFieldsForCreate()` and `withAuditFieldsForUpdate()` utilities exist but are unused. Manual timestamp management appears 30+ times.

**Current Pattern**:

```typescript
await db.insert(journalEntries).values({
	userId: user.id,
	content: form.data.content,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
});
```

**Recommended Pattern**:

```typescript
await db.insert(journalEntries).values(
	withAuditFieldsForCreate(
		{
			content: form.data.content,
			tags: parseCommaSeparatedToJson(form.data.tags)
		},
		user.id
	)
);
```

**Action Items**:

- [ ] Update all create operations to use `withAuditFieldsForCreate()`
- [ ] Update all update operations to use `withAuditFieldsForUpdate()`
- [ ] Create migration script to assist with bulk replacement
- [ ] Add ESLint rule to enforce utility usage

**Files to Update**:

- Journal: `new/+page.server.ts`, `[id]/edit/+page.server.ts`
- Todos: `new/+page.server.ts`, `[id]/edit/+page.server.ts`, `+page.server.ts`
- Fitness: `+page.server.ts` (5 separate forms)
- Meditation: `routines/new/+page.server.ts`, `routines/[id]/+page.server.ts`, `+page.server.ts`
- Visits: `[id]/+page.server.ts`, `new/+page.server.ts`
- Profile: `+page.server.ts`

---

### 1.4 Code Quality: Create Tag Parsing Utility

**Category**: Code Quality (DRY Violation)  
**Severity**: HIGH  
**Impact**: Code duplication, maintenance burden  
**Effort**: 1 hour  
**Files**: 10+ files (journal, todos, meditation, visits)

**Issue**: Identical comma-separated string to JSON array parsing appears 10+ times.

**Duplicate Code**:

```typescript
const tags = form.data.tags
	? JSON.stringify(
			(form.data.tags as string)
				.split(',')
				.map((t: string) => t.trim())
				.filter((t: string) => t.length > 0)
		)
	: null;
```

**Solution**: Create utility in `src/lib/server/db/utils.ts`:

```typescript
/**
 * Parse comma-separated string into JSON array
 * @param input - Comma-separated string
 * @returns JSON stringified array or null
 */
export function parseCommaSeparatedToJson(input: string | null | undefined): string | null {
	if (!input) return null;

	const array = input
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	return array.length > 0 ? JSON.stringify(array) : null;
}
```

**Action Items**:

- [ ] Create `parseCommaSeparatedToJson()` utility
- [ ] Add unit tests for utility (empty string, null, whitespace, etc.)
- [ ] Replace all duplicate implementations (10+ files)
- [ ] Update to use with `withAuditFieldsForCreate()`

---

### 1.5 Code Quality: Create Form Action Helpers

**Category**: Code Quality (DRY Violation)  
**Severity**: HIGH  
**Impact**: Code duplication, inconsistent error handling  
**Effort**: 2 hours  
**Files**: 20+ form action handlers

**Issue**: Form validation error handling and try/catch patterns duplicated across 20+ files.

**Solution**: Create `src/lib/server/actions/form-helpers.ts`:

```typescript
import { message } from 'sveltekit-superforms';
import { logger } from '$lib/utils/logger';
import type { SuperValidated } from 'sveltekit-superforms';

/**
 * Handle invalid form submission
 */
export function handleInvalidForm<T extends Record<string, unknown>>(
	form: SuperValidated<T>,
	context: string
) {
	logger.warn(`Invalid ${context} form data`, { errors: form.errors });
	return { form, status: 400 as const };
}

/**
 * Handle form action error
 */
export function handleFormError<T extends Record<string, unknown>>(
	form: SuperValidated<T>,
	error: unknown,
	context: string,
	userMessage?: string
) {
	logger.error(`Failed to ${context}`, { error });
	return message(
		form,
		{
			type: 'error',
			text: userMessage || `Failed to ${context}. Please try again.`
		},
		{ status: 500 }
	);
}
```

**Action Items**:

- [ ] Create form helper utilities
- [ ] Replace duplicate error handling in all form actions
- [ ] Add unit tests for helpers
- [ ] Document usage in AGENTS.md

---

### 1.6 Architecture: Remove Client Imports of Server Types

**Category**: Architecture  
**Severity**: HIGH  
**Impact**: Breaks separation of concerns, tight coupling  
**Effort**: 3 hours  
**Files**: 6+ client components

**Issue**: Client-side Svelte components import types from `$lib/server/db/types`, violating architectural boundaries.

**Affected Components**:

- `src/lib/components/todos/TodoListView.svelte`
- `src/lib/components/todos/TodoKanbanView.svelte`
- `src/lib/components/todos/TodoCard.svelte`
- `src/lib/components/todos/TodoGridView.svelte`
- `src/lib/components/app/NavUser.svelte`
- `src/lib/components/app/AppSidebar.svelte`

**Solution**: Create shared client-safe types in `src/lib/types.ts`:

```typescript
// Client-safe types (no database implementation details)
export type Project = {
	id: string;
	name: string;
	color: string | null;
	description: string | null;
};

export type User = {
	id: string;
	name: string;
	email: string;
	image: string | null;
	// No sensitive fields like password, sessions, etc.
};

export type TodoItem = {
	id: string;
	title: string;
	description: string | null;
	status: 'todo' | 'in_progress' | 'done';
	priority: number;
	dueDate: string | null;
	tags: string | null; // JSON array
	projectId: string | null;
	project?: Project;
};
```

**Action Items**:

- [ ] Create client-safe type definitions in `src/lib/types.ts`
- [ ] Update all client components to use client-safe types
- [ ] Add ESLint rule to prevent server imports in client code
- [ ] Document type separation in AGENTS.md

---

### 1.7 Code Quality: Eliminate `any` Types

**Category**: Type Safety  
**Severity**: MEDIUM (promoted to HIGH)  
**Impact**: Reduced type safety, violates coding standards  
**Effort**: 2 hours  
**Files**: 3 components

**Issue**: Project coding standards explicitly state "Avoid using `any` type entirely", but several files violate this.

**Files**:

- `src/lib/components/ui/data-table/data-table.svelte.ts` (line 60)
- `src/lib/components/ui/data-table/render-helpers.ts` (line 12)
- `src/lib/components/ui/chart/chart-tooltip.svelte` (line 9)

**Action Items**:

- [ ] Replace `any` with proper generic types in data-table
- [ ] Use `unknown` with type guards where generic types aren't practical
- [ ] Add ESLint rule to prevent `any` usage (`@typescript-eslint/no-explicit-any`)
- [ ] Add pre-commit hook to enforce no-any rule

---

## P2: Medium Priority Refactoring (Target: Week 3-4)

### 2.1 Architecture: Create Service/Repository Layer

**Category**: Architecture  
**Severity**: MEDIUM  
**Impact**: Testability, code organization, reusability  
**Effort**: 2 weeks  
**Files**: All route handlers (20+ files)

**Issue**: Route handlers contain direct database queries, mixing concerns and reducing testability.

**Current Pattern**:

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
	const todos = await getDb().query.todoItems.findMany({
		where: and(...conditions),
		with: { project: true },
		orderBy: [todoItems.priority, todoItems.dueDate]
	});
};
```

**Recommended Pattern**:

```typescript
// src/lib/server/services/todo-service.ts
export class TodoService {
	constructor(
		private db: Database,
		private logger: Logger
	) {}

	async getTodosForUser(userId: string, filters: TodoFilters): Promise<TodoItem[]> {
		const conditions = this.buildWhereConditions(userId, filters);
		return this.db.query.todoItems.findMany({
			where: and(...conditions),
			with: { project: true },
			orderBy: [todoItems.priority, todoItems.dueDate]
		});
	}

	private buildWhereConditions(userId: string, filters: TodoFilters): SQL[] {
		// Extract query building logic
	}
}

// Route handler becomes:
export const load: PageServerLoad = async ({ locals, url }) => {
	const todoService = new TodoService(getDb(), logger);
	const todos = await todoService.getTodosForUser(locals.user!.id, parseFilters(url.searchParams));
};
```

**Benefits**:

- Testable business logic (can mock database)
- Reusable across API and page routes
- Clear separation of concerns
- Easier to add caching, validation, etc.

**Action Items**:

- [ ] Design service layer interfaces
- [ ] Create base service class with common patterns
- [ ] Implement services for each domain:
  - [ ] `TodoService` (todos, projects)
  - [ ] `JournalService` (entries, tags)
  - [ ] `FitnessService` (weight, workouts, meals, goals)
  - [ ] `MeditationService` (routines, sessions)
  - [ ] `VisitService` (visits, people, locations)
- [ ] Update route handlers to use services
- [ ] Write unit tests for all services
- [ ] Document service pattern in AGENTS.md

---

### 2.2 Architecture: Break Down Large Page Components

**Category**: Architecture  
**Severity**: MEDIUM  
**Impact**: Maintainability, reusability  
**Effort**: 1 week  
**Files**: 5 large page components

**Issue**: Several page components exceed 200 lines and mix multiple concerns.

**Large Components**:
| File | Lines | Issue |
|------|-------|-------|
| `fitness/+page.svelte` | 714 | 5 forms, tabs, charts in one component |
| `meditation/routines/[id]/+page.svelte` | 425 | Routine management + forms |
| `visits/[id]/+page.svelte` | 374 | Visit details + multiple forms |
| `profile/+page.svelte` | 316 | Profile + password change |
| `dashboard/+page.svelte` | 285 | Mixed dashboard concerns |

**Recommended Refactoring**:

**Fitness Page**:

```
src/routes/(app)/fitness/
  +page.svelte (layout/tabs - ~100 lines)
  _components/
    WeightTracking.svelte (weight form + WeightChart)
    WorkoutTracking.svelte (workout form + history)
    MealTracking.svelte (meal log + CalorieProgress)
    GoalsTracking.svelte (goals form + progress)
```

**Meditation Routine Page**:

```
src/routes/(app)/meditation/routines/[id]/
  +page.svelte (layout - ~100 lines)
  _components/
    RoutineForm.svelte (edit routine metadata)
    SessionsList.svelte (sessions history)
    SessionForm.svelte (log new session)
```

**Action Items**:

- [ ] Refactor fitness page into sub-components
- [ ] Refactor meditation routine page
- [ ] Refactor visits detail page
- [ ] Refactor profile page (separate password change)
- [ ] Refactor dashboard (create reusable stat widgets)
- [ ] Add tests for extracted components

---

### 2.3 Code Cleanup: Remove Unused Exports and Dead Code

**Category**: Code Quality  
**Severity**: MEDIUM  
**Impact**: Codebase bloat, confusion  
**Effort**: 3 hours  
**Files**: Multiple small files

**Unused Files (Safe to Remove)**:

- [ ] `src/lib/utils/errors.ts` - All error classes unused
- [ ] `src/lib/server/actions/crud-messages.ts` - Never imported
- [ ] `src/lib/client/auth.ts` - Entire module unused (form-based auth used instead)
- [ ] `src/lib/server/sync/index.ts` - Placeholder implementation
- [ ] `src/lib/components/shared/ErrorBoundary.svelte` - Never imported
- [ ] `src/lib/components/shared/TableSkeleton.svelte` - Never imported
- [ ] `src/lib/components/shared/CardListSkeleton.svelte` - Never imported
- [ ] `src/lib/components/shared/ErrorAlert.svelte` - Never imported
- [ ] `src/lib/components/shared/SectionHeader.svelte` - Never imported
- [ ] `src/lib/components/app/SectionHeader.svelte` - Never imported
- [ ] `src/lib/components/skeletons/index.ts` - Never imported

**Unused Database Tables**:

- [ ] `emailNotifications` table - Schema defined but never queried
- [ ] `workoutReminders` table - Schema exists but no CRUD operations

**Unused Dependencies**:

- [ ] `tw-animate-css` - Listed in package.json but not used
- [ ] `dotenv-expand` - Listed in package.json but not used

**Action Items**:

- [ ] Remove all unused files listed above
- [ ] Remove unused database tables or document as planned features
- [ ] Run `npm prune` and remove unused dependencies
- [ ] Update imports if any files reference removed code
- [ ] Create git branch with removals for safe review

---

### 2.4 Error Handling: Add Missing Error Handling

**Category**: Error Handling  
**Severity**: MEDIUM  
**Impact**: User experience, debugging  
**Effort**: 4 hours  
**Files**: 5 route handlers

**Missing Error Handling in Load Functions**:

- [ ] `src/routes/(auth)/sign-out/+page.server.ts` - No try/catch around sign-out
- [ ] `src/routes/(app)/profile/+page.server.ts` - No error handling for DB queries
- [ ] `src/routes/(app)/visits/[id]/+page.server.ts` - No error handling
- [ ] `src/routes/(auth)/verify-email/+page.server.ts` - No validation/error handling

**Action Items**:

- [ ] Add try/catch blocks to all load functions
- [ ] Throw user-friendly `error()` responses on failures
- [ ] Log errors with context using logger utility
- [ ] Test error scenarios (DB down, invalid params, etc.)

---

### 2.5 Error Handling: Standardize Error Patterns

**Category**: Error Handling  
**Severity**: MEDIUM  
**Impact**: Consistency, debugging  
**Effort**: 2 hours  
**Files**: All route handlers

**Issue**: Inconsistent error handling patterns across the codebase.

**Current Patterns**:

- Pattern A: `return fail(status, { error: 'message' })`
- Pattern B: `return { form, error: 'message', status }`
- Pattern C: `throw error(status, 'message')`
- Pattern D: `return message(form, { type: 'error', text: '...' }, { status })`

**Recommended Standards**:

- **Load functions**: Use `throw error(status, message)`
- **Simple actions** (no form): Use `return fail(status, { error })`
- **Superforms actions**: Use `return message(form, { type, text }, { status })`
- **Never**: Mix patterns in the same file

**Action Items**:

- [ ] Document error handling standards in AGENTS.md
- [ ] Audit all route handlers for pattern consistency
- [ ] Refactor inconsistent error handling
- [ ] Create examples for each pattern

---

### 2.6 Error Handling: Fix Silent Failures

**Category**: Error Handling  
**Severity**: MEDIUM  
**Impact**: User experience, debugging  
**Effort**: 3 hours  
**Files**: Dashboard, list pages, email service

**Issues**:

1. **Dashboard** returns empty data on error instead of showing error state
2. **List pages** (journal, todos, visits) return empty arrays on DB errors
3. **Email service** returns error object instead of throwing

**Recommended Fixes**:

**Dashboard**:

```typescript
// Return error state instead of empty data
return {
    stats: { ... },
    recentJournalEntries: [],
    error: 'Failed to load dashboard data. Please refresh.'
};
```

**List Pages**:

```typescript
// Return error info
return {
    items: [],
    error: 'Failed to load items. Please try again.'
};

// In component:
{#if data.error}
    <Alert variant="destructive">{data.error}</Alert>
{/if}
```

**Email Service**:

```typescript
// Either throw or return explicit result
export async function sendVerificationEmail(
	email: string,
	token: string
): Promise<{ success: boolean; error?: Error }> {
	try {
		// ... send email
		return { success: true };
	} catch (error) {
		logger.error('Failed to send verification email', { error });
		return { success: false, error };
	}
}
```

**Action Items**:

- [ ] Update dashboard to return error state
- [ ] Update list pages to return error state
- [ ] Update email service to return result object
- [ ] Add error banners to UI components
- [ ] Test error scenarios in each page

---

### 2.7 Error Handling: Replace console.log with Logger

**Category**: Code Quality  
**Severity**: MEDIUM  
**Impact**: Violates coding standards, missing structured logs  
**Effort**: 1 hour  
**Files**: 3 files

**Issue**: Coding standards explicitly prohibit `console.log()` usage in favor of logger utility.

**Files**:

- `src/routes/(app)/dashboard/+page.server.ts` (line 151)
- `src/lib/utils/errors.ts` (line 91)
- `src/env.ts` (lines 22, 67, 71, 75, 79) - **Exception**: Pre-logger initialization

**Action Items**:

- [ ] Replace `console.error` with `logger.error` in dashboard
- [ ] Replace `console.error` with `logger.error` in errors.ts
- [ ] Leave env.ts console usage (pre-logger initialization, acceptable)
- [ ] Add ESLint rule to prevent console usage
- [ ] Add to pre-commit hooks

---

### 2.8 Error Handling: Add Safe JSON Parse Utility

**Category**: Error Handling  
**Severity**: MEDIUM  
**Impact**: Potential crashes on corrupted data  
**Effort**: 2 hours  
**Files**: 28 instances of `JSON.parse()`

**Issue**: Many `JSON.parse()` calls lack try/catch blocks, risking crashes on malformed database data.

**Solution**: Create `src/lib/utils/json.ts`:

```typescript
import { logger } from './logger';

/**
 * Safely parse JSON with fallback value
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
	if (!json) return fallback;

	try {
		return JSON.parse(json) as T;
	} catch (error) {
		logger.warn('Failed to parse JSON', { json, error });
		return fallback;
	}
}

/**
 * Safely stringify JSON
 */
export function safeJsonStringify(value: unknown, fallback: string = 'null'): string {
	try {
		return JSON.stringify(value);
	} catch (error) {
		logger.warn('Failed to stringify JSON', { error });
		return fallback;
	}
}
```

**Action Items**:

- [ ] Create safe JSON utilities
- [ ] Replace all unsafe `JSON.parse()` calls (28 instances)
- [ ] Add unit tests for edge cases
- [ ] Document in AGENTS.md

---

### 2.9 Security: Improve Content Security Policy

**Category**: Security  
**Severity**: MEDIUM  
**Impact**: XSS protection weakened  
**Effort**: 4 hours  
**Files**: `src/hooks.server.ts`

**Issue**: CSP allows `unsafe-inline` and `unsafe-eval` which defeats XSS protection.

**Current CSP**:

```typescript
const csp = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // ❌ Dangerous
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com" // ❌ Dangerous
].join('; ');
```

**Recommended Approach**:

1. Use nonces for inline scripts/styles
2. Extract inline scripts to separate files with hashes
3. For d3/layerchart, explore alternatives to `unsafe-eval`
4. Monitor CSP violations

**Action Items**:

- [ ] Implement nonce generation for inline scripts/styles
- [ ] Extract inline scripts to separate files
- [ ] Test application with stricter CSP
- [ ] Add CSP violation reporting endpoint
- [ ] Document CSP requirements in AGENTS.md

---

### 2.10 Security: Move Email from URL to Session

**Category**: Security  
**Severity**: MEDIUM  
**Impact**: Email exposure in logs/history  
**Effort**: 2 hours  
**Files**: `src/routes/(auth)/verify-email/+page.server.ts`, `src/routes/(auth)/register/+page.server.ts`

**Issue**: User email passed in URL query string, visible in browser history and server logs.

**Current Code**:

```typescript
throw redirect(302, `/verify-email?email=${encodeURIComponent(form.data.email)}`);
```

**Recommended Approach**: Use session storage or token-based approach:

```typescript
// In register action:
const token = crypto.randomUUID();
await redis.setex(
	`verify:${token}`,
	3600,
	JSON.stringify({
		email: form.data.email,
		timestamp: Date.now()
	})
);
throw redirect(302, `/verify-email?token=${token}`);

// In verify-email load:
const token = url.searchParams.get('token');
const data = await redis.get(`verify:${token}`);
if (!data) throw error(400, 'Invalid or expired verification link');
const { email } = JSON.parse(data);
```

**Alternative** (simpler): Use session cookies:

```typescript
// In register action:
event.cookies.set('pendingEmail', form.data.email, {
	path: '/verify-email',
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	maxAge: 3600
});
throw redirect(302, '/verify-email');

// In verify-email load:
const email = event.cookies.get('pendingEmail');
```

**Action Items**:

- [ ] Implement session-based or token-based email storage
- [ ] Update register action
- [ ] Update verify-email page
- [ ] Test verification flow
- [ ] Document approach in AGENTS.md

---

### 2.11 Data Integrity: Add Transaction Support for Related Operations

**Category**: Data Integrity  
**Severity**: MEDIUM  
**Impact**: Partial data on errors  
**Effort**: 1 week  
**Files**: Fitness, meditation, visits workflows

**Issue**: Related database operations not wrapped in transactions, risking partial data on failures.

**Example**: Creating workout with exercises (fitness page):

```typescript
// Current: No transaction
const [workoutLog] = await db.insert(workoutLogs).values({...}).returning();

for (const exercise of exercises) {
    await db.insert(workoutExercises).values({
        workoutLogId: workoutLog.id,
        ...exercise
    });
    // ❌ If this fails mid-loop, partial data remains
}
```

**Recommended**:

```typescript
await db.transaction(async (tx) => {
    const [workoutLog] = await tx.insert(workoutLogs).values({...}).returning();

    for (const exercise of exercises) {
        await tx.insert(workoutExercises).values({
            workoutLogId: workoutLog.id,
            ...exercise
        });
    }
    // All or nothing - transaction rolls back on error
});
```

**Action Items**:

- [ ] Identify all related operations requiring transactions
- [ ] Add transaction wrapper to database utilities
- [ ] Implement transactions for:
  - [ ] Workout creation with exercises
  - [ ] Meditation routine creation
  - [ ] Visit creation with people relationships
  - [ ] Any other multi-table operations
- [ ] Add integration tests for transaction rollback

---

### 2.12 Type Safety: Remove Duplicate Type Definitions

**Category**: Type Safety  
**Severity**: LOW (promoted to MEDIUM)  
**Impact**: Confusion, maintenance burden  
**Effort**: 30 minutes  
**Files**: `src/lib/types.ts`, `src/lib/server/db/types.ts`

**Issue**: `JournalEntry` type defined in both files, with slight differences. The manual definition in `lib/types.ts` is outdated.

**Action Items**:

- [ ] Remove duplicate `JournalEntry` from `src/lib/types.ts`
- [ ] Import from `src/lib/server/db/types.ts` where needed
- [ ] Audit for other duplicate type definitions
- [ ] Document single source of truth for types

---

## P3: Low Priority Improvements (Target: Week 5+)

### 3.1 Data Visualization: Add More Charts and Insights

**Category**: Feature Enhancement  
**Severity**: LOW  
**Impact**: User experience  
**Effort**: 2 weeks  
**Files**: Dashboard, feature pages

**Opportunities**:

- **Dashboard**: Activity heatmap, trend charts across all features
- **Journal**: Entries per week/month, mood tracking (if mood data exists), writing streaks
- **Todos**: Completion rate over time, overdue trends, priority distribution
- **Meditation**: Minutes per week, mood distribution, streak calendar
- **Fitness**: Already has charts, could add more goal progress visualizations

**Action Items**:

- [ ] Design chart components for each feature
- [ ] Implement using existing chart library (d3, layerchart)
- [ ] Add to relevant pages
- [ ] Ensure mobile responsiveness
- [ ] Add loading states for chart data

---

### 3.2 Performance: Add Database Query Timeout and Retry Logic

**Category**: Performance/Reliability  
**Severity**: LOW  
**Impact**: Resilience to transient failures  
**Effort**: 1 week  
**Files**: Database configuration, all queries

**Issue**: Database operations lack timeout and retry mechanisms for transient failures.

**Recommendations**:

1. Add query timeout configuration to better-sqlite3
2. Implement retry logic with exponential backoff for SQLITE_BUSY errors
3. Consider connection pooling for high concurrency scenarios

**Action Items**:

- [ ] Research better-sqlite3 timeout options
- [ ] Create database wrapper with retry logic
- [ ] Implement exponential backoff for transient errors
- [ ] Add monitoring for query performance
- [ ] Document retry policies in AGENTS.md

---

### 3.3 Testing: Add Integration Tests for Service Layer

**Category**: Testing  
**Severity**: LOW  
**Impact**: Code quality, confidence in refactoring  
**Effort**: 2 weeks  
**Files**: All services (after P2.1 implementation)

**Action Items**:

- [ ] Set up testing infrastructure (Vitest already configured)
- [ ] Create test database fixtures
- [ ] Write integration tests for each service
- [ ] Add test coverage reporting
- [ ] Add to CI/CD pipeline

---

### 3.4 Documentation: Improve User-Facing Error Messages

**Category**: User Experience  
**Severity**: LOW  
**Impact**: User experience  
**Effort**: 1 week  
**Files**: All error messages

**Issue**: Many error messages are generic ("Failed to update profile. Please try again.").

**Recommendations**:

- Add more context to error messages
- Distinguish between user errors and system errors
- Consider error codes for i18n support
- Provide actionable guidance ("Check your internet connection", "Contact support if this persists")

**Action Items**:

- [ ] Audit all error messages
- [ ] Create error message dictionary with context-specific messages
- [ ] Implement error code system
- [ ] Update all error handling to use new messages
- [ ] Add i18n support for future localization

---

### 3.5 Code Quality: Refactor Offline Sync Implementation

**Category**: Feature Enhancement  
**Severity**: LOW  
**Impact**: Feature completeness (if sync is planned)  
**Effort**: 2-3 weeks  
**Files**: `src/lib/server/sync/`, `src/lib/client/offline-db.ts`, `src/routes/api/sync/`

**Issue**: Sync implementation is incomplete with placeholder code.

**Options**:

1. **Remove** sync feature entirely if not planned
2. **Implement** proper offline sync with conflict resolution
3. **Document** as planned feature for future development

**If Implementing**:

- [ ] Design conflict resolution strategy
- [ ] Implement proper sync protocol
- [ ] Add comprehensive validation
- [ ] Add rate limiting (already in P1.2)
- [ ] Test offline scenarios thoroughly
- [ ] Document sync architecture

---

### 3.6 Performance: Implement Caching Layer

**Category**: Performance  
**Severity**: LOW  
**Impact**: Performance, scalability  
**Effort**: 2 weeks  
**Files**: Service layer (after P2.1)

**Recommendations**:

- Add in-memory caching for frequently accessed data (e.g., user profiles, projects)
- Implement cache invalidation on updates
- Consider Redis for distributed caching in production

**Action Items**:

- [ ] Design caching strategy
- [ ] Implement in-memory cache with TTL
- [ ] Add cache invalidation logic
- [ ] Add cache hit/miss metrics
- [ ] Test cache behavior
- [ ] Document caching policies

---

### 3.7 Code Quality: Extract Business Logic from Components

**Category**: Architecture  
**Severity**: LOW  
**Impact**: Testability, reusability  
**Effort**: 1 week  
**Files**: `src/lib/components/app/SyncIndicator.svelte`, other components with business logic

**Issue**: Some UI components contain business logic that should be extracted to service layer.

**Example**: `SyncIndicator.svelte` has sync logic embedded in component.

**Action Items**:

- [ ] Extract sync logic to service
- [ ] Extract any other business logic from UI components
- [ ] Update components to use services
- [ ] Add unit tests for extracted logic

---

### 3.8 Security: Add SQLite-Specific Error Handling

**Category**: Security/Error Handling  
**Severity**: LOW  
**Impact**: User experience  
**Effort**: 2 hours  
**Files**: All database operations

**Issue**: No specific handling for SQLite constraint violations, leading to technical error messages.

**Recommendation**: Catch specific SQLite errors and return user-friendly messages.

**Example**:

```typescript
try {
    await db.insert(users).values({...});
} catch (error) {
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
        return fail(400, { error: 'Email address already registered' });
    }
    throw error;
}
```

**Action Items**:

- [ ] Create SQLite error parser utility
- [ ] Map common constraint violations to user messages
- [ ] Update all database operations to use error parser
- [ ] Add tests for constraint violations

---

### 3.9 Code Quality: Implement Breadcrumb Component

**Category**: UI Enhancement  
**Severity**: LOW  
**Impact**: Navigation, user experience  
**Effort**: 1 day  
**Files**: Detail pages (journal entries, visits, meditation routines, etc.)

**Recommendation**: Add Breadcrumb component for detail pages as outlined in UI redesign plan.

**Action Items**:

- [ ] Use shadcn-svelte Breadcrumb component
- [ ] Add to SiteHeader component
- [ ] Implement for detail pages:
  - [ ] Journal > Entry Title
  - [ ] Fitness > Workouts > Workout Name
  - [ ] Meditation > Routines > Routine Name
  - [ ] Visits > Visit Name

---

### 3.10 Performance: Optimize Large List Rendering

**Category**: Performance  
**Severity**: LOW  
**Impact**: Performance on large datasets  
**Effort**: 1 week  
**Files**: Journal, todos, visits list pages

**Recommendations**:

- Implement virtual scrolling for large lists (Svelte Virtual List)
- Add pagination or infinite scroll
- Optimize database queries with proper indexes

**Action Items**:

- [ ] Measure performance with large datasets (1000+ items)
- [ ] Implement virtual scrolling for lists with 100+ items
- [ ] Add pagination as fallback
- [ ] Add database indexes for common queries
- [ ] Test with production-scale data

---

### 3.11 Code Quality: Standardize Component Props Patterns

**Category**: Code Quality  
**Severity**: LOW  
**Impact**: Consistency  
**Effort**: 3 days  
**Files**: All Svelte components

**Recommendations**:

- Standardize use of `$bindable()` for two-way binding
- Consistent prop naming conventions
- Add TypeScript interfaces for complex props

**Action Items**:

- [ ] Audit all component props
- [ ] Standardize prop patterns
- [ ] Create prop type definitions where needed
- [ ] Document prop conventions in AGENTS.md

---

## Implementation Roadmap

### Week 1-2: P1 High Priority

**Focus**: Security, critical code quality issues, reduce duplication

**Target Items**:

- ✅ 1.1: Fix authorization bypass (5 min)
- ✅ 1.2: Implement rate limiting (2 hours)
- ✅ 1.3: Use audit field utilities (4 hours)
- ✅ 1.4: Create tag parsing utility (1 hour)
- ✅ 1.5: Create form action helpers (2 hours)
- ✅ 1.6: Remove client imports of server types (3 hours)
- ✅ 1.7: Eliminate `any` types (2 hours)

**Total Effort**: ~14 hours

---

### Week 3-4: P2 Medium Priority (Part 1)

**Focus**: Architecture improvements, error handling

**Target Items**:

- ⏳ 2.1: Create service/repository layer (2 weeks - START)
- ✅ 2.3: Remove unused exports and dead code (3 hours)
- ✅ 2.4: Add missing error handling (4 hours)
- ✅ 2.5: Standardize error patterns (2 hours)
- ✅ 2.6: Fix silent failures (3 hours)
- ✅ 2.7: Replace console.log with logger (1 hour)
- ✅ 2.8: Add safe JSON parse utility (2 hours)

**Total Effort**: ~15 hours + ongoing service layer work

---

### Week 5-6: P2 Medium Priority (Part 2)

**Focus**: Complete architecture improvements, security hardening

**Target Items**:

- ✅ 2.1: Complete service/repository layer
- ✅ 2.2: Break down large page components (1 week)
- ✅ 2.9: Improve Content Security Policy (4 hours)
- ✅ 2.10: Move email from URL to session (2 hours)
- ✅ 2.11: Add transaction support (1 week)
- ✅ 2.12: Remove duplicate type definitions (30 min)

**Total Effort**: ~2 weeks

---

### Week 7+: P3 Low Priority (As Time Permits)

**Focus**: Nice-to-haves, polish, performance optimizations

**Target Items**:

- Optional based on priorities and time availability
- Can be deferred to future sprints
- Good candidates for community contributions

---

## Metrics and Success Criteria

### Code Quality Metrics

**Before Refactoring**:

- Duplicate code patterns: 50+ instances
- Unused exports: 15+ files/functions
- Large components (>200 lines): 5 components
- `any` type usage: 3 files
- Console.log violations: 3 files
- Missing error handling: 5+ files

**After Refactoring** (Target):

- Duplicate code patterns: <5 acceptable instances
- Unused exports: 0 (or documented as planned)
- Large components: 0 (all under 200 lines)
- `any` type usage: 0
- Console.log violations: 0 (except env.ts)
- Missing error handling: 0

### Performance Metrics

**Target**:

- Database query timeout: <100ms (95th percentile)
- Page load time: <1s (95th percentile)
- Error rate: <0.1% of requests
- Code coverage: >80% for service layer

### Security Metrics

**Target**:

- OWASP Top 10 vulnerabilities: 0 high/critical
- CSP violations: 0 in production
- Rate limit bypasses: 0
- Authorization bypasses: 0

---

## Risk Assessment

### High Risk Items

**1.1 Authorization Fix**: Low risk, high impact - simple change, critical security fix

**1.2 Rate Limiting**: Medium risk - could impact legitimate users if too restrictive

**2.1 Service Layer**: High effort, high risk - requires careful testing, could introduce bugs

**2.2 Component Refactoring**: Medium risk - could break UI if not tested thoroughly

### Risk Mitigation Strategies

1. **Feature Flags**: Use feature flags for major architectural changes
2. **Incremental Rollout**: Deploy changes gradually, monitor metrics
3. **Comprehensive Testing**: Add tests before and after refactoring
4. **Code Review**: Require reviews for all P0/P1 changes
5. **Backup Strategy**: Ensure database backups before data integrity changes
6. **Monitoring**: Add logging/monitoring for new code paths

---

## Appendix A: File Inventory

### Files Requiring Changes (P1)

**Security**:

- `src/routes/(app)/meditation/routines/[id]/+page.server.ts`
- `src/routes/api/sync/+server.ts`

**Utilities to Create**:

- `src/lib/server/db/utils.ts` (update)
- `src/lib/server/actions/form-helpers.ts` (create)
- `src/lib/types.ts` (update with client-safe types)

**Route Handlers to Update** (30+ files):

- All journal routes (4 files)
- All todos routes (5 files)
- All fitness routes (1 large file)
- All meditation routes (4 files)
- All visits routes (3 files)
- Profile route (1 file)

**Components to Update**:

- Todo components (4 files)
- App components (2 files)
- Data table components (2 files)
- Chart components (1 file)

---

## Appendix B: Dependency Audit

### Dependencies to Remove

```json
{
	"devDependencies": {
		"tw-animate-css": "REMOVE - not used"
	},
	"dependencies": {
		"dotenv-expand": "REMOVE - not used"
	}
}
```

### Dependencies to Consider Adding

```json
{
	"dependencies": {
		"@upstash/ratelimit": "^1.0.0", // For P1.2 rate limiting
		"ioredis": "^5.0.0" // For session storage (P2.10)
	}
}
```

---

## Appendix C: Quick Wins (< 1 hour each)

These can be tackled opportunistically:

1. ✅ **Fix authorization bypass** (5 min) - P1.1
2. ✅ **Create tag parsing utility** (30 min) - P1.4
3. ✅ **Remove unused dependencies** (5 min) - P2.3
4. ✅ **Replace console.log violations** (15 min) - P2.7
5. ✅ **Remove duplicate type definitions** (15 min) - P2.12
6. ⏳ **Delete unused files** (30 min) - P2.3
7. ⏳ **Add missing try/catch in sign-out** (10 min) - P2.4

---

## Conclusion

This refactoring plan addresses **44 identified issues** across security, code quality, architecture, and error handling. The phased approach prioritizes security and high-impact code quality improvements first, followed by architectural enhancements and lower-priority polish.

**Estimated Total Effort**: 6-8 weeks for P1 and P2 items

**Key Principles**:

- Security first (P0/P1)
- Reduce duplication (DRY)
- Improve testability (service layer)
- Consistent patterns (error handling, types)
- Maintain functionality (no breaking changes)

**Next Steps**:

1. Review and approve this plan
2. Create GitHub issues for each P1 item
3. Begin implementation following the roadmap
4. Monitor metrics and adjust priorities as needed

---

**Document Version**: 1.0  
**Last Updated**: February 11, 2026  
**Status**: ✅ Ready for Implementation
