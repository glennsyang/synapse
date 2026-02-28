import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { updateTodoStateSchema } from '$lib/schemas/todo';
import { requireAuth } from '$lib/server/actions/auth-guard';
import getDb from '$lib/server/db';
import { todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

/**
 * Get all unique tags across user's todos
 */
async function getAllTags(userId: string): Promise<string[]> {
	const todos = await getDb().query.todoItems.findMany({
		where: eq(todoItems.userId, userId),
		columns: { tags: true }
	});

	const tagSet = new Set<string>();
	for (const todo of todos) {
		if (todo.tags) {
			try {
				const tagArray = JSON.parse(todo.tags);
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

	return Array.from(tagSet).sort();
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id;

	// Parse query parameters for filtering
	const cadence = url.searchParams.get('cadence');
	const state = url.searchParams.get('state');
	const priority = url.searchParams.get('priority');
	const tag = url.searchParams.get('tag');

	try {
		// Build where conditions
		const conditions = [eq(todoItems.userId, userId)];

		if (cadence) {
			conditions.push(eq(todoItems.cadence, cadence));
		}
		if (state) {
			conditions.push(eq(todoItems.state, state));
		}
		if (priority) {
			conditions.push(eq(todoItems.priority, Number.parseInt(priority, 10)));
		}

		// Query todos without project relation
		let todos = await getDb().query.todoItems.findMany({
			where: and(...conditions),
			orderBy: [todoItems.priority, todoItems.dueDate]
		});

		// Filter by tag if provided (tags are stored as JSON)
		if (tag) {
			todos = todos.filter((todo) => {
				if (!todo.tags) return false;
				try {
					const tagArray = JSON.parse(todo.tags);
					return Array.isArray(tagArray) && tagArray.includes(tag);
				} catch {
					return false;
				}
			});
		}

		// Parse tags JSON field for frontend
		const todosWithParsedFields = todos.map((todo) => ({
			...todo,
			tags: todo.tags ? JSON.parse(todo.tags) : null
		}));

		// Get all unique tags for filter component
		const allTags = await getAllTags(userId);

		return {
			todos: todosWithParsedFields,
			allTags
		};
	} catch (error) {
		logger.error('Failed to load todos', { error, userId });
		return {
			todos: [],
			allTags: []
		};
	}
};

export const actions: Actions = {
	/**
	 * Update todoItem state (for drag-and-drop in kanban view)
	 */
	updateState: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateTodoStateSchema));
		if (!form.valid) return fail(400, { form });

		try {
			// Verify todoItem belongs to user
			const existing = await getDb().query.todoItems.findFirst({
				where: and(eq(todoItems.id, form.data.id), eq(todoItems.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Todo not found' });
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

			await getDb().update(todoItems).set(updateData).where(eq(todoItems.id, form.data.id));

			return { form };
		} catch (error) {
			logger.error('Failed to update todo state', { error, form });
			return fail(500, { form, error: 'Failed to update todo state' });
		}
	})
};
