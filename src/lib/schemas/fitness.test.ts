import { describe, expect, it } from 'vitest';

import {
	deleteEntrySchema,
	logMealSchema,
	logWeightSchema,
	logWorkoutSchema,
	setCalorieTargetSchema,
	setGoalWeightSchema,
	updateMealSchema,
	updateWeightSchema,
	updateWorkoutSchema
} from './fitness';

describe('logWeightSchema', () => {
	it('accepts a valid weight log entry', () => {
		expect(() => logWeightSchema.parse({ date: '2026-03-15', weightLbs: 185.5 })).not.toThrow();
	});

	it('accepts an optional time field', () => {
		const result = logWeightSchema.parse({ date: '2026-03-15', time: '07:30', weightLbs: 185 });
		expect(result.time).toBe('07:30');
	});

	it('rejects a non-positive weight', () => {
		expect(logWeightSchema.safeParse({ date: '2026-03-15', weightLbs: 0 }).success).toBe(false);
		expect(logWeightSchema.safeParse({ date: '2026-03-15', weightLbs: -1 }).success).toBe(false);
	});

	it('coerces a string weight to a number', () => {
		const result = logWeightSchema.parse({ date: '2026-03-15', weightLbs: '170.5' });
		expect(result.weightLbs).toBe(170.5);
	});

	it('rejects an invalid date format', () => {
		expect(logWeightSchema.safeParse({ date: 'March 15', weightLbs: 185 }).success).toBe(false);
	});

	it('rejects an invalid time format', () => {
		expect(
			logWeightSchema.safeParse({ date: '2026-03-15', time: '7:30am', weightLbs: 185 }).success
		).toBe(false);
	});
});

describe('updateWeightSchema', () => {
	it('requires an id field', () => {
		expect(updateWeightSchema.safeParse({ date: '2026-03-15', weightLbs: 185 }).success).toBe(
			false
		);
	});

	it('accepts a valid update payload with a UUID id', () => {
		expect(() =>
			updateWeightSchema.parse({
				id: '123e4567-e89b-12d3-a456-426614174000',
				date: '2026-03-15',
				weightLbs: 185
			})
		).not.toThrow();
	});
});

describe('setGoalWeightSchema', () => {
	it('accepts a positive target weight', () => {
		expect(() => setGoalWeightSchema.parse({ targetWeightLbs: 170 })).not.toThrow();
	});

	it('rejects zero and negative weights', () => {
		expect(setGoalWeightSchema.safeParse({ targetWeightLbs: 0 }).success).toBe(false);
		expect(setGoalWeightSchema.safeParse({ targetWeightLbs: -5 }).success).toBe(false);
	});
});

describe('logWorkoutSchema', () => {
	it('accepts a valid workout with required fields', () => {
		expect(() => logWorkoutSchema.parse({ date: '2026-03-15', type: 'cardio' })).not.toThrow();
	});

	it('accepts all workout types', () => {
		for (const type of ['strength', 'cardio', 'hiit', 'walk', 'stretch', 'other'] as const) {
			expect(() => logWorkoutSchema.parse({ date: '2026-03-15', type })).not.toThrow();
		}
	});

	it('rejects an unknown workout type', () => {
		expect(logWorkoutSchema.safeParse({ date: '2026-03-15', type: 'yoga' }).success).toBe(false);
	});

	it('coerces durationMinutes to an integer', () => {
		const result = logWorkoutSchema.parse({
			date: '2026-03-15',
			type: 'walk',
			durationMinutes: '45'
		});
		expect(result.durationMinutes).toBe(45);
	});

	it('rejects a non-positive durationMinutes', () => {
		expect(
			logWorkoutSchema.safeParse({ date: '2026-03-15', type: 'walk', durationMinutes: 0 }).success
		).toBe(false);
	});
});

describe('updateWorkoutSchema', () => {
	it('requires a valid UUID id', () => {
		expect(updateWorkoutSchema.safeParse({ date: '2026-03-15', type: 'cardio' }).success).toBe(
			false
		);
	});
});

describe('logMealSchema', () => {
	it('accepts a valid meal entry', () => {
		expect(() =>
			logMealSchema.parse({
				date: '2026-03-15',
				timeOfDay: 'breakfast',
				description: 'Oatmeal with berries'
			})
		).not.toThrow();
	});

	it('accepts all meal types', () => {
		for (const timeOfDay of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
			expect(() =>
				logMealSchema.parse({ date: '2026-03-15', timeOfDay, description: 'Some food' })
			).not.toThrow();
		}
	});

	it('rejects an unknown meal type', () => {
		expect(
			logMealSchema.safeParse({ date: '2026-03-15', timeOfDay: 'brunch', description: 'Food' })
				.success
		).toBe(false);
	});

	it('rejects an empty description', () => {
		expect(
			logMealSchema.safeParse({ date: '2026-03-15', timeOfDay: 'lunch', description: '' }).success
		).toBe(false);
	});

	it('coerces caloriesEstimate from string', () => {
		const result = logMealSchema.parse({
			date: '2026-03-15',
			timeOfDay: 'lunch',
			description: 'Salad',
			caloriesEstimate: '400'
		});
		expect(result.caloriesEstimate).toBe(400);
	});
});

describe('updateMealSchema', () => {
	it('requires a UUID id', () => {
		expect(
			updateMealSchema.safeParse({ date: '2026-03-15', timeOfDay: 'lunch', description: 'Food' })
				.success
		).toBe(false);
	});
});

describe('setCalorieTargetSchema', () => {
	it('accepts a positive calorie target', () => {
		expect(() => setCalorieTargetSchema.parse({ targetCalories: 2000 })).not.toThrow();
	});

	it('rejects zero and negative values', () => {
		expect(setCalorieTargetSchema.safeParse({ targetCalories: 0 }).success).toBe(false);
		expect(setCalorieTargetSchema.safeParse({ targetCalories: -500 }).success).toBe(false);
	});

	it('coerces string numbers', () => {
		const result = setCalorieTargetSchema.parse({ targetCalories: '2000' });
		expect(result.targetCalories).toBe(2000);
	});
});

describe('deleteEntrySchema', () => {
	it('accepts a valid UUID', () => {
		expect(() =>
			deleteEntrySchema.parse({ id: '123e4567-e89b-12d3-a456-426614174000' })
		).not.toThrow();
	});

	it('rejects a non-UUID id', () => {
		expect(deleteEntrySchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
	});
});
