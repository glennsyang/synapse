import { describe, expect, it } from 'vitest';

import {
	getWorkoutBadgeClass,
	getWorkoutBorderClass,
	getWorkoutChartColor,
	getWorkoutEmoji,
	getWorkoutLabel,
	getWorkoutNotificationTag
} from './workout';

describe('getWorkoutLabel', () => {
	it('returns the correct label for each workout type', () => {
		expect(getWorkoutLabel('strength')).toBe('Strength');
		expect(getWorkoutLabel('cardio')).toBe('Cardio');
		expect(getWorkoutLabel('hiit')).toBe('HIIT');
		expect(getWorkoutLabel('walk')).toBe('Walk');
		expect(getWorkoutLabel('stretch')).toBe('Stretch');
		expect(getWorkoutLabel('other')).toBe('Other');
	});

	it('returns the Other fallback for unknown types', () => {
		expect(getWorkoutLabel('unknown')).toBe('Other');
		expect(getWorkoutLabel('')).toBe('Other');
	});
});

describe('getWorkoutBorderClass', () => {
	it('returns the correct border class for known types', () => {
		expect(getWorkoutBorderClass('strength')).toBe('border-l-orange-500');
		expect(getWorkoutBorderClass('cardio')).toBe('border-l-blue-500');
		expect(getWorkoutBorderClass('hiit')).toBe('border-l-red-500');
		expect(getWorkoutBorderClass('walk')).toBe('border-l-green-500');
		expect(getWorkoutBorderClass('stretch')).toBe('border-l-purple-500');
		expect(getWorkoutBorderClass('other')).toBe('border-l-gray-400');
	});

	it('falls back to gray border for unknown types', () => {
		expect(getWorkoutBorderClass('unknown')).toBe('border-l-gray-400');
	});
});

describe('getWorkoutBadgeClass', () => {
	it('returns badge class for each known workout type', () => {
		expect(getWorkoutBadgeClass('strength')).toContain('orange');
		expect(getWorkoutBadgeClass('cardio')).toContain('blue');
		expect(getWorkoutBadgeClass('hiit')).toContain('red');
		expect(getWorkoutBadgeClass('walk')).toContain('green');
		expect(getWorkoutBadgeClass('stretch')).toContain('purple');
		expect(getWorkoutBadgeClass('other')).toContain('gray');
	});

	it('falls back to gray badge for unknown types', () => {
		expect(getWorkoutBadgeClass('yoga')).toContain('gray');
	});
});

describe('getWorkoutChartColor', () => {
	it('returns CSS variable chart colors for known types', () => {
		expect(getWorkoutChartColor('strength')).toBe('var(--chart-1)');
		expect(getWorkoutChartColor('cardio')).toBe('var(--chart-2)');
		expect(getWorkoutChartColor('hiit')).toBe('var(--chart-5)');
		expect(getWorkoutChartColor('walk')).toBe('var(--chart-4)');
	});

	it('falls back to chart-3 for unknown types', () => {
		expect(getWorkoutChartColor('unknown')).toBe('var(--chart-3)');
	});
});

describe('getWorkoutEmoji', () => {
	it('returns the correct emoji for each workout type', () => {
		expect(getWorkoutEmoji('strength')).toBe('💪');
		expect(getWorkoutEmoji('cardio')).toBe('🏃');
		expect(getWorkoutEmoji('hiit')).toBe('🔥');
		expect(getWorkoutEmoji('walk')).toBe('🚶');
		expect(getWorkoutEmoji('stretch')).toBe('🤸');
		expect(getWorkoutEmoji('other')).toBe('🏋️');
	});

	it('falls back to the weightlifter emoji for unknown types', () => {
		expect(getWorkoutEmoji('dancing')).toBe('🏋️');
	});
});

describe('getWorkoutNotificationTag', () => {
	it('returns the correct notification tag for each workout type', () => {
		expect(getWorkoutNotificationTag('strength')).toBe('muscle');
		expect(getWorkoutNotificationTag('cardio')).toBe('runner');
		expect(getWorkoutNotificationTag('hiit')).toBe('fire');
		expect(getWorkoutNotificationTag('walk')).toBe('walking');
		expect(getWorkoutNotificationTag('stretch')).toBe('person_doing_cartwheel');
		expect(getWorkoutNotificationTag('other')).toBe('weight_lifter');
	});

	it('falls back to weight_lifter for unknown types', () => {
		expect(getWorkoutNotificationTag('cycling')).toBe('weight_lifter');
	});
});
