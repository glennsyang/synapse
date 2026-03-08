import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { TaskState } from '$lib/schemas/task';
import { updateTaskStateSchema } from '$lib/schemas/task';
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

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id;

	// Parse query parameters for filtering
	const state = url.searchParams.get('state');
	const priority = url.searchParams.get('priority');
	const tag = url.searchParams.get('tag');

	try {
		// Build where conditions
		const conditions = [eq(tasks.userId, userId)];

		if (state) {
			conditions.push(eq(tasks.state, state));
		}
		if (priority) {
			conditions.push(eq(tasks.priority, Number.parseInt(priority, 10)));
		}

		let taskRows = await getDb().query.tasks.findMany({
			where: and(...conditions),
			orderBy: [tasks.priority, tasks.dueDate, tasks.createdAt]
		});

		// Filter by tag if provided (tags are stored as JSON)
		if (tag) {
			taskRows = taskRows.filter((task) => {
				if (!task.tags) return false;
				try {
					const tagArray = JSON.parse(task.tags);
					return Array.isArray(tagArray) && tagArray.includes(tag);
				} catch {
					return false;
				}
			});
		}

		const tasksWithParsedFields = taskRows.map((task) => ({
			...task,
			state: task.state as TaskState,
			tags: task.tags ? (JSON.parse(task.tags) as string[]) : null
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
	})
};
