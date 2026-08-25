import { scopesToPermissions, type ApiScope } from '$lib/api-scopes';
import { createApiKeySchema, revokeApiKeySchema } from '$lib/schemas/api-key';
import { requireAdmin } from '$lib/server/actions/auth-guard';
import { auth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { people, user, visits } from '$lib/server/db/schema';
import { withAuditFieldsForUpdate } from '$lib/server/db/utils';
import { logger } from '$lib/server/logger';
import { fail } from '@sveltejs/kit';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const createApiKeyForm = await superValidate(zod4(createApiKeySchema), { id: 'createApiKey' });

	try {
		const db = getDb();

		const [users, archivedPeople, { apiKeys }] = await Promise.all([
			db.query.user.findMany({ orderBy: [desc(user.createdAt)] }),
			db.query.people.findMany({
				where: eq(people.isArchived, true),
				orderBy: [desc(people.updatedAt)]
			}),
			auth.api.listApiKeys({ headers: request.headers })
		]);

		const ownerIds = [...new Set(archivedPeople.map((person) => person.userId))];
		const owners =
			ownerIds.length > 0
				? await db.query.user.findMany({ where: inArray(user.id, ownerIds) })
				: [];
		const ownerEmailById = new Map(owners.map((owner) => [owner.id, owner.email]));

		const latestVisitsByPersonId = new Map<string, typeof visits.$inferSelect>();

		if (archivedPeople.length > 0) {
			const orderedVisits = await db.query.visits.findMany({
				where: inArray(
					visits.personId,
					archivedPeople.map((person) => person.id)
				),
				orderBy: [asc(visits.personId), desc(visits.date), desc(visits.createdAt)]
			});

			for (const visit of orderedVisits) {
				if (!latestVisitsByPersonId.has(visit.personId)) {
					latestVisitsByPersonId.set(visit.personId, visit);
				}
			}
		}

		return {
			users,
			archivedPeople: archivedPeople.map((person) => ({
				...person,
				ownerEmail: ownerEmailById.get(person.userId) ?? 'Unknown',
				lastVisitDate: latestVisitsByPersonId.get(person.id)?.date ?? null
			})),
			apiKeys,
			createApiKeyForm
		};
	} catch (err) {
		logger.error('Failed to load admin dashboard data', err);
		return { users: [], archivedPeople: [], apiKeys: [], createApiKeyForm };
	}
};

export const actions = {
	unarchivePerson: requireAdmin(async ({ request }) => {
		const formData = await request.formData();
		const personId = formData.get('personId') as string;

		if (!personId) {
			return fail(400, { error: 'Person ID is required' });
		}

		try {
			const db = getDb();

			await db
				.update(people)
				.set({ isArchived: false, archivedAt: null, ...withAuditFieldsForUpdate() })
				.where(eq(people.id, personId));

			logger.info('Person unarchived', { personId });
		} catch (err) {
			logger.error('Failed to unarchive person', err);
			return fail(500, { error: 'Failed to unarchive person' });
		}
	}),

	createApiKey: requireAdmin(async ({ request }, user) => {
		const form = await superValidate(request, zod4(createApiKeySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Deliberately not passing `headers` here: the plugin only accepts server-only
			// fields like `permissions` and rate-limit overrides on a "trusted server" call
			// (no headers/request on the context), and rejects them outright on a
			// session-based "client" call.
			const created = await auth.api.createApiKey({
				body: {
					name: form.data.name,
					userId: user.id,
					permissions: scopesToPermissions(form.data.scopes as ApiScope[]),
					expiresIn: form.data.expiresInDays ? form.data.expiresInDays * 86400 : undefined
				}
			});

			logger.info('API key created', { keyId: created.id, scopes: form.data.scopes });

			// The plaintext key is only ever returned here, once. Ride it alongside the
			// usual message-bearing form rather than inventing a new response shape.
			form.message = {
				type: 'success',
				text: 'API key created. Copy it now — it will not be shown again.'
			};
			return { form, apiKey: created.key };
		} catch (err) {
			logger.error('Failed to create API key', err);
			return message(
				form,
				{ type: 'error', text: 'Failed to create API key. Please try again.' },
				{ status: 500 }
			);
		}
	}),

	revokeApiKey: requireAdmin(async ({ request }) => {
		const formData = await request.formData();
		const parsed = revokeApiKeySchema.safeParse({ id: formData.get('id') });

		if (!parsed.success) {
			return fail(400, { error: 'API key ID is required' });
		}

		try {
			await auth.api.deleteApiKey({ body: { keyId: parsed.data.id }, headers: request.headers });
			logger.info('API key revoked', { keyId: parsed.data.id });
		} catch (err) {
			logger.error('Failed to revoke API key', err);
			return fail(500, { error: 'Failed to revoke API key' });
		}
	})
} satisfies Actions;
