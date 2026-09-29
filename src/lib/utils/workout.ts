import type { WorkoutType } from '$lib/schemas/fitness';

export const workoutTypeOptions = [
	{
		value: 'strength' as WorkoutType,
		label: 'Strength',
		emoji: '💪',
		notificationTag: 'muscle',
		badgeClass: 'bg-pen-tasks/12 text-pen-tasks dark:bg-pen-tasks/30 dark:text-pen-tasks',
		chartColor: 'var(--chart-1)'
	},
	{
		value: 'cardio' as WorkoutType,
		label: 'Cardio',
		emoji: '🏃',
		notificationTag: 'runner',
		badgeClass: 'bg-pen-journal/12 text-pen-journal dark:bg-pen-journal/30 dark:text-pen-journal',
		chartColor: 'var(--chart-2)'
	},
	{
		value: 'hiit' as WorkoutType,
		label: 'HIIT',
		emoji: '🔥',
		notificationTag: 'fire',
		badgeClass: 'bg-destructive/12 text-destructive dark:bg-destructive/30 dark:text-destructive',
		chartColor: 'var(--chart-5)'
	},
	{
		value: 'walk' as WorkoutType,
		label: 'Walk',
		emoji: '🚶',
		notificationTag: 'walking',
		badgeClass: 'bg-pen-fitness/12 text-pen-fitness dark:bg-pen-fitness/30 dark:text-pen-fitness',
		chartColor: 'var(--chart-4)'
	},
	{
		value: 'stretch' as WorkoutType,
		label: 'Stretch',
		emoji: '🤸',
		notificationTag: 'person_doing_cartwheel',
		badgeClass: 'bg-pen-mind/12 text-pen-mind dark:bg-pen-mind/30 dark:text-pen-mind',
		chartColor: 'var(--chart-3)'
	},
	{
		value: 'other' as WorkoutType,
		label: 'Other',
		emoji: '🏋️',
		notificationTag: 'weight_lifter',
		badgeClass: 'bg-muted text-foreground dark:bg-muted/50 dark:text-muted-foreground',
		chartColor: 'var(--chart-3)'
	}
] as const;

// Optimized lookup following mood.ts pattern
const workoutOptionsByValue = new Map(workoutTypeOptions.map((option) => [option.value, option]));

function getWorkoutOption(type: string) {
	return workoutOptionsByValue.get(type as WorkoutType);
}

export function getWorkoutLabel(type: string): string {
	return getWorkoutOption(type)?.label ?? 'Other';
}

export function getWorkoutBadgeClass(type: string): string {
	return (
		getWorkoutOption(type)?.badgeClass ??
		'bg-muted text-foreground dark:bg-muted/50 dark:text-muted-foreground'
	);
}

export function getWorkoutChartColor(type: string): string {
	return getWorkoutOption(type)?.chartColor ?? 'var(--chart-3)';
}

export function getWorkoutEmoji(type: string): string {
	return getWorkoutOption(type)?.emoji ?? '🏋️';
}

export function getWorkoutNotificationTag(type: string): string {
	return getWorkoutOption(type)?.notificationTag ?? 'weight_lifter';
}
