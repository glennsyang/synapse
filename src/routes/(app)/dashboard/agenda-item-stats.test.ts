import { describe, expect, it } from 'vitest';

import { buildAgendaItemStats, buildDateRanges } from './dashboard-utils';

type AgendaEntry = {
	id: string;
	date: string;
	completed: boolean;
	title: string;
	templateGroupId: string | null;
	sortOrder: number;
};

function createEntry(input: Partial<AgendaEntry> & Pick<AgendaEntry, 'id' | 'date'>): AgendaEntry {
	return {
		id: input.id,
		date: input.date,
		completed: input.completed ?? false,
		title: input.title ?? 'Exercise / Walk',
		templateGroupId: input.templateGroupId ?? 'group-exercise',
		sortOrder: input.sortOrder ?? 0
	};
}

describe('buildAgendaItemStats', () => {
	it('computes DOW percentages from real counts (guards against NaN/-1 regression)', () => {
		const ranges = buildDateRanges('2026-05-26');
		const entries: AgendaEntry[] = [
			createEntry({ id: 'last4-mon-1', date: '2026-05-04', completed: true }),
			createEntry({ id: 'last4-mon-2', date: '2026-05-11', completed: false }),
			createEntry({ id: 'last4-tue-1', date: '2026-05-05', completed: true }),
			createEntry({ id: 'prev4-1', date: '2026-04-07', completed: true }),
			createEntry({ id: 'prev4-2', date: '2026-04-08', completed: false }),
			createEntry({ id: 'prev4-3', date: '2026-04-09', completed: false }),
			createEntry({ id: 'prev4-4', date: '2026-04-10', completed: false }),
			createEntry({ id: 'prev4-5', date: '2026-04-11', completed: false })
		];

		const stats = buildAgendaItemStats(entries, ranges);

		expect(stats).toHaveLength(1);
		expect(stats[0]?.completionPct).toBe(67);
		expect(stats[0]?.dowCompletionPct[0]).toBe(50); // Monday: 1/2
		expect(stats[0]?.dowCompletionPct[1]).toBe(100); // Tuesday: 1/1
	});

	it('uses only last 4 weeks for DOW dots (prev 4 should not affect dot colors/titles)', () => {
		const ranges = buildDateRanges('2026-05-26');
		const entries: AgendaEntry[] = [
			createEntry({ id: 'last4-mon-1', date: '2026-05-12', completed: false }),
			createEntry({ id: 'prev4-fri-1', date: '2026-04-10', completed: true }),
			createEntry({ id: 'prev4-fri-2', date: '2026-04-17', completed: true }),
			createEntry({ id: 'prev4-fri-3', date: '2026-04-24', completed: true }),
			createEntry({ id: 'prev4-thu-1', date: '2026-04-09', completed: false }),
			createEntry({ id: 'prev4-wed-1', date: '2026-04-08', completed: false }),
			createEntry({ id: 'prev4-tue-1', date: '2026-04-07', completed: false })
		];

		const stats = buildAgendaItemStats(entries, ranges);

		expect(stats).toHaveLength(1);
		expect(stats[0]?.dowCompletionPct[4]).toBe(-1); // Friday exists only in prev4 window
		expect(stats[0]?.completionPct).toBe(0);
		expect(stats[0]?.prevCompletionPct).toBe(50);
	});
});
