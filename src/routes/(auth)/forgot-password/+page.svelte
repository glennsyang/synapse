<script lang="ts">
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
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

	let submitted = $state(false);
</script>

<svelte:head><title>Forgot Password - Synapse</title></svelte:head>

{#if submitted}
	<div class="space-y-4 text-center">
		<div
			class="bg-pen-fitness/12 dark:bg-pen-fitness/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full"
		>
			<svg
				class="text-pen-fitness dark:text-pen-fitness h-8 w-8"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<title>Email sent</title>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h2 class="text-foreground text-2xl font-bold dark:text-white">Check your email</h2>
		<p class="text-muted-foreground dark:text-muted-foreground text-sm">
			We've sent password reset instructions to your email address.
		</p>
		<a
			href="/sign-in"
			class="text-pen-journal dark:text-pen-journal mt-4 inline-block text-sm hover:underline"
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

					<Button type="submit" class="w-full" disabled={$submitting}>
						{#if $submitting}
							<Spinner class="mr-2 size-4" aria-label="Sending reset link" />
						{/if}
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
