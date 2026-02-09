<script lang="ts">
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import EditIcon from '@lucide/svelte/icons/edit';
	import LockIcon from '@lucide/svelte/icons/lock';
	import SaveIcon from '@lucide/svelte/icons/save';
	import UserIcon from '@lucide/svelte/icons/user';
	import XIcon from '@lucide/svelte/icons/x';
	import { superForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Separator from '$lib/components/ui/separator';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Profile form
	// svelte-ignore state_referenced_locally
	const profileFormStore = superForm(data.profileForm, {
		onUpdate: ({ form }) => {
			if (form.message) {
				// Reset editing state on success
				if (form.message.includes('successfully')) {
					isEditingProfile = false;
				}
			}
		}
	});

	const {
		form: profileForm,
		errors: profileErrors,
		message: profileMessage,
		submitting: profileSubmitting
	} = profileFormStore;

	// Password form
	// svelte-ignore state_referenced_locally
	const passwordFormStore = superForm(data.passwordForm, {
		resetForm: true,
		onUpdate: ({ form }) => {
			if (form.message) {
				// Reset editing state and form on success
				if (form.message.includes('successfully')) {
					isEditingPassword = false;
				}
			}
		}
	});

	const {
		form: passwordForm,
		errors: passwordErrors,
		message: passwordMessage,
		submitting: passwordSubmitting
	} = passwordFormStore;

	// Profile editing state
	let isEditingProfile = $state(false);
	let isEditingPassword = $state(false);

	// Derived values from data
	const userEmail = $derived(data.user?.email || '');
	const passwordUpdatedAt = $derived(data.passwordUpdatedAt || '');

	// Reset profile form
	function resetProfileForm() {
		$profileForm.name = data.user?.name || '';
		isEditingProfile = false;
	}

	// Reset password form
	function resetPasswordForm() {
		$passwordForm.currentPassword = '';
		$passwordForm.newPassword = '';
		$passwordForm.confirmPassword = '';
		isEditingPassword = false;
	}
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
		<p class="mt-2 text-muted-foreground">Manage your account information and security settings</p>
	</div>

	<div class="space-y-6">
		<!-- Profile Information Section -->
		<div class="overflow-hidden rounded-lg border shadow">
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<UserIcon class="h-5 w-5" />
						<h2 class="text-xl font-semibold">Profile Information</h2>
					</div>
					{#if !isEditingProfile}
						<Button size="sm" variant="outline" onclick={() => (isEditingProfile = true)}>
							<EditIcon class="mr-2 h-4 w-4" />
							Edit
						</Button>
					{/if}
				</div>

				<form method="POST" action="?/update">
					<div class="space-y-4">
						{#if $profileMessage}
							<div
								class="flex items-center gap-2 rounded-md p-3 {$profileMessage.includes(
									'successfully'
								)
									? 'border border-green-200 bg-green-50 text-green-700'
									: 'border border-red-200 bg-red-50 text-red-700'}"
							>
								{#if $profileMessage.includes('successfully')}
									<CheckCircleIcon class="h-4 w-4" />
								{:else}
									<AlertCircleIcon class="h-4 w-4" />
								{/if}
								<span class="text-sm">{$profileMessage}</span>
							</div>
						{/if}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="name" class="mb-2 block text-sm font-medium"> Name </label>
								<Input
									id="name"
									name="name"
									type="text"
									bind:value={$profileForm.name}
									disabled={!isEditingProfile}
									placeholder="Enter your first name"
									class={$profileErrors.name ? 'border-red-400' : ''}
								/>
								{#if $profileErrors.name}
									<p class="mt-1 text-sm text-red-600">{$profileErrors.name}</p>
								{/if}
							</div>
						</div>

						<div>
							<label for="email" class="mb-2 block text-sm font-medium"> Email Address </label>
							<Input
								id="email"
								type="email"
								value={userEmail}
								disabled={true}
								placeholder="Email cannot be changed"
								class="bg-muted"
							/>
							<p class="mt-1 text-xs text-muted-foreground">Email address cannot be changed</p>
						</div>

						{#if isEditingProfile}
							<div class="flex gap-2 pt-4">
								<Button type="submit" size="sm" disabled={$profileSubmitting}>
									{#if $profileSubmitting}
										<div
											class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
										></div>
									{:else}
										<SaveIcon class="mr-2 h-4 w-4" />
									{/if}
									Save Changes
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={resetProfileForm}
									disabled={$profileSubmitting}
								>
									<XIcon class="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						{/if}
					</div>
				</form>
			</div>
		</div>

		<Separator.Root />

		<!-- Password Change Section -->
		<div class="overflow-hidden rounded-lg border shadow">
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<LockIcon class="h-5 w-5" />
						<h2 class="text-xl font-semibold">Change Password</h2>
					</div>
					{#if !isEditingPassword}
						<Button size="sm" variant="outline" onclick={() => (isEditingPassword = true)}>
							<EditIcon class="mr-2 h-4 w-4" />
							Change Password
						</Button>
					{/if}
				</div>

				{#if isEditingPassword}
					<form method="POST" action="?/changePassword">
						<div class="space-y-4">
							{#if $passwordMessage}
								<div
									class="flex items-center gap-2 rounded-md p-3 {$passwordMessage.includes(
										'successfully'
									)
										? 'border border-green-200 bg-green-50 text-green-700'
										: 'border border-red-200 bg-red-50 text-red-700'}"
								>
									{#if $passwordMessage.includes('successfully')}
										<CheckCircleIcon class="h-4 w-4" />
									{:else}
										<AlertCircleIcon class="h-4 w-4" />
									{/if}
									<span class="text-sm">{$passwordMessage}</span>
								</div>
							{/if}
							<div>
								<label for="currentPassword" class="mb-2 block text-sm font-medium">
									Current Password
								</label>
								<Input
									id="currentPassword"
									name="currentPassword"
									type="password"
									bind:value={$passwordForm.currentPassword}
									placeholder="Enter your current password"
									class={$passwordErrors.currentPassword ? 'border-red-400' : ''}
									required
								/>
								{#if $passwordErrors.currentPassword}
									<p class="mt-1 text-sm text-red-600">{$passwordErrors.currentPassword}</p>
								{/if}
							</div>

							<div>
								<label for="newPassword" class="mb-2 block text-sm font-medium">
									New Password
								</label>
								<Input
									id="newPassword"
									name="newPassword"
									type="password"
									bind:value={$passwordForm.newPassword}
									placeholder="Enter your new password"
									class={$passwordErrors.newPassword ? 'border-red-400' : ''}
									required
								/>
								{#if $passwordErrors.newPassword}
									<p class="mt-1 text-sm text-red-600">{$passwordErrors.newPassword}</p>
								{/if}
							</div>

							<div>
								<label for="confirmPassword" class="mb-2 block text-sm font-medium">
									Confirm New Password
								</label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									bind:value={$passwordForm.confirmPassword}
									placeholder="Confirm your new password"
									class={$passwordErrors.confirmPassword ? 'border-red-400' : ''}
									required
								/>
								{#if $passwordErrors.confirmPassword}
									<p class="mt-1 text-sm text-red-600">{$passwordErrors.confirmPassword}</p>
								{/if}
							</div>

							<div class="flex gap-2 pt-4">
								<Button type="submit" size="sm" disabled={$passwordSubmitting}>
									{#if $passwordSubmitting}
										<div
											class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
										></div>
									{:else}
										<SaveIcon class="mr-2 h-4 w-4" />
									{/if}
									Change Password
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={resetPasswordForm}
									disabled={$passwordSubmitting}
								>
									<XIcon class="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						</div>
					</form>
				{:else}
					<div class="text-sm text-muted-foreground">
						{#if passwordUpdatedAt}
							<p>
								Password was last updated on {new Date(passwordUpdatedAt).toLocaleDateString()}
							</p>
						{/if}
						<p class="mt-1">Click "Change Password" to update your password.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
