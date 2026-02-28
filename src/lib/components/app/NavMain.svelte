<script lang="ts">
import type { Component } from 'svelte';

import { page } from '$app/state';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';

let {
	items
}: {
	items: {
		title: string;
		url?: string;
		icon?: Component;
		items?: { title: string; url: string }[];
		color?: string;
	}[];
} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={item.url ? page.url.pathname.startsWith(item.url) : false}
						size="lg"
					>
						{#snippet child({ props })}
							{@const IconComponent = item.icon}
							<a href={item.url} data-sveltekit-preload-data="hover" {...props}>
								<span class={item.color}> <IconComponent size="24" class={item.color} /> </span>
								<span class={`${item.color} font-display text-lg font-semibold md:text-xl`}>
									{item.title}
								</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
