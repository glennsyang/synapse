<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		unit?: string;
		trend?: 'positive' | 'negative' | 'neutral';
		trendLabel?: string;
		gradient?: string;
	}

	let { label, value, unit, trend = 'neutral', trendLabel, gradient }: Props = $props();

	// The highlighted readings name their pen in the gradient class list.
	const penTriplet: Record<string, string> = {
		fitness: 'green',
		tasks: 'orange',
		journal: 'blue',
		mind: 'purple',
		people: 'pink',
		brand: 'teal',
		warn: 'amber'
	};
	const pen = $derived(
		penTriplet[gradient?.match(/pen-(fitness|tasks|journal|mind|people|brand|warn)/)?.[1] ?? '']
	);
</script>

<!-- One reading in the fitness margin: pen numeral, plain label, one note. -->
<div class="flex flex-col py-3 md:px-5 md:first:pl-0">
	<span
		class="text-4xl leading-none font-black tabular-nums"
		style="color: oklch(var(--color-{pen ?? 'green'}))"
	>
		{value}{#if unit}<span class="text-muted-foreground ml-1 text-sm font-bold">{unit}</span>{/if}
	</span>
	<p class="mt-1.5 text-sm font-bold">{label}</p>
	{#if trendLabel}
		<p
			class={[
				'text-xs',
				trend === 'positive' && 'text-pen-fitness font-medium',
				trend === 'negative' && 'text-destructive font-medium',
				(!trend || trend === 'neutral') && 'text-muted-foreground'
			]}
		>
			{trendLabel}
		</p>
	{/if}
</div>
