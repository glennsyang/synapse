<script lang="ts">
	type AgendaItemStat = {
		title: string;
		completionPct: number;
		prevCompletionPct: number;
		dowCompletionPct: number[]; // index 0=Mon … 6=Sun, -1 = not scheduled that day
		totalDays: number;
	};

	let { items }: { items: AgendaItemStat[] } = $props();

	const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

	function pctColorClass(pct: number): string {
		if (pct < 0) return 'bg-muted text-muted-foreground';
		if (pct >= 70) return 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]';
		if (pct >= 40) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
		return 'bg-destructive/10 text-destructive';
	}

	function dotColorClass(pct: number): string {
		if (pct < 0) return 'bg-border/60'; // not scheduled
		if (pct >= 70) return 'bg-[oklch(var(--color-green))]';
		if (pct >= 40) return 'bg-amber-400';
		return 'bg-destructive/70';
	}

	function trendSymbol(current: number, prev: number): { label: string; cls: string } {
		const delta = current - prev;
		if (delta >= 5) return { label: '↑', cls: 'text-[oklch(var(--color-green))]' };
		if (delta <= -5) return { label: '↓', cls: 'text-destructive' };
		return { label: '→', cls: 'text-muted-foreground' };
	}

	function dotTitle(pct: number, dow: string): string {
		if (pct < 0) return `${dow}: not scheduled`;
		return `${dow}: ${pct}%`;
	}
</script>

{#if items.length === 0}
	<div
		class="border-border/60 text-muted-foreground flex min-h-28 items-center justify-center rounded-xl border border-dashed text-sm"
	>
		Complete more agenda items to see your breakdown.
	</div>
{:else}
	<div class="space-y-4">
		{#each items as item (item.title)}
			{@const trend = trendSymbol(item.completionPct, item.prevCompletionPct)}
			<div>
				<div class="mb-1.5 flex items-center justify-between gap-2">
					<div class="flex min-w-0 items-center gap-2">
						<span class="truncate text-sm font-medium">{item.title}</span>
						<span class="shrink-0 {trend.cls} text-sm font-semibold" title="vs prior 4 weeks">
							{trend.label}
						</span>
					</div>
					<span
						class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold {pctColorClass(
							item.completionPct
						)}"
					>
						{item.completionPct}%
					</span>
				</div>
				<!-- Day-of-week dot row -->
				<div class="flex items-center gap-1">
					{#each item.dowCompletionPct as pct, i (i)}
						<div class="flex flex-col items-center gap-0.5">
							<div
								class="size-2.5 rounded-full {dotColorClass(pct)}"
								title={dotTitle(pct, DOW_LABELS[i] ?? '')}
							></div>
							<span class="text-muted-foreground/60 text-[9px] leading-none">{DOW_LABELS[i]}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
