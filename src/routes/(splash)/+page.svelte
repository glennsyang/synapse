<script lang="ts">
	import { goto } from '$app/navigation';
	import { SIGN_IN_ROUTE } from '$lib/auth-routes';
	import ThemeToggle from '$lib/components/app/ThemeToggle.svelte';
	import { Button } from '$lib/components/ui/button';

	const handleSignIn = () => goto(SIGN_IN_ROUTE);

	// The index tabs a new planner arrives with, one per section.
	const tabs = [
		{ label: 'Today', pen: 'teal' },
		{ label: 'Journal', pen: 'blue' },
		{ label: 'Tasks', pen: 'orange' },
		{ label: 'Fitness', pen: 'green' },
		{ label: 'Meditation', pen: 'purple' },
		{ label: 'Visits', pen: 'pink' }
	];
</script>

<div class="text-cover-foreground flex min-h-dvh flex-col bg-cover">
	<header class="flex items-center justify-between px-5 py-4 md:px-10">
		<a href="/" class="flex items-center gap-2 text-sm font-black tracking-[0.3em] uppercase">
			<span
				class="border-cover-foreground/70 grid size-8 place-items-center rounded-full border-[1.5px] tracking-normal"
				aria-hidden="true">S</span
			>
			Synapse
		</a>
		<div class="flex items-center gap-2">
			<ThemeToggle class="hover:bg-cover-deep" />
			<Button
				variant="outline"
				class="border-cover-foreground/50 text-cover-foreground hover:bg-cover-deep hover:text-cover-foreground bg-transparent"
				onclick={handleSignIn}>Sign In</Button
			>
		</div>
	</header>

	<main class="flex grow items-center justify-center px-4 pb-16">
		<!-- A planner, closed: the sheet peeks out with its tabs down the edge. -->
		<div class="relative w-full max-w-xl">
			<ul class="absolute top-8 left-full hidden flex-col gap-1.5 sm:flex" aria-hidden="true">
				{#each tabs as tab (tab.label)}
					<li
						class="h-9 w-max rounded-r-[3px] px-2.5 text-[0.65rem] leading-9 font-bold text-white"
						style="background: oklch(var(--color-{tab.pen}))"
					>
						{tab.label}
					</li>
				{/each}
			</ul>
			<div class="grid-paper text-foreground relative rounded-[3px] px-8 py-12 md:px-12 md:py-16">
				<h1 class="text-5xl leading-[0.95] font-black tracking-[-0.03em] md:text-6xl">
					Welcome to Synapse
				</h1>
				<p class="mt-5 max-w-md text-lg">
					Take control of your life with our powerful second brain tools.
				</p>
				<div class="mt-8">
					<Button size="lg" class="px-6" onclick={handleSignIn}>Sign In</Button>
				</div>
			</div>
		</div>
	</main>
</div>
