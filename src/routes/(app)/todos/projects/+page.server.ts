import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { createProjectSchema, updateProjectSchema } from '$lib/schemas/project';
import getDb from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/sign-in');
	}

	// Load all user projects
	const userProjects = await getDb().query.projects.findMany({
		where: eq(projects.userId, locals.user.id),
		orderBy: [projects.name]
	});

	const createForm = await superValidate(zod4(createProjectSchema));

	return {
		projects: userProjects,
		createForm
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const form = await superValidate(request, zod4(createProjectSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Check for duplicate project name
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.userId, locals.user.id), eq(projects.name, form.data.name))
			});

			if (existing) {
				return fail(400, { form, error: 'A project with this name already exists' });
			}

			// Create project
			await getDb()
				.insert(projects)
				.values({
					userId: locals.user.id,
					name: form.data.name,
					color: form.data.color || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});

			logger.info('Project created', { projectName: form.data.name, userId: locals.user.id });
		} catch (error) {
			logger.error('Failed to create project', { error, userId: locals.user.id });
			return fail(500, { form, error: 'Failed to create project' });
		}

		return { form };
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const projectId = formData.get('id') as string;

		const form = await superValidate(formData, zod4(updateProjectSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Verify project belongs to user
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.id, projectId), eq(projects.userId, locals.user.id))
			});

			if (!existing) {
				return fail(404, { form, error: 'Project not found' });
			}

			// Build update data
			const updateData: Record<string, unknown> = {
				updatedAt: new Date().toISOString()
			};

			if (form.data.name !== undefined) updateData.name = form.data.name;
			if (form.data.color !== undefined) updateData.color = form.data.color;

			// Update project
			await getDb().update(projects).set(updateData).where(eq(projects.id, projectId));

			logger.info('Project updated', { projectId, userId: locals.user.id });
		} catch (error) {
			logger.error('Failed to update project', { error, projectId });
			return fail(500, { form, error: 'Failed to update project' });
		}

		return { form };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const projectId = formData.get('id') as string;

		try {
			// Verify project belongs to user
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.id, projectId), eq(projects.userId, locals.user.id))
			});

			if (!existing) {
				return fail(404, { error: 'Project not found' });
			}

			// Delete project (todos will have projectId set to null due to ON DELETE SET NULL)
			await getDb().delete(projects).where(eq(projects.id, projectId));

			logger.info('Project deleted', { projectId, userId: locals.user.id });
		} catch (error) {
			logger.error('Failed to delete project', { error, projectId });
			return fail(500, { error: 'Failed to delete project' });
		}

		return { success: true };
	}
};
