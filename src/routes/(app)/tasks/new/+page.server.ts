import { logger } from '$lib';
import { createTaskSchema, type TaskState, TaskStateEnum } from '$lib/schemas/task';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const MAX_TASK_NUMBER_ATTEMPTS = 3;
const TASK_NUMBER_CONSTRAINT_TEXT = 'UNIQUE constraint failed: tasks.task_number';

function getInitialTaskState(rawState: string | null): TaskState {
	const parsedState = TaskStateEnum.safeParse(rawState);
	return parsedState.success ? parsedState.data : 'new';
}

function isTaskNumberConflict(error: unknown): boolean {
	return error instanceof Error && error.message.includes(TASK_NUMBER_CONSTRAINT_TEXT);
}

async function createTaskWithTaskNumber(
	userId: string,
	input: {
		title: string;
		description: string | null;
		tags: string | null;
		dueDate: string | null;
		priority: number;
		state: TaskState;
	}
) {
	const db = getDb();

	for (let attempt = 1; attempt <= MAX_TASK_NUMBER_ATTEMPTS; attempt += 1) {
		try {
			return db.transaction((tx) => {
				const [taskNumberRow] = tx
					.select({
						nextTaskNumber: sql<number>`coalesce(max(${tasks.taskNumber}), 0) + 1`
					})
					.from(tasks)
					.all();

				const [sortOrderRow] = tx
					.select({
						maxSortOrder: sql<number>`coalesce(max(${tasks.sortOrder}), -1)`
					})
					.from(tasks)
					.where(and(eq(tasks.userId, userId), eq(tasks.state, input.state)))
					.all();

				const timestamp = new Date().toISOString();
				const nextTaskNumber = taskNumberRow?.nextTaskNumber ?? 1;
				const nextSortOrder = (sortOrderRow?.maxSortOrder ?? -1) + 1;

				const [newTask] = tx
					.insert(tasks)
					.values({
						userId,
						taskNumber: nextTaskNumber,
						title: input.title,
						description: input.description,
						tags: input.tags,
						dueDate: input.dueDate,
						priority: input.priority,
						state: input.state,
						sortOrder: nextSortOrder,
						createdAt: timestamp,
						updatedAt: timestamp
					})
					.returning()
					.all();

				return newTask;
			});
		} catch (error) {
			if (isTaskNumberConflict(error) && attempt < MAX_TASK_NUMBER_ATTEMPTS) {
				continue;
			}

			throw error;
		}
	}

	throw new Error('Failed to allocate a task number');
}

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(
		{
			priority: 2,
			state: getInitialTaskState(url.searchParams.get('state'))
		},
		zod4(createTaskSchema)
	);

	return { form };
};

export const actions = {
	default: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createTaskSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const duplicate = await getDb().query.tasks.findFirst({
			where: and(eq(tasks.userId, user.id), eq(tasks.title, form.data.title))
		});
		if (duplicate) {
			return setError(form, 'title', 'A task with this name already exists.');
		}

		try {
			const tagsJson = toCommaSeparatedJson(form.data.tags);

			const newTask = await createTaskWithTaskNumber(user.id, {
				title: form.data.title,
				description: form.data.description || null,
				tags: tagsJson,
				dueDate: form.data.dueDate || null,
				priority: form.data.priority,
				state: form.data.state
			});

			logger.info('Task created', {
				taskId: newTask.id,
				taskNumber: newTask.taskNumber,
				userId: user.id
			});
		} catch (error) {
			logger.error('Failed to create task', { error, userId: user.id });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while creating the task. Please try again.'
				},
				{ status: 500 }
			);
		}

		throw redirect(303, '/tasks');
	})
} satisfies Actions;
