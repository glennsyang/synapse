<script lang="ts">
	import {
		ArrowLeft,
		Calendar,
		CircleCheck,
		CirclePlay,
		Clock,
		Pencil,
		Plus,
		Trash,
		Trash2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { daysOfWeek, formatTime12Hour, formatTimestampLong } from '$lib/utils/date';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showScheduleDialog = $state(false);
	let showSessionDialog = $state(false);
	let showEditDialog = $state(false);
	let showDeleteConfirm = $state(false);
	let showDeleteScheduleConfirm = $state(false);
	let showDeleteSessionConfirm = $state(false);
	let sessionToDelete = $state<string | null>(null);
	let showEditSessionDialog = $state(false);

	// svelte-ignore state_referenced_locally
	const {
		form: scheduleForm,
		errors: scheduleErrors,
		enhance: scheduleEnhance,
		submitting: scheduleSubmitting
	} = superForm(data.scheduleForm, {
		onUpdate: ({ form }) => {
			if (form.valid && form.message?.type === 'success') {
				toast.success('Schedule saved successfully!');
				showScheduleDialog = false;
			}
			if (form.message?.type === 'error') {
				toast.error(`Error: ${form.message.text}`);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: sessionForm,
		errors: sessionErrors,
		enhance: sessionEnhance,
		submitting: sessionSubmitting
	} = superForm(data.sessionForm, {
		onUpdate: ({ form }) => {
			if (form.valid && form.message?.type === 'success') {
				toast.success('Session logged successfully!');
				showSessionDialog = false;
			}
			if (form.message?.type === 'error') {
				toast.error(`Error: ${form.message.text}`);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: updateForm,
		errors: updateErrors,
		enhance: updateEnhance,
		submitting: updateSubmitting
	} = superForm(data.updateForm, {
		onUpdate: ({ form }) => {
			if (form.valid && form.message?.type === 'success') {
				toast.success('Routine updated successfully!');
				showEditDialog = false;
			}
			if (form.message?.type === 'error') {
				toast.error(`Error: ${form.message.text}`);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: editSessionForm,
		errors: editSessionErrors,
		enhance: editSessionEnhance,
		submitting: editSessionSubmitting
	} = superForm(data.editSessionForm, {
		onUpdate: ({ form }) => {
			if (form.valid && form.message?.type === 'success') {
				toast.success('Session updated successfully!');
				showEditSessionDialog = false;
			}
			if (form.message?.type === 'error') {
				toast.error(`Error: ${form.message.text}`);
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

	function getDayName(dayNumber: number) {
		return daysOfWeek.find((d) => d.id === dayNumber)?.name || 'Unknown';
	}

	function getSelectedDays(): number[] {
		try {
			return $scheduleForm.days_of_week ? JSON.parse($scheduleForm.days_of_week) : [];
		} catch {
			return [];
		}
	}

	function toggleDay(dayId: number) {
		const days = getSelectedDays();
		if (days.includes(dayId)) {
			$scheduleForm.days_of_week = JSON.stringify(days.filter((d) => d !== dayId));
		} else {
			$scheduleForm.days_of_week = JSON.stringify([...days, dayId].sort((a, b) => a - b));
		}
	}

	function getNowDatetimeLocal(): string {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
	}

	function toDatetimeLocal(isoString: string): string {
		const d = new Date(isoString);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function openEditSession(session: (typeof data.sessions)[number]) {
		$editSessionForm.id = session.id;
		$editSessionForm.completed_at = toDatetimeLocal(session.completedAt);
		$editSessionForm.pre_mood_rating = session.preMoodRating ?? undefined;
		$editSessionForm.mood_rating = session.moodRating ?? undefined;
		$editSessionForm.notes = session.notes ?? undefined;
		showEditSessionDialog = true;
	}

	$effect(() => {
		if (showSessionDialog) {
			$sessionForm.completed_at = getNowDatetimeLocal();
		}
	});
</script>

<div class="container mx-auto max-w-4xl py-8">
	<div class="mb-6">
		<Button href="/meditation" variant="ghost">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Meditation
		</Button>
	</div>

	<!-- Routine Details -->
	<Card.Root class="mb-6 border-purple-200 dark:border-purple-800">
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
							<Pencil class="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onclick={() => (showDeleteConfirm = true)}>
							<Trash class="h-4 w-4" />
						</Button>
					</div>
				{/if}
			</div>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 text-muted-foreground">
					<Clock class="h-5 w-5" />
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
			<Button
				href={data.routine.linkUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="bg-purple-600 hover:bg-purple-700"
			>
				<CirclePlay class="mr-2 h-4 w-4" />
				Start Practice
			</Button>
			<Button
				variant="outline"
				class="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
				onclick={() => (showSessionDialog = true)}
			>
				<CircleCheck class="mr-2 h-4 w-4" />
				Log Session
			</Button>
		</Card.Footer>
	</Card.Root>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Schedule -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Calendar class="h-5 w-5" />
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
							{formatTime12Hour(data.schedule.time)}
						</p>
						<p class="text-sm">
							<span class="font-medium">Status:</span>
							<Badge
								variant={data.schedule.enabled ? 'default' : 'secondary'}
								class="ml-1 bg-purple-600"
							>
								{data.schedule.enabled ? 'Active' : 'Inactive'}
							</Badge>
						</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No schedule set</p>
				{/if}
			</Card.Content>
			<Card.Footer class="flex gap-3">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon-sm"
								class="border border-white/55 bg-white/68 text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
								aria-label={data.schedule ? 'Edit Schedule' : 'Add Schedule'}
								onclick={() => (showScheduleDialog = true)}
							>
								{#if data.schedule}
									<Pencil class="h-4 w-4" />
								{:else}
									<Plus class="h-4 w-4" />
								{/if}
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>{data.schedule ? 'Edit Schedule' : 'Add Schedule'}</Tooltip.Content>
				</Tooltip.Root>
				{#if data.schedule}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon-sm"
									class="border border-white/55 bg-white/68 text-destructive shadow-sm backdrop-blur-xl hover:bg-destructive/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-destructive/15"
									aria-label="Delete Schedule"
									onclick={() => (showDeleteScheduleConfirm = true)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Delete Schedule</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</Card.Footer>
		</Card.Root>

		<!-- Session History -->
		<Card.Root>
			<Card.Header> <Card.Title>Recent Sessions</Card.Title> </Card.Header>
			<Card.Content>
				{#if data.sessions.length > 0}
					<div class="space-y-3">
						{#each data.sessions.slice(0, 5) as session (session.id)}
							<div class="flex items-start justify-between border-b pb-2 last:border-b-0">
								<div>
									<p class="text-sm font-medium">{formatTimestampLong(session.completedAt)}</p>
									{#if session.preMoodRating && session.moodRating}
										<p class="text-sm text-muted-foreground">
											Mood: {session.preMoodRating} → {session.moodRating}
										</p>
									{:else if session.moodRating}
										<p class="text-sm text-muted-foreground">Mood: {session.moodRating}/5</p>
									{/if}
								</div>
								<div class="flex shrink-0 gap-1">
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon-sm"
													class="border border-white/55 bg-white/68 text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
													aria-label="Edit Session"
													onclick={() => openEditSession(session)}
												>
													<Pencil class="h-4 w-4" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Edit Session</Tooltip.Content>
									</Tooltip.Root>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon-sm"
													class="border border-white/55 bg-white/68 text-destructive shadow-sm backdrop-blur-xl hover:bg-destructive/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-destructive/15"
													aria-label="Delete Session"
													onclick={() => { sessionToDelete = session.id; showDeleteSessionConfirm = true; }}
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Delete Session</Tooltip.Content>
									</Tooltip.Root>
								</div>
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
					<Label>Days of Week</Label>
					<Input name="days_of_week" type="hidden" bind:value={$scheduleForm.days_of_week} />
					<div class="flex flex-wrap gap-2">
						{#each daysOfWeek as day (day.id)}
							{@const selectedDays = getSelectedDays()}
							<Button
								type="button"
								variant={selectedDays.includes(day.id) ? 'default' : 'outline'}
								size="sm"
								class={selectedDays.includes(day.id)
									? 'bg-purple-600 hover:bg-purple-700'
									: ''}
								onclick={() => toggleDay(day.id)}
							>
								{day.shortName}
							</Button>
						{/each}
					</div>
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
				<Button
					type="submit"
					class="bg-purple-600 hover:bg-purple-700"
					disabled={$scheduleSubmitting}
				>
					{#if $scheduleSubmitting}
						Saving...
					{:else}
						Save
					{/if}
				</Button>
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
				<Label for="completed_at">Date & Time</Label>
				<Input
					id="completed_at"
					name="completed_at"
					type="datetime-local"
					bind:value={$sessionForm.completed_at}
				/>
				{#if $sessionErrors.completed_at}
					<p class="text-sm text-destructive">{$sessionErrors.completed_at}</p>
				{/if}
			</div>
			<!-- Rating explanation -->
			<div
				class="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
			>
				Rate your mood before and after your session to track how meditation affects your wellbeing.
				<strong>1</strong>
				= Very Bad &nbsp;·&nbsp;
				<strong>2</strong>
				= Bad &nbsp;·&nbsp;
				<strong>3</strong>
				= Neutral &nbsp;·&nbsp;
				<strong>4</strong>
				= Good &nbsp;·&nbsp;
				<strong>5</strong>
				= Great
			</div>

			<div class="space-y-2">
				<Label for="pre_mood_rating">Before Session — How are you feeling right now?</Label>
				<Input
					id="pre_mood_rating"
					name="pre_mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$sessionForm.pre_mood_rating}
					placeholder="1–5"
				/>
				{#if $sessionErrors.pre_mood_rating}
					<p class="text-sm text-destructive">{$sessionErrors.pre_mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="mood_rating">After Session — How do you feel now?</Label>
				<Input
					id="mood_rating"
					name="mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$sessionForm.mood_rating}
					placeholder="1–5"
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
				<Button
					type="submit"
					class="bg-purple-600 hover:bg-purple-700"
					disabled={$sessionSubmitting}
				>
					{#if $sessionSubmitting}
						Saving...
					{:else}
						Save
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Routine Dialog -->
<Dialog.Root bind:open={showEditDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header> <Dialog.Title>Edit Routine</Dialog.Title> </Dialog.Header>
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
				<p class="text-xs text-muted-foreground">
					Comma-separated: Anxious, Low Energy, Focused, Pre-Sleep, General
				</p>
				{#if $updateErrors.mood_tags}
					<p class="text-sm text-destructive">{$updateErrors.mood_tags}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					type="submit"
					class="bg-purple-600 hover:bg-purple-700"
					disabled={$updateSubmitting}
				>
					{#if $updateSubmitting}
						Updating...
					{:else}
						Update Routine
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Routine Confirm Dialog -->
<ConfirmDialog
	bind:open={showDeleteConfirm}
	title="Delete Routine?"
	message="This will permanently delete this routine and all associated schedules and sessions. This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/deleteRoutine"
/>

<!-- Delete Schedule Confirm Dialog -->
<ConfirmDialog
	bind:open={showDeleteScheduleConfirm}
	title="Delete Schedule?"
	message="Are you sure you want to delete this schedule? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/deleteSchedule"
/>

<!-- Delete Session Confirm Dialog -->
<ConfirmDialog
	bind:open={showDeleteSessionConfirm}
	title="Delete Session?"
	message="Are you sure you want to delete this session? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/deleteSession"
	hiddenFields={{ session_id: sessionToDelete ?? '' }}
/>

<!-- Edit Session Dialog -->
<Dialog.Root bind:open={showEditSessionDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit Session</Dialog.Title>
			<Dialog.Description>Update your meditation session details</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/updateSession" use:editSessionEnhance class="space-y-4">
			<input type="hidden" name="id" bind:value={$editSessionForm.id}>

			<div class="space-y-2">
				<Label for="edit_session_completed_at">Date & Time</Label>
				<Input
					id="edit_session_completed_at"
					name="completed_at"
					type="datetime-local"
					bind:value={$editSessionForm.completed_at}
				/>
				{#if $editSessionErrors.completed_at}
					<p class="text-sm text-destructive">{$editSessionErrors.completed_at}</p>
				{/if}
			</div>

			<div
				class="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
			>
				Rate your mood before and after your session to track how meditation affects your wellbeing.
				<strong>1</strong>
				= Very Bad &nbsp;·&nbsp;
				<strong>2</strong>
				= Bad &nbsp;·&nbsp;
				<strong>3</strong>
				= Neutral &nbsp;·&nbsp;
				<strong>4</strong>
				= Good &nbsp;·&nbsp;
				<strong>5</strong>
				= Great
			</div>

			<div class="space-y-2">
				<Label for="edit_session_pre_mood">Before Session — How were you feeling?</Label>
				<Input
					id="edit_session_pre_mood"
					name="pre_mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$editSessionForm.pre_mood_rating}
					placeholder="1–5"
				/>
				{#if $editSessionErrors.pre_mood_rating}
					<p class="text-sm text-destructive">{$editSessionErrors.pre_mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_session_mood">After Session — How did you feel?</Label>
				<Input
					id="edit_session_mood"
					name="mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$editSessionForm.mood_rating}
					placeholder="1–5"
				/>
				{#if $editSessionErrors.mood_rating}
					<p class="text-sm text-destructive">{$editSessionErrors.mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="edit_session_notes">Notes (optional)</Label>
				<Textarea
					id="edit_session_notes"
					name="notes"
					bind:value={$editSessionForm.notes}
					placeholder="Any reflections or observations..."
					rows={3}
				/>
				{#if $editSessionErrors.notes}
					<p class="text-sm text-destructive">{$editSessionErrors.notes}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					type="submit"
					class="bg-purple-600 hover:bg-purple-700"
					disabled={$editSessionSubmitting}
				>
					{#if $editSessionSubmitting}
						Saving...
					{:else}
						Save
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
