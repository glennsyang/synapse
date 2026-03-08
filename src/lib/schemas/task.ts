import { z } from 'zod';

export const TaskStateEnum = z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']);

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

export type TaskState = z.infer<typeof TaskStateEnum>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
