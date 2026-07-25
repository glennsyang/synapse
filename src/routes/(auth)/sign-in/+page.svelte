<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		Field,
		FieldDescription,
		FieldGroup,
		FieldLabel
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { superForm } from 'sveltekit-superforms';

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

<svelte:head><title>Sign In - Synapse</title></svelte:head>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header class="text-center">
		<Card.Title class="text-2xl">Welcome back</Card.Title>
		<Card.Description>Sign in to your account with email</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="space-y-6">
			{#if registered}
				<div
					class="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
				>
					Account created successfully! Please check your email to verify your account before
					signing in.
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
				<div
					class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					{$message}
				</div>
			{/if}
			<FieldGroup>
				<Field>
					<FieldLabel for="email">Email</FieldLabel>
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
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password">Password</FieldLabel>
						<a href="/forgot-password" class="ms-auto inline-block text-sm underline">
							Forgot your password?
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
				</Field>
				<Field>
					<Button type="submit" class="w-full" disabled={$submitting}>
						{#if $submitting}
							<Spinner class="mr-2 size-4" aria-label="Signing in" />
						{/if}
						{$submitting ? 'Signing in...' : 'Sign in'}
					</Button>
					<FieldDescription class="text-center">
						Don't have an account? <a href="/register">Sign up</a>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
