import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { type Cadence, type TodoState, updateTodoSchema } from '$lib/schemas/todo';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import getDb from '$lib/server/db';
import { todoItems } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Load todoItem
	const todo = await getDb().query.todoItems.findFirst({
		where: and(eq(todoItems.id, params.id), eq(todoItems.userId, locals.user?.id))
	});

	if (!todo) {
		throw redirect(303, '/todos');
	}

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
			// Verify todoItem belongs to user
			const existing = await getDb().query.todoItems.findFirst({
				where: and(eq(todoItems.id, todoId), eq(todoItems.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Todo not found' });
			}

			const tagsJson = toCommaSeparatedJson(form.data.tags);

			// Build update data
			const updateData: Record<string, unknown> = {
				updatedAt: new Date().toISOString()
			};

			if (form.data.title !== undefined) updateData.title = form.data.title;
			if (form.data.description !== undefined) updateData.description = form.data.description;
			if (form.data.cadence === undefined) {
				updateData.cadence = null; // Clear cadence if not provided
			} else {
				updateData.cadence = form.data.cadence;
			}
			if (form.data.tags !== undefined) updateData.tags = tagsJson;
			if (form.data.dueDate !== undefined) updateData.dueDate = form.data.dueDate;
			if (form.data.priority !== undefined) updateData.priority = form.data.priority;

			// Handle state change and completedAt
			if (form.data.state !== undefined) {
				updateData.state = form.data.state;
				if (form.data.state === 'done' && existing.state !== 'done') {
					updateData.completedAt = new Date().toISOString();
				} else if (form.data.state !== 'done' && existing.state === 'done') {
					updateData.completedAt = null;
				}
			}

			// Update todoItem
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
			// Verify todoItem belongs to user
			const existing = await getDb().query.todoItems.findFirst({
				where: and(eq(todoItems.id, todoId), eq(todoItems.userId, user.id))
			});

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
