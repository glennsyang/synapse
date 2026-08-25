import { TaskStateEnum } from '$lib/schemas/task';
import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)');

export const apiCreateTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	description: z.string().max(5000, 'Description too long').optional(),
	tags: z.array(z.string().min(1)).optional(),
	dueDate: dateString.optional(),
	priority: z.number().int().min(1, 'Priority must be between 1 and 4').max(4),
	state: TaskStateEnum.default('new')
});

export const apiUpdateTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
	description: z.string().max(5000, 'Description too long').nullable().optional(),
	tags: z.array(z.string().min(1)).nullable().optional(),
	dueDate: dateString.nullable().optional(),
	priority: z.number().int().min(1, 'Priority must be between 1 and 4').max(4).optional(),
	state: TaskStateEnum.optional()
});

export const apiTaskListQuerySchema = z.object({
	state: TaskStateEnum.optional(),
	priority: z.coerce.number().int().min(1).max(4).optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ApiCreateTaskInput = z.infer<typeof apiCreateTaskSchema>;
export type ApiUpdateTaskInput = z.infer<typeof apiUpdateTaskSchema>;
