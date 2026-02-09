import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { createProjectSchema, updateProjectSchema } from '$lib/schemas/project';
import { requireAuth } from '$lib/server/actions/auth-guard';
import getDb from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Auth handled by (app)/+layout.server.ts

	// Load all user projects
	const userProjects = await getDb().query.projects.findMany({
		where: eq(projects.userId, locals.user!.id),
		orderBy: [projects.name]
	});

	const createForm = await superValidate(zod4(createProjectSchema));

	return {
		projects: userProjects,
		createForm
	};
};

export const actions: Actions = {
	create: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createProjectSchema));

		if (!form.valid) {
			return { form, status: 400 };
		}

		try {
			// Check for duplicate project name
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.userId, user.id), eq(projects.name, form.data.name))
			});

			if (existing) {
				return { form, error: 'A project with this name already exists', status: 400 };
			}

			// Create project
			await getDb()
				.insert(projects)
				.values({
					userId: user.id,
					name: form.data.name,
					color: form.data.color || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});

			logger.info('Project created', { projectName: form.data.name, userId: user.id });
		} catch (error) {
			logger.error('Failed to create project', { error, userId: user.id });
			return { form, error: 'Failed to create project', status: 500 };
		}

		return { form };
	}),

	update: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const projectId = formData.get('id') as string;

		const form = await superValidate(formData, zod4(updateProjectSchema));

		if (!form.valid) {
			return { form, status: 400 };
		}

		try {
			// Verify project belongs to user
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.id, projectId), eq(projects.userId, user.id))
			});

			if (!existing) {
				return { form, error: 'Project not found', status: 404 };
			}

			// Build update data
			const updateData: Record<string, unknown> = {
				updatedAt: new Date().toISOString()
			};

			if (form.data.name !== undefined) updateData.name = form.data.name;
			if (form.data.color !== undefined) updateData.color = form.data.color;

			// Update project
			await getDb().update(projects).set(updateData).where(eq(projects.id, projectId));

			logger.info('Project updated', { projectId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update project', { error, projectId });
			return { form, error: 'Failed to update project', status: 500 };
		}

		return { form };
	}),

	delete: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const projectId = formData.get('id') as string;

		try {
			// Verify project belongs to user
			const existing = await getDb().query.projects.findFirst({
				where: and(eq(projects.id, projectId), eq(projects.userId, user.id))
			});

			if (!existing) {
				return { error: 'Project not found', status: 404 };
			}

			// Delete project (todos will have projectId set to null due to ON DELETE SET NULL)
			await getDb().delete(projects).where(eq(projects.id, projectId));

			logger.info('Project deleted', { projectId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete project', { error, projectId });
			return { error: 'Failed to delete project', status: 500 };
		}

		return { success: true };
	})
};
