import { z } from 'zod';

/**
 * Schema for creating a new todoItem item
 */
export const createTodoSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional(),
	cadence: z.enum(['daily', 'weekly', 'monthly']).optional(),
	tags: z.string().optional(), // Comma-separated string, parsed in server action
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4),
	state: z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']).default('new')
});

/**
 * Schema for updating an existing todoItem item
 */
export const updateTodoSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional().nullable(),
	cadence: z.enum(['daily', 'weekly', 'monthly']).optional(),
	tags: z.string().optional().nullable(), // Comma-separated string
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4).optional(),
	state: z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']).optional()
});

/**
 * Schema for updating todoItem state (for drag-and-drop kanban)
 */
export const updateTodoStateSchema = z.object({
	id: z.uuid(),
	state: z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done'])
});

export type CreatetodoItemput = z.infer<typeof createTodoSchema>;
export type UpdatetodoItemput = z.infer<typeof updateTodoSchema>;
export type UpdateTodoStateInput = z.infer<typeof updateTodoStateSchema>;
