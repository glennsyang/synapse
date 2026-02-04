<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

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
</script>

<svelte:head>
	<title>Sign Up - Synapse</title>
</svelte:head>

<form method="POST" use:enhance class="space-y-6">
	<div class="mb-6 text-center">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h2>
		<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Get started with Synapse</p>
	</div>

	{#if $message}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
			{$message}
		</div>
	{/if}

	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="name">Name</Label>
			<Input
				id="name"
				name="name"
				type="text"
				bind:value={$form.name}
				placeholder="John Doe"
				class={$errors.name ? 'border-red-500' : ''}
				required
			/>
			{#if $errors.name}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.name}</p>
			{/if}
		</div>

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

		<div class="space-y-2">
			<Label for="password">Password</Label>
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

		<div class="space-y-2">
			<Label for="confirmPassword">Confirm Password</Label>
			<Input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				bind:value={$form.confirmPassword}
				placeholder="••••••••"
				class={$errors.confirmPassword ? 'border-red-500' : ''}
				required
			/>
			{#if $errors.confirmPassword}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{$errors.confirmPassword}</p>
			{/if}
		</div>
	</div>

	<Button type="submit" class="w-full" disabled={$submitting}>
		{$submitting ? 'Creating account...' : 'Sign up'}
	</Button>
</form>
