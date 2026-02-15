<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import EditIcon from '@lucide/svelte/icons/edit';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { personSchema, visitSchema } from '$lib/schemas/visits';
	import { formatDateLong, formatDateShort } from '$lib/utils/date';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showLogVisitDialog = $state(false);
	let showEditPersonDialog = $state(false);
	let showDeletePersonDialog = $state(false);
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

	function getStatusBadge(status: string) {
		switch (status) {
			case 'green':
				return 'bg-green-100 text-green-800';
			case 'yellow':
				return 'bg-yellow-100 text-yellow-800';
			case 'red':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'green':
				return 'Recent';
			case 'yellow':
				return 'Overdue';
			case 'red':
				return 'Critical';
			default:
				return 'No Visits';
		}
	}

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
</script>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<Button variant="ghost" href="/visits" class="mb-4">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Visits
		</Button>

		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold">{data.person.name}</h1>
				<div class="mt-2 flex items-center gap-2">
					<span
						class="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold {getStatusBadge(
							data.person.status
						)}"
					>
						{getStatusLabel(data.person.status)}
					</span>
					{#if data.person.daysSinceLastVisit !== null}
						<span class="text-sm text-muted-foreground">
							Last visit: {formatTimeSince(data.person.daysSinceLastVisit)}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<Button
					size="icon"
					aria-label="Log Visit"
					title="Log Visit"
					onclick={() => (showLogVisitDialog = true)}
				>
					<CalendarIcon class="h-4 w-4" />
				</Button>
				<Button
					size="icon"
					variant="outline"
					aria-label="Edit Person"
					title="Edit Person"
					onclick={() => (showEditPersonDialog = true)}
				>
					<EditIcon class="h-4 w-4" />
				</Button>
				<Button
					size="icon"
					variant="destructive"
					aria-label="Delete Person"
					title="Delete Person"
					onclick={() => (showDeletePersonDialog = true)}
				>
					<Trash2Icon class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>

	<!-- Visit History -->
	<div>
		<h2 class="mb-4 text-2xl font-semibold">Visit History</h2>

		{#if data.visits.length === 0}
			<Card.Root>
				<Card.Content class="py-12 text-center">
					<p class="mb-4 text-muted-foreground">No visits logged yet.</p>
					<Button onclick={() => (showLogVisitDialog = true)}>Log First Visit</Button>
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
										<p class="font-semibold">
											{formatDateLong(visit.date)}
										</p>
										{#if visit.time}
											<span class="text-sm text-muted-foreground">{formatTime(visit.time)}</span>
										{/if}
									</div>

									{#if visit.companions && visit.companions.length > 0}
										<p class="text-sm text-muted-foreground">
											With: {visit.companions.join(', ')}
										</p>
									{/if}

									{#if visit.notes}
										<p class="mt-2 text-sm text-muted-foreground">Notes: {visit.notes}</p>
									{/if}

									{#if visit.followUpDate}
										<p class="mt-2 text-sm text-muted-foreground">
											Follow-up: {formatDateShort(visit.followUpDate)}
										</p>
									{/if}
								</div>

								<form method="POST" action="?/deleteVisit">
									<Input type="hidden" name="visitId" value={visit.id} />
									<Button
										size="icon"
										type="button"
										variant="destructive"
										aria-label="Delete Visit"
										title="Delete Visit"
										onclick={() => (visitToDelete = visit.id)}
									>
										<Trash2Icon class="h-4 w-4" />
									</Button>
								</form>
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
			<Dialog.Title>Log Visit</Dialog.Title>
			<Dialog.Description>Record a visit with {data.person.name}</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/logVisit" use:visitEnhance>
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
						<p class="mt-1 text-sm text-destructive">{$visitErrors.date}</p>
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
						<p class="mt-1 text-sm text-destructive">{$visitErrors.time}</p>
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
						<p class="mt-1 text-sm text-destructive">{$visitErrors.companions}</p>
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
						<p class="mt-1 text-sm text-destructive">{$visitErrors.followUpDate}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => (showLogVisitDialog = false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={$visitSubmitting}>
						{$visitSubmitting ? 'Logging...' : 'Log Visit'}
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
						<p class="mt-1 text-sm text-destructive">{$editErrors.name}</p>
					{/if}
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
