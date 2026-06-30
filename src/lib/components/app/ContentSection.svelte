<script lang="ts">
	import { cn } from '$lib';

	type SectionColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';

	let {
		title,
		color,
		border = false,
		padding = 'default',
		children,
		class: className,
		...restProps
	}: {
		title?: string;
		color?: SectionColor;
		border?: boolean;
		padding?: 'none' | 'sm' | 'default' | 'lg';
		children?: import('svelte').Snippet;
		class?: string;
	} = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		default: 'p-4 md:p-6',
		lg: 'p-6 md:p-8'
	};

	const bgClasses = $derived(
		color
			? {
					teal: 'bg-[oklch(var(--color-teal)/0.05)] dark:bg-[oklch(var(--color-teal)/0.1)]',
					blue: 'bg-[oklch(var(--color-blue)/0.05)] dark:bg-[oklch(var(--color-blue)/0.1)]',
					green: 'bg-[oklch(var(--color-green)/0.05)] dark:bg-[oklch(var(--color-green)/0.1)]',
					orange: 'bg-[oklch(var(--color-orange)/0.05)] dark:bg-[oklch(var(--color-orange)/0.1)]',
					purple: 'bg-[oklch(var(--color-purple)/0.05)] dark:bg-[oklch(var(--color-purple)/0.1)]',
					pink: 'bg-[oklch(var(--color-pink)/0.05)] dark:bg-[oklch(var(--color-pink)/0.1)]'
				}[color]
			: ''
	);

	const borderClasses = $derived(
		border && color
			? {
					teal: 'border-l-4 border-[oklch(var(--color-teal))]',
					blue: 'border-l-4 border-[oklch(var(--color-blue))]',
					green: 'border-l-4 border-[oklch(var(--color-green))]',
					orange: 'border-l-4 border-[oklch(var(--color-orange))]',
					purple: 'border-l-4 border-[oklch(var(--color-purple))]',
					pink: 'border-l-4 border-[oklch(var(--color-pink))]'
				}[color]
			: ''
	);
</script>

<section
	class={cn(
		'rounded-lg transition-colors',
		bgClasses,
		borderClasses,
		paddingClasses[padding],
		className
	)}
	{...restProps}
>
	{#if title}
		<h2 class="font-display mb-4 text-xl font-semibold md:text-2xl">{title}</h2>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</section>
