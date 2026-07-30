import { logger } from '$lib';
import { buildWeatherJson, journalEntrySchema } from '$lib/schemas/journal';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { withAuditFieldsForUpdate } from '$lib/server/db/utils';
import { safeParse } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const entry = await getDb().query.journalEntries.findFirst({
		where: and(eq(journalEntries.id, params.id), eq(journalEntries.userId, getUser(locals).id))
	});

	if (!entry) {
		throw error(404, 'Entry not found');
	}

	const weather = safeParse<{ temp?: number; condition?: string } | null>(entry.weather, null);

	const form = await superValidate(
		{
			date: entry.date,
			content: entry.content,
			location: entry.location || 'Home',
			weatherTemp: weather?.temp,
			weatherCondition: weather?.condition
		},
		zod4(journalEntrySchema)
	);

	return { form, entry };
};

export const actions: Actions = {
	update: requireAuth(async ({ request, params }, user) => {
		const entryId = params.id;
		const form = await superValidate(request, zod4(journalEntrySchema));

		if (!form.valid) {
			logger.warn('Invalid journal entry form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();
			const location = form.data.location?.trim() || 'Home';

			const weather = buildWeatherJson(form.data.weatherTemp, form.data.weatherCondition);

			await db
				.update(journalEntries)
				.set({
					date: form.data.date as string,
					content: form.data.content as string,
					location,
					weather,
					...withAuditFieldsForUpdate()
				})
				.where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id)));

			logger.info('Journal entry updated', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update journal entry', { error });
			return fail(500, { form, error: 'Failed to update journal entry' });
		}

		throw redirect(303, '/journal');
	}),

	delete: requireAuth(async ({ request, params }, user) => {
		const entryId = params.id;
		const formData = await request.formData();
		const submittedId = formData.get('id');

		if (typeof submittedId !== 'string' || submittedId !== entryId) {
			return fail(400, { error: 'Invalid journal entry id' });
		}

		try {
			const existingEntry = await getDb().query.journalEntries.findFirst({
				where: and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id))
			});

			if (!existingEntry) {
				return fail(404, { error: 'Journal entry not found' });
			}

			await getDb()
				.delete(journalEntries)
				.where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id)));

			logger.info('Journal entry deleted', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to delete journal entry', { error, entryId });
			return fail(500, { error: 'Failed to delete journal entry' });
		}

		throw redirect(303, '/journal');
	})
};
