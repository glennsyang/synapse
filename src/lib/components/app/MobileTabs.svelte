<script lang="ts">
	import { page } from '$app/state';
	import type { SidebarNav } from '$lib/types';

	let { items }: { items: SidebarNav['navMain'] } = $props();

	// Admin lives in the account menu on phones; six tabs is the thumb limit.
	const tabs = $derived(items.filter((i) => !i.adminOnly));
</script>

<nav
	aria-label="Sections"
	class="fixed inset-x-0 bottom-0 z-40 bg-cover pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid grid-cols-6 gap-1 px-1.5">
		{#each tabs as item (item.title)}
			{@const active = item.url ? page.url.pathname.startsWith(item.url) : false}
			{@const Icon = item.icon}
			<li style="--pen: oklch(var(--color-{item.pen}))">
				<a
					href={item.url}
					aria-current={active ? 'page' : undefined}
					class={[
						'mobile-tab flex flex-col items-center gap-1 rounded-b-[3px] pt-2 pb-2.5 text-[0.65rem] leading-none font-bold',
						active && 'is-active'
					]}
				>
					{#if Icon}<Icon class="size-[1.15rem]" strokeWidth={2.25} aria-hidden="true" />{/if}
					<span class="max-w-full truncate">{item.short}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.mobile-tab {
		color: var(--cover-foreground);
		border-top: 3px solid var(--pen);
		transition:
			background-color 160ms ease-out,
			color 160ms ease-out;
	}
	/* Active tab hangs from the sheet above it, in the sheet's own paper. */
	.mobile-tab.is-active {
		background: var(--paper);
		color: var(--pen);
		border-top-color: var(--paper);
	}
</style>
