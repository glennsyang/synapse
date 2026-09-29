export const moodOptions = [
	{
		value: 'sad',
		label: 'Sad',
		score: 1,
		chartColor: 'var(--chart-5)',
		buttonClass: 'border-destructive bg-destructive/12 text-destructive hover:bg-destructive/12'
	},
	{
		value: 'anxious',
		label: 'Anxious',
		score: 2,
		chartColor: 'var(--chart-1)',
		buttonClass: 'border-pen-tasks bg-pen-tasks/12 text-pen-tasks hover:bg-pen-tasks/12'
	},
	{
		value: 'overwhelmed',
		label: 'Overwhelmed',
		score: 3,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-border bg-muted text-foreground hover:bg-muted'
	},
	{
		value: 'tired',
		label: 'Tired',
		score: 4,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-border bg-muted text-foreground hover:bg-muted'
	},
	{
		value: 'calm',
		label: 'Calm',
		score: 5,
		chartColor: 'var(--chart-2)',
		buttonClass: 'border-pen-journal bg-pen-journal/12 text-pen-journal hover:bg-pen-journal/12'
	},
	{
		value: 'focused',
		label: 'Focused',
		score: 6,
		chartColor: 'var(--chart-4)',
		buttonClass: 'border-pen-brand bg-pen-brand/12 text-pen-brand hover:bg-pen-brand/12'
	},
	{
		value: 'content',
		label: 'Content',
		score: 7,
		chartColor: 'oklch(var(--color-green))',
		buttonClass: 'border-pen-fitness bg-pen-fitness/12 text-pen-fitness hover:bg-pen-fitness/12'
	},
	{
		value: 'happy',
		label: 'Happy',
		score: 8,
		chartColor: 'var(--chart-2)',
		buttonClass: 'border-pen-fitness bg-pen-fitness/12 text-pen-fitness hover:bg-pen-fitness/12'
	},
	{
		value: 'custom',
		label: 'Custom',
		score: 4,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-pen-mind bg-pen-mind/12 text-pen-mind hover:bg-pen-mind/12'
	}
] as const;

export const moodPeriods = ['week', 'month', 'quarter'] as const;

export type MoodPeriod = (typeof moodPeriods)[number];

type MoodValue = (typeof moodOptions)[number]['value'];

const moodOptionsByValue = new Map(moodOptions.map((option) => [option.value, option]));

export function isMoodValue(value: string): value is MoodValue {
	return moodOptionsByValue.has(value as MoodValue);
}

function getMoodOption(value: string) {
	return moodOptionsByValue.get(value as MoodValue);
}

function getMoodLabel(value: string): string {
	return getMoodOption(value)?.label ?? value;
}

export function getMoodScore(value: string): number {
	return getMoodOption(value)?.score ?? 4;
}

export function getMoodChartColor(value: string): string {
	return getMoodOption(value)?.chartColor ?? 'var(--chart-3)';
}

export function resolveMoodLabel(mood: string, customMood: string | null | undefined): string {
	if (mood === 'custom') {
		const customLabel = customMood?.trim();
		return customLabel && customLabel.length > 0 ? customLabel : 'Custom';
	}

	return getMoodLabel(mood);
}

export function getMoodScoreLabel(score: number): string {
	const roundedScore = Math.max(1, Math.min(8, Math.round(score)));
	return moodOptions.find((option) => option.score === roundedScore)?.label ?? 'Mood';
}

export function normalizeOptionalMoodText(value: string | null | undefined): string | null {
	const trimmedValue = value?.trim();
	return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null;
}
