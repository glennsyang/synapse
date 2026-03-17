import { describe, expect, it } from 'vitest';

import {
	createDailyAgendaEntrySchema,
	createDailyAgendaTemplateSchema,
	dailyAgendaPageQuerySchema,
	toggleDailyAgendaEntrySchema,
	updateDailyAgendaEntrySchema,
	updateDailyAgendaTemplateSchema
} from './daily-agenda';

describe('daily agenda schemas', () => {
	it('defaults the page tab to kanban and normalizes week values to Monday', () => {
		const result = dailyAgendaPageQuerySchema.parse({
			week: '2026-03-08'
		});

		expect(result).toEqual({
			tab: 'kanban',
			week: '2026-03-02'
		});
	});

	it('validates default item creation with trimmed titles', () => {
		const result = createDailyAgendaTemplateSchema.parse({
			title: '  Morning review  ',
			applicableDays: ['1', '3', '5']
		});

		expect(result.title).toBe('Morning review');
		expect(result.applicableDays).toEqual([1, 3, 5]);
	});

	it('accepts updating default items by id', () => {
		const result = updateDailyAgendaTemplateSchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			title: 'Plan tomorrow before bed',
			applicableDays: ['0', '6', '0']
		});

		expect(result.title).toBe('Plan tomorrow before bed');
		expect(result.applicableDays).toEqual([0, 6]);
	});

	it('requires at least one applicable day for default items', () => {
		const result = createDailyAgendaTemplateSchema.safeParse({
			title: 'Exercise',
			applicableDays: []
		});

		expect(result.success).toBe(false);
	});

	it('validates day-only agenda items with required local dates', () => {
		const result = createDailyAgendaEntrySchema.parse({
			date: '2026-03-11',
			title: 'Pick up groceries'
		});

		expect(result).toEqual({
			date: '2026-03-11',
			title: 'Pick up groceries'
		});
	});

	it('accepts updating day-only agenda items by id', () => {
		const result = updateDailyAgendaEntrySchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			title: 'Refill water bottle'
		});

		expect(result.title).toBe('Refill water bottle');
	});

	it('parses checkbox-like completion payloads', () => {
		const checked = toggleDailyAgendaEntrySchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			completed: 'on'
		});
		const unchecked = toggleDailyAgendaEntrySchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			completed: 'false'
		});

		expect(checked.completed).toBe(true);
		expect(unchecked.completed).toBe(false);
	});

	it('rejects invalid completion payloads', () => {
		const result = toggleDailyAgendaEntrySchema.safeParse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			completed: 'maybe'
		});

		expect(result.success).toBe(false);
	});
});
