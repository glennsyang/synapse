import { z } from 'zod';

export const TaskStateEnum = z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']);

const commaSeparatedQueryParamSchema = z
	.union([z.string(), z.array(z.string())])
	.optional()
	.transform((value): string[] => {
		let entries: string[] = [];
		if (Array.isArray(value)) {
			entries = value;
		} else if (value) {
			entries = [value];
		}

		return entries
			.flatMap((entry) => entry.split(','))
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);
	});

const uniqueValues = <T>(values: T[]): T[] => Array.from(new Set(values));

/**
 * Schema for creating a new task item
 */
export const createTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional(),
	tags: z.string().optional(), // Comma-separated string, parsed in server action
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4),
	state: TaskStateEnum.default('new')
});

/**
 * Schema for updating an existing task item
 */
export const updateTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional().nullable(),
	tags: z.string().optional().nullable(), // Comma-separated string
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4).optional(),
	state: TaskStateEnum.optional()
});

/**
 * Schema for updating task state from the kanban board
 */
export const updateTaskStateSchema = z.object({
	id: z.uuid(),
	state: TaskStateEnum
});

export const moveTaskBoardSchema = z.object({
	id: z.uuid(),
	fromState: TaskStateEnum,
	toState: TaskStateEnum,
	toIndex: z.coerce.number().int().min(0)
});

export const deleteTaskSchema = z.object({
	id: z.uuid()
});

export const taskFilterSchema = z.object({
	keyword: z
		.string()
		.trim()
		.max(200, 'Keyword too long')
		.optional()
		.transform((value): string | undefined => value || undefined),
	priority: commaSeparatedQueryParamSchema.transform((values, ctx): number[] => {
		const parsedValues: number[] = [];

		for (const value of values) {
			const parsedValue = Number.parseInt(value, 10);
			if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 4) {
				ctx.addIssue({
					code: 'custom',
					message: 'Priority filters must be between 1 and 4'
				});
				return z.NEVER;
			}

			parsedValues.push(parsedValue);
		}

		return uniqueValues(parsedValues);
	}),
	tag: commaSeparatedQueryParamSchema.transform((values): string[] => uniqueValues(values)),
	state: TaskStateEnum.optional(),
	dueDate: commaSeparatedQueryParamSchema.transform(
		(values, ctx): ('overdue' | 'today' | 'upcoming')[] => {
			const validValues = ['overdue', 'today', 'upcoming'];
			const parsedValues: ('overdue' | 'today' | 'upcoming')[] = [];

			for (const value of values) {
				if (!validValues.includes(value)) {
					ctx.addIssue({
						code: 'custom',
						message: 'Due date filters must be one of: overdue, today, upcoming'
					});
					return z.NEVER;
				}

				parsedValues.push(value as 'overdue' | 'today' | 'upcoming');
			}

			return uniqueValues(parsedValues);
		}
	)
});

export type TaskState = z.infer<typeof TaskStateEnum>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
