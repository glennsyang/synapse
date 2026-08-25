import type { TaskState } from '$lib/schemas/task';
import { ApiWriteError } from '$lib/server/api/errors';
import type { ApiCreateTaskInput, ApiUpdateTaskInput } from '$lib/server/api/schemas/tasks';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { withAuditFieldsForUpdate } from '$lib/server/db/utils';
import { and, eq, ne, sql } from 'drizzle-orm';

const MAX_TASK_NUMBER_ATTEMPTS = 3;
const TASK_NUMBER_CONSTRAINT_TEXT = 'UNIQUE constraint failed: tasks.task_number';

function isTaskNumberConflict(error: unknown): boolean {
	return error instanceof Error && error.message.includes(TASK_NUMBER_CONSTRAINT_TEXT);
}

function tagsToJson(tags: string[] | undefined | null): string | null {
	if (!tags || tags.length === 0) return null;
	return JSON.stringify(tags);
}

async function assertNoDuplicateTitle(userId: string, title: string, excludeTaskId?: string) {
	const duplicate = await getDb().query.tasks.findFirst({
		where: excludeTaskId
			? and(eq(tasks.userId, userId), eq(tasks.title, title), ne(tasks.id, excludeTaskId))
			: and(eq(tasks.userId, userId), eq(tasks.title, title))
	});
	if (duplicate) {
		throw new ApiWriteError('validation_failed', 'A task with this name already exists.', 400);
	}
}

/**
 * Insert path for API-key-driven task creation. Mirrors the task-number-allocation
 * transaction and duplicate-title check in
 * src/routes/(app)/tasks/new/+page.server.ts, kept as its own standalone function
 * rather than sharing code with that UI action.
 */
export async function createTask(userId: string, input: ApiCreateTaskInput) {
	await assertNoDuplicateTitle(userId, input.title);

	const db = getDb();

	for (let attempt = 1; attempt <= MAX_TASK_NUMBER_ATTEMPTS; attempt += 1) {
		try {
			return db.transaction((tx) => {
				const [taskNumberRow] = tx
					.select({
						nextTaskNumber: sql<number>`coalesce(max(${tasks.taskNumber}), 0) + 1`
					})
					.from(tasks)
					.all();

				const [sortOrderRow] = tx
					.select({
						maxSortOrder: sql<number>`coalesce(max(${tasks.sortOrder}), -1)`
					})
					.from(tasks)
					.where(and(eq(tasks.userId, userId), eq(tasks.state, input.state)))
					.all();

				const timestamp = new Date().toISOString();
				const nextTaskNumber = taskNumberRow?.nextTaskNumber ?? 1;
				const nextSortOrder = (sortOrderRow?.maxSortOrder ?? -1) + 1;

				const [newTask] = tx
					.insert(tasks)
					.values({
						userId,
						taskNumber: nextTaskNumber,
						title: input.title,
						description: input.description ?? null,
						tags: tagsToJson(input.tags),
						dueDate: input.dueDate ?? null,
						priority: input.priority,
						state: input.state,
						sortOrder: nextSortOrder,
						createdAt: timestamp,
						updatedAt: timestamp
					})
					.returning()
					.all();

				return newTask;
			});
		} catch (error) {
			if (isTaskNumberConflict(error) && attempt < MAX_TASK_NUMBER_ATTEMPTS) {
				continue;
			}
			throw error;
		}
	}

	throw new Error('Failed to allocate a task number');
}

/**
 * Update path for API-key-driven task updates. Mirrors the field-mapping and
 * kanban-column resort-on-state-change logic in
 * src/routes/(app)/tasks/[id]/edit/+page.server.ts, kept separate from that UI action.
 */
export async function updateTask(userId: string, taskId: string, input: ApiUpdateTaskInput) {
	const db = getDb();

	if (input.title) {
		await assertNoDuplicateTitle(userId, input.title, taskId);
	}

	const existing = await db.query.tasks.findFirst({
		where: and(eq(tasks.id, taskId), eq(tasks.userId, userId))
	});

	if (!existing) {
		throw new ApiWriteError('not_found', 'Task not found.', 404);
	}

	const nextState = (input.state ?? existing.state) as TaskState;

	const buildUpdateData = (existingState: string) => {
		const updateData: Partial<typeof tasks.$inferInsert> = {
			...withAuditFieldsForUpdate()
		};

		if (input.title !== undefined) updateData.title = input.title;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.tags !== undefined) updateData.tags = tagsToJson(input.tags);
		if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
		if (input.priority !== undefined) updateData.priority = input.priority;

		if (input.state !== undefined) {
			updateData.state = input.state;
			if (input.state === 'done' && existingState !== 'done') {
				updateData.completedAt = new Date().toISOString();
			} else if (input.state !== 'done' && existingState === 'done') {
				updateData.completedAt = null;
			}
		}

		return updateData;
	};

	if (nextState === existing.state) {
		const updateData = buildUpdateData(existing.state);
		await db
			.update(tasks)
			.set(updateData)
			.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
	} else {
		const timestamp = new Date().toISOString();

		// The better-sqlite3 driver runs transaction callbacks synchronously, so every
		// query inside must use its sync execution method (`.all()`/`.run()`/`.sync()`)
		// instead of `await` — an `async` callback throws "Transaction function cannot
		// return a promise" at runtime.
		db.transaction((tx) => {
			const [targetSortOrderRow] = tx
				.select({
					maxSortOrder: sql<number>`coalesce(max(${tasks.sortOrder}), -1)`
				})
				.from(tasks)
				.where(and(eq(tasks.userId, userId), eq(tasks.state, nextState)))
				.all();

			const sourceRows = tx.query.tasks
				.findMany({
					where: and(eq(tasks.userId, userId), eq(tasks.state, existing.state as TaskState)),
					columns: { id: true },
					orderBy: [tasks.sortOrder, tasks.taskNumber]
				})
				.sync();

			const sourceTaskIds = sourceRows
				.map((row) => row.id)
				.filter((sourceTaskId) => sourceTaskId !== taskId);

			const updateData = buildUpdateData(existing.state);

			tx.update(tasks)
				.set({
					...updateData,
					sortOrder: (targetSortOrderRow?.maxSortOrder ?? -1) + 1,
					updatedAt: timestamp
				})
				.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
				.run();

			for (let index = 0; index < sourceTaskIds.length; index += 1) {
				tx.update(tasks)
					.set({ sortOrder: index, updatedAt: timestamp })
					.where(and(eq(tasks.id, sourceTaskIds[index]), eq(tasks.userId, userId)))
					.run();
			}
		});
	}

	const updated = await db.query.tasks.findFirst({
		where: and(eq(tasks.id, taskId), eq(tasks.userId, userId))
	});

	if (!updated) {
		throw new ApiWriteError('not_found', 'Task not found.', 404);
	}

	return updated;
}
