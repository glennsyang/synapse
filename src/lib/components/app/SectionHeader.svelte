<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { cn } from '$lib/utils.js';

	type SectionColor = 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';

	let {
		title,
		description,
		color = 'teal',
		breadcrumbs = [],
		children,
		class: className,
		...restProps
	}: {
		title: string;
		description?: string;
		color?: SectionColor;
		breadcrumbs?: { title: string; url?: string }[];
		children?: import('svelte').Snippet;
		class?: string;
	} = $props();

	const colorClasses = {
		teal: 'border-[oklch(var(--color-teal))]',
		blue: 'border-[oklch(var(--color-blue))]',
		green: 'border-[oklch(var(--color-green))]',
		orange: 'border-[oklch(var(--color-orange))]',
		purple: 'border-[oklch(var(--color-purple))]',
		pink: 'border-[oklch(var(--color-pink))]'
	};
</script>

<div class={cn('mb-0', className)} {...restProps}>
	<!-- Breadcrumbs if provided -->
	{#if breadcrumbs.length > 0}
		<Breadcrumb.Root class="mb-4">
			<Breadcrumb.List>
				{#each breadcrumbs as crumb, i (crumb.title)}
					<Breadcrumb.Item>
						{#if crumb.url}
							<Breadcrumb.Link href={crumb.url}>{crumb.title}</Breadcrumb.Link>
						{:else}
							<Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
						{/if}
					</Breadcrumb.Item>
					{#if i < breadcrumbs.length - 1}
						<Breadcrumb.Separator />
					{/if}
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	{/if}

	<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<!-- Title and Description -->
		<div class="space-y-2">
			<div>
				<div class={cn('h-1 w-12 rounded-full', colorClasses[color])}></div>
				<h1 class="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
			</div>
			{#if description}
				<p class="text-base text-muted-foreground md:text-lg">{description}</p>
			{/if}
		</div>

		<!-- Actions slot -->
		{#if children}
			<div class="flex items-center gap-2">{@render children()}</div>
		{/if}
	</div>

	<!-- Accent bar -->
	<div class={cn('mt-4 h-1 rounded-full', colorClasses[color])}></div>
</div>
