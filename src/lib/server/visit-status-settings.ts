import { getDb } from '$lib/server/db';
import { visitStatusSettings } from '$lib/server/db/schema';
import {
	DEFAULT_VISIT_STATUS_THRESHOLDS,
	normalizeVisitStatusThresholds,
	type VisitStatusThresholds
} from '$lib/utils/visit-status';
import { eq, inArray } from 'drizzle-orm';

function toThresholds(
	row:
		| {
				recentToOverdueDays: number;
				overdueToCriticalDays: number;
		  }
		| undefined
): VisitStatusThresholds {
	if (!row) {
		return { ...DEFAULT_VISIT_STATUS_THRESHOLDS };
	}

	return normalizeVisitStatusThresholds({
		recentToOverdueDays: row.recentToOverdueDays,
		overdueToCriticalDays: row.overdueToCriticalDays
	});
}

export async function getVisitStatusThresholdsForUser(
	userId: string,
	db = getDb()
): Promise<VisitStatusThresholds> {
	const settings = await db.query.visitStatusSettings.findFirst({
		where: eq(visitStatusSettings.userId, userId)
	});

	return toThresholds(settings);
}

export async function getVisitStatusThresholdsByUserIds(
	userIds: string[],
	db = getDb()
): Promise<Map<string, VisitStatusThresholds>> {
	const uniqueUserIds = Array.from(new Set(userIds));
	const thresholdsByUserId = new Map<string, VisitStatusThresholds>(
		uniqueUserIds.map((userId) => [userId, { ...DEFAULT_VISIT_STATUS_THRESHOLDS }])
	);

	if (uniqueUserIds.length === 0) {
		return thresholdsByUserId;
	}

	const rows = await db.query.visitStatusSettings.findMany({
		where: inArray(visitStatusSettings.userId, uniqueUserIds)
	});

	for (const row of rows) {
		thresholdsByUserId.set(row.userId, toThresholds(row));
	}

	return thresholdsByUserId;
}
