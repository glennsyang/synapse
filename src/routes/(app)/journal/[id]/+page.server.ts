import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { journalEntrySchema } from '$lib/schemas/journal';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const entry = await getDb().query.journalEntries.findFirst({
		where: and(eq(journalEntries.id, params.id), eq(journalEntries.userId, locals.user?.id))
	});

	if (!entry) {
		throw error(404, 'Entry not found');
	}

	const weather = entry.weather ? JSON.parse(entry.weather) : null;

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
		const entryId = params.id as string;
		const form = await superValidate(request, zod4(journalEntrySchema));

		if (!form.valid) {
			logger.warn('Invalid journal entry form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();
			const location = form.data.location?.trim() || 'Home';

			const weather =
				form.data.weatherTemp || form.data.weatherCondition
					? JSON.stringify({
							temp: form.data.weatherTemp,
							condition: form.data.weatherCondition
						})
					: null;

			await db
				.update(journalEntries)
				.set({
					date: form.data.date as string,
					content: form.data.content as string,
					location,
					weather,
					updatedAt: new Date().toISOString()
				})
				.where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id)));

			logger.info('Journal entry updated', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to update journal entry', { error });
			return fail(500, { form, error: 'Failed to update journal entry' });
		}

		throw redirect(303, '/journal');
	})
};
