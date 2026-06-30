import { personSchema, visitSchema } from '$lib/schemas/visits';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import { toCommaSeparatedJson } from '$lib/server/actions/string-parsers';
import { getDb } from '$lib/server/db';
import { people, visits } from '$lib/server/db/schema';
import {
	generateId,
	withAuditFieldsForCreate,
	withAuditFieldsForUpdate
} from '$lib/server/db/utils';
import { getVisitStatusThresholdsForUser } from '$lib/server/visit-status-settings';
import { safeParse } from '$lib/utils';
import { getTodayString } from '$lib/utils/date';
import { logger } from '$lib/utils/logger';
import { calculatePersonVisitStatus } from '$lib/utils/visit-status';
import { error, fail, isHttpError, isRedirect, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!params.id) {
		throw error(400, 'Person ID is required');
	}

	const db = getDb();
	const userId = getUser(locals).id;

	try {
		// Load person
		const person = await db.query.people.findFirst({
			where: and(eq(people.id, params.id), eq(people.userId, userId))
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
			companions: safeParse<string[] | null>(visit.companions, null)
		}));
		const visitStatusThresholds = await getVisitStatusThresholdsForUser(userId, db);

		// Calculate status
		const latestVisit = personVisits[0];
		const statusInfo = calculatePersonVisitStatus(
			latestVisit?.date ?? null,
			person.isExempt,
			latestVisit?.followUpDate ?? null,
			getTodayString(),
			visitStatusThresholds
		);

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
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err;
		logger.error('Failed to load visit page data', { error: err, personId: params.id, userId });
		throw error(500, 'Failed to load page data');
	}
};

export const actions: Actions = {
	logVisit: requireAuth(async ({ request, params }, user) => {
		if (!params.id) {
			return fail(400, { error: 'Person ID is required' });
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
				return fail(404, { error: 'Person not found' });
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
				...withAuditFieldsForCreate()
			});

			logger.info('Visit logged', {
				visitId,
				personId: params.id,
				userId: user.id
			});

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

	updateVisit: requireAuth(async ({ request, params }, user) => {
		if (!params.id) {
			return fail(400, { error: 'Person ID is required' });
		}

		const formData = await request.formData();
		const visitId = formData.get('visitId');
		const form = await superValidate(formData, zod4(visitSchema));

		if (!form.valid) {
			logger.warn('Invalid visit update form data', { errors: form.errors });
			return fail(400, { form });
		}

		if (typeof visitId !== 'string' || !visitId) {
			return fail(400, { error: 'Visit ID is required' });
		}

		try {
			const db = getDb();

			const visit = await db.query.visits.findFirst({
				where: and(
					eq(visits.id, visitId),
					eq(visits.userId, user.id),
					eq(visits.personId, params.id)
				)
			});

			if (!visit) {
				return fail(404, { error: 'Visit not found' });
			}

			const companions = toCommaSeparatedJson(form.data.companions);

			await db
				.update(visits)
				.set({
					date: form.data.date,
					time: form.data.time || null,
					companions,
					notes: form.data.notes || null,
					followUpDate: form.data.followUpDate || null,
					...withAuditFieldsForUpdate()
				})
				.where(
					and(eq(visits.id, visitId), eq(visits.userId, user.id), eq(visits.personId, params.id))
				);

			logger.info('Visit updated', {
				visitId,
				personId: params.id,
				userId: user.id
			});

			return message(form, {
				type: 'success',
				text: 'Visit updated successfully!'
			});
		} catch (err) {
			logger.error('Failed to update visit', { error: err });
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while updating the visit. Please try again.'
				},
				{ status: 500 }
			);
		}
	}),

	updatePerson: requireAuth(async ({ request, params }, user) => {
		if (!params.id) {
			return fail(400, { error: 'Person ID is required' });
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
				return fail(404, { error: 'Person not found' });
			}

			await db
				.update(people)
				.set({
					name: form.data.name,
					isExempt: form.data.isExempt,
					...withAuditFieldsForUpdate()
				})
				.where(and(eq(people.id, params.id), eq(people.userId, user.id)));

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
			return fail(400, { error: 'Person ID is required' });
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				return fail(404, { error: 'Person not found' });
			}

			await db
				.update(people)
				.set({
					isArchived: true,
					...withAuditFieldsForUpdate()
				})
				.where(and(eq(people.id, params.id), eq(people.userId, user.id)));

			logger.info('Person archived', { personId: params.id, userId: user.id });
		} catch (err) {
			logger.error('Failed to archive person', { error: err });
			return fail(500, { error: 'Failed to archive person' });
		}

		throw redirect(303, '/visits');
	}),

	deletePerson: requireAuth(async ({ params }, user) => {
		if (!params.id) {
			return fail(400, { error: 'Person ID is required' });
		}

		try {
			const db = getDb();

			// Verify person belongs to user
			const person = await db.query.people.findFirst({
				where: and(eq(people.id, params.id), eq(people.userId, user.id))
			});

			if (!person) {
				return fail(404, { error: 'Person not found' });
			}

			// Delete person (cascades to visits)
			await db.delete(people).where(and(eq(people.id, params.id), eq(people.userId, user.id)));

			logger.info('Person deleted', { personId: params.id, userId: user.id });
		} catch (err) {
			logger.error('Failed to delete person', { error: err });
			return fail(500, { error: 'Failed to delete person' });
		}

		throw redirect(303, '/visits');
	}),

	deleteVisit: requireAuth(async ({ request }, user) => {
		const formData = await request.formData();
		const visitId = formData.get('visitId') as string;

		if (!visitId) {
			return fail(400, { error: 'Visit ID is required' });
		}

		try {
			const db = getDb();

			// Verify visit belongs to user
			const visit = await db.query.visits.findFirst({
				where: and(eq(visits.id, visitId), eq(visits.userId, user.id))
			});

			if (!visit) {
				return fail(404, { error: 'Visit not found' });
			}

			await db.delete(visits).where(and(eq(visits.id, visitId), eq(visits.userId, user.id)));

			logger.info('Visit deleted', { visitId, userId: user.id });

			return { success: true };
		} catch (err) {
			logger.error('Failed to delete visit', { error: err });
			return fail(500, { error: 'Failed to delete visit' });
		}
	})
};
