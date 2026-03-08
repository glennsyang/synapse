import { describe, expect, it } from 'vitest';

import { createTaskSchema, updateTaskSchema, updateTaskStateSchema } from './task';

describe('task schemas', () => {
	it('defaults new tasks to the new state without a cadence field', () => {
		const result = createTaskSchema.parse({
			title: 'Ship tasks overhaul',
			priority: 1,
			tags: '#urgent, #product'
		});

		expect(result.state).toBe('new');
		expect(result.priority).toBe(1);
		expect(result.tags).toBe('#urgent, #product');
		expect(result).not.toHaveProperty('cadence');
	});

	it('ignores legacy cadence values on task creation payloads', () => {
		const result = createTaskSchema.parse({
			title: 'Legacy recurring task',
			priority: 2,
			cadence: 'daily'
		});

		expect(result.priority).toBe(2);
		expect(result).not.toHaveProperty('cadence');
	});

	it('accepts task updates with task-specific state and priority fields', () => {
		const result = updateTaskSchema.parse({
			title: 'Refine kanban board',
			priority: 3,
			state: 'in_progress',
			dueDate: '2026-03-07',
			tags: '#work'
		});

		expect(result).toMatchObject({
			title: 'Refine kanban board',
			priority: 3,
			state: 'in_progress',
			dueDate: '2026-03-07',
			tags: '#work'
		});
	});

	it('validates task state updates for kanban actions', () => {
		const result = updateTaskStateSchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			state: 'done'
		});

		expect(result).toEqual({
			id: '123e4567-e89b-12d3-a456-426614174000',
			state: 'done'
		});
	});
});
