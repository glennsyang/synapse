import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { createTodoSchema } from '$lib/schemas/todo';
import getDb from '$lib/server/db';
import { projects, todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	// Load user projects for the project dropdown
	const userProjects = await getDb().query.projects.findMany({
		where: eq(projects.userId, locals.user.id),
		orderBy: [projects.name]
	});

	const form = await superValidate(zod4(createTodoSchema));

	return {
		form,
		projects: userProjects
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const form = await superValidate(request, zod4(createTodoSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Verify project belongs to user if provided
			if (form.data.projectId) {
				const project = await getDb().query.projects.findFirst({
					where: eq(projects.id, form.data.projectId)
				});

				if (!project || project.userId !== locals.user.id) {
					return fail(400, { form, error: 'Invalid project' });
				}
			}

			// Parse tags from comma-separated string to JSON array
			let tagsJson: string | null = null;
			if (form.data.tags) {
				const tagsArray = form.data.tags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0);
				tagsJson = JSON.stringify(tagsArray);
			}

			// Insert new todoItem
			const [newTodo] = await getDb()
				.insert(todoItems)
				.values({
					userId: locals.user.id,
					title: form.data.title,
					description: form.data.description || null,
					cadence: form.data.cadence,
					projectId: form.data.projectId || null,
					tags: tagsJson,
					dueDate: form.data.dueDate || null,
					priority: form.data.priority,
					state: form.data.state,
					subSteps: null, // Will be added in edit page
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				})
				.returning();

			logger.info('Todo created', { todoId: newTodo.id, userId: locals.user.id });
		} catch (error) {
			logger.error('Failed to create todo', { error, userId: locals.user.id });
			return fail(500, { form, error: 'Failed to create todo' });
		}

		redirect(303, '/todos');
	}
};
