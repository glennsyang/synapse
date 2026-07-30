import { logger } from '$lib';
import { personSchema } from '$lib/schemas/visits';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { people } from '$lib/server/db/schema';
import { generateId, withAuditFieldsForCreate } from '$lib/server/db/utils';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(personSchema));
	return { form };
};

export const actions: Actions = {
	default: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(personSchema));

		if (!form.valid) {
			logger.warn('Invalid person form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const personId = generateId();

			await getDb()
				.insert(people)
				.values({
					id: personId,
					userId: user.id,
					name: form.data.name,
					isExempt: false,
					isArchived: false,
					...withAuditFieldsForCreate()
				});

			logger.info('Person created', { personId, userId: user.id });
		} catch (error) {
			logger.error('Failed to create person', error);
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while adding the person. Please try again.'
				},
				{ status: 500 }
			);
		}

		throw redirect(303, '/visits');
	})
};
