<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EditIcon from '@lucide/svelte/icons/edit';
	import PlayCircleIcon from '@lucide/svelte/icons/play-circle';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showScheduleDialog = $state(false);
	let showSessionDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteConfirm = $state(false);

	// svelte-ignore state_referenced_locally
	const {
		form: scheduleForm,
		errors: scheduleErrors,
		enhance: scheduleEnhance,
		message: scheduleMessage
	} = superForm(data.scheduleForm, {
		onUpdate: ({ form }) => {
			if (form.valid && $scheduleMessage?.type === 'success') {
				toast.success('Schedule saved successfully!');
				showScheduleDialog = false;
			}
			if ($scheduleMessage?.type === 'error') {
				toast.error(`Error: ${$scheduleMessage.text}`);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: sessionForm,
		errors: sessionErrors,
		enhance: sessionEnhance,
		message: sessionMessage
	} = superForm(data.sessionForm, {
		onUpdate: ({ form }) => {
			if (form.valid && $sessionMessage?.type === 'success') {
				toast.success('Session logged successfully!');
				showSessionDialog = false;
			}
			if ($sessionMessage?.type === 'error') {
				toast.error(`Error: ${$sessionMessage.text}`);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: updateForm,
		errors: updateErrors,
		enhance: updateEnhance,
		message: updateMessage
	} = superForm(data.updateForm, {
		onUpdate: ({ form }) => {
			if (form.valid && $updateMessage?.type === 'success') {
				toast.success('Routine updated successfully!');
				showEditDialog = false;
			}
			if ($updateMessage?.type === 'error') {
				toast.error(`Error: ${$updateMessage.text}`);
			}
		}
	});

	const moodTagColors: Record<string, string> = {
		Anxious: 'bg-amber-100 text-amber-800',
		'Low Energy': 'bg-blue-100 text-blue-800',
		Focused: 'bg-green-100 text-green-800',
		'Pre-Sleep': 'bg-purple-100 text-purple-800',
		General: 'bg-gray-100 text-gray-800'
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getDayName(dayNumber: number) {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		return days[dayNumber];
	}
</script>

<div class="container mx-auto max-w-4xl py-8">
	<div class="mb-6">
		<Button href="/meditation" variant="ghost">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Meditation
		</Button>
	</div>

	<!-- Routine Details -->
	<Card.Root class="mb-6">
		<Card.Header>
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<Card.Title class="text-2xl">{data.routine.title}</Card.Title>
					{#if data.routine.description}
						<Card.Description class="mt-2">{data.routine.description}</Card.Description>
					{/if}
				</div>
				{#if !data.routine.isPredefined}
					<div class="flex gap-2">
						<Button variant="outline" size="icon" onclick={() => (showEditDialog = true)}>
							<EditIcon class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onclick={() => (showDeleteConfirm = true)}>
							<TrashIcon class="h-4 w-4" />
						</Button>
					</div>
				{/if}
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 text-muted-foreground">
					<ClockIcon class="h-5 w-5" />
					<span>{data.routine.durationMinutes} minutes</span>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each data.routine.moodTags as tag, index (tag + index)}
					<Badge variant="outline" class={moodTagColors[tag]}>{tag}</Badge>
				{/each}
			</div>
		</Card.Content>
		<Card.Footer class="flex gap-2">
			<Button href={data.routine.linkUrl} target="_blank" rel="noopener noreferrer" class="flex-1">
				<PlayCircleIcon class="mr-2 h-4 w-4" />
				Start Practice
			</Button>
			<Button variant="outline" onclick={() => (showSessionDialog = true)}>
				<CheckCircleIcon class="mr-2 h-4 w-4" />
				Log Session
			</Button>
		</Card.Footer>
	</Card.Root>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Schedule -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<CalendarIcon class="h-5 w-5" />
					Schedule
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.schedule}
					<div class="space-y-2">
						<p class="text-sm">
							<span class="font-medium">Cadence:</span>
							<span class="capitalize">{data.schedule.cadence}</span>
						</p>
						{#if data.schedule.daysOfWeek && data.schedule.daysOfWeek.length > 0}
							<p class="text-sm">
								<span class="font-medium">Days:</span>
								{data.schedule.daysOfWeek.map(getDayName).join(', ')}
							</p>
						{/if}
						<p class="text-sm">
							<span class="font-medium">Time:</span>
							{data.schedule.time}
						</p>
						<p class="text-sm">
							<span class="font-medium">Status:</span>
							<Badge variant={data.schedule.enabled ? 'default' : 'secondary'}>
								{data.schedule.enabled ? 'Active' : 'Inactive'}
							</Badge>
						</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No schedule set</p>
				{/if}
			</Card.Content>
			<Card.Footer class="flex gap-2">
				<Button variant="outline" class="flex-1" onclick={() => (showScheduleDialog = true)}>
					{data.schedule ? 'Edit Schedule' : 'Add Schedule'}
				</Button>
				{#if data.schedule}
					<form method="POST" action="?/deleteSchedule" class="inline">
						<Button type="submit" variant="ghost" size="icon">
							<TrashIcon class="h-4 w-4" />
						</Button>
					</form>
				{/if}
			</Card.Footer>
		</Card.Root>

		<!-- Session History -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Recent Sessions</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.sessions.length > 0}
					<div class="space-y-3">
						{#each data.sessions.slice(0, 5) as session (session.id)}
							<div class="border-b pb-2 last:border-b-0">
								<p class="text-sm font-medium">{formatDate(session.completedAt)}</p>
								{#if session.moodRating}
									<p class="text-sm text-muted-foreground">Mood: {session.moodRating}/5</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No sessions yet</p>
				{/if}
			</Card.Content>
			{#if data.sessions.length > 5}
				<Card.Footer>
					<Button href="/meditation?tab=history" variant="link" class="w-full">
						View All Sessions
					</Button>
				</Card.Footer>
			{/if}
		</Card.Root>
	</div>
</div>

<!-- Schedule Dialog -->
<Dialog.Root bind:open={showScheduleDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{data.schedule ? 'Edit' : 'Add'} Schedule</Dialog.Title>
			<Dialog.Description>Set up a reminder for this meditation routine</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/createSchedule" use:scheduleEnhance class="space-y-4">
			<div class="space-y-2">
				<Label for="cadence">Cadence</Label>
				<Select.Root type="single" name="cadence" bind:value={$scheduleForm.cadence}>
					<Select.Trigger id="cadence">
						{$scheduleForm.cadence
							? $scheduleForm.cadence.charAt(0).toUpperCase() + $scheduleForm.cadence.slice(1)
							: 'Select cadence'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="daily">Daily</Select.Item>
						<Select.Item value="weekly">Weekly</Select.Item>
						<Select.Item value="custom">Custom</Select.Item>
					</Select.Content>
				</Select.Root>
				{#if $scheduleErrors.cadence}
					<p class="text-sm text-destructive">{$scheduleErrors.cadence}</p>
				{/if}
			</div>

			{#if $scheduleForm.cadence === 'weekly' || $scheduleForm.cadence === 'custom'}
				<div class="space-y-2">
					<Label for="days_of_week">Days of Week</Label>
					<Input
						id="days_of_week"
						name="days_of_week"
						bind:value={$scheduleForm.days_of_week}
						placeholder="0,1,6 (0=Sun, 6=Sat)"
					/>
					<p class="text-sm text-muted-foreground">
						Comma-separated day numbers (0=Sunday, 6=Saturday)
					</p>
					{#if $scheduleErrors.days_of_week}
						<p class="text-sm text-destructive">{$scheduleErrors.days_of_week}</p>
					{/if}
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="time">Time</Label>
				<Input id="time" name="time" type="time" bind:value={$scheduleForm.time} />
				{#if $scheduleErrors.time}
					<p class="text-sm text-destructive">{$scheduleErrors.time}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit">Save Schedule</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Session Dialog -->
<Dialog.Root bind:open={showSessionDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Log Meditation Session</Dialog.Title>
			<Dialog.Description>Record your completed meditation</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/completeSession" use:sessionEnhance class="space-y-4">
			<div class="space-y-2">
				<Label for="mood_rating">Mood Rating (1-5)</Label>
				<Input
					id="mood_rating"
					name="mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$sessionForm.mood_rating}
					placeholder="How do you feel?"
				/>
				{#if $sessionErrors.mood_rating}
					<p class="text-sm text-destructive">{$sessionErrors.mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="notes">Notes (optional)</Label>
				<Textarea
					id="notes"
					name="notes"
					bind:value={$sessionForm.notes}
					placeholder="Any reflections or observations..."
					rows={3}
				/>
				{#if $sessionErrors.notes}
					<p class="text-sm text-destructive">{$sessionErrors.notes}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit">Log Session</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Routine Dialog -->
<Dialog.Root bind:open={showEditDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit Routine</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/updateRoutine" use:updateEnhance class="space-y-4">
			<div class="space-y-2">
				<Label for="edit_title">Title</Label>
				<Input id="edit_title" name="title" bind:value={$updateForm.title} />
				{#if $updateErrors.title}
					<p class="text-sm text-destructive">{$updateErrors.title}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_description">Description</Label>
				<Textarea
					id="edit_description"
					name="description"
					bind:value={$updateForm.description}
					rows={3}
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit_link_url">Link URL</Label>
				<Input id="edit_link_url" name="link_url" type="url" bind:value={$updateForm.link_url} />
				{#if $updateErrors.link_url}
					<p class="text-sm text-destructive">{$updateErrors.link_url}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_duration_minutes">Duration (minutes)</Label>
				<Input
					id="edit_duration_minutes"
					name="duration_minutes"
					type="number"
					bind:value={$updateForm.duration_minutes}
				/>
				{#if $updateErrors.duration_minutes}
					<p class="text-sm text-destructive">{$updateErrors.duration_minutes}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_mood_tags">Mood Tags</Label>
				<Input
					id="edit_mood_tags"
					name="mood_tags"
					bind:value={$updateForm.mood_tags}
					placeholder="Anxious, Focused"
				/>
				{#if $updateErrors.mood_tags}
					<p class="text-sm text-destructive">{$updateErrors.mood_tags}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit">Update Routine</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirm Dialog -->
<Dialog.Root bind:open={showDeleteConfirm}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Routine?</Dialog.Title>
			<Dialog.Description>
				This will permanently delete this routine and all associated schedules and sessions. This
				action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
			<form method="POST" action="?/deleteRoutine" class="inline">
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
