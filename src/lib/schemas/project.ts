import { z } from 'zod';

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
		.optional()
});

/**
 * Schema for updating an existing project
 */
export const updateProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
		.optional()
		.nullable()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
