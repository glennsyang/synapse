<script lang="ts">
	import type { Icon } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		items
	}: {
		items: {
			title: string;
			url?: string;
			icon?: Component<Icon>;
			items?: { title: string; url: string }[];
		}[];
	} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title}>
						{#snippet child({ props })}
							{@const IconComponent = item.icon}
							<a href={item.url} data-sveltekit-preload-data="hover" {...props}>
								<IconComponent />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
