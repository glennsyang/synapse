import { describe, expect, it } from 'vitest';

import { personSchema, visitSchema } from './visits';

describe('personSchema', () => {
	it('accepts a valid person with a name', () => {
		expect(() => personSchema.parse({ name: 'Alice' })).not.toThrow();
	});

	it('defaults isExempt to false when not provided', () => {
		const result = personSchema.parse({ name: 'Alice' });
		expect(result.isExempt).toBe(false);
	});

	it('rejects an empty name', () => {
		expect(personSchema.safeParse({ name: '' }).success).toBe(false);
	});

	it('rejects a name longer than 100 characters', () => {
		expect(personSchema.safeParse({ name: 'A'.repeat(101) }).success).toBe(false);
	});

	describe('isExempt booleanFromForm preprocessing', () => {
		it('accepts boolean true directly', () => {
			expect(personSchema.parse({ name: 'Alice', isExempt: true }).isExempt).toBe(true);
		});

		it('accepts boolean false directly', () => {
			expect(personSchema.parse({ name: 'Alice', isExempt: false }).isExempt).toBe(false);
		});

		it('coerces truthy string values to true', () => {
			for (const truthy of ['true', 'on', '1']) {
				expect(personSchema.parse({ name: 'Alice', isExempt: truthy }).isExempt).toBe(true);
			}
		});

		it('coerces falsy string values to false', () => {
			for (const falsy of ['false', '0', '']) {
				expect(personSchema.parse({ name: 'Alice', isExempt: falsy }).isExempt).toBe(false);
			}
		});

		it('coerces undefined and null to false', () => {
			expect(personSchema.parse({ name: 'Alice', isExempt: undefined }).isExempt).toBe(false);
			expect(personSchema.parse({ name: 'Alice', isExempt: null }).isExempt).toBe(false);
		});
	});
});

describe('visitSchema', () => {
	it('accepts a valid visit with required fields', () => {
		expect(() => visitSchema.parse({ date: '2026-03-15' })).not.toThrow();
	});

	it('accepts a visit with all optional fields', () => {
		expect(() =>
			visitSchema.parse({
				date: '2026-03-15',
				time: '14:00',
				companions: 'Bob, Carol',
				notes: 'Good visit',
				followUpDate: '2026-06-15'
			})
		).not.toThrow();
	});

	it('rejects an invalid date format', () => {
		expect(visitSchema.safeParse({ date: '15-03-2026' }).success).toBe(false);
	});

	it('rejects an invalid time format', () => {
		expect(visitSchema.safeParse({ date: '2026-03-15', time: '2pm' }).success).toBe(false);
	});

	it('rejects an invalid followUpDate format', () => {
		expect(visitSchema.safeParse({ date: '2026-03-15', followUpDate: 'next-week' }).success).toBe(
			false
		);
	});

	it('treats an empty string followUpDate as undefined (no follow-up)', () => {
		const result = visitSchema.parse({ date: '2026-03-15', followUpDate: '' });
		expect(result.followUpDate).toBeUndefined();
	});
});
