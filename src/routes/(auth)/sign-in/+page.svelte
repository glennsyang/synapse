<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		onUpdated: ({ form }) => {
			if (form.message) {
				// The error message will be displayed below
			}
		}
	});

	const registered = $derived(page.url.searchParams.get('registered') === 'true');
	const verified = $derived(page.url.searchParams.get('verified') === 'true');
	const reset = $derived(page.url.searchParams.get('reset') === 'true');
</script>

<svelte:head>
	<title>Sign In - Synapse</title>
</svelte:head>

<form method="POST" use:enhance class="space-y-6">
	<div class="mb-6 text-center">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
		<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Sign in to your account</p>
	</div>

	{#if registered}
		<div
			class="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
		>
			Account created successfully! Please check your email to verify your account before signing
			in.
		</div>
	{/if}

	{#if verified}
		<div
			class="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
		>
			Email verified successfully! You can now sign in.
		</div>
	{/if}

	{#if reset}
		<div
			class="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
		>
			Password reset successfully! You can now sign in with your new password.
		</div>
	{/if}

	{#if $message}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
			{$message}
		</div>
	{/if}

	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				bind:value={$form.email}
				placeholder="you@example.com"
				class={$errors.email ? 'border-red-500' : ''}
				required
			/>
			{#if $errors.email}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.email}</p>
			{/if}
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between">
				<Label for="password">Password</Label>
				<a href="/forgot-password" class="text-xs text-blue-600 hover:underline dark:text-blue-400">
					Forgot password?
				</a>
			</div>
			<Input
				id="password"
				name="password"
				type="password"
				bind:value={$form.password}
				placeholder="••••••••"
				class={$errors.password ? 'border-red-500' : ''}
				required
			/>
			{#if $errors.password}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.password}</p>
			{/if}
		</div>
	</div>

	<Button type="submit" class="w-full" disabled={$submitting}>
		{$submitting ? 'Signing in...' : 'Sign in'}
	</Button>
</form>
