import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { createTodoSchema } from '$lib/schemas/todo';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(createTodoSchema));

	return {
		form
	};
};

export const actions: Actions = {
	default: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createTodoSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const tagsJson = toCommaSeparatedJson(form.data.tags);

			// Insert new todoItem
			const [newTodo] = await getDb()
				.insert(todoItems)
				.values({
					userId: user.id,
					title: form.data.title,
					description: form.data.description || null,
					cadence: form.data.cadence || null,
					tags: tagsJson,
					dueDate: form.data.dueDate || null,
					priority: form.data.priority,
					state: form.data.state,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				})
				.returning();

			logger.info('Todo created', { todoId: newTodo.id, userId: user.id });
		} catch (error) {
			logger.error('Failed to create todo', { error, userId: user.id });
			return fail(500, { form, error: 'Failed to create todo' });
		}

		throw redirect(303, '/todos');
	})
};
