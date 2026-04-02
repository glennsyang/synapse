import { describe, expect, it } from 'vitest';

import {
	createTaskSchema,
	deleteTaskSchema,
	moveTaskBoardSchema,
	taskFilterSchema,
	updateTaskSchema,
	updateTaskStateSchema
} from './task';

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

	it('validates board drag payloads for cross-column moves', () => {
		const result = moveTaskBoardSchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			fromState: 'new',
			toState: 'in_progress',
			toIndex: 2
		});

		expect(result).toEqual({
			id: '123e4567-e89b-12d3-a456-426614174000',
			fromState: 'new',
			toState: 'in_progress',
			toIndex: 2
		});
	});

	it('rejects negative board drop indices', () => {
		const result = moveTaskBoardSchema.safeParse({
			id: '123e4567-e89b-12d3-a456-426614174000',
			fromState: 'blocked',
			toState: 'done',
			toIndex: -1
		});

		expect(result.success).toBe(false);
	});

	it('validates delete payloads with task UUIDs', () => {
		const result = deleteTaskSchema.parse({
			id: '123e4567-e89b-12d3-a456-426614174000'
		});

		expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
	});

	it('parses live task filters with trimmed keyword, multi-priority, and multi-tag values', () => {
		const result = taskFilterSchema.parse({
			keyword: '  sprint board  ',
			priority: '1, 2, 2,4',
			tag: 'work, planning,work'
		});

		expect(result).toEqual({
			keyword: 'sprint board',
			priority: [1, 2, 4],
			tag: ['work', 'planning'],
			state: undefined,
			dueDate: []
		});
	});

	it('normalizes empty task filters to undefined keyword and empty arrays', () => {
		const result = taskFilterSchema.parse({
			keyword: '   ',
			priority: '',
			tag: undefined
		});

		expect(result).toEqual({
			keyword: undefined,
			priority: [],
			tag: [],
			state: undefined,
			dueDate: []
		});
	});

	it('rejects invalid task priorities in filter params', () => {
		const result = taskFilterSchema.safeParse({
			priority: '2,5'
		});

		expect(result.success).toBe(false);
	});
});
