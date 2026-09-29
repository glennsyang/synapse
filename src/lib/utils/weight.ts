export const calorieLegendItems = [
	{ label: 'Under target', className: 'bg-pen-journal' },
	{ label: 'On target', className: 'bg-pen-fitness' },
	{ label: 'Slightly over', className: 'bg-destructive' },
	{ label: 'Over target', className: 'bg-destructive' }
] as const;

export function getCalorieAdherenceClass(
	calories: number | null,
	calorieTarget: number | null
): string {
	if (calories === null) return 'bg-muted dark:bg-muted';
	if (!calorieTarget) return 'bg-muted dark:bg-muted';

	const ratio = calories / calorieTarget;

	if (ratio >= 0.85 && ratio <= 1.1) return 'bg-pen-fitness';
	if (ratio > 1.1 && ratio <= 1.25) return 'bg-destructive';
	if (ratio > 1.25) return 'bg-destructive';

	return 'bg-pen-journal';
}
