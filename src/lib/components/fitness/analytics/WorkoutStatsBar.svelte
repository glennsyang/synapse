<script lang="ts">
import ClockIcon from '@lucide/svelte/icons/clock';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import FlameIcon from '@lucide/svelte/icons/flame';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

interface Workout {
	id: string;
	date: string;
	durationMinutes: number | null;
}

let { workouts }: { workouts: Workout[] } = $props();

const stats = $derived.by(() => {
	const now = new Date();
	const thirtyDaysAgo = new Date(now);
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const last30 = workouts.filter((w) => new Date(w.date) >= thirtyDaysAgo);

	// This week (Mon–Sun)
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
	startOfWeek.setHours(0, 0, 0, 0);
	const thisWeek = workouts.filter((w) => new Date(w.date) >= startOfWeek);

	// Current streak: consecutive days with at least one workout
	const workoutDates = new Set(workouts.map((w) => w.date));
	let streak = 0;
	const d = new Date(now);
	d.setHours(0, 0, 0, 0);
	while (true) {
		const dateStr = d.toISOString().slice(0, 10);
		if (workoutDates.has(dateStr)) {
			streak++;
			d.setDate(d.getDate() - 1);
		} else {
			break;
		}
	}

	const longestSession = workouts.reduce((max, w) => Math.max(max, w.durationMinutes ?? 0), 0);

	return {
		last30Count: last30.length,
		thisWeekCount: thisWeek.length,
		streak,
		longestSession
	};
});

const cards = $derived([
	{
		label: 'Last 30 Days',
		value: stats.last30Count,
		unit: 'workouts',
		icon: DumbbellIcon
	},
	{
		label: 'This Week',
		value: stats.thisWeekCount,
		unit: 'workouts',
		icon: TrendingUpIcon
	},
	{
		label: 'Day Streak',
		value: stats.streak,
		unit: 'days',
		icon: FlameIcon
	},
	{
		label: 'Longest Session',
		value: stats.longestSession,
		unit: 'min',
		icon: ClockIcon
	}
]);
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
	{#each cards as card (card.label)}
		<div
			class="flex flex-col gap-1 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 p-4 text-white"
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-medium uppercase tracking-wide text-white/70">{card.label}</p>
				<card.icon class="h-4 w-4 text-white/60" />
			</div>
			<p class="font-display text-3xl font-bold leading-none">{card.value}</p>
			<p class="text-xs text-white/70">{card.unit}</p>
		</div>
	{/each}
</div>
