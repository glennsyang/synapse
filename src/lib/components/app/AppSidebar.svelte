<script lang="ts">
	import { Brain } from '@lucide/svelte/icons';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { SidebarNav, User } from '$lib/types';

	import NavMain from './NavMain.svelte';
	import NavUser from './NavUser.svelte';

	interface Props {
		user: User;
		navItems: SidebarNav;
	}

	let { user, navItems, ...restProps }: Props = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="data-[slot=sidebar-menu-button]:p-1.5!">
					{#snippet child({ props })}
						<a href="/" data-sveltekit-preload-data="hover" {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<Brain class="size-5!" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-display font-extrabold">Synapse</span>
								<span class="text-xs">Your Second Brain</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content> <NavMain items={navItems.navMain} /> </Sidebar.Content>
	<Sidebar.Footer> <NavUser {user} /> </Sidebar.Footer>
</Sidebar.Root>
