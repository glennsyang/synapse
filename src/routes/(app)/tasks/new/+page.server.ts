import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { createTaskSchema } from '$lib/schemas/task';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(createTaskSchema));

	return {
		form
	};
};

export const actions: Actions = {
	default: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createTaskSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const tagsJson = toCommaSeparatedJson(form.data.tags);

			const [newTask] = await getDb()
				.insert(tasks)
				.values({
					userId: user.id,
					title: form.data.title,
					description: form.data.description || null,
					tags: tagsJson,
					dueDate: form.data.dueDate || null,
					priority: form.data.priority,
					state: form.data.state,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				})
				.returning();

			logger.info('Task created', { taskId: newTask.id, userId: user.id });
		} catch (error) {
			logger.error('Failed to create task', { error, userId: user.id });
			return fail(500, { form, error: 'Failed to create task' });
		}

		throw redirect(303, '/tasks');
	})
};
