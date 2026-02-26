import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { personSchema, visitSchema } from '$lib/schemas/visits';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { people, visits } from '$lib/server/db/schema';
import { generateId } from '$lib/server/db/utils';
import { getTodayString } from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import { calculatePersonVisitStatus } from '$lib/utils/visit-status';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!params.id) {
		throw error(400, 'Person ID is required');
	}

	const db = getDb();

	// Load person
	const person = await db.query.people.findFirst({
		where: and(eq(people.id, params.id), eq(people.userId, locals.user!.id))
	});

	if (!person) {
		throw error(404, 'Person not found');
	}

	if (person.isArchived) {
		throw redirect(303, '/visits');
	}

	// Load all visits for this person
	const personVisits = await db.query.visits.findMany({
		where: eq(visits.personId, params.id),
		orderBy: [desc(visits.date)]
	});

	const parsedVisits = personVisits.map((visit) => ({
		...visit,
		companions: visit.companions ? JSON.parse(visit.companions) : null
	}));

	// Calculate status
	const latestVisit = personVisits[0];
	const statusInfo = calculatePersonVisitStatus(latestVisit?.date ?? null, person.isExempt);

	// Initialize forms
	const visitForm = await superValidate(zod4(visitSchema));
	visitForm.data.date = getTodayString(); // Set default to today

	const editForm = await superValidate(person, zod4(personSchema));

	return {
		person: {
			...person,
			status: statusInfo.status,
			daysSinceLastVisit: statusInfo.daysSinceLastVisit
		},
		visits: parsedVisits,
		visitForm,
		editForm
	};
};

export const actions: Actions = {
	logVisit: requireAuth(async ({ request, params }, user) => {
		if (!params.id) {
			throw error(400, 'Person ID is required');
		}

		const form = await superValidate(request, zod4(visitSchema));

		if (!form.valid) {
			logger.warn('Invalid visit form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				throw error(404, 'Person not found');
			}

			const companions = toCommaSeparatedJson(form.data.companions);

			const visitId = generateId();

			await db.insert(visits).values({
				id: visitId,
				personId: params.id,
				userId: user.id,
				date: form.data.date,
				time: form.data.time || null,
				companions,
				notes: form.data.notes || null,
				followUpDate: form.data.followUpDate || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			logger.info('Visit logged', { visitId, personId: params.id, userId: user.id });

			return message(form, {
				type: 'success',
				text: 'Visit logged successfully!'
			});
		} catch (err) {
			logger.error('Failed to log visit', { error: err });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while logging the visit. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	updatePerson: requireAuth(async ({ request, params }, user) => {
		if (!params.id) {
			throw error(400, 'Person ID is required');
		}

		const form = await superValidate(request, zod4(personSchema));

		if (!form.valid) {
			logger.warn('Invalid person form data', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				throw error(404, 'Person not found');
			}

			await db
				.update(people)
				.set({
					name: form.data.name,
					isExempt: form.data.isExempt,
					updatedAt: new Date().toISOString()
				})
				.where(eq(people.id, params.id));

			logger.info('Person updated', { personId: params.id, userId: user.id });

			return message(form, {
				type: 'success',
				text: 'Person updated successfully!'
			});
		} catch (err) {
			logger.error('Failed to update person', { error: err });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while updating the person. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	archivePerson: requireAuth(async ({ params }, user) => {
		if (!params.id) {
			throw error(400, 'Person ID is required');
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				throw error(404, 'Person not found');
			}

			await db
				.update(people)
				.set({
					isArchived: true,
					updatedAt: new Date().toISOString()
				})
				.where(eq(people.id, params.id));

			logger.info('Person archived', { personId: params.id, userId: user.id });
		} catch (err) {
			logger.error('Failed to archive person', { error: err });
			throw error(500, 'Failed to archive person');
		}

		throw redirect(303, '/visits');
	}),

	deletePerson: requireAuth(async ({ params }, user) => {
		if (!params.id) {
			throw error(400, 'Person ID is required');
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				throw error(404, 'Person not found');
			}

			// Delete person (cascades to visits)
			await db.delete(people).where(eq(people.id, params.id));

			logger.info('Person deleted', { personId: params.id, userId: user.id });
		} catch (err) {
			logger.error('Failed to delete person', { error: err });
			throw error(500, 'Failed to delete person');
		}

		throw redirect(303, '/visits');
	}),

	deleteVisit: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const visitId = formData.get('visitId') as string;

		if (!visitId) {
			throw error(400, 'Visit ID is required');
		}

		try {
			const db = getDb();

			// Verify visit belongs to user
			const visit = await db.query.visits.findFirst({
				where: and(eq(visits.id, visitId), eq(visits.userId, user.id))
			});

			if (!visit) {
				throw error(404, 'Visit not found');
			}

			await db.delete(visits).where(eq(visits.id, visitId));

			logger.info('Visit deleted', { visitId, userId: user.id });

			return { success: true };
		} catch (err) {
			logger.error('Failed to delete visit', { error: err });
			throw error(500, 'Failed to delete visit');
		}
	})
};
