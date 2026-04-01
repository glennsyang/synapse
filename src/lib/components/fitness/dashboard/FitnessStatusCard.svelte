<script lang="ts">
import type { Component } from 'svelte';

interface Props {
	label: string;
	value: string | number;
	unit?: string;
	icon?: Component<{ class?: string }>;
	trend?: 'positive' | 'negative' | 'neutral';
	trendLabel?: string;
}

let { label, value, unit, icon: Icon, trend = 'neutral', trendLabel }: Props = $props();
</script>

<div
	class="flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 p-4 transition-all dark:border-stone-800 dark:bg-stone-900/40"
>
	<div class="flex items-center justify-between">
		<p class="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
			{label}
		</p>
		{#if Icon}
			<Icon class="h-4 w-4 text-stone-400 dark:text-stone-500" />
		{/if}
	</div>

	<div class="flex items-baseline gap-1">
		<span class="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
			{value}
		</span>
		{#if unit}
			<span class="text-sm text-stone-500 dark:text-stone-400">{unit}</span>
		{/if}
	</div>

	{#if trendLabel}
		<p
			class="text-xs"
			class:text-emerald-600={trend === 'positive'}
			class:dark:text-emerald-400={trend === 'positive'}
			class:text-rose-500={trend === 'negative'}
			class:dark:text-rose-400={trend === 'negative'}
			class:text-stone-500={trend === 'neutral'}
			class:dark:text-stone-400={trend === 'neutral'}
		>
			{trendLabel}
		</p>
	{/if}
</div>
