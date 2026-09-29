<script lang="ts">
	import { page } from '$app/state';
	import type { SidebarNav, User } from '$lib/types';

	import ThemeToggle from './ThemeToggle.svelte';
	import UserMenu from './UserMenu.svelte';

	interface Props {
		items: SidebarNav['navMain'];
		user: User;
	}

	let { items, user }: Props = $props();

	const section = $derived(items.find((i) => i.url && page.url.pathname.startsWith(i.url)));

	// Detail pages (journal/abc, tasks/new) get a trail back to their section.
	const detail = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		if (segments.length < 2) return null;
		return decodeURIComponent(segments[segments.length - 1])
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	});

	// Client-only: the server's timezone isn't the reader's.
	let today = $state('');
	$effect(() => {
		today = new Date().toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	});
</script>

<!-- The running head printed across the top of every planner page. -->
<header
	class="text-muted-foreground flex h-11 items-center gap-3 border-b px-4 text-xs md:px-8"
	style={section ? `--pen: oklch(var(--color-${section.pen}))` : undefined}
>
	<a
		href="/dashboard"
		class="text-foreground flex items-center gap-2 font-black tracking-[0.16em] uppercase"
	>
		<span
			class="border-foreground/70 grid size-6 place-items-center rounded-full border-[1.5px] text-[0.7rem] tracking-normal"
			aria-hidden="true">S</span
		>
		Synapse
	</a>

	<nav aria-label="Breadcrumb" class="hidden min-w-0 items-center gap-2 md:ml-4 md:flex">
		{#if section && detail}
			<a href={section.url} class="font-bold tracking-[0.14em] uppercase" style="color: var(--pen)"
				>{section.title}</a
			>
		{/if}
		{#if detail}
			<span aria-hidden="true">/</span>
			<span class="text-foreground truncate" aria-current="page">{detail}</span>
		{/if}
	</nav>

	<time class="ml-auto hidden tabular-nums md:block">{today}</time>

	<div class="ml-auto flex items-center gap-1 md:ml-2">
		<ThemeToggle class="hover:bg-muted size-9" />
		<UserMenu {user} showAdmin side="bottom" class="bg-muted" />
	</div>
</header>
