<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { SIGN_OUT_ROUTE } from '$lib/auth-routes';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { User } from '$lib/types';
	import { CircleUserIcon, LogOutIcon, Shield } from '@lucide/svelte';

	interface Props {
		user: User;
		/** Show the Admin link here (mobile, where it has no tab). */
		showAdmin?: boolean;
		side?: 'right' | 'bottom';
		class?: string;
	}

	let { user, showAdmin = false, side = 'right', class: className = '' }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="text-foreground grid size-9 place-items-center rounded-full text-sm font-black focus-visible:outline-2 {className}"
		aria-label="Account menu"
	>
		{user?.name?.[0] || '?'}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-60" {side} align="end" sideOffset={8}>
		<DropdownMenu.Label class="px-2 py-2 font-normal">
			<span class="block truncate text-sm font-bold">{user?.name || ''}</span>
			<span class="text-muted-foreground block truncate text-xs">{user.email}</span>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => goto('/profile')}>
			<CircleUserIcon />
			Profile
		</DropdownMenu.Item>
		{#if showAdmin && user.role === 'admin'}
			<DropdownMenu.Item onclick={() => goto('/admin')}>
				<Shield />
				Admin
			</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Separator />
		<form method="POST" action={SIGN_OUT_ROUTE} use:enhance id="logout-form-{side}"></form>
		<DropdownMenu.Item
			onclick={() => {
				const form = document.getElementById(`logout-form-${side}`) as HTMLFormElement;
				form?.requestSubmit();
			}}
		>
			<LogOutIcon />
			Logout
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
