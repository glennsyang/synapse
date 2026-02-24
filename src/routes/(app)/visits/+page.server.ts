import { desc, eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { people, visits } from '$lib/server/db/schema';
import { logger } from '$lib/utils/logger';
import {
	calculatePersonVisitStatus,
	getStatusPriority,
	type PersonWithStatus
} from '$lib/utils/visit-status';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const db = getDb();

		// Load all people for the user
		const userPeople = await db.query.people.findMany({
			where: eq(people.userId, locals.user!.id),
			orderBy: [desc(people.createdAt)]
		});

		// For each person, get the latest visit and calculate status
		const peopleWithStatus: PersonWithStatus[] = await Promise.all(
			userPeople.map(async (person) => {
				const latestVisit = await db.query.visits.findFirst({
					where: eq(visits.personId, person.id),
					orderBy: [desc(visits.date)]
				});

				const statusInfo = calculatePersonVisitStatus(latestVisit?.date ?? null, person.isExempt);

				return {
					id: person.id,
					name: person.name,
					isExempt: person.isExempt,
					lastVisit: latestVisit
						? {
								date: latestVisit.date,
								companions: latestVisit.companions ? JSON.parse(latestVisit.companions) : null
							}
						: null,
					status: statusInfo.status,
					daysSinceLastVisit: statusInfo.daysSinceLastVisit,
					daysUntilStatusChange: statusInfo.daysUntilStatusChange,
					createdAt: person.createdAt
				};
			})
		);

		// Sort by status priority, then by days since last visit
		peopleWithStatus.sort((a, b) => {
			const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
			if (priorityDiff !== 0) return priorityDiff;

			// If same status, sort by days since last visit (descending)
			if (a.daysSinceLastVisit === null && b.daysSinceLastVisit === null) return 0;
			if (a.daysSinceLastVisit === null) return 1;
			if (b.daysSinceLastVisit === null) return -1;
			return b.daysSinceLastVisit - a.daysSinceLastVisit;
		});

		return { people: peopleWithStatus };
	} catch (error) {
		logger.error('Failed to load people', { error });
		return { people: [] };
	}
};
