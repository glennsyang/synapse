export const calorieLegendItems = [
	{ label: 'Under target', className: 'bg-blue-400' },
	{ label: 'On target', className: 'bg-green-400' },
	{ label: 'Slightly over', className: 'bg-rose-400' },
	{ label: 'Over target', className: 'bg-red-500' }
] as const;

export function getCalorieAdherenceClass(
	calories: number | null,
	calorieTarget: number | null
): string {
	if (calories === null) return 'bg-stone-200 dark:bg-stone-700';
	if (!calorieTarget) return 'bg-stone-300 dark:bg-stone-600';

	const ratio = calories / calorieTarget;

	if (ratio >= 0.85 && ratio <= 1.1) return 'bg-green-400';
	if (ratio > 1.1 && ratio <= 1.25) return 'bg-rose-400';
	if (ratio > 1.25) return 'bg-red-500';

	return 'bg-blue-400';
}
