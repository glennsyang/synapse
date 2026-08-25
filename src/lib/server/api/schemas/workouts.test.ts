import { describe, expect, it } from 'vitest';

import {
	apiCreateWorkoutSchema,
	apiUpdateWorkoutSchema,
	apiWorkoutListQuerySchema
} from './workouts';

describe('apiCreateWorkoutSchema', () => {
	it('accepts a minimal cardio workout', () => {
		const result = apiCreateWorkoutSchema.safeParse({
			date: '2026-08-25',
			type: 'cardio',
			durationMinutes: 30
		});
		expect(result.success).toBe(true);
	});

	it('accepts a strength workout with exercises', () => {
		const result = apiCreateWorkoutSchema.safeParse({
			date: '2026-08-25',
			type: 'strength',
			durationMinutes: 45,
			exercises: [{ exerciseName: 'Squat', sets: 3, reps: 5, weightLbs: 185 }]
		});
		expect(result.success).toBe(true);
	});

	it('rejects an exercise with no name', () => {
		const result = apiCreateWorkoutSchema.safeParse({
			date: '2026-08-25',
			type: 'strength',
			exercises: [{ exerciseName: '' }]
		});
		expect(result.success).toBe(false);
	});

	it('rejects an invalid workout type', () => {
		expect(apiCreateWorkoutSchema.safeParse({ date: '2026-08-25', type: 'yoga' }).success).toBe(
			false
		);
	});

	it('rejects a malformed time', () => {
		expect(
			apiCreateWorkoutSchema.safeParse({ date: '2026-08-25', type: 'walk', time: '7:30am' }).success
		).toBe(false);
	});
});

describe('apiUpdateWorkoutSchema', () => {
	it('accepts an empty partial update', () => {
		expect(apiUpdateWorkoutSchema.safeParse({}).success).toBe(true);
	});

	it('accepts nulling out optional fields', () => {
		expect(apiUpdateWorkoutSchema.safeParse({ time: null, steps: null, notes: null }).success).toBe(
			true
		);
	});
});

describe('apiWorkoutListQuerySchema', () => {
	it('defaults limit to 50', () => {
		expect(apiWorkoutListQuerySchema.safeParse({}).data?.limit).toBe(50);
	});
});
