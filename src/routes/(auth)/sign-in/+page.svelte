<script lang="ts">
	import { page } from '$app/state';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
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

	const verified = $derived(page.url.searchParams.get('verified') === 'true');
</script>

<svelte:head><title>Sign In - Synapse</title></svelte:head>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header class="text-center">
		<Card.Title class="text-2xl">Welcome back</Card.Title>
		<Card.Description>Sign in to your account with email</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="space-y-6">
			{#if verified}
				<div
					class="bg-pen-fitness/12 text-pen-fitness dark:bg-pen-fitness/20 dark:text-pen-fitness rounded-lg p-4 text-sm"
				>
					Email verified successfully! You can now sign in.
				</div>
			{/if}
			{#if data.resetComplete}
				<div
					class="bg-pen-fitness/12 text-pen-fitness dark:bg-pen-fitness/20 dark:text-pen-fitness rounded-lg p-4 text-sm"
					role="status"
				>
					Password reset successfully! You can now sign in with your new password.
				</div>
			{/if}
			{#if data.invalidVerificationLink}
				<div
					class="bg-destructive/12 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-lg p-4 text-sm"
					role="alert"
				>
					That verification link is invalid or has expired. Please sign in or request a new one.
				</div>
			{/if}
			<AuthFormMessage message={$message} />
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
						class={$errors.email ? 'border-destructive' : ''}
						required
					/>
					{#if $errors.email}
						<p class="text-destructive dark:text-destructive mt-1 text-sm">{$errors.email}</p>
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
						class={$errors.password ? 'border-destructive' : ''}
						required
					/>
					{#if $errors.password}
						<p class="text-destructive dark:text-destructive mt-1 text-sm">{$errors.password}</p>
					{/if}
				</Field>
				<Field>
					<Button type="submit" class="w-full" disabled={$submitting}>
						{#if $submitting}
							<Spinner class="mr-2 size-4" aria-label="Signing in" />
						{/if}
						{$submitting ? 'Signing in...' : 'Sign in'}
					</Button>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
