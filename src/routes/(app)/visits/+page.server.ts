import { logger } from '$lib';
import { getUser } from '$lib/server/actions/auth-guard';
import { getDb } from '$lib/server/db';
import { people, visits } from '$lib/server/db/schema';
import { getVisitStatusThresholdsForUser } from '$lib/server/visit-status-settings';
import { getTodayString } from '$lib/utils/date';
import { safeParse } from '$lib/utils/json';
import {
	calculatePersonVisitStatus,
	getStatusPriority,
	type PersonWithStatus
} from '$lib/utils/visit-status';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const db = getDb();
		const today = getTodayString();
		const userId = getUser(locals).id;
		const visitStatusThresholds = await getVisitStatusThresholdsForUser(userId, db);

		// Load all people for the user
		const userPeople = await db.query.people.findMany({
			where: and(eq(people.userId, userId), eq(people.isArchived, false)),
			orderBy: [desc(people.createdAt)]
		});

		const latestVisitsByPersonId = new Map<string, typeof visits.$inferSelect>();

		if (userPeople.length > 0) {
			const orderedVisits = await db.query.visits.findMany({
				where: and(
					eq(visits.userId, userId),
					inArray(
						visits.personId,
						userPeople.map((person) => person.id)
					)
				),
				orderBy: [asc(visits.personId), desc(visits.date), desc(visits.createdAt)]
			});

			for (const visit of orderedVisits) {
				if (!latestVisitsByPersonId.has(visit.personId)) {
					latestVisitsByPersonId.set(visit.personId, visit);
				}
			}
		}

		const peopleWithStatus: PersonWithStatus[] = userPeople.map((person) => {
			const latestVisit = latestVisitsByPersonId.get(person.id);
			const latestFollowUpDate = latestVisit?.followUpDate ?? null;
			const nextFollowUpDate =
				latestFollowUpDate && latestFollowUpDate >= today ? latestFollowUpDate : null;

			const statusInfo = calculatePersonVisitStatus(
				latestVisit?.date ?? null,
				person.isExempt,
				latestFollowUpDate,
				today,
				visitStatusThresholds
			);

			return {
				id: person.id,
				name: person.name,
				isExempt: person.isExempt,
				nextFollowUpDate,
				lastVisit: latestVisit
					? {
							date: latestVisit.date,
							companions: safeParse<string[] | null>(latestVisit.companions, null)
						}
					: null,
				status: statusInfo.status,
				daysSinceLastVisit: statusInfo.daysSinceLastVisit,
				daysUntilStatusChange: statusInfo.daysUntilStatusChange,
				createdAt: person.createdAt
			};
		});

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
