import { describe, expect, it } from 'vitest';

import {
	getMoodChartColor,
	getMoodScore,
	getMoodScoreLabel,
	isMoodValue,
	normalizeOptionalMoodText,
	resolveMoodLabel
} from './mood';

describe('isMoodValue', () => {
	it('returns true for all valid mood values', () => {
		const validMoods = [
			'sad',
			'anxious',
			'overwhelmed',
			'tired',
			'calm',
			'focused',
			'content',
			'happy',
			'custom'
		];

		for (const mood of validMoods) {
			expect(isMoodValue(mood)).toBe(true);
		}
	});

	it('returns false for invalid mood values', () => {
		expect(isMoodValue('angry')).toBe(false);
		expect(isMoodValue('')).toBe(false);
		expect(isMoodValue('HAPPY')).toBe(false);
		expect(isMoodValue('great')).toBe(false);
	});
});

describe('getMoodScore', () => {
	it('returns the correct score for each mood', () => {
		expect(getMoodScore('sad')).toBe(1);
		expect(getMoodScore('anxious')).toBe(2);
		expect(getMoodScore('calm')).toBe(5);
		expect(getMoodScore('focused')).toBe(6);
		expect(getMoodScore('content')).toBe(7);
		expect(getMoodScore('happy')).toBe(8);
	});

	it('returns the default score of 4 for unknown moods', () => {
		expect(getMoodScore('unknown')).toBe(4);
		expect(getMoodScore('')).toBe(4);
	});
});

describe('getMoodChartColor', () => {
	it('returns the correct chart color for known moods', () => {
		expect(getMoodChartColor('sad')).toBe('var(--chart-5)');
		expect(getMoodChartColor('content')).toBe('oklch(var(--color-green))');
	});

	it('returns the fallback chart color for unknown moods', () => {
		expect(getMoodChartColor('unknown')).toBe('var(--chart-3)');
		expect(getMoodChartColor('')).toBe('var(--chart-3)');
	});
});

describe('resolveMoodLabel', () => {
	it('returns the standard label for non-custom moods', () => {
		expect(resolveMoodLabel('happy', null)).toBe('Happy');
		expect(resolveMoodLabel('calm', undefined)).toBe('Calm');
		expect(resolveMoodLabel('sad', 'ignored custom')).toBe('Sad');
	});

	it('returns the custom mood label when mood is custom', () => {
		expect(resolveMoodLabel('custom', 'Grateful')).toBe('Grateful');
	});

	it('trims whitespace from custom mood labels', () => {
		expect(resolveMoodLabel('custom', '  Grateful  ')).toBe('Grateful');
	});

	it('falls back to Custom when the custom label is empty or whitespace', () => {
		expect(resolveMoodLabel('custom', '')).toBe('Custom');
		expect(resolveMoodLabel('custom', '   ')).toBe('Custom');
		expect(resolveMoodLabel('custom', null)).toBe('Custom');
		expect(resolveMoodLabel('custom', undefined)).toBe('Custom');
	});

	it('returns the raw mood string for completely unknown moods', () => {
		expect(resolveMoodLabel('mystery', null)).toBe('mystery');
	});
});

describe('getMoodScoreLabel', () => {
	it('maps score 1 to Sad and score 8 to Happy', () => {
		expect(getMoodScoreLabel(1)).toBe('Sad');
		expect(getMoodScoreLabel(8)).toBe('Happy');
	});

	it('clamps scores below 1 to 1', () => {
		expect(getMoodScoreLabel(0)).toBe('Sad');
		expect(getMoodScoreLabel(-5)).toBe('Sad');
	});

	it('clamps scores above 8 to 8', () => {
		expect(getMoodScoreLabel(9)).toBe('Happy');
		expect(getMoodScoreLabel(100)).toBe('Happy');
	});

	it('rounds fractional scores to the nearest integer', () => {
		expect(getMoodScoreLabel(1.4)).toBe('Sad');
		expect(getMoodScoreLabel(1.5)).toBe('Anxious');
	});
});

describe('normalizeOptionalMoodText', () => {
	it('returns the trimmed text for non-empty strings', () => {
		expect(normalizeOptionalMoodText('  Grateful  ')).toBe('Grateful');
		expect(normalizeOptionalMoodText('content')).toBe('content');
	});

	it('returns null for empty or whitespace strings', () => {
		expect(normalizeOptionalMoodText('')).toBeNull();
		expect(normalizeOptionalMoodText('   ')).toBeNull();
	});

	it('returns null for null and undefined', () => {
		expect(normalizeOptionalMoodText(null)).toBeNull();
		expect(normalizeOptionalMoodText(undefined)).toBeNull();
	});
});
