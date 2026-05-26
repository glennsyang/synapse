<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		Field,
		FieldDescription,
		FieldGroup,
		FieldLabel
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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
</script>

<svelte:head><title>Sign Up - Synapse</title></svelte:head>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header class="text-center">
		<Card.Title class="text-2xl">Create your account</Card.Title>
		<Card.Description>Get started with Synapse</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="space-y-6">
			{#if $message}
				<div
					class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					{$message}
				</div>
			{/if}

			<FieldGroup>
				<Field>
					<FieldLabel for="name">Name</FieldLabel>
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
				</Field>

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
					<FieldLabel for="password">Password</FieldLabel>
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
					<FieldLabel for="confirmPassword">Confirm Password</FieldLabel>
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
				</Field>
			</FieldGroup>

			<Field>
				<Button type="submit" class="w-full" disabled={$submitting}>
					{$submitting ? 'Creating account...' : 'Sign up'}
				</Button>
				<FieldDescription class="text-center">
					Already have an account? <a href="/sign-in">Sign in</a>
				</FieldDescription>
			</Field>
		</form>
	</Card.Content>
</Card.Root>
