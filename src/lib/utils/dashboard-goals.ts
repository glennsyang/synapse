export interface DashboardGoals {
	meditationWeeklyGoal: number;
	workoutGreenThreshold: number;
	workoutAmberThreshold: number;
}

export const DEFAULT_DASHBOARD_GOALS: DashboardGoals = {
	meditationWeeklyGoal: 1,
	workoutGreenThreshold: 12,
	workoutAmberThreshold: 8
};

function isPositiveInteger(value: number): boolean {
	return Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
	return Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

export function normalizeDashboardGoals(goals?: Partial<DashboardGoals> | null): DashboardGoals {
	const meditationCandidate = Math.round(Number(goals?.meditationWeeklyGoal));
	const greenCandidate = Math.round(Number(goals?.workoutGreenThreshold));
	const amberCandidate = Math.round(Number(goals?.workoutAmberThreshold));

	const meditationWeeklyGoal = isPositiveInteger(meditationCandidate)
		? meditationCandidate
		: DEFAULT_DASHBOARD_GOALS.meditationWeeklyGoal;
	const workoutGreenThreshold = isPositiveInteger(greenCandidate)
		? greenCandidate
		: DEFAULT_DASHBOARD_GOALS.workoutGreenThreshold;
	const workoutAmberThreshold = isNonNegativeInteger(amberCandidate)
		? amberCandidate
		: DEFAULT_DASHBOARD_GOALS.workoutAmberThreshold;

	if (workoutAmberThreshold >= workoutGreenThreshold) {
		return { ...DEFAULT_DASHBOARD_GOALS };
	}

	return {
		meditationWeeklyGoal,
		workoutGreenThreshold,
		workoutAmberThreshold
	};
}
