<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar-days';

	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { parseLocalDateString, toLocalDateString } from '$lib/utils/date';
	import { getMoodScoreLabel } from '$lib/utils/mood';

	interface CalendarLog {
		date: string;
		score: number;
		resolvedMood: string;
		fill: string;
	}

	interface Props {
		calendarLogs: CalendarLog[];
		/** ISO date string for today — used to compute the calendar grid */
		today: string;
	}

	let { calendarLogs, today }: Props = $props();

	/** Build a grid of week columns for the current month */
	const calendarGrid = $derived.by(() => {
		const todayDate = parseLocalDateString(today);
		const year = todayDate.getFullYear();
		const month = todayDate.getMonth();

		// First day of month
		const firstDay = new Date(year, month, 1);
		// Last day of month
		const lastDay = new Date(year, month + 1, 0);

		// Monday-based offset for first day: Mon=0…Sun=6
		const startOffset = (firstDay.getDay() + 6) % 7;

		// Build flat array of cell objects (null = padding before month starts)
		type Cell = { date: string; label: number } | null;
		const cells: Cell[] = [];

		for (let i = 0; i < startOffset; i += 1) {
			cells.push(null);
		}

		for (let d = 1; d <= lastDay.getDate(); d += 1) {
			const cellDate = new Date(year, month, d);
			cells.push({ date: toLocalDateString(cellDate), label: d });
		}

		// Split into weeks (rows of 7)
		const weeks: Cell[][] = [];
		for (let i = 0; i < cells.length; i += 7) {
			weeks.push(cells.slice(i, i + 7));
		}
		// Pad last row
		const lastWeek = weeks[weeks.length - 1];
		while (lastWeek.length < 7) {
			lastWeek.push(null);
		}

		return weeks;
	});

	const logByDate = $derived(new Map(calendarLogs.map((l) => [l.date, l])));

	const monthName = $derived.by(() => {
		const d = parseLocalDateString(today);
		return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	});

	const weekdayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	function scoreToBg(score: number): string {
		if (score <= 2) return 'bg-orange-200 dark:bg-orange-900/60';
		if (score <= 4) return 'bg-orange-300 dark:bg-orange-700/70';
		if (score <= 6) return 'bg-orange-500 dark:bg-orange-500/80';
		return 'bg-orange-600 dark:bg-orange-400/90';
	}

	function isFuture(dateStr: string): boolean {
		return dateStr > today;
	}
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title class="font-display flex items-center gap-2">
			<CalendarIcon class="h-4 w-4 text-[oklch(var(--color-orange))]" />
			{monthName}
		</Card.Title>
		<Card.Description>Daily mood log — current month</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-2">
			<!-- Weekday header row -->
			<div class="grid grid-cols-7 gap-1 text-center">
				{#each weekdayHeaders as header, i (i)}
					<div class="text-xs font-medium text-muted-foreground">{header}</div>
				{/each}
			</div>

			<!-- Calendar grid -->
			{#each calendarGrid as week, weekIndex (weekIndex)}
				<div class="grid grid-cols-7 gap-1">
					{#each week as cell, dayIndex (dayIndex)}
						{@const log = cell ? logByDate.get(cell.date) : null}
						{@const future = cell ? isFuture(cell.date) : false}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<div
									class={[
										'flex aspect-square w-full items-center justify-center rounded-md text-xs font-medium transition-colors',
										!cell && 'pointer-events-none opacity-0',
										cell && future && 'text-muted-foreground/40',
										cell && !future && !log && 'bg-muted/40 text-muted-foreground hover:bg-muted/60',
										cell && !future && log && scoreToBg(log.score),
										cell && !future && log && 'text-white'
									]}
								>
									{cell ? cell.label : ''}
								</div>
							</Tooltip.Trigger>
							{#if cell && !future}
								<Tooltip.Content>
									{#if log}
										<span class="font-medium">{log.resolvedMood}</span>
										<span class="ml-1 text-muted-foreground">
											· {getMoodScoreLabel(log.score)} ({log.score})
										</span>
									{:else}
										<span class="text-muted-foreground">No log</span>
									{/if}
								</Tooltip.Content>
							{/if}
						</Tooltip.Root>
					{/each}
				</div>
			{/each}

			<!-- Legend -->
			<div class="flex items-center justify-end gap-2 pt-1 text-xs text-muted-foreground">
				<span>Low</span>
				<div class="flex gap-0.5">
					<div class="h-3 w-3 rounded-sm bg-orange-200 dark:bg-orange-900/60"></div>
					<div class="h-3 w-3 rounded-sm bg-orange-300 dark:bg-orange-700/70"></div>
					<div class="h-3 w-3 rounded-sm bg-orange-500 dark:bg-orange-500/80"></div>
					<div class="h-3 w-3 rounded-sm bg-orange-600 dark:bg-orange-400/90"></div>
				</div>
				<span>High</span>
			</div>
		</div>
	</Card.Content>
</Card.Root>
