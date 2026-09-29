<script lang="ts">
	import { cn } from '$lib';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

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

	<div
		class="ruled flex flex-col gap-3 pb-3 md:flex-row md:items-end md:justify-between"
		style="--pen: oklch(var(--color-{color}))"
	>
		<div class="min-w-0 space-y-1">
			<h1
				class="flex items-center gap-3 text-3xl leading-tight font-black tracking-tight md:text-4xl"
			>
				<span class="size-3 shrink-0 rounded-[2px] bg-(--pen)" aria-hidden="true"></span>
				{title}
			</h1>
			{#if description}
				<p class="text-muted-foreground pl-6 text-sm md:text-base">{description}</p>
			{/if}
		</div>

		<!-- Actions slot -->
		{#if children}
			<div class="flex flex-wrap items-center gap-2">{@render children()}</div>
		{/if}
	</div>
</div>
