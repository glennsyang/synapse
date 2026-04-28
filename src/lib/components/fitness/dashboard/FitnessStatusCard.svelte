<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		label: string;
		value: string | number;
		unit?: string;
		icon?: Component<{ class?: string }>;
		trend?: 'positive' | 'negative' | 'neutral';
		trendLabel?: string;
		gradient?: string;
	}

	let { label, value, unit, icon: Icon, trend = 'neutral', trendLabel, gradient }: Props = $props();
</script>

{#if gradient}
	<div
		class="flex flex-col gap-1.5 rounded-2xl bg-gradient-to-br {gradient} p-4 shadow-md transition-all"
	>
		<div class="flex items-center justify-between">
			<p class="text-xs font-medium uppercase tracking-wider text-white/70">{label}</p>
			{#if Icon}
				<Icon class="h-4 w-4 text-white/70" />
			{/if}
		</div>

		<div class="flex items-baseline gap-1">
			<span class="font-display text-3xl font-bold text-white">{value}</span>
			{#if unit}
				<span class="text-sm text-white/70">{unit}</span>
			{/if}
		</div>

		{#if trendLabel}
			<p class="text-xs text-white/80">{trendLabel}</p>
		{/if}
	</div>
{:else}
	<div
		class="flex flex-col gap-1.5 rounded-2xl border-0 bg-white p-4 shadow-sm transition-all dark:bg-zinc-900"
	>
		<div class="flex items-center justify-between">
			<p class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
				{label}
			</p>
			{#if Icon}
				<Icon class="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
			{/if}
		</div>

		<div class="flex items-baseline gap-1">
			<span class="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
				{value}
			</span>
			{#if unit}
				<span class="text-sm text-zinc-500 dark:text-zinc-400">{unit}</span>
			{/if}
		</div>

		{#if trendLabel}
			<p
				class="text-xs"
				class:text-emerald-600={trend === 'positive'}
				class:dark:text-emerald-400={trend === 'positive'}
				class:text-rose-500={trend === 'negative'}
				class:dark:text-rose-400={trend === 'negative'}
				class:text-zinc-500={trend === 'neutral'}
				class:dark:text-zinc-400={trend === 'neutral'}
			>
				{trendLabel}
			</p>
		{/if}
	</div>
{/if}
