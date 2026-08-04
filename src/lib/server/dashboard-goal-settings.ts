import { getDb } from '$lib/server/db';
import { dashboardGoalSettings } from '$lib/server/db/schema';
import {
	DEFAULT_DASHBOARD_GOALS,
	normalizeDashboardGoals,
	type DashboardGoals
} from '$lib/utils/dashboard-goals';
import { eq } from 'drizzle-orm';

function toGoals(
	row:
		| {
				meditationWeeklyGoal: number;
				workoutGreenThreshold: number;
				workoutAmberThreshold: number;
		  }
		| undefined
): DashboardGoals {
	if (!row) {
		return { ...DEFAULT_DASHBOARD_GOALS };
	}

	return normalizeDashboardGoals({
		meditationWeeklyGoal: row.meditationWeeklyGoal,
		workoutGreenThreshold: row.workoutGreenThreshold,
		workoutAmberThreshold: row.workoutAmberThreshold
	});
}

export async function getDashboardGoalsForUser(
	userId: string,
	db = getDb()
): Promise<DashboardGoals> {
	const settings = await db.query.dashboardGoalSettings.findFirst({
		where: eq(dashboardGoalSettings.userId, userId)
	});

	return toGoals(settings);
}
