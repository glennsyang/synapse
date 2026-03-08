import { fail, redirect } from '@sveltejs/kit';
import { and, eq, like, or } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { TaskState } from '$lib/schemas/task';
import { deleteTaskSchema, taskFilterSchema, updateTaskStateSchema } from '$lib/schemas/task';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

/**
 * Get all unique tags across the user's tasks
 */
async function getAllTags(userId: string): Promise<string[]> {
	const taskRows = await getDb().query.tasks.findMany({
		where: eq(tasks.userId, userId),
		columns: { tags: true }
	});

	const tagSet = new Set<string>();
	for (const task of taskRows) {
		if (task.tags) {
			try {
				const tagArray = JSON.parse(task.tags);
				if (Array.isArray(tagArray)) {
					for (const tag of tagArray) {
						tagSet.add(tag);
					}
				}
			} catch {
				// Skip invalid JSON
			}
		}
	}

	return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

function parseStoredTags(rawTags: string | null): string[] | null {
	if (!rawTags) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawTags);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id;
	const filters = taskFilterSchema.safeParse({
		keyword: url.searchParams.get('keyword') ?? undefined,
		priority: url.searchParams.get('priority') ?? undefined,
		tag: url.searchParams.get('tag') ?? undefined,
		state: url.searchParams.get('state') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid task filter parameters', { error: filters.error, userId });

		return {
			tasks: [],
			allTags: userId ? await getAllTags(userId) : []
		};
	}

	const { keyword, priority, state, tag } = filters.data;

	try {
		// Build where conditions
		const conditions = [eq(tasks.userId, userId)];

		if (state) {
			conditions.push(eq(tasks.state, state));
		}
		if (priority.length > 0) {
			const priorityCondition = or(...priority.map((value) => eq(tasks.priority, value)));
			if (priorityCondition) {
				conditions.push(priorityCondition);
			}
		}
		if (keyword) {
			const keywordPattern = `%${keyword}%`;
			const keywordCondition = or(
				like(tasks.title, keywordPattern),
				like(tasks.description, keywordPattern)
			);
			if (keywordCondition) {
				conditions.push(keywordCondition);
			}
		}
		if (tag.length > 0) {
			const tagCondition = or(...tag.map((value) => like(tasks.tags, `%"${value}"%`)));
			if (tagCondition) {
				conditions.push(tagCondition);
			}
		}

		const taskRows = await getDb().query.tasks.findMany({
			where: and(...conditions),
			orderBy: [tasks.priority, tasks.dueDate, tasks.taskNumber]
		});

		const tasksWithParsedFields = taskRows.map((task) => ({
			...task,
			taskNumber: task.taskNumber,
			state: task.state as TaskState,
			tags: parseStoredTags(task.tags)
		}));

		// Get all unique tags for filter component
		const allTags = await getAllTags(userId);

		return {
			tasks: tasksWithParsedFields,
			allTags
		};
	} catch (error) {
		logger.error('Failed to load tasks', { error, userId });
		return {
			tasks: [],
			allTags: []
		};
	}
};

export const actions: Actions = {
	/**
	 * Update task state from the kanban board
	 */
	updateState: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateTaskStateSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const existing = await getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}

			// Update state and completedAt if changing to done
			const updateData: Record<string, unknown> = {
				state: form.data.state,
				updatedAt: new Date().toISOString()
			};

			if (form.data.state === 'done' && existing.state !== 'done') {
				updateData.completedAt = new Date().toISOString();
			} else if (form.data.state !== 'done' && existing.state === 'done') {
				updateData.completedAt = null;
			}

			await getDb().update(tasks).set(updateData).where(eq(tasks.id, form.data.id));

			return { form };
		} catch (error) {
			logger.error('Failed to update task state', { error, form });
			return fail(500, { form, error: 'Failed to update task state' });
		}
	}),

	delete: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteTaskSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const existing = await getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}

			await getDb().delete(tasks).where(eq(tasks.id, form.data.id));

			logger.info('Task deleted from board', {
				taskId: form.data.id,
				taskNumber: existing.taskNumber,
				userId: user.id
			});
		} catch (error) {
			logger.error('Failed to delete task from board', { error, form });
			return fail(500, { form, error: 'Failed to delete task' });
		}

		throw redirect(303, '/tasks');
	})
};
