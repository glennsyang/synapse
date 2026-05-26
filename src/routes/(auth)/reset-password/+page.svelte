<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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

	const token = $derived(() => page.url.searchParams.get('token'));
	const hasToken = $derived(() => !!token);
</script>

<svelte:head><title>Reset Password - Synapse</title></svelte:head>

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
				<title>Invalid reset link</title>
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
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="text-center">
			<Card.Title class="text-2xl">Reset your password</Card.Title>
			<Card.Description>Enter your new password below</Card.Description>
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
							{$submitting ? 'Resetting password...' : 'Reset password'}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
