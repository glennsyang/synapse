import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { type TaskState, type UpdateTaskInput, updateTaskSchema } from '$lib/schemas/task';
import { requireAuth } from '$lib/server/actions/auth-guard';
import {
	getOwnedEntityOrNull,
	getOwnedEntityOrThrow
} from '$lib/server/actions/edit-route-helpers';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

function buildTaskUpdateData(
	formData: UpdateTaskInput,
	existingState: string
): Record<string, unknown> {
	const updateData: Record<string, unknown> = {
		updatedAt: new Date().toISOString()
	};

	if (formData.title !== undefined) updateData.title = formData.title;
	if (formData.description !== undefined) updateData.description = formData.description;
	if (formData.tags !== undefined) updateData.tags = toCommaSeparatedJson(formData.tags);
	if (formData.dueDate !== undefined) updateData.dueDate = formData.dueDate;
	if (formData.priority !== undefined) updateData.priority = formData.priority;

	if (formData.state !== undefined) {
		updateData.state = formData.state;
		if (formData.state === 'done' && existingState !== 'done') {
			updateData.completedAt = new Date().toISOString();
		} else if (formData.state !== 'done' && existingState === 'done') {
			updateData.completedAt = null;
		}
	}

	return updateData;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const task = await getOwnedEntityOrThrow(
		() =>
			getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, params.id), eq(tasks.userId, locals.user?.id))
			}),
		{ type: 'redirect', to: '/tasks' }
	);

	// Parse JSON fields for form
	const tagsArray = task.tags ? JSON.parse(task.tags) : [];
	const tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';

	// Prepare form data
	const form = await superValidate(
		{
			title: task.title,
			description: task.description ?? undefined,
			priority: task.priority,
			dueDate: task.dueDate ?? undefined,
			state: task.state as TaskState,
			tags: tagsString
		},
		zod4(updateTaskSchema)
	);

	return {
		task,
		form
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const taskId = params.id as string;

		const form = await superValidate(request, zod4(updateTaskSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const existing = await getOwnedEntityOrNull(() =>
				getDb().query.tasks.findFirst({
					where: and(eq(tasks.id, taskId), eq(tasks.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}

			const updateData = buildTaskUpdateData(form.data, existing.state);

			await getDb().update(tasks).set(updateData).where(eq(tasks.id, taskId));

			logger.info('Task updated', { taskId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update task', { error, taskId });
			return fail(500, { form, error: 'Failed to update task' });
		}

		throw redirect(303, '/tasks');
	}),

	delete: requireAuth(async ({ params }, user) => {
		const taskId = params.id as string;

		try {
			const existing = await getOwnedEntityOrNull(() =>
				getDb().query.tasks.findFirst({
					where: and(eq(tasks.id, taskId), eq(tasks.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { error: 'Task not found' });
			}

			await getDb().delete(tasks).where(eq(tasks.id, taskId));

			logger.info('Task deleted', { taskId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete task', { error, taskId });
			return fail(500, { error: 'Failed to delete task' });
		}

		throw redirect(303, '/tasks');
	})
};
