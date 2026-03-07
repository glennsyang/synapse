import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
	type Cadence,
	type TodoState,
	type UpdatetodoItemput,
	updateTodoSchema
} from '$lib/schemas/todo';
import { requireAuth } from '$lib/server/actions/auth-guard';
import {
	getOwnedEntityOrNull,
	getOwnedEntityOrThrow
} from '$lib/server/actions/edit-route-helpers';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

function buildTodoUpdateData(
	formData: UpdatetodoItemput,
	existingState: string
): Record<string, unknown> {
	const updateData: Record<string, unknown> = {
		updatedAt: new Date().toISOString()
	};

	if (formData.title !== undefined) updateData.title = formData.title;
	if (formData.description !== undefined) updateData.description = formData.description;
	if (formData.cadence === undefined) {
		updateData.cadence = null;
	} else {
		updateData.cadence = formData.cadence;
	}
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
	const todo = await getOwnedEntityOrThrow(
		() =>
			getDb().query.todoItems.findFirst({
				where: and(eq(todoItems.id, params.id), eq(todoItems.userId, locals.user?.id))
			}),
		{ type: 'redirect', to: '/todos' }
	);

	// Parse JSON fields for form
	const tagsArray = todo.tags ? JSON.parse(todo.tags) : [];
	const tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';

	// Prepare form data
	const form = await superValidate(
		{
			title: todo.title,
			description: todo.description ?? undefined,
			cadence: (todo.cadence as Cadence) ?? 'none',
			priority: todo.priority,
			dueDate: todo.dueDate ?? undefined,
			state: todo.state as TodoState,
			tags: tagsString
		},
		zod4(updateTodoSchema)
	);

	return {
		todo,
		form
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const todoId = params.id as string;

		const form = await superValidate(request, zod4(updateTodoSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const existing = await getOwnedEntityOrNull(() =>
				getDb().query.todoItems.findFirst({
					where: and(eq(todoItems.id, todoId), eq(todoItems.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { form, error: 'Todo not found' });
			}

			const updateData = buildTodoUpdateData(form.data, existing.state);

			await getDb().update(todoItems).set(updateData).where(eq(todoItems.id, todoId));

			logger.info('Todo updated', { todoId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update todo', { error, todoId });
			return fail(500, { form, error: 'Failed to update todo' });
		}

		throw redirect(303, `/todos`);
	}),

	delete: requireAuth(async ({ params }, user) => {
		const todoId = params.id as string;

		try {
			const existing = await getOwnedEntityOrNull(() =>
				getDb().query.todoItems.findFirst({
					where: and(eq(todoItems.id, todoId), eq(todoItems.userId, user.id))
				})
			);

			if (!existing) {
				return fail(404, { error: 'Todo not found' });
			}

			// Delete todoItem
			await getDb().delete(todoItems).where(eq(todoItems.id, todoId));

			logger.info('Todo deleted', { todoId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete todo', { error, todoId });
			return fail(500, { error: 'Failed to delete todo' });
		}

		throw redirect(303, '/todos');
	})
};
