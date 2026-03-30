export const moodOptions = [
	{
		value: 'sad',
		label: 'Sad',
		score: 1,
		chartColor: 'var(--chart-5)',
		buttonClass: 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
	},
	{
		value: 'anxious',
		label: 'Anxious',
		score: 2,
		chartColor: 'var(--chart-1)',
		buttonClass: 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
	},
	{
		value: 'overwhelmed',
		label: 'Overwhelmed',
		score: 3,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100'
	},
	{
		value: 'tired',
		label: 'Tired',
		score: 4,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100'
	},
	{
		value: 'calm',
		label: 'Calm',
		score: 5,
		chartColor: 'var(--chart-2)',
		buttonClass: 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100'
	},
	{
		value: 'focused',
		label: 'Focused',
		score: 6,
		chartColor: 'var(--chart-4)',
		buttonClass: 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100'
	},
	{
		value: 'content',
		label: 'Content',
		score: 7,
		chartColor: 'var(--color-green)',
		buttonClass: 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
	},
	{
		value: 'happy',
		label: 'Happy',
		score: 8,
		chartColor: 'var(--chart-2)',
		buttonClass: 'border-lime-300 bg-lime-50 text-lime-900 hover:bg-lime-100'
	},
	{
		value: 'custom',
		label: 'Custom',
		score: 4,
		chartColor: 'var(--chart-3)',
		buttonClass: 'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100'
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
