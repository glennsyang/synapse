<script lang="ts">
	import { page } from '$app/state';
	import type { SidebarNav } from '$lib/types';

	interface Props {
		items: SidebarNav['navMain'];
	}

	let { items }: Props = $props();

	const isActive = (url?: string) => (url ? page.url.pathname.startsWith(url) : false);
</script>

<!-- Desktop binding: the cover's spine with an index tab per section. -->
<nav
	aria-label="Sections"
	class="sticky top-0 hidden h-dvh w-[6.5rem] shrink-0 flex-col items-end py-3 md:flex"
>
	<ul class="mt-16 flex w-full flex-col items-end gap-1.5">
		{#each items as item (item.title)}
			{@const active = isActive(item.url)}
			{@const Icon = item.icon}
			<li class="flex w-full justify-end" style="--pen: oklch(var(--color-{item.pen}))">
				<a
					href={item.url}
					data-sveltekit-preload-data="hover"
					aria-current={active ? 'page' : undefined}
					title={item.description}
					class={[
						'index-tab ml-auto flex h-11 w-max items-center gap-1.5 rounded-l-[3px] pl-2.5 text-[0.72rem] leading-none font-bold tracking-wide transition-[padding,background-color,color] duration-200 ease-out',
						active ? 'is-active pr-4' : 'pr-2.5 hover:pr-4'
					]}
				>
					{#if Icon}<Icon class="size-3.5" strokeWidth={2.25} aria-hidden="true" />{/if}
					<span>{item.short}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.index-tab {
		background: color-mix(in oklch, var(--pen) 88%, var(--cover));
		color: oklch(0.99 0 0);
	}
	.index-tab:hover {
		background: var(--pen);
	}
	/* The open tab is cut from the same sheet as the page it opens. */
	.index-tab.is-active {
		background: var(--paper);
		color: var(--pen);
		margin-right: -1px;
	}

	:global(.dark) .index-tab:not(.is-active) {
		color: oklch(0.18 0.02 260);
	}
</style>
