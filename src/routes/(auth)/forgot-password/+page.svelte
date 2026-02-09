<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		Field,
		FieldDescription,
		FieldGroup,
		FieldLabel
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		onUpdated: ({ form }) => {
			if (form.message) {
				// The error message will be displayed below
			}
		}
	});

	let submitted = $state(false);
</script>

<svelte:head>
	<title>Forgot Password - Synapse</title>
</svelte:head>

{#if submitted}
	<div class="space-y-4 text-center">
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
		>
			<svg
				class="h-8 w-8 text-green-600 dark:text-green-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h2>
		<p class="text-sm text-slate-600 dark:text-slate-400">
			We've sent password reset instructions to your email address.
		</p>
		<a
			href="/sign-in"
			class="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
		>
			Back to sign in
		</a>
	</div>
{:else}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-2xl">Forgot your password?</Card.Title>
			<Card.Description>Enter your email to receive reset instructions</Card.Description>
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

					<Button type="submit" class="w-full" disabled={$submitting}>
						{$submitting ? 'Sending...' : 'Send reset link'}
					</Button>

					<FieldDescription class="text-center">
						<a href="/sign-in"> Back to Sign in </a>
					</FieldDescription>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
