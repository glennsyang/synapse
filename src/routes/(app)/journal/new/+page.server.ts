import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { journalEntrySchema } from '$lib/schemas/journal';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { journalEntries } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { logger } from '$lib/utils/logger';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Auth handled by (app)/+layout.server.ts
	const form = await superValidate(zod4(journalEntrySchema));

	// Set default date to today, use local timezone
	form.data.date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
	//form.data.date = new Date().toISOString().split('T')[0];

	return { form };
};

export const actions: Actions = {
	default: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(journalEntrySchema));

		if (!form.valid) {
			logger.warn('Invalid journal entry form data', { errors: form.errors });
			return { form, status: 400 };
		}

		try {
			const tags = form.data.tags
				? JSON.stringify(
						(form.data.tags as string)
							.split(',')
							.map((t: string) => t.trim())
							.filter((t: string) => t.length > 0)
					)
				: null;

			const weather =
				form.data.weatherTemp || form.data.weatherCondition
					? JSON.stringify({
							temp: form.data.weatherTemp,
							condition: form.data.weatherCondition
						})
					: null;

			const entryId = generateId();

			await getDb()
				.insert(journalEntries)
				.values({
					userId: user.id,
					date: form.data.date,
					content: form.data.content,
					tags,
					location: form.data.location || null,
					weather,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});

			logger.info('Journal entry created', { entryId, userId: user.id });
		} catch (error) {
			logger.error('Failed to create journal entry', { error });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while creating the journal entry. Please try again.'
				},
				{ status: 500 }
			);
		}

		throw redirect(303, '/journal');
	})
};
