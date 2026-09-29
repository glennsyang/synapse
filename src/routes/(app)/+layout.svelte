<script lang="ts">
	import IndexTabs from '$lib/components/app/IndexTabs.svelte';
	import MobileTabs from '$lib/components/app/MobileTabs.svelte';
	import RunningHead from '$lib/components/app/RunningHead.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import { navItems } from './sidebar';

	import '../../app.css';

	let { data, children } = $props();

	const filteredNavItems = $derived(
		navItems.navMain.filter((item) => !item.adminOnly || data.user?.role === 'admin')
	);
</script>

<Toaster position="bottom-right" richColors />
<Tooltip.Provider>
	{#if data.user}
		<div class="flex min-h-dvh">
			<IndexTabs items={filteredNavItems} />
			<!-- The sheet: one page of grid paper bound into the cover. -->
			<div
				class="grid-paper flex min-w-0 flex-1 flex-col pb-20 md:my-2.5 md:mr-2.5 md:rounded-[3px] md:pb-0"
			>
				<RunningHead items={filteredNavItems} user={data.user} />
				<main class="flex min-w-0 flex-1 flex-col px-4 py-5 md:px-8 md:py-7">
					{@render children()}
				</main>
			</div>
		</div>
		<MobileTabs items={filteredNavItems} />
	{/if}
</Tooltip.Provider>
