<script lang="ts">
import type { Component } from 'svelte';

import { Button } from '$lib/components/ui/button/index.js';
import { cn } from '$lib/utils.js';

type SectionColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';

let {
	title,
	description,
	icon,
	color = 'teal',
	href,
	ctaText = 'Go',
	onclick,
	class: className,
	...restProps
}: {
	title: string;
	description: string;
	icon?: Component;
	color?: SectionColor;
	href?: string;
	ctaText?: string;
	onclick?: () => void;
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

const gradientClasses = {
	teal: 'from-[oklch(var(--color-teal)/0.1)] to-transparent',
	blue: 'from-[oklch(var(--color-blue)/0.1)] to-transparent',
	green: 'from-[oklch(var(--color-green)/0.1)] to-transparent',
	orange: 'from-[oklch(var(--color-orange)/0.1)] to-transparent',
	purple: 'from-[oklch(var(--color-purple)/0.1)] to-transparent',
	pink: 'from-[oklch(var(--color-pink)/0.1)] to-transparent'
};

const borderHoverClasses = {
	teal: 'hover:border-[oklch(var(--color-teal)/0.5)]',
	blue: 'hover:border-[oklch(var(--color-blue)/0.5)]',
	green: 'hover:border-[oklch(var(--color-green)/0.5)]',
	orange: 'hover:border-[oklch(var(--color-orange)/0.5)]',
	purple: 'hover:border-[oklch(var(--color-purple)/0.5)]',
	pink: 'hover:border-[oklch(var(--color-pink)/0.5)]'
};
</script>

<div
	class={cn(
		'group relative overflow-hidden rounded-lg border bg-card p-6 shadow-xs transition-all hover:shadow-md',
		borderHoverClasses[color],
		className
	)}
	{...restProps}
>
	<!-- Gradient background on hover -->
	<div
		class={cn(
			'pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity group-hover:opacity-100',
			gradientClasses[color]
		)}
	></div>

	<div class="relative space-y-4">
		<!-- Icon -->
		{#if icon}
			{@const IconComponent = icon}
			<div
				class={cn(
					'flex size-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
					iconBgClasses[color]
				)}
			>
				<IconComponent class="size-8" />
			</div>
		{/if}

		<!-- Content -->
		<div class="space-y-2">
			<h3 class="font-display text-xl font-semibold">{title}</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">{description}</p>
		</div>

		<!-- CTA Button -->
		{#if href || onclick}
			<div class="pt-2">
				<Button {href} {onclick} variant="outline" size="sm" class="group-hover:shadow-xs">
					{ctaText}
				</Button>
			</div>
		{/if}
	</div>
</div>
