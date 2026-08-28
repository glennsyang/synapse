import { describe, expect, it } from 'vitest';

import {
	completeSessionSchema,
	createRoutineSchema,
	editSessionSchema,
	routineFilterSchema,
	scheduleSchema,
	updateRoutineSchema
} from './meditation';

const validRoutine = {
	title: 'Morning Calm',
	link_url: 'https://example.com/meditation',
	duration_minutes: 15,
	mood_tags: 'Calm, Focused'
};

describe('createRoutineSchema', () => {
	it('accepts a valid routine payload', () => {
		expect(() => createRoutineSchema.parse(validRoutine)).not.toThrow();
	});

	it('rejects an empty title', () => {
		expect(createRoutineSchema.safeParse({ ...validRoutine, title: '' }).success).toBe(false);
	});

	it('rejects a title longer than 100 characters', () => {
		expect(createRoutineSchema.safeParse({ ...validRoutine, title: 'T'.repeat(101) }).success).toBe(
			false
		);
	});

	it('rejects an invalid URL', () => {
		expect(createRoutineSchema.safeParse({ ...validRoutine, link_url: 'not-a-url' }).success).toBe(
			false
		);
	});

	it('rejects a javascript: URL', () => {
		expect(
			createRoutineSchema.safeParse({ ...validRoutine, link_url: 'javascript:alert(1)' }).success
		).toBe(false);
	});

	it('rejects a non-positive duration', () => {
		expect(createRoutineSchema.safeParse({ ...validRoutine, duration_minutes: 0 }).success).toBe(
			false
		);
	});

	it('rejects empty mood tags', () => {
		expect(createRoutineSchema.safeParse({ ...validRoutine, mood_tags: '' }).success).toBe(false);
	});

	it('accepts an optional description', () => {
		const result = createRoutineSchema.parse({
			...validRoutine,
			description: 'A relaxing session'
		});
		expect(result.description).toBe('A relaxing session');
	});
});

describe('updateRoutineSchema', () => {
	it('accepts a valid update payload', () => {
		expect(() => updateRoutineSchema.parse(validRoutine)).not.toThrow();
	});

	it('rejects an invalid URL in update', () => {
		expect(
			updateRoutineSchema.safeParse({ ...validRoutine, link_url: 'not-a-valid-url' }).success
		).toBe(false);
	});

	it('rejects a javascript: URL in update', () => {
		expect(
			updateRoutineSchema.safeParse({ ...validRoutine, link_url: 'javascript:alert(1)' }).success
		).toBe(false);
	});
});

describe('scheduleSchema', () => {
	it('accepts daily cadence with a valid time', () => {
		expect(() => scheduleSchema.parse({ cadence: 'daily', time: '07:00' })).not.toThrow();
	});

	it('accepts weekly cadence with days_of_week', () => {
		expect(() =>
			scheduleSchema.parse({ cadence: 'weekly', days_of_week: '[1,3,5]', time: '08:30' })
		).not.toThrow();
	});

	it('rejects an invalid cadence value', () => {
		expect(scheduleSchema.safeParse({ cadence: 'hourly', time: '09:00' }).success).toBe(false);
	});

	it('rejects an invalid time format', () => {
		expect(scheduleSchema.safeParse({ cadence: 'daily', time: '9am' }).success).toBe(false);
		expect(scheduleSchema.safeParse({ cadence: 'daily', time: '09:0' }).success).toBe(false);
	});
});

describe('completeSessionSchema', () => {
	it('accepts a valid session completion payload', () => {
		expect(() =>
			completeSessionSchema.parse({ completed_at: '2026-03-15T08:00:00.000Z' })
		).not.toThrow();
	});

	it('accepts mood ratings within bounds', () => {
		expect(() =>
			completeSessionSchema.parse({
				completed_at: '2026-03-15T08:00:00.000Z',
				pre_mood_rating: 1,
				mood_rating: 5
			})
		).not.toThrow();
	});

	it('rejects mood ratings outside 1-5 range', () => {
		expect(
			completeSessionSchema.safeParse({
				completed_at: '2026-03-15T08:00:00.000Z',
				mood_rating: 0
			}).success
		).toBe(false);

		expect(
			completeSessionSchema.safeParse({
				completed_at: '2026-03-15T08:00:00.000Z',
				mood_rating: 6
			}).success
		).toBe(false);
	});

	it('rejects an empty completed_at', () => {
		expect(completeSessionSchema.safeParse({ completed_at: '' }).success).toBe(false);
	});
});

describe('editSessionSchema', () => {
	it('accepts a valid edit session payload', () => {
		expect(() =>
			editSessionSchema.parse({
				id: 'session_123',
				completed_at: '2026-03-15T08:00:00.000Z'
			})
		).not.toThrow();
	});

	it('rejects an empty id', () => {
		expect(
			editSessionSchema.safeParse({ id: '', completed_at: '2026-03-15T08:00:00Z' }).success
		).toBe(false);
	});
});

describe('routineFilterSchema', () => {
	it('accepts an empty filter', () => {
		expect(() => routineFilterSchema.parse({})).not.toThrow();
	});

	it('accepts valid mood array and duration', () => {
		const result = routineFilterSchema.parse({ moods: ['Anxious', 'Focused'], duration: 15 });
		expect(result.moods).toEqual(['Anxious', 'Focused']);
		expect(result.duration).toBe(15);
	});

	it('rejects an invalid mood tag value', () => {
		expect(routineFilterSchema.safeParse({ moods: ['UnknownMood'] }).success).toBe(false);
	});

	it('rejects a search string longer than 200 characters', () => {
		expect(routineFilterSchema.safeParse({ search: 'x'.repeat(201) }).success).toBe(false);
	});
});
