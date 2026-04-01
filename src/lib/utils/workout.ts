import type { WorkoutType } from '$lib/schemas/fitness';

export const workoutTypeOptions = [
	{
		value: 'strength' as WorkoutType,
		label: 'Strength',
		borderClass: 'border-l-orange-500',
		badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
		chartColor: 'var(--chart-1)'
	},
	{
		value: 'cardio' as WorkoutType,
		label: 'Cardio',
		borderClass: 'border-l-blue-500',
		badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		chartColor: 'var(--chart-2)'
	},
	{
		value: 'hiit' as WorkoutType,
		label: 'HIIT',
		borderClass: 'border-l-red-500',
		badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		chartColor: 'var(--chart-5)'
	},
	{
		value: 'walk' as WorkoutType,
		label: 'Walk',
		borderClass: 'border-l-green-500',
		badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		chartColor: 'var(--chart-4)'
	},
	{
		value: 'stretch' as WorkoutType,
		label: 'Stretch',
		borderClass: 'border-l-purple-500',
		badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
		chartColor: 'var(--chart-3)'
	},
	{
		value: 'other' as WorkoutType,
		label: 'Other',
		borderClass: 'border-l-gray-400',
		badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
		chartColor: 'var(--chart-3)'
	}
] as const;

// Optimized lookup following mood.ts pattern
const workoutOptionsByValue = new Map(workoutTypeOptions.map((option) => [option.value, option]));

export function isWorkoutType(value: string): value is WorkoutType {
	return workoutOptionsByValue.has(value as WorkoutType);
}

function getWorkoutOption(type: string) {
	return workoutOptionsByValue.get(type as WorkoutType);
}

export function getWorkoutLabel(type: string): string {
	return getWorkoutOption(type)?.label ?? 'Other';
}

export function getWorkoutBorderClass(type: string): string {
	return getWorkoutOption(type)?.borderClass ?? 'border-l-gray-400';
}

export function getWorkoutBadgeClass(type: string): string {
	return (
		getWorkoutOption(type)?.badgeClass ??
		'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
	);
}

export function getWorkoutChartColor(type: string): string {
	return getWorkoutOption(type)?.chartColor ?? 'var(--chart-3)';
}

// Re-export for convenience
export type { WorkoutType } from '$lib/schemas/fitness';
