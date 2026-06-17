<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Separator from '$lib/components/ui/separator';
	import {
		convertVisitThresholdFromDays,
		convertVisitThresholdToDays
	} from '$lib/utils/visit-status';
	import {
		CircleAlert,
		CircleCheck,
		Lock,
		Pencil,
		Save,
		SlidersHorizontal,
		User,
		X
	} from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type FormMessage =
		| string
		| {
				type?: string;
				text?: string;
		  }
		| null
		| undefined;

	function getMessageText(message: FormMessage): string {
		if (typeof message === 'string') {
			return message;
		}

		if (message && typeof message.text === 'string') {
			return message.text;
		}

		return '';
	}

	function isSuccessMessage(message: FormMessage): boolean {
		if (message && typeof message === 'object' && message.type === 'success') {
			return true;
		}

		return getMessageText(message).toLowerCase().includes('success');
	}

	// Profile form
	// svelte-ignore state_referenced_locally
	const profileFormStore = superForm(data.profileForm, {
		onUpdate: ({ form }) => {
			if (isSuccessMessage(form.message as FormMessage)) {
				isEditingProfile = false;
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
			if (isSuccessMessage(form.message as FormMessage)) {
				isEditingPassword = false;
			}
		}
	});

	const {
		form: passwordForm,
		errors: passwordErrors,
		message: passwordMessage,
		submitting: passwordSubmitting
	} = passwordFormStore;

	// Visit settings form
	// svelte-ignore state_referenced_locally
	const visitSettingsFormStore = superForm(data.visitSettingsForm, {
		onUpdate: ({ form }) => {
			if (isSuccessMessage(form.message as FormMessage)) {
				isEditingVisitSettings = false;
			}
		}
	});

	const {
		form: visitSettingsForm,
		errors: visitSettingsErrors,
		message: visitSettingsMessage,
		submitting: visitSettingsSubmitting
	} = visitSettingsFormStore;

	// Profile editing state
	let isEditingProfile = $state(false);
	let isEditingPassword = $state(false);
	let isEditingVisitSettings = $state(false);

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

	function setVisitSettingsUnit(nextUnit: 'days' | 'months') {
		const currentUnit = $visitSettingsForm.thresholdUnit;
		if (nextUnit === currentUnit) {
			return;
		}

		const recentToOverdueInDays = convertVisitThresholdToDays(
			Number($visitSettingsForm.recentToOverdueValue),
			currentUnit
		);
		const overdueToCriticalInDays = convertVisitThresholdToDays(
			Number($visitSettingsForm.overdueToCriticalValue),
			currentUnit
		);

		$visitSettingsForm.thresholdUnit = nextUnit;
		$visitSettingsForm.recentToOverdueValue = convertVisitThresholdFromDays(
			Number.isFinite(recentToOverdueInDays)
				? recentToOverdueInDays
				: data.visitThresholds.recentToOverdueDays,
			nextUnit
		);
		$visitSettingsForm.overdueToCriticalValue = convertVisitThresholdFromDays(
			Number.isFinite(overdueToCriticalInDays)
				? overdueToCriticalInDays
				: data.visitThresholds.overdueToCriticalDays,
			nextUnit
		);
	}

	function resetVisitSettingsForm() {
		$visitSettingsForm.thresholdUnit = 'days';
		$visitSettingsForm.recentToOverdueValue = data.visitThresholds.recentToOverdueDays;
		$visitSettingsForm.overdueToCriticalValue = data.visitThresholds.overdueToCriticalDays;
		isEditingVisitSettings = false;
	}

	const visitThresholdSummary = $derived.by(() => {
		const recentToOverdueInDays = convertVisitThresholdToDays(
			Number($visitSettingsForm.recentToOverdueValue),
			$visitSettingsForm.thresholdUnit
		);
		const overdueToCriticalInDays = convertVisitThresholdToDays(
			Number($visitSettingsForm.overdueToCriticalValue),
			$visitSettingsForm.thresholdUnit
		);

		return {
			recentToOverdueDays: Number.isFinite(recentToOverdueInDays)
				? recentToOverdueInDays
				: data.visitThresholds.recentToOverdueDays,
			overdueToCriticalDays: Number.isFinite(overdueToCriticalInDays)
				? overdueToCriticalInDays
				: data.visitThresholds.overdueToCriticalDays
		};
	});
</script>

<svelte:head><title>Profile</title></svelte:head>

<div class="px-4 py-6 sm:px-0">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Profile</h1>
		<p class="text-muted-foreground mt-2">Manage your account information and security settings</p>
	</div>

	<div class="space-y-6">
		<!-- Profile Information Section -->
		<div class="overflow-hidden rounded-lg border shadow">
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<User class="h-5 w-5" />
						<h2 class="text-xl font-semibold">Profile Information</h2>
					</div>
					{#if !isEditingProfile}
						<Button size="sm" variant="outline" onclick={() => (isEditingProfile = true)}>
							<Pencil class="mr-2 h-4 w-4" />
							Edit
						</Button>
					{/if}
				</div>

				<form method="POST" action="?/update">
					<div class="space-y-4">
						{#if $profileMessage}
							<div
								class="flex items-center gap-2 rounded-md p-3 {isSuccessMessage($profileMessage)
									? 'border border-green-200 bg-green-50 text-green-700'
									: 'border border-red-200 bg-red-50 text-red-700'}"
							>
								{#if isSuccessMessage($profileMessage)}
									<CircleCheck class="h-4 w-4" />
								{:else}
									<CircleAlert class="h-4 w-4" />
								{/if}
								<span class="text-sm">{getMessageText($profileMessage)}</span>
							</div>
						{/if}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<Label for="name" class="mb-2 block text-sm font-medium">Name</Label>
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
							<Label for="email" class="mb-2 block text-sm font-medium">Email Address</Label>
							<Input
								id="email"
								type="email"
								value={userEmail}
								disabled={true}
								placeholder="Email cannot be changed"
								class="bg-muted"
							/>
							<p class="text-muted-foreground mt-1 text-xs">Email address cannot be changed</p>
						</div>

						{#if isEditingProfile}
							<div class="flex gap-2 pt-4">
								<Button type="submit" size="sm" disabled={$profileSubmitting}>
									{#if $profileSubmitting}
										<div
											class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
										></div>
									{:else}
										<Save class="mr-2 h-4 w-4" />
									{/if}
									Save
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={resetProfileForm}
									disabled={$profileSubmitting}
								>
									<X class="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						{/if}
					</div>
				</form>
			</div>
		</div>

		<Separator.Root />

		<!-- Visit Settings Section -->
		<div class="overflow-hidden rounded-lg border shadow">
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<SlidersHorizontal class="h-5 w-5" />
						<h2 class="text-xl font-semibold">Settings</h2>
					</div>
					{#if !isEditingVisitSettings}
						<Button size="sm" variant="outline" onclick={() => (isEditingVisitSettings = true)}>
							<Pencil class="mr-2 h-4 w-4" />
							Edit
						</Button>
					{/if}
				</div>

				<form method="POST" action="?/updateVisitSettings">
					<div class="space-y-4">
						{#if $visitSettingsMessage}
							<div
								class="flex items-center gap-2 rounded-md p-3 {isSuccessMessage(
									$visitSettingsMessage
								)
									? 'border border-green-200 bg-green-50 text-green-700'
									: 'border border-red-200 bg-red-50 text-red-700'}"
							>
								{#if isSuccessMessage($visitSettingsMessage)}
									<CircleCheck class="h-4 w-4" />
								{:else}
									<CircleAlert class="h-4 w-4" />
								{/if}
								<span class="text-sm">{getMessageText($visitSettingsMessage)}</span>
							</div>
						{/if}

						{#if isEditingVisitSettings}
							<div class="space-y-4">
								<p class="text-muted-foreground text-sm">
									Customize when a person becomes overdue and critical based on days since the last
									visit.
								</p>

								<div class="flex items-center gap-2">
									<Label class="text-sm font-medium">Unit</Label>
									<div class="inline-flex rounded-md border p-1">
										<Button
											type="button"
											size="sm"
											variant={$visitSettingsForm.thresholdUnit === 'days' ? 'default' : 'ghost'}
											onclick={() => setVisitSettingsUnit('days')}
										>
											Days
										</Button>
										<Button
											type="button"
											size="sm"
											variant={$visitSettingsForm.thresholdUnit === 'months' ? 'default' : 'ghost'}
											onclick={() => setVisitSettingsUnit('months')}
										>
											Months
										</Button>
									</div>
									<input
										type="hidden"
										name="thresholdUnit"
										bind:value={$visitSettingsForm.thresholdUnit}
									/>
								</div>

								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<Label for="recentToOverdueValue" class="mb-2 block text-sm font-medium">
											Recent to Overdue ({$visitSettingsForm.thresholdUnit})
										</Label>
										<Input
											id="recentToOverdueValue"
											name="recentToOverdueValue"
											type="number"
											step={$visitSettingsForm.thresholdUnit === 'months' ? '0.01' : '1'}
											bind:value={$visitSettingsForm.recentToOverdueValue}
											class={$visitSettingsErrors.recentToOverdueValue ? 'border-red-400' : ''}
											required
										/>
										{#if $visitSettingsErrors.recentToOverdueValue}
											<p class="mt-1 text-sm text-red-600">
												{$visitSettingsErrors.recentToOverdueValue}
											</p>
										{/if}
									</div>

									<div>
										<Label for="overdueToCriticalValue" class="mb-2 block text-sm font-medium">
											Overdue to Critical ({$visitSettingsForm.thresholdUnit})
										</Label>
										<Input
											id="overdueToCriticalValue"
											name="overdueToCriticalValue"
											type="number"
											step={$visitSettingsForm.thresholdUnit === 'months' ? '0.01' : '1'}
											bind:value={$visitSettingsForm.overdueToCriticalValue}
											class={$visitSettingsErrors.overdueToCriticalValue ? 'border-red-400' : ''}
											required
										/>
										{#if $visitSettingsErrors.overdueToCriticalValue}
											<p class="mt-1 text-sm text-red-600">
												{$visitSettingsErrors.overdueToCriticalValue}
											</p>
										{/if}
									</div>
								</div>

								<p class="text-muted-foreground text-xs">
									Saved as {visitThresholdSummary.recentToOverdueDays} days and
									{visitThresholdSummary.overdueToCriticalDays} days.
								</p>

								<div class="flex gap-2 pt-2">
									<Button type="submit" size="sm" disabled={$visitSettingsSubmitting}>
										{#if $visitSettingsSubmitting}
											<div
												class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
											></div>
										{:else}
											<Save class="mr-2 h-4 w-4" />
										{/if}
										Save
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onclick={resetVisitSettingsForm}
										disabled={$visitSettingsSubmitting}
									>
										<X class="mr-2 h-4 w-4" />
										Cancel
									</Button>
								</div>
							</div>
						{:else}
							<div class="text-muted-foreground space-y-2 text-sm">
								<p>
									Recent to Overdue:
									<strong class="text-foreground ml-1">
										{data.visitThresholds.recentToOverdueDays} days (~{convertVisitThresholdFromDays(
											data.visitThresholds.recentToOverdueDays,
											'months'
										)} months)
									</strong>
								</p>
								<p>
									Overdue to Critical:
									<strong class="text-foreground ml-1">
										{data.visitThresholds.overdueToCriticalDays} days (~{convertVisitThresholdFromDays(
											data.visitThresholds.overdueToCriticalDays,
											'months'
										)} months)
									</strong>
								</p>
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
						<Lock class="h-5 w-5" />
						<h2 class="text-xl font-semibold">Change Password</h2>
					</div>
					{#if !isEditingPassword}
						<Button size="sm" variant="outline" onclick={() => (isEditingPassword = true)}>
							<Pencil class="mr-2 h-4 w-4" />
							Change Password
						</Button>
					{/if}
				</div>

				{#if isEditingPassword}
					<form method="POST" action="?/changePassword">
						<div class="space-y-4">
							{#if $passwordMessage}
								<div
									class="flex items-center gap-2 rounded-md p-3 {isSuccessMessage($passwordMessage)
										? 'border border-green-200 bg-green-50 text-green-700'
										: 'border border-red-200 bg-red-50 text-red-700'}"
								>
									{#if isSuccessMessage($passwordMessage)}
										<CircleCheck class="h-4 w-4" />
									{:else}
										<CircleAlert class="h-4 w-4" />
									{/if}
									<span class="text-sm">{getMessageText($passwordMessage)}</span>
								</div>
							{/if}
							<div>
								<Label for="currentPassword" class="mb-2 block text-sm font-medium">
									Current Password
								</Label>
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
								<Label for="newPassword" class="mb-2 block text-sm font-medium">New Password</Label>
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
								<Label for="confirmPassword" class="mb-2 block text-sm font-medium">
									Confirm New Password
								</Label>
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
											class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
										></div>
									{:else}
										<Save class="mr-2 h-4 w-4" />
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
									<X class="mr-2 h-4 w-4" />
									Cancel
								</Button>
							</div>
						</div>
					</form>
				{:else}
					<div class="text-muted-foreground text-sm">
						{#if passwordUpdatedAt}
							<p>Password was last updated on {new Date(passwordUpdatedAt).toLocaleDateString()}</p>
						{/if}
						<p class="mt-1">Click "Change Password" to update your password.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
