<script lang="ts">
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { personSchema, visitSchema } from '$lib/schemas/visits';
	import { formatDateLong, formatDateShort } from '$lib/utils/date';
	import { getStatusLabel } from '$lib/utils/visit-status';
	import { Archive, ArrowLeft, Calendar, Pencil, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showLogVisitDialog = $state(false);
	let showEditPersonDialog = $state(false);
	let showArchivePersonDialog = $state(false);
	let showDeletePersonDialog = $state(false);
	let editingVisitId = $state<string | null>(null);
	let visitToDelete = $state<string | null>(null);

	let visitFormState = $derived(
		superForm(data.visitForm, {
			validators: zod4(visitSchema),
			resetForm: true,
			onUpdated({ form }) {
				if (form.message) {
					if (form.message.type === 'success') {
						toast.success(form.message.text);
						showLogVisitDialog = false;
						editingVisitId = null;
					} else if (form.message.type === 'error') {
						toast.error(form.message.text);
					}
				}
			}
		})
	);

	let editFormState = $derived(
		superForm(data.editForm, {
			validators: zod4(personSchema),
			onUpdated({ form }) {
				if (form.message) {
					if (form.message.type === 'success') {
						toast.success(form.message.text);
						showEditPersonDialog = false;
					} else if (form.message.type === 'error') {
						toast.error(form.message.text);
					}
				}
			}
		})
	);

	const {
		form: visitForm,
		errors: visitErrors,
		enhance: visitEnhance,
		submitting: visitSubmitting
	} = $derived(visitFormState);

	const {
		form: editForm,
		errors: editErrors,
		enhance: editEnhance,
		submitting: editSubmitting
	} = $derived(editFormState);

	const isEditingVisit = $derived(editingVisitId !== null);

	function openLogVisitDialogForCreate() {
		editingVisitId = null;
		$visitForm.date = data.visitForm.data.date ?? '';
		$visitForm.time = '';
		$visitForm.companions = '';
		$visitForm.notes = '';
		$visitForm.followUpDate = '';
		showLogVisitDialog = true;
	}

	function openLogVisitDialogForEdit(visit: PageData['visits'][number]) {
		editingVisitId = visit.id;
		$visitForm.date = visit.date;
		$visitForm.time = visit.time ?? '';
		$visitForm.companions = visit.companions?.join(', ') ?? '';
		$visitForm.notes = visit.notes ?? '';
		$visitForm.followUpDate = visit.followUpDate ?? '';
		showLogVisitDialog = true;
	}

	function closeLogVisitDialog() {
		showLogVisitDialog = false;
		editingVisitId = null;
	}

	const statusBadge: Record<string, string> = {
		green: 'bg-green-100 text-green-800',
		yellow: 'bg-yellow-100 text-yellow-800',
		red: 'bg-red-100 text-red-800',
		scheduled: 'bg-purple-100 text-purple-800',
		exempt: 'bg-gray-100 text-gray-800'
	};

	function formatTime(timeString: string): string {
		const [hours, minutes] = timeString.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const hour12 = hours % 12 || 12;
		return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	function formatTimeSince(days: number): string {
		if (days < 30) {
			return `${days} day${days !== 1 ? 's' : ''} ago`;
		}
		const months = Math.floor(days / 30);
		return `${months} month${months !== 1 ? 's' : ''} ago`;
	}

	function getEditStatusDescription(isExempt: boolean): string {
		return isExempt
			? 'This person is exempt from yellow/critical visit warnings when no scheduled follow-up is set.'
			: 'This person will follow normal yellow/critical visit warning rules.';
	}
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<Button variant="ghost" href="/visits" class="mb-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Visits
		</Button>

		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold">{data.person.name}</h1>
				<div class="mt-2 flex items-center gap-2">
					<span
						class="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold {statusBadge[
							data.person.status
						] ?? 'bg-gray-100 text-gray-800'}"
					>
						{getStatusLabel(data.person.status)}
					</span>
					{#if data.person.daysSinceLastVisit !== null}
						<span class="text-muted-foreground text-sm">
							Last visit: {formatTimeSince(data.person.daysSinceLastVisit)}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								aria-label="Log Visit"
								onclick={openLogVisitDialogForCreate}
							>
								<Calendar class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Log Visit</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								variant="outline"
								aria-label="Edit Person"
								onclick={() => (showEditPersonDialog = true)}
							>
								<Pencil class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Edit</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								variant="secondary"
								aria-label="Archive Person"
								onclick={() => (showArchivePersonDialog = true)}
							>
								<Archive class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Archive</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								variant="destructive"
								aria-label="Delete Person"
								onclick={() => (showDeletePersonDialog = true)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Delete</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>
	</div>

	<!-- Visit History -->
	<div>
		<h2 class="mb-4 text-2xl font-semibold">Visit History</h2>

		{#if data.visits.length === 0}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<p class="text-muted-foreground mb-4">No visits logged yet.</p>
					<Button onclick={openLogVisitDialogForCreate}>Log First Visit</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-4">
				{#each data.visits as visit (visit.id)}
					<Card.Root>
						<Card.Content>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="mb-2 flex items-center gap-4">
										<p class="font-semibold">{formatDateLong(visit.date)}</p>
										{#if visit.time}
											<span class="text-muted-foreground text-sm">{formatTime(visit.time)}</span>
										{/if}
									</div>

									{#if visit.companions && visit.companions.length > 0}
										<p class="text-muted-foreground text-sm">With: {visit.companions.join(', ')}</p>
									{/if}

									{#if visit.notes}
										<p class="text-muted-foreground mt-2 text-sm">Notes: {visit.notes}</p>
									{/if}

									{#if visit.followUpDate}
										<p class="text-muted-foreground mt-2 text-sm">
											Follow-up: {formatDateShort(visit.followUpDate)}
										</p>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													size="icon"
													variant="outline"
													aria-label="Edit Visit"
													onclick={() => openLogVisitDialogForEdit(visit)}
												>
													<Pencil class="h-4 w-4" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Edit</Tooltip.Content>
									</Tooltip.Root>

									<form method="POST" action="?/deleteVisit">
										<Input type="hidden" name="visitId" value={visit.id} />

										<Tooltip.Root>
											<Tooltip.Trigger>
												{#snippet child({ props })}
													<Button
														{...props}
														size="icon"
														type="button"
														variant="destructive"
														aria-label="Delete Visit"
														onclick={() => (visitToDelete = visit.id)}
													>
														<Trash2 class="h-4 w-4" />
													</Button>
												{/snippet}
											</Tooltip.Trigger>
											<Tooltip.Content>Delete</Tooltip.Content>
										</Tooltip.Root>
									</form>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Log Visit Dialog -->
<Dialog.Root bind:open={showLogVisitDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{isEditingVisit ? 'Edit Visit' : 'Log Visit'}</Dialog.Title>
			<Dialog.Description>
				{isEditingVisit
					? `Update visit details with ${data.person.name}`
					: `Record a visit with ${data.person.name}`}
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action={isEditingVisit ? '?/updateVisit' : '?/logVisit'} use:visitEnhance>
			{#if editingVisitId}
				<Input type="hidden" name="visitId" value={editingVisitId} />
			{/if}
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="date">Date*</Label>
					<Input
						id="date"
						name="date"
						type="date"
						bind:value={$visitForm.date}
						required
						aria-invalid={$visitErrors.date ? 'true' : undefined}
					/>
					{#if $visitErrors.date}
						<p class="text-destructive mt-1 text-sm">{$visitErrors.date}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="time">Time</Label>
					<Input
						id="time"
						name="time"
						type="time"
						bind:value={$visitForm.time}
						aria-invalid={$visitErrors.time ? 'true' : undefined}
					/>
					{#if $visitErrors.time}
						<p class="text-destructive mt-1 text-sm">{$visitErrors.time}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="companions">Companions</Label>
					<Input
						id="companions"
						name="companions"
						type="text"
						bind:value={$visitForm.companions}
						placeholder="Alice, Bob (comma-separated)"
						aria-invalid={$visitErrors.companions ? 'true' : undefined}
					/>
					{#if $visitErrors.companions}
						<p class="text-destructive mt-1 text-sm">{$visitErrors.companions}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="notes">Notes</Label>
					<Textarea
						id="notes"
						name="notes"
						bind:value={$visitForm.notes}
						placeholder="Any notes about the visit"
						rows={3}
					/>
				</div>

				<div class="space-y-2">
					<Label for="followUpDate">Follow-up Date</Label>
					<Input
						id="followUpDate"
						name="followUpDate"
						type="date"
						bind:value={$visitForm.followUpDate}
						aria-invalid={$visitErrors.followUpDate ? 'true' : undefined}
					/>
					{#if $visitErrors.followUpDate}
						<p class="text-destructive mt-1 text-sm">{$visitErrors.followUpDate}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={closeLogVisitDialog}>Cancel</Button>
					<Button type="submit" disabled={$visitSubmitting}>
						{$visitSubmitting
							? isEditingVisit
								? 'Saving...'
								: 'Logging...'
							: isEditingVisit
								? 'Save'
								: 'Log Visit'}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Person Dialog -->
<Dialog.Root bind:open={showEditPersonDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Person</Dialog.Title>
			<Dialog.Description>Update person's name</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/updatePerson" use:editEnhance>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="edit-name">Name*</Label>
					<Input
						id="edit-name"
						name="name"
						type="text"
						bind:value={$editForm.name}
						required
						aria-invalid={$editErrors.name ? 'true' : undefined}
					/>
					{#if $editErrors.name}
						<p class="text-destructive mt-1 text-sm">{$editErrors.name}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<input
							id="edit-isExempt"
							name="isExempt"
							type="checkbox"
							class="border-input h-4 w-4 rounded"
							bind:checked={$editForm.isExempt}
						/>
						<Label for="edit-isExempt">Exempt from visit warning rules</Label>
					</div>
					<p class="text-muted-foreground text-xs">
						{getEditStatusDescription($editForm.isExempt ?? false)}
					</p>
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => (showEditPersonDialog = false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={$editSubmitting}>
						{$editSubmitting ? 'Updating...' : 'Update'}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Archive Person Confirmation -->
<ConfirmDialog
	bind:open={showArchivePersonDialog}
	title="Archive Person"
	message="Are you sure you want to archive {data.person
		.name}? Archived people no longer appear in visits views and tabs."
	confirmButtonText="Archive"
	actionUrl="?/archivePerson"
/>

<!-- Delete Person Confirmation -->
<ConfirmDialog
	bind:open={showDeletePersonDialog}
	title="Delete Person"
	message="Are you sure you want to delete {data.person
		.name}? This will also delete all associated visits. This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/deletePerson"
/>

<!-- Delete Visit Confirmation -->
{#if visitToDelete}
	<ConfirmDialog
		open={!!visitToDelete}
		title="Delete Visit"
		message="Are you sure you want to delete this visit? This action cannot be undone."
		confirmButtonText="Delete"
		actionUrl="?/deleteVisit"
		id={visitToDelete}
	/>
{/if}
