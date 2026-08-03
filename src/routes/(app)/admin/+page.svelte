<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AdminArchivedPersonsTable from '$lib/components/admin/AdminArchivedPersonsTable.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const activeTab = $derived.by(() =>
		page.url.searchParams.get('tab') === 'archived-persons' ? 'archived-persons' : 'users'
	);

	async function switchTab(tab: string) {
		const url = new URL(page.url);
		if (tab === 'users') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}
		await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

<PageShell class="min-w-0 overflow-x-hidden">
	<div class="mb-4 sm:mb-5">
		<h1 class="font-display text-2xl font-bold sm:text-3xl">Admin</h1>
		<p class="text-muted-foreground text-sm sm:text-base">Manage users and archived contacts</p>
	</div>

	<Tabs.Root value={activeTab} class="w-full gap-3">
		<Tabs.List
			class="bg-muted/75 text-muted-foreground grid h-11 w-full grid-cols-2 rounded-xl p-1"
		>
			<Tabs.Trigger
				value="users"
				class="font-display border-b-2 border-transparent data-[state=active]:border-red-500"
				onclick={() => {
					if (activeTab !== 'users') void switchTab('users');
				}}
			>
				Users
			</Tabs.Trigger>
			<Tabs.Trigger
				value="archived-persons"
				class="font-display border-b-2 border-transparent data-[state=active]:border-red-500"
				onclick={() => {
					if (activeTab !== 'archived-persons') void switchTab('archived-persons');
				}}
			>
				Archived Persons
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="users" class="mt-0 w-full space-y-4">
			<AdminUsersTable users={data.users} />
		</Tabs.Content>

		<Tabs.Content value="archived-persons" class="mt-0 w-full space-y-4">
			<AdminArchivedPersonsTable people={data.archivedPeople} />
		</Tabs.Content>
	</Tabs.Root>
</PageShell>
