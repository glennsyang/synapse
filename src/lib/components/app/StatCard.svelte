<script lang="ts">
import TrendingDown from '@lucide/svelte/icons/trending-down';
import TrendingUp from '@lucide/svelte/icons/trending-up';
import type { Component } from 'svelte';

import { cn } from '$lib/utils.js';

type SectionColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';
type TrendDirection = 'up' | 'down' | 'neutral';

let {
	label,
	value,
	icon,
	color = 'teal',
	trend,
	trendValue,
	trendDirection = 'neutral',
	class: className,
	...restProps
}: {
	label: string;
	value: string | number;
	icon?: Component;
	color?: SectionColor;
	trend?: string;
	trendValue?: string;
	trendDirection?: TrendDirection;
	class?: string;
} = $props();

const iconBgClasses = {
	teal: 'bg-[oklch(var(--color-teal)/0.15)] text-[oklch(var(--color-teal))]',
	blue: 'bg-[oklch(var(--color-blue)/0.15)] text-[oklch(var(--color-blue))]',
	green: 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]',
	orange: 'bg-[oklch(var(--color-orange)/0.15)] text-[oklch(var(--color-orange))]',
	purple: 'bg-[oklch(var(--color-purple)/0.15)] text-[oklch(var(--color-purple))]',
	pink: 'bg-[oklch(var(--color-pink)/0.15)] text-[oklch(var(--color-pink))]'
};

const trendColorClasses = {
	up: 'text-[oklch(var(--color-green))]',
	down: 'text-destructive',
	neutral: 'text-muted-foreground'
};

const TrendIcon = $derived(
	trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : null
);
</script>

<div
	class={cn(
		'group relative overflow-hidden rounded-lg border bg-card p-6 shadow-xs transition-all hover:shadow-sm',
		className
	)}
	{...restProps}
>
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 space-y-3">
			<p class="text-sm font-medium text-muted-foreground">{label}</p>
			<p class="font-display text-3xl font-bold tracking-tight">{value}</p>
			{#if trend || trendValue}
				<div class="flex items-center gap-1.5 text-sm">
					{#if TrendIcon}
						<TrendIcon class={cn('size-4', trendColorClasses[trendDirection])} />
					{/if}
					{#if trendValue}
						<span class={cn('font-medium', trendColorClasses[trendDirection])}>{trendValue}</span>
					{/if}
					{#if trend}
						<span class="text-muted-foreground">{trend}</span>
					{/if}
				</div>
			{/if}
		</div>

		{#if icon}
			{@const IconComponent = icon}
			<div
				class={cn(
					'flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-110',
					iconBgClasses[color]
				)}
			>
				<IconComponent class="size-6" />
			</div>
		{/if}
	</div>
</div>
