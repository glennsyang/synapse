<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { API_SCOPES, type ApiScope } from '$lib/api-scopes';
	import AdminApiKeysTable from '$lib/components/admin/AdminApiKeysTable.svelte';
	import AdminArchivedPersonsTable from '$lib/components/admin/AdminArchivedPersonsTable.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const activeTab = $derived.by(() => {
		const tab = page.url.searchParams.get('tab');
		return tab === 'archived-persons' || tab === 'api-keys' ? tab : 'users';
	});

	async function switchTab(tab: string) {
		const url = new URL(page.url);
		if (tab === 'users') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}
		await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	let revealedKey = $state<string | null>(null);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(data.createApiKeyForm, {
		id: 'createApiKey',
		dataType: 'json',
		resetForm: true,
		onUpdate: ({ form, result }) => {
			if (form.message?.type === 'success') {
				toast.success(form.message.text);
				const resultData = result.data as { apiKey?: string } | undefined;
				revealedKey = resultData?.apiKey ?? null;
			} else if (form.message?.type === 'error') {
				toast.error(form.message.text);
			}
		},
		onError: ({ result }) => {
			toast.error(`Failed to create API key: ${result.error.message}`);
		}
	});

	function toggleScope(scope: ApiScope, checked: boolean) {
		if (checked) {
			if (!$form.scopes.includes(scope)) {
				$form.scopes = [...$form.scopes, scope];
			}
		} else {
			$form.scopes = $form.scopes.filter((s) => s !== scope);
		}
	}

	async function copyRevealedKey() {
		if (!revealedKey) return;
		await navigator.clipboard.writeText(revealedKey);
		toast.success('Copied to clipboard.');
	}
</script>

<PageShell class="min-w-0 overflow-x-hidden">
	<div class="mb-4 sm:mb-5">
		<h1 class="font-display text-2xl font-bold sm:text-3xl">Admin</h1>
		<p class="text-muted-foreground text-sm sm:text-base">
			Manage users, archived contacts, and API keys
		</p>
	</div>

	<Tabs.Root value={activeTab} class="w-full gap-3">
		<Tabs.List
			class="bg-muted/75 text-muted-foreground grid h-11 w-full grid-cols-3 rounded-xl p-1"
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
			<Tabs.Trigger
				value="api-keys"
				class="font-display border-b-2 border-transparent data-[state=active]:border-red-500"
				onclick={() => {
					if (activeTab !== 'api-keys') void switchTab('api-keys');
				}}
			>
				API Keys
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="users" class="mt-0 w-full space-y-4">
			<AdminUsersTable users={data.users} />
		</Tabs.Content>

		<Tabs.Content value="archived-persons" class="mt-0 w-full space-y-4">
			<AdminArchivedPersonsTable people={data.archivedPeople} />
		</Tabs.Content>

		<Tabs.Content value="api-keys" class="mt-0 w-full space-y-4">
			<p class="text-muted-foreground text-sm">
				Keys for external tools (e.g. scripts or assistants) to drive Synapse via the
				<code class="bg-muted rounded px-1 py-0.5">/api/v1</code> API.
			</p>

			{#if revealedKey}
				<Card class="border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950">
					<CardHeader>
						<CardTitle class="text-amber-900 dark:text-amber-200">
							Copy your new API key now
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<p class="text-sm text-amber-900 dark:text-amber-200">
							This is the only time this key will be shown. Store it somewhere safe.
						</p>
						<div class="flex gap-2">
							<Input
								readonly
								value={revealedKey}
								class="border-amber-300 bg-white font-mono text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-900 dark:text-amber-100"
							/>
							<Button type="button" variant="outline" onclick={copyRevealedKey}>
								<CopyIcon class="size-4" />
								Copy
							</Button>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="text-amber-900 dark:text-amber-200"
							onclick={() => (revealedKey = null)}
						>
							Done
						</Button>
					</CardContent>
				</Card>
			{/if}

			<Card>
				<CardHeader>
					<CardTitle>Create a new key</CardTitle>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/createApiKey" use:enhance class="space-y-4">
						<div>
							<Label for="key-name" class="mb-2 block">Name</Label>
							<Input
								id="key-name"
								name="name"
								bind:value={$form.name}
								placeholder="e.g. Personal assistant, script, etc."
								class={$errors.name ? 'border-destructive' : ''}
							/>
							{#if $errors.name}
								<p class="text-destructive mt-1 text-sm">{$errors.name}</p>
							{/if}
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium">Scopes</span>
							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{#each API_SCOPES as scope (scope)}
									<label class="flex items-center gap-2 text-sm">
										<Checkbox
											checked={$form.scopes.includes(scope)}
											onCheckedChange={(checked) => toggleScope(scope, Boolean(checked))}
										/>
										{scope}
									</label>
								{/each}
							</div>
							{#if $errors.scopes}
								<p class="text-destructive mt-1 text-sm">{$errors.scopes}</p>
							{/if}
						</div>

						<div>
							<Label for="key-expires" class="mb-2 block">Expires in (days, optional)</Label>
							<Input
								id="key-expires"
								name="expiresInDays"
								type="number"
								min="1"
								max="365"
								bind:value={$form.expiresInDays}
								placeholder="Never expires"
								class="max-w-40"
							/>
						</div>

						<Button type="submit" disabled={$submitting}>
							{$submitting ? 'Creating...' : 'Create key'}
						</Button>
					</form>
				</CardContent>
			</Card>

			<AdminApiKeysTable apiKeys={data.apiKeys} />
		</Tabs.Content>
	</Tabs.Root>
</PageShell>
