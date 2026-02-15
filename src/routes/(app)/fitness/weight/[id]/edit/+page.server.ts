import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { deleteEntrySchema, updateWeightSchema } from '$lib/schemas/fitness';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { weightEntries } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const entry = await getDb().query.weightEntries.findFirst({
		where: and(eq(weightEntries.id, params.id), eq(weightEntries.userId, locals.user!.id))
	});

	if (!entry) {
		redirect(303, '/fitness?tab=weight');
	}

	const form = await superValidate(
		{
			id: entry.id,
			date: entry.date,
			time: entry.time,
			weightLbs: entry.weightLbs
		},
		zod4(updateWeightSchema)
	);

	return {
		entry,
		form
	};
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const entryId = params.id as string;
		const form = await superValidate(request, zod4(updateWeightSchema));

		if (!form.valid) {
			return { form, status: 400 };
		}

		try {
			const db = getDb();

			const existing = await db.query.weightEntries.findFirst({
				where: and(eq(weightEntries.id, entryId), eq(weightEntries.userId, user.id))
			});

			if (!existing) {
				return { form, error: 'Weight entry not found', status: 404 };
			}

			await db
				.update(weightEntries)
				.set({
					date: form.data.date,
					time: form.data.time || null,
					weightLbs: form.data.weightLbs,
					updatedAt: new Date().toISOString()
				})
				.where(eq(weightEntries.id, entryId));

			logger.info('Weight entry updated', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update weight entry', { error, entryId });
			return { form, error: 'Failed to update weight entry', status: 500 };
		}

		throw redirect(303, '/fitness?tab=weight&notice=weight-updated');
	}),

	delete: requireAuth(async ({ request, params }, user) => {
		const entryId = params.id as string;
		const form = await superValidate(request, zod4(deleteEntrySchema));

		if (!form.valid || form.data.id !== entryId) {
			return { error: 'Invalid weight entry id', status: 400 };
		}

		try {
			const db = getDb();

			const existing = await db.query.weightEntries.findFirst({
				where: and(eq(weightEntries.id, entryId), eq(weightEntries.userId, user.id))
			});

			if (!existing) {
				return { error: 'Weight entry not found', status: 404 };
			}

			await db.delete(weightEntries).where(eq(weightEntries.id, entryId));

			logger.info('Weight entry deleted', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete weight entry', { error, entryId });
			return { error: 'Failed to delete weight entry', status: 500 };
		}

		throw redirect(303, '/fitness?tab=weight&notice=weight-deleted');
	})
};
