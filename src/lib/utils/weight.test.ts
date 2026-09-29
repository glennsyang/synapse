import { describe, expect, it } from 'vitest';

import { calorieLegendItems, getCalorieAdherenceClass } from './weight';

describe('calorieLegendItems', () => {
	it('exposes legend labels and classes in display order', () => {
		expect(calorieLegendItems).toEqual([
			{ label: 'Under target', className: 'bg-pen-journal' },
			{ label: 'On target', className: 'bg-pen-fitness' },
			{ label: 'Slightly over', className: 'bg-destructive' },
			{ label: 'Over target', className: 'bg-destructive' }
		]);
	});
});

describe('getCalorieAdherenceClass', () => {
	it('returns no-data class when calories are null', () => {
		expect(getCalorieAdherenceClass(null, 2000)).toBe('bg-muted dark:bg-muted');
	});

	it('returns no-target class when calorie target is missing or zero', () => {
		expect(getCalorieAdherenceClass(1800, null)).toBe('bg-muted dark:bg-muted');
		expect(getCalorieAdherenceClass(1800, 0)).toBe('bg-muted dark:bg-muted');
	});

	it('returns on-target class at inclusive bounds', () => {
		expect(getCalorieAdherenceClass(1700, 2000)).toBe('bg-pen-fitness');
		expect(getCalorieAdherenceClass(2200, 2000)).toBe('bg-pen-fitness');
	});

	it('returns slightly-over class above 1.1 and up to 1.25', () => {
		expect(getCalorieAdherenceClass(2201, 2000)).toBe('bg-destructive');
		expect(getCalorieAdherenceClass(2500, 2000)).toBe('bg-destructive');
	});

	it('returns over-target class when ratio is above 1.25', () => {
		expect(getCalorieAdherenceClass(2501, 2000)).toBe('bg-destructive');
	});

	it('returns under-target class when ratio is below 0.85', () => {
		expect(getCalorieAdherenceClass(1699, 2000)).toBe('bg-pen-journal');
	});
});
