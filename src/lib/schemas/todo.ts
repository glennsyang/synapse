import { z } from 'zod';

const CadenceEnum = z.enum(['daily', 'weekly', 'monthly', 'none']);
const TodoStateEnum = z.enum(['new', 'in_progress', 'on_hold', 'blocked', 'done']);

/**
 * Schema for creating a new todoItem item
 */
export const createTodoSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional(),
	cadence: CadenceEnum.default('none')
		.optional()
		.transform((val) => (val === 'none' ? undefined : val)),
	tags: z.string().optional(), // Comma-separated string, parsed in server action
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4),
	state: TodoStateEnum.default('new')
});

/**
 * Schema for updating an existing todoItem item
 */
export const updateTodoSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional().nullable(),
	cadence: CadenceEnum.default('none')
		.optional()
		.transform((val) => (val === 'none' ? undefined : val)),
	tags: z.string().optional().nullable(), // Comma-separated string
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
		.optional()
		.nullable(),
	priority: z.coerce.number().int().min(1, 'Priority is required').max(4).optional(),
	state: TodoStateEnum.optional()
});

/**
 * Schema for updating todoItem state (for drag-and-drop kanban)
 */
export const updateTodoStateSchema = z.object({
	id: z.uuid(),
	state: TodoStateEnum
});

export type Cadence = z.infer<typeof CadenceEnum>;
export type TodoState = z.infer<typeof TodoStateEnum>;
export type UpdatetodoItemput = z.infer<typeof updateTodoSchema>;
