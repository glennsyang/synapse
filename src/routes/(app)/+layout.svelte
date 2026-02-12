<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	import AppSidebar from '$lib/components/app/AppSidebar.svelte';
	import SiteHeader from '$lib/components/app/SiteHeader.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import { navItems } from './sidebar';

	import '../../app.css';

	let { data, children } = $props();
</script>

<ModeWatcher />
<Toaster position="bottom-right" richColors />
<Tooltip.Provider>
	<Sidebar.Provider style="--header-height: calc(var(--spacing) * 12);">
		{#if data.user}
			<AppSidebar {navItems} user={data.user} />
			<Sidebar.Inset>
				<SiteHeader />
				<main class="flex flex-1 flex-col space-y-4 p-4 md:py-2">
					{@render children()}
				</main>
			</Sidebar.Inset>
		{/if}
	</Sidebar.Provider>
</Tooltip.Provider>
