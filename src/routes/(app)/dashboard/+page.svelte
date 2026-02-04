<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	import { navItems } from './../sidebar';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard - Synapse</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white">
			Welcome back, {data.user.name}!
		</h1>
		<p class="mt-2 text-slate-600 dark:text-slate-400">
			Your second brain is ready to help you stay organized and mindful.
		</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each navItems.navMain as navItem (navItem.title)}
			<a href={navItem.url} class="group block">
				<Card.Root class="h-full transition-all hover:scale-[1.02] hover:shadow-lg">
					<Card.Header>
						{@const IconComponent = navItem.icon}
						<div
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
						>
							<span class="h-6 w-6 {navItem.color}">
								<IconComponent />
							</span>
						</div>
						<Card.Title
							class="transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
						>
							{navItem.title}
						</Card.Title>
						<Card.Description>{navItem.description}</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Getting Started</Card.Title>
			<Card.Description>Quick tips to make the most of Synapse</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-start gap-3">
				<div
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
				>
					<span class="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
				</div>
				<div>
					<p class="font-medium text-slate-900 dark:text-white">Start with Journal</p>
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Capture your thoughts, tag them, and track your location automatically
					</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
				>
					<span class="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
				</div>
				<div>
					<p class="font-medium text-slate-900 dark:text-white">Organize with Todos</p>
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Create projects, set priorities, and view tasks in list, grid, or kanban
					</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
				>
					<span class="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
				</div>
				<div>
					<p class="font-medium text-slate-900 dark:text-white">Track Your Health</p>
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Log workouts, meals, and weight to visualize your fitness journey
					</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
