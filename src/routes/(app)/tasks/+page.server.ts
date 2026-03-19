import { fail, redirect } from '@sveltejs/kit';
import { and, eq, like, or } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
	createDailyAgendaEntrySchema,
	createDailyAgendaTemplateSchema,
	dailyAgendaPageQuerySchema,
	deleteDailyAgendaEntrySchema,
	deleteDailyAgendaTemplateSchema,
	toggleDailyAgendaEntrySchema,
	updateDailyAgendaEntrySchema,
	updateDailyAgendaTemplateSchema
} from '$lib/schemas/daily-agenda';
import type { TaskState } from '$lib/schemas/task';
import { deleteTaskSchema, taskFilterSchema, updateTaskStateSchema } from '$lib/schemas/task';
import { requireAuth } from '$lib/server/actions/auth-guard';
import {
	createDailyAgendaCustomEntry,
	createDailyAgendaTemplate,
	DailyAgendaMutationError,
	deleteDailyAgendaCustomEntry,
	deleteDailyAgendaTemplate,
	loadDailyAgendaData,
	toggleDailyAgendaEntry,
	updateDailyAgendaCustomEntry,
	updateDailyAgendaTemplate
} from '$lib/server/daily-agenda';
import { getDb } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { getStartOfWeek } from '$lib/utils/date';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

type AgendaActionScope =
	| 'create-template'
	| 'update-template'
	| 'delete-template'
	| 'create-entry'
	| 'update-entry'
	| 'delete-entry'
	| 'toggle-entry';

type AgendaActionPayload = {
	scope: AgendaActionScope;
	type: 'success' | 'error' | 'validation-error';
	text: string;
	fieldErrors?: unknown;
	values?: Record<string, unknown>;
	entityId?: string;
	date?: string;
};

function buildAgendaActionPayload(
	scope: AgendaActionScope,
	payload: Omit<AgendaActionPayload, 'scope'>
) {
	return {
		agendaAction: {
			scope,
			...payload
		}
	};
}

function failAgendaValidation(
	scope: AgendaActionScope,
	form: Awaited<ReturnType<typeof superValidate>>,
	extra: Partial<AgendaActionPayload> = {}
) {
	return fail(
		400,
		buildAgendaActionPayload(scope, {
			type: 'validation-error',
			text: 'Please correct the highlighted fields.',
			fieldErrors: form.errors,
			values: form.data,
			...extra
		})
	);
}

function failAgendaMutation(
	scope: AgendaActionScope,
	error: unknown,
	context: {
		userId: string;
		entityId?: string;
		date?: string;
		message: string;
		logMessage: string;
	}
) {
	if (error instanceof DailyAgendaMutationError) {
		const status = error.code === 'not_found' ? 404 : 400;
		return fail(
			status,
			buildAgendaActionPayload(scope, {
				type: 'error',
				text: error.message,
				entityId: context.entityId,
				date: context.date
			})
		);
	}

	logger.error(context.logMessage, {
		error,
		userId: context.userId,
		entityId: context.entityId,
		date: context.date
	});

	return fail(
		500,
		buildAgendaActionPayload(scope, {
			type: 'error',
			text: context.message,
			entityId: context.entityId,
			date: context.date
		})
	);
}

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

function parseStoredTags(rawTags: string | null): string[] | null {
	if (!rawTags) {
		return null;
	}

	try {
		const parsed = JSON.parse(rawTags);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

async function loadTaskBoardData(
	userId: string,
	filters: {
		keyword?: string;
		priority: number[];
		tag: string[];
		state?: TaskState;
	}
) {
	const conditions = [eq(tasks.userId, userId)];

	if (filters.state) {
		conditions.push(eq(tasks.state, filters.state));
	}

	if (filters.priority.length > 0) {
		const priorityCondition = or(...filters.priority.map((value) => eq(tasks.priority, value)));
		if (priorityCondition) {
			conditions.push(priorityCondition);
		}
	}

	if (filters.keyword) {
		const keywordPattern = `%${filters.keyword}%`;
		const keywordCondition = or(
			like(tasks.title, keywordPattern),
			like(tasks.description, keywordPattern)
		);
		if (keywordCondition) {
			conditions.push(keywordCondition);
		}
	}

	if (filters.tag.length > 0) {
		const tagCondition = or(...filters.tag.map((value) => like(tasks.tags, `%"${value}"%`)));
		if (tagCondition) {
			conditions.push(tagCondition);
		}
	}

	const taskRows = await getDb().query.tasks.findMany({
		where: and(...conditions),
		orderBy: [tasks.priority, tasks.dueDate, tasks.taskNumber]
	});

	return taskRows.map((task) => ({
		...task,
		taskNumber: task.taskNumber,
		state: task.state as TaskState,
		tags: parseStoredTags(task.tags)
	}));
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id;
	const pageState = dailyAgendaPageQuerySchema.safeParse({
		tab: url.searchParams.get('tab') ?? undefined,
		week: url.searchParams.get('week') ?? undefined
	});
	const activeTab = pageState.success ? pageState.data.tab : 'kanban';
	const agendaWeek = pageState.success ? pageState.data.week : getStartOfWeek();
	const agenda = userId ? await loadDailyAgendaData(userId, agendaWeek) : null;
	const filters = taskFilterSchema.safeParse({
		keyword: url.searchParams.get('keyword') ?? undefined,
		priority: url.searchParams.get('priority') ?? undefined,
		tag: url.searchParams.get('tag') ?? undefined,
		state: url.searchParams.get('state') ?? undefined
	});

	if (!filters.success) {
		logger.error('Invalid task filter parameters', { error: filters.error, userId });

		return {
			activeTab,
			agenda,
			tasks: [],
			allTags: userId ? await getAllTags(userId) : []
		};
	}

	try {
		const tasksWithParsedFields = await loadTaskBoardData(userId, filters.data);

		// Get all unique tags for filter component
		const allTags = await getAllTags(userId);

		return {
			activeTab,
			agenda,
			tasks: tasksWithParsedFields,
			allTags
		};
	} catch (error) {
		logger.error('Failed to load tasks', { error, userId });
		return {
			activeTab,
			agenda,
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
	}),

	delete: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteTaskSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const existing = await getDb().query.tasks.findFirst({
				where: and(eq(tasks.id, form.data.id), eq(tasks.userId, user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Task not found' });
			}
			await getDb().delete(tasks).where(eq(tasks.id, form.data.id));

			logger.info('Task deleted from board', {
				taskId: form.data.id,
				taskNumber: existing.taskNumber,
				userId: user.id
			});
		} catch (error) {
			logger.error('Failed to delete task from board', { error, form });
			return fail(500, { form, error: 'Failed to delete task' });
		}

		throw redirect(303, '/tasks');
	}),

	createAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('create-template', form);
		}

		try {
			await createDailyAgendaTemplate(user.id, form.data.title, form.data.daysOfWeek);

			return buildAgendaActionPayload('create-template', {
				type: 'success',
				text: 'Default item added.'
			});
		} catch (error) {
			return failAgendaMutation('create-template', error, {
				userId: user.id,
				message: 'Failed to add default item.',
				logMessage: 'Failed to create Daily Agenda template'
			});
		}
	}),

	updateAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('update-template', form, { entityId: form.data.id });
		}

		try {
			await updateDailyAgendaTemplate(user.id, form.data.id, form.data.title, form.data.daysOfWeek);

			return buildAgendaActionPayload('update-template', {
				type: 'success',
				text: 'Default item updated.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('update-template', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update default item.',
				logMessage: 'Failed to update Daily Agenda template'
			});
		}
	}),

	deleteAgendaTemplate: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteDailyAgendaTemplateSchema));
		if (!form.valid) {
			return failAgendaValidation('delete-template', form, { entityId: form.data.id });
		}

		try {
			await deleteDailyAgendaTemplate(user.id, form.data.id);

			return buildAgendaActionPayload('delete-template', {
				type: 'success',
				text: 'Default item deleted.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('delete-template', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to delete default item.',
				logMessage: 'Failed to delete Daily Agenda template'
			});
		}
	}),

	createAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('create-entry', form, { date: form.data.date });
		}

		try {
			await createDailyAgendaCustomEntry(user.id, form.data);

			return buildAgendaActionPayload('create-entry', {
				type: 'success',
				text: 'Agenda item added.',
				date: form.data.date
			});
		} catch (error) {
			return failAgendaMutation('create-entry', error, {
				userId: user.id,
				date: form.data.date,
				message: 'Failed to add agenda item.',
				logMessage: 'Failed to create Daily Agenda entry'
			});
		}
	}),

	updateAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('update-entry', form, { entityId: form.data.id });
		}

		try {
			await updateDailyAgendaCustomEntry(user.id, form.data.id, form.data.title);

			return buildAgendaActionPayload('update-entry', {
				type: 'success',
				text: 'Agenda item updated.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('update-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update agenda item.',
				logMessage: 'Failed to update Daily Agenda entry'
			});
		}
	}),

	deleteAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(deleteDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('delete-entry', form, { entityId: form.data.id });
		}

		try {
			await deleteDailyAgendaCustomEntry(user.id, form.data.id);

			return buildAgendaActionPayload('delete-entry', {
				type: 'success',
				text: 'Agenda item deleted.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('delete-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to delete agenda item.',
				logMessage: 'Failed to delete Daily Agenda entry'
			});
		}
	}),

	toggleAgendaEntry: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(toggleDailyAgendaEntrySchema));
		if (!form.valid) {
			return failAgendaValidation('toggle-entry', form, { entityId: form.data.id });
		}

		try {
			await toggleDailyAgendaEntry(user.id, form.data.id, form.data.completed);

			return buildAgendaActionPayload('toggle-entry', {
				type: 'success',
				text: form.data.completed ? 'Agenda item marked done.' : 'Agenda item marked incomplete.',
				entityId: form.data.id
			});
		} catch (error) {
			return failAgendaMutation('toggle-entry', error, {
				userId: user.id,
				entityId: form.data.id,
				message: 'Failed to update agenda item.',
				logMessage: 'Failed to toggle Daily Agenda entry'
			});
		}
	})
};
