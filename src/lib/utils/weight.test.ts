import { describe, expect, it } from 'vitest';

import { calorieLegendItems, getCalorieAdherenceClass } from './weight';

describe('calorieLegendItems', () => {
	it('exposes legend labels and classes in display order', () => {
		expect(calorieLegendItems).toEqual([
			{ label: 'Under target', className: 'bg-blue-400' },
			{ label: 'On target', className: 'bg-green-400' },
			{ label: 'Slightly over', className: 'bg-rose-400' },
			{ label: 'Over target', className: 'bg-red-500' }
		]);
	});
});

describe('getCalorieAdherenceClass', () => {
	it('returns no-data class when calories are null', () => {
		expect(getCalorieAdherenceClass(null, 2000)).toBe('bg-stone-200 dark:bg-stone-700');
	});

	it('returns no-target class when calorie target is missing or zero', () => {
		expect(getCalorieAdherenceClass(1800, null)).toBe('bg-stone-300 dark:bg-stone-600');
		expect(getCalorieAdherenceClass(1800, 0)).toBe('bg-stone-300 dark:bg-stone-600');
	});

	it('returns on-target class at inclusive bounds', () => {
		expect(getCalorieAdherenceClass(1700, 2000)).toBe('bg-green-400');
		expect(getCalorieAdherenceClass(2200, 2000)).toBe('bg-green-400');
	});

	it('returns slightly-over class above 1.1 and up to 1.25', () => {
		expect(getCalorieAdherenceClass(2201, 2000)).toBe('bg-rose-400');
		expect(getCalorieAdherenceClass(2500, 2000)).toBe('bg-rose-400');
	});

	it('returns over-target class when ratio is above 1.25', () => {
		expect(getCalorieAdherenceClass(2501, 2000)).toBe('bg-red-500');
	});

	it('returns under-target class when ratio is below 0.85', () => {
		expect(getCalorieAdherenceClass(1699, 2000)).toBe('bg-blue-400');
	});
});
