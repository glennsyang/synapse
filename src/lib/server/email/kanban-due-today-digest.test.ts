import { describe, expect, it } from 'vitest';

import {
	buildKanbanDueTodayDigestMessage,
	buildKanbanDueTodayDigestTitle,
	type KanbanDueTodayTaskSummary
} from './kanban-due-today-digest';

function createTask(overrides: Partial<KanbanDueTodayTaskSummary> = {}): KanbanDueTodayTaskSummary {
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

describe('kanban-due-today-digest', () => {
	it('builds a due-today title with the formatted date', () => {
		const title = buildKanbanDueTodayDigestTitle('2026-03-30');

		expect(title).toContain('Synapse - Kanban Tasks Due Today');
		expect(title).toContain('Mar');
	});

	it('builds a numbered bullet list for due-today Kanban tasks', () => {
		const tasks = [
			createTask({ id: 'task-1', taskNumber: 12, title: 'Review weekly training plan' }),
			createTask({ id: 'task-2', taskNumber: 14, title: 'Submit grocery list' })
		];

		const message = buildKanbanDueTodayDigestMessage(tasks, '2026-03-30');

		expect(message).toContain('Task #12');
		expect(message).toContain('Review weekly training plan');
		expect(message).toContain('Task #14');
		expect(message).toContain('Submit grocery list');
		expect(message).toContain('due today');
	});

	it('builds a calm empty-state message when no Kanban tasks are due today', () => {
		const message = buildKanbanDueTodayDigestMessage([], '2026-03-30');

		expect(message).toContain('No Kanban tasks are due today');
		expect(message).toContain('Keep your momentum');
	});
});
