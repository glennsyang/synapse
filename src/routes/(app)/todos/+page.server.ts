import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { updateTodoStateSchema } from '$lib/schemas/todo';
import { requireAuth } from '$lib/server/actions/auth-guard';
import getDb from '$lib/server/db';
import { projects, todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Auth handled by (app)/+layout.server.ts

	const userId = locals.user!.id;

	// Parse query parameters for filtering
	const cadence = url.searchParams.get('cadence');
	const projectId = url.searchParams.get('project');
	const state = url.searchParams.get('state');
	const priority = url.searchParams.get('priority');
	const tag = url.searchParams.get('tag');

	try {
		// Build where conditions
		const conditions = [eq(todoItems.userId, userId)];

		if (cadence) {
			conditions.push(eq(todoItems.cadence, cadence));
		}
		if (projectId) {
			conditions.push(eq(todoItems.projectId, projectId));
		}
		if (state) {
			conditions.push(eq(todoItems.state, state));
		}
		if (priority) {
			conditions.push(eq(todoItems.priority, Number.parseInt(priority, 10)));
		}

		// Query todos with project relation
		let todos = await getDb().query.todoItems.findMany({
			where: and(...conditions),
			with: {
				project: true
			},
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

		// Parse JSON fields for frontend
		const todosWithParsedFields = todos.map((todo) => ({
			...todo,
			tags: todo.tags ? JSON.parse(todo.tags) : null,
			subSteps: todo.subSteps ? JSON.parse(todo.subSteps) : null
		}));

		// Get all user projects for filter dropdown
		const userProjects = await getDb().query.projects.findMany({
			where: eq(projects.userId, userId),
			orderBy: [projects.name]
		});

		return {
			todos: todosWithParsedFields,
			projects: userProjects
		};
	} catch (error) {
		logger.error('Failed to load todos', { error, userId });
		return {
			todos: [],
			projects: []
		};
	}
};

export const actions: Actions = {
	/**
	 * Update todoItem state (for drag-and-drop in kanban view)
	 */
	updateState: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateTodoStateSchema));
		if (!form.valid) return { form, status: 400 };

		try {
			// Verify todoItem belongs to user
			const existing = await getDb().query.todoItems.findFirst({
				where: and(eq(todoItems.id, form.data.id), eq(todoItems.userId, user.id))
			});

			if (!existing) {
				return { form, error: 'Todo not found', status: 404 };
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
			return { form, error: 'Failed to update todo state', status: 500 };
		}
	})
};
