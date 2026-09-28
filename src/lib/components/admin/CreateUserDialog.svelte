<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { USER_ROLES, type createUserSchema } from '$lib/schemas/admin-user';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	type CreateUserData = Infer<typeof createUserSchema>;

	let {
		formData,
		onAllowlistNeeded
	}: {
		formData: SuperValidated<CreateUserData>;
		onAllowlistNeeded?: (command: string) => void;
	} = $props();

	let open = $state(false);

	const roleLabels: Record<CreateUserData['role'], string> = { user: 'User', admin: 'Admin' };

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(formData, {
		id: 'createUser',
		resetForm: true,
		onUpdate: ({ form, result }) => {
			if (!form.valid) return;
			if (form.message?.type === 'success') {
				toast.success(form.message.text);
			} else if (form.message?.type === 'error') {
				toast.error(form.message.text);
			}
			// A server error (500) keeps the dialog open so the admin can retry.
			if (result.type === 'success') {
				open = false;
				const resultData = result.data as { allowlistCommand?: string } | undefined;
				if (resultData?.allowlistCommand) {
					onAllowlistNeeded?.(resultData.allowlistCommand);
				}
			}
		},
		onError: ({ result }) => {
			toast.error(`Failed to create user: ${result.error.message}`);
		}
	});
</script>

<Button type="button" onclick={() => (open = true)}>
	<UserPlusIcon class="size-4" />
	Add user
</Button>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add User</Dialog.Title>
			<Dialog.Description>
				They'll get a welcome email explaining how to set their own password.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/createUser" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="create-user-name">Name</Label>
					<Input
						id="create-user-name"
						name="name"
						bind:value={$form.name}
						class={$errors.name ? 'border-destructive' : ''}
						autocomplete="off"
					/>
					{#if $errors.name}
						<p class="text-destructive text-sm">{$errors.name}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="create-user-email">Email</Label>
					<Input
						id="create-user-email"
						name="email"
						type="email"
						bind:value={$form.email}
						class={$errors.email ? 'border-destructive' : ''}
						autocomplete="off"
					/>
					{#if $errors.email}
						<p class="text-destructive text-sm">{$errors.email}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="create-user-role">Role</Label>
					<Select.Root type="single" name="role" bind:value={$form.role}>
						<Select.Trigger id="create-user-role" class="w-full">
							{roleLabels[$form.role]}
						</Select.Trigger>
						<Select.Content>
							{#each USER_ROLES as role (role)}
								<Select.Item value={role} label={roleLabels[role]}>{roleLabels[role]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.role}
						<p class="text-destructive text-sm">{$errors.role}</p>
					{/if}
				</div>
				{#if $message?.type === 'error'}
					<p class="text-destructive text-sm">{$message.text}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Creating...' : 'Create user'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
