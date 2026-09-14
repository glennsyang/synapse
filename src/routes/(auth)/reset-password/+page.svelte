<script lang="ts">
	import { FORGOT_PASSWORD_ROUTE, SIGN_IN_ROUTE } from '$lib/auth-routes';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { CircleXIcon } from '@lucide/svelte/icons';
	import { superForm } from 'sveltekit-superforms';

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
</script>

<svelte:head><title>Reset Password - Synapse</title></svelte:head>

{#if data.invalid}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="text-center">
			<div
				class="bg-destructive/10 mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full"
			>
				<CircleXIcon class="text-destructive h-8 w-8" />
			</div>
			<Card.Title class="text-2xl">Invalid or expired link</Card.Title>
			<Card.Description>
				This password reset link is no longer valid. Request a new one and we'll email it right
				over.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<FieldGroup>
				<Field>
					<Button href={FORGOT_PASSWORD_ROUTE} class="w-full">Request a new link</Button>
				</Field>
				<Field>
					<a href={SIGN_IN_ROUTE} class="text-center text-sm font-medium underline">
						Back to sign in
					</a>
				</Field>
			</FieldGroup>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-2xl">Reset your password</Card.Title>
			<Card.Description>Enter your new password below</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<AuthFormMessage message={$message} />

				<FieldGroup>
					<Field><Input type="hidden" name="token" bind:value={data.token} /></Field>

					<Field>
						<FieldLabel for="password">New Password</FieldLabel>
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
					</Field>

					<Field>
						<FieldLabel for="confirmPassword">Confirm New Password</FieldLabel>
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
					</Field>

					<Field>
						<Button type="submit" class="w-full" disabled={$submitting}>
							{#if $submitting}
								<Spinner class="mr-2 size-4" aria-label="Resetting password" />
							{/if}
							{$submitting ? 'Resetting password...' : 'Reset password'}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
