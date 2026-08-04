import { describe, expect, it } from 'vitest';

import { DEFAULT_DASHBOARD_GOALS, normalizeDashboardGoals } from './dashboard-goals';

describe('dashboard goal normalization', () => {
	it('returns defaults when no goals are provided', () => {
		expect(normalizeDashboardGoals()).toEqual(DEFAULT_DASHBOARD_GOALS);
		expect(normalizeDashboardGoals(null)).toEqual(DEFAULT_DASHBOARD_GOALS);
	});

	it('accepts valid custom goals', () => {
		expect(
			normalizeDashboardGoals({
				meditationWeeklyGoal: 3,
				workoutGreenThreshold: 16,
				workoutAmberThreshold: 10
			})
		).toEqual({
			meditationWeeklyGoal: 3,
			workoutGreenThreshold: 16,
			workoutAmberThreshold: 10
		});
	});

	it('allows a zero amber threshold', () => {
		expect(
			normalizeDashboardGoals({
				meditationWeeklyGoal: 1,
				workoutGreenThreshold: 5,
				workoutAmberThreshold: 0
			})
		).toEqual({
			meditationWeeklyGoal: 1,
			workoutGreenThreshold: 5,
			workoutAmberThreshold: 0
		});
	});

	it('falls back to defaults when amber threshold is not less than green threshold', () => {
		expect(
			normalizeDashboardGoals({
				meditationWeeklyGoal: 2,
				workoutGreenThreshold: 8,
				workoutAmberThreshold: 8
			})
		).toEqual(DEFAULT_DASHBOARD_GOALS);

		expect(
			normalizeDashboardGoals({
				meditationWeeklyGoal: 2,
				workoutGreenThreshold: 8,
				workoutAmberThreshold: 10
			})
		).toEqual(DEFAULT_DASHBOARD_GOALS);
	});

	it('falls back to defaults for invalid individual values', () => {
		expect(normalizeDashboardGoals({ meditationWeeklyGoal: 0 }).meditationWeeklyGoal).toBe(
			DEFAULT_DASHBOARD_GOALS.meditationWeeklyGoal
		);
		expect(normalizeDashboardGoals({ meditationWeeklyGoal: -1 }).meditationWeeklyGoal).toBe(
			DEFAULT_DASHBOARD_GOALS.meditationWeeklyGoal
		);
		expect(
			normalizeDashboardGoals({ workoutGreenThreshold: Number.NaN }).workoutGreenThreshold
		).toBe(DEFAULT_DASHBOARD_GOALS.workoutGreenThreshold);
		expect(normalizeDashboardGoals({ workoutAmberThreshold: -1 }).workoutAmberThreshold).toBe(
			DEFAULT_DASHBOARD_GOALS.workoutAmberThreshold
		);
	});

	it('rounds non-integer values', () => {
		expect(
			normalizeDashboardGoals({
				meditationWeeklyGoal: 2.4,
				workoutGreenThreshold: 12.6,
				workoutAmberThreshold: 7.5
			})
		).toEqual({
			meditationWeeklyGoal: 2,
			workoutGreenThreshold: 13,
			workoutAmberThreshold: 8
		});
	});
});
