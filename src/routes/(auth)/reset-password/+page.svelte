<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		onUpdated: ({ form }) => {
			if (form.message) {
				// The error message will be displayed below
			}
		}
	});

	const token = $derived(() => page.url.searchParams.get('token'));
	const hasToken = $derived(() => !!token);
</script>

<svelte:head>
	<title>Reset Password - Synapse</title>
</svelte:head>

{#if !hasToken}
	<div class="space-y-4 text-center">
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
		>
			<svg
				class="h-8 w-8 text-red-600 dark:text-red-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</div>
		<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Invalid reset link</h2>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			This password reset link is invalid or has expired.
		</p>
		<a
			href="/forgot-password"
			class="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
		>
			Request a new reset link
		</a>
	</div>
{:else}
	<form method="POST" use:enhance class="space-y-6">
		<div class="mb-6 text-center">
			<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h2>
			<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Enter your new password below</p>
		</div>

		{#if $message}
			<div
				class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
			>
				{$message}
			</div>
		{/if}

		<input type="hidden" name="token" bind:value={data.token} />

		<div class="space-y-4">
			<div>
				<Label for="password">New Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					bind:value={$form.password}
					placeholder="••••••••"
					class={$errors.password ? 'border-red-500' : ''}
					required
				/>
				{#if $errors.password}
					<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.password}</p>
				{/if}
			</div>

			<div>
				<Label for="confirmPassword">Confirm New Password</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					bind:value={$form.confirmPassword}
					placeholder="••••••••"
					class={$errors.confirmPassword ? 'border-red-500' : ''}
					required
					autocomplete="new-password"
				/>
				{#if $errors.confirmPassword}
					<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.confirmPassword}</p>
				{/if}
			</div>
		</div>

		<Button type="submit" class="w-full" disabled={$submitting}>
			{$submitting ? 'Resetting password...' : 'Reset password'}
		</Button>
	</form>
{/if}
