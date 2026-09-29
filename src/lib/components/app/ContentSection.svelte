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
</script>

<section
	class={cn(
		'bg-card rounded-[3px] border',
		border && color && 'border-t-2 border-t-(--pen)',
		paddingClasses[padding],
		className
	)}
	style={color ? `--pen: oklch(var(--color-${color}))` : undefined}
	{...restProps}
>
	{#if title}
		<h2 class="ruled mb-4 pb-2 text-lg font-black md:text-xl">{title}</h2>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</section>
