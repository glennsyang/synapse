import { describe, expect, it } from 'vitest';

import {
	buildTasksDueTodayDigestMessage,
	buildTasksDueTodayDigestTitle,
	type TasksDueTodayTaskSummary
} from './tasks-due-today-digest';

function createTask(overrides: Partial<TasksDueTodayTaskSummary> = {}): TasksDueTodayTaskSummary {
	return {
		id: 'task-1',
		taskNumber: 12,
		title: 'Review weekly training plan',
		priority: 2,
		dueDate: '2026-03-30',
		state: 'new',
		...overrides
	};
}

describe('tasks-due-today-digest', () => {
	it('builds a due-today title with the formatted date', () => {
		const title = buildTasksDueTodayDigestTitle('2026-03-30');

		expect(title).toContain('Synapse - Tasks Due Today');
		expect(title).toContain('Mar');
	});

	it('builds a numbered bullet list for due-today tasks', () => {
		const tasks = [
			createTask({ id: 'task-1', taskNumber: 12, title: 'Review weekly training plan' }),
			createTask({ id: 'task-2', taskNumber: 14, title: 'Submit grocery list' })
		];

		const message = buildTasksDueTodayDigestMessage(tasks, '2026-03-30');

		expect(message).toContain('Review weekly training plan');
		expect(message).toContain('Submit grocery list');
		expect(message).toContain('due today');
	});

	it('builds a calm empty-state message when no tasks are due today', () => {
		const message = buildTasksDueTodayDigestMessage([], '2026-03-30');

		expect(message).toContain('No tasks are due today');
		expect(message).toContain('Keep your momentum');
	});
});
