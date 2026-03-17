import { describe, expect, it } from 'vitest';

import type { DailyAgendaEntry } from '$lib/types';

import {
	buildDailyAgendaDigestMessage,
	buildDailyAgendaDigestTitle,
	DAILY_MOTIVATION_PHRASES,
	getDailyMotivationPhrase,
	isWithinDailyDigestWindow
} from './daily-agenda-digest';

function createEntry(overrides: Partial<DailyAgendaEntry>): DailyAgendaEntry {
	return {
		id: 'entry-1',
		templateId: null,
		templateGroupId: null,
		date: '2026-03-16',
		title: 'Review top priorities',
		sourceType: 'custom',
		sortOrder: 0,
		completed: false,
		completedAt: null,
		...overrides
	};
}

describe('daily-agenda-digest', () => {
	it('builds a plain title with date', () => {
		const title = buildDailyAgendaDigestTitle('2026-03-16');

		expect(title).toContain('Synapse - Daily Agenda Tasks');
		expect(title).toContain('Daily Agenda Tasks');
		expect(title).toContain('March');
	});

	it('builds an emoji-prefixed bullet list for tasks and motivational ending', () => {
		const entries = [
			createEntry({ id: 'entry-1', title: 'Plan sprint tasks', completed: false }),
			createEntry({ id: 'entry-2', title: 'Submit weekly report', completed: true })
		];

		const message = buildDailyAgendaDigestMessage(entries, '2026-03-16');

		expect(message).toContain('• ⏳ Plan sprint tasks');
		expect(message).toContain('• ✅ Submit weekly report');
		expect(message).toContain('🚀');
		expect(message).toContain('✨');
	});

	it('builds an empty-state message with a positive emoji when there are no tasks', () => {
		const message = buildDailyAgendaDigestMessage([], '2026-03-16');

		expect(message).toContain('• 🌟 No agenda tasks today');
		expect(message).toContain('🚀');
	});

	it('uses deterministic daily motivation phrase selection by date', () => {
		const phraseA = getDailyMotivationPhrase('2026-03-16');
		const phraseB = getDailyMotivationPhrase('2026-03-16');

		expect(phraseA).toEqual(phraseB);
		expect(DAILY_MOTIVATION_PHRASES).toContain(phraseA);
	});

	it('fires only inside the 6:00-6:10 AM daily digest window', () => {
		expect(isWithinDailyDigestWindow('06', '00')).toBe(true);
		expect(isWithinDailyDigestWindow('06', '10')).toBe(true);
		expect(isWithinDailyDigestWindow('05', '59')).toBe(false);
		expect(isWithinDailyDigestWindow('06', '11')).toBe(false);
	});
});
