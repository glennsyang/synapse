<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import MeditationDurationFilter from '$lib/components/meditation/MeditationDurationFilter.svelte';
	import MeditationMoodFilter from '$lib/components/meditation/MeditationMoodFilter.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { formatTimeFromTimestamp, formatTimestampDateHeuristic } from '$lib/utils/date';
	import {
		CirclePlay,
		Clock,
		ListFilter,
		Pencil,
		Plus,
		Search,
		Sparkles,
		Trash2
	} from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showEditSessionDialog = $state(false);
	let showDeleteSessionConfirm = $state(false);
	let sessionToDelete = $state<string | null>(null);
	// svelte-ignore state_referenced_locally
	let selectedSession = $state<(typeof data.sessions)[number] | null>(null);

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

	function toDatetimeLocal(isoString: string): string {
		const d = new Date(isoString);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function openEditSession(session: (typeof data.sessions)[number]) {
		selectedSession = session;
		$editSessionForm.id = session.id;
		$editSessionForm.completed_at = toDatetimeLocal(session.completedAt);
		$editSessionForm.pre_mood_rating = session.preMoodRating ?? undefined;
		$editSessionForm.mood_rating = session.moodRating ?? undefined;
		$editSessionForm.notes = session.notes ?? undefined;
		showEditSessionDialog = true;
	}

	const moodTagColors: Record<string, string> = {
		Anxious: 'bg-pen-warn/12 text-pen-warn dark:bg-pen-warn/18 dark:text-pen-warn',
		'Low Energy': 'bg-pen-journal/12 text-pen-journal dark:bg-pen-journal/18 dark:text-pen-journal',
		Focused: 'bg-pen-fitness/12 text-pen-fitness dark:bg-pen-fitness/18 dark:text-pen-fitness',
		'Pre-Sleep': 'bg-pen-mind/12 text-pen-mind dark:bg-pen-mind/18 dark:text-pen-mind',
		General: 'bg-muted text-foreground dark:bg-muted dark:text-foreground'
	};

	let filtersOpen = $state(false);
	let keyword = $state(page.url.searchParams.get('search') ?? '');
	let keywordDebounce = $state<ReturnType<typeof setTimeout> | null>(null);
	let keywordDirty = $state(false);
	let urlKeyword = $derived(page.url.searchParams.get('search') ?? '');

	let hasActiveFilters = $derived(
		Boolean(page.url.searchParams.get('search')?.trim()) ||
			Boolean(page.url.searchParams.get('mood')) ||
			Boolean(page.url.searchParams.get('duration'))
	);

	const activeTab = $derived.by(() =>
		page.url.searchParams.get('tab') === 'history' ? 'history' : 'routines'
	);
	const showPageSkeleton = $derived(
		navigating.to?.url.pathname === '/meditation' && navigating.from?.url.pathname !== '/meditation'
	);

	onDestroy(() => {
		if (keywordDebounce) {
			clearTimeout(keywordDebounce);
		}
	});

	function handleKeywordInput(event: Event) {
		const currentTarget = event.currentTarget;
		if (!(currentTarget instanceof HTMLInputElement)) return;
		keyword = currentTarget.value;
		queueKeywordFilterUpdate();
	}

	function queueKeywordFilterUpdate() {
		keywordDirty = true;
		if (keywordDebounce) clearTimeout(keywordDebounce);
		keywordDebounce = setTimeout(() => {
			void applyKeywordFilter();
		}, 250);
	}

	async function applyKeywordFilter() {
		if (keywordDebounce) {
			clearTimeout(keywordDebounce);
			keywordDebounce = null;
		}
		const normalizedKeyword = keyword.trim();
		if (normalizedKeyword === urlKeyword) {
			keywordDirty = false;
			return;
		}
		const url = new URL(page.url);
		if (normalizedKeyword) {
			url.searchParams.set('search', normalizedKeyword);
		} else {
			url.searchParams.delete('search');
		}
		try {
			await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
		} finally {
			keywordDirty = false;
		}
	}

	async function switchTab(tab: string) {
		const url = new URL(page.url);
		if (tab === 'routines') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}
		await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

{#if showPageSkeleton}
	<PageSkeleton color="purple" />
{:else}
	<PageShell class="min-w-0 overflow-x-hidden">
		<div
			class="mobile-stack ruled mb-6 flex items-center justify-between gap-3 pb-4 sm:flex-wrap lg:flex-nowrap"
		>
			<div class="min-w-0 flex-1">
				<h1 class="page-title" style="--pen: oklch(var(--color-purple))">Meditation</h1>
				<p class="text-muted-foreground text-sm sm:text-base">
					Manage routines and track your practice
				</p>
			</div>
			<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
				<Button href="/meditation/routines/new" class="bg-pen-mind hover:bg-pen-mind">
					<Plus class="mr-2 h-4 w-4" />
					New Routine
				</Button>
				{#if activeTab === 'routines'}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									type="button"
									variant="outline"
									size="icon"
									onclick={() => (filtersOpen = !filtersOpen)}
									aria-label="Toggle routine filters"
									aria-controls="meditation-filter-bar"
									aria-expanded={filtersOpen}
									class={[
										'shrink-0',
										(filtersOpen || hasActiveFilters) &&
											'border-pen-mind bg-pen-mind/12 text-pen-mind hover:bg-pen-mind/12 hover:text-pen-mind dark:border-pen-mind/40 dark:bg-pen-mind/10 dark:text-pen-mind dark:hover:bg-pen-mind/20'
									]}
								>
									<ListFilter class="size-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Filter routines</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</div>
		</div>

		<Tabs.Root value={activeTab} class="w-full gap-3">
			<Tabs.List
				class="bg-muted/75 text-muted-foreground grid h-11 w-full grid-cols-2 rounded-xl p-1"
			>
				<Tabs.Trigger
					value="routines"
					class="font-display data-[state=active]:border-pen-mind border-b-2 border-transparent"
					onclick={() => {
						if (activeTab !== 'routines') void switchTab('routines');
					}}
				>
					Routines
				</Tabs.Trigger>
				<Tabs.Trigger
					value="history"
					class="font-display data-[state=active]:border-pen-mind border-b-2 border-transparent"
					onclick={() => {
						if (activeTab !== 'history') void switchTab('history');
					}}
				>
					History
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Routines Tab -->
			<Tabs.Content value="routines" class="mt-0 w-full space-y-4">
				{#if activeTab === 'routines'}
					<!-- Filter Panel -->
					<Collapsible.Root bind:open={filtersOpen}>
						<Collapsible.Content id="meditation-filter-bar" class="w-full">
							<div
								class="border-pen-mind/35 bg-pen-mind/8 dark:border-pen-mind/25 dark:bg-pen-mind/8 grid gap-4 rounded-3xl border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
							>
								<div class="w-full min-w-0">
									<div class="relative">
										<Search
											class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
										/>
										<Input
											id="routine-keyword-filter"
											type="search"
											value={keywordDirty ? keyword : urlKeyword}
											oninput={handleKeywordInput}
											aria-label="Search routines by keyword"
											placeholder="Search title or description"
											maxlength={200}
											class="bg-background/90 h-10 pl-9"
										/>
									</div>
								</div>
								<div class="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:justify-self-end">
									<div class="w-full lg:w-36 lg:shrink-0"><MeditationMoodFilter /></div>
									<div class="w-full lg:w-32 lg:shrink-0"><MeditationDurationFilter /></div>
								</div>
							</div>
						</Collapsible.Content>
					</Collapsible.Root>

					<!-- Routines, ruled one per line -->
					<ul class="border-foreground border-t-2">
						{#each data.routines as routine (routine.id)}
							<li
								class="border-rule grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b py-4 md:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
							>
								<span
									class="text-pen-mind row-span-2 hidden text-3xl leading-none font-black tabular-nums md:block"
								>
									{routine.durationMinutes}<span
										class="text-muted-foreground ml-0.5 text-xs font-bold">min</span
									>
								</span>
								<div class="min-w-0">
									<a
										href="/meditation/routines/{routine.id}"
										class="hover:text-pen-mind flex items-center gap-2 font-black transition-colors"
									>
										{routine.title}
										{#if routine.isPredefined}
											<Sparkles
												class="text-pen-mind h-3.5 w-3.5 shrink-0"
												aria-label="Predefined"
											/>
										{/if}
									</a>
									{#if routine.description}
										<p class="text-muted-foreground mt-0.5 text-sm">{routine.description}</p>
									{/if}
									<div class="mt-2 flex flex-wrap items-center gap-1.5">
										<span class="text-muted-foreground flex items-center gap-1 text-xs md:hidden">
											<Clock class="h-3.5 w-3.5" />{routine.durationMinutes} min
										</span>
										{#each routine.moodTags as tag, index (tag + index)}
											<Badge variant="outline" class={moodTagColors[tag] || 'bg-muted'}>
												{tag}
											</Badge>
										{/each}
									</div>
								</div>
								<div class="flex shrink-0 items-center gap-1.5 self-start md:self-center">
									<Button
										href={routine.linkUrl}
										target="_blank"
										rel="noopener noreferrer"
										variant="outline"
										class="border-pen-mind/60 text-pen-mind hover:bg-pen-mind/8 hover:text-pen-mind"
									>
										<CirclePlay class="h-4 w-4" />
										Practice
									</Button>
									<Button href="/meditation/routines/{routine.id}" variant="ghost">Details</Button>
								</div>
							</li>
						{:else}
							<li class="text-muted-foreground border-rule border-b py-8 text-center">
								No routines found. Try adjusting your filters or create a new routine.
							</li>
						{/each}
					</ul>
				{/if}
			</Tabs.Content>

			<!-- History Tab -->
			<Tabs.Content value="history" class="w-full space-y-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Session History</Card.Title>
						<Card.Description>Your completed meditation sessions</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if data.sessions.length > 0}
							<div class="space-y-4">
								{#each data.sessions as session (session.id)}
									<div class="flex items-start justify-between border-b pb-4 last:border-b-0">
										<div class="flex-1">
											<h3 class="font-medium">{session.routine.title}</h3>
											<p class="text-muted-foreground text-sm">
												{formatTimestampDateHeuristic(session.completedAt, { fallback: 'short' })}
												at
												{formatTimeFromTimestamp(session.completedAt)}
											</p>
											{#if session.notes}
												<p class="text-muted-foreground mt-2 text-sm">{session.notes}</p>
											{/if}
										</div>
										<div class="flex flex-col items-end gap-2">
											{#if session.preMoodRating && session.moodRating}
												<Badge variant="outline"
													>Mood: {session.preMoodRating} → {session.moodRating}</Badge
												>
											{:else if session.moodRating}
												<Badge variant="outline">Mood: {session.moodRating}/5</Badge>
											{/if}
											<span class="text-muted-foreground text-sm"
												>{session.routine.durationMinutes}
												min</span
											>
											<div class="flex gap-1">
												<Tooltip.Root>
													<Tooltip.Trigger>
														{#snippet child({ props })}
															<Button
																{...props}
																variant="ghost"
																size="icon-sm"
																class="border-border bg-card text-foreground hover:bg-card dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted border"
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
																class="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/15 border-border bg-card dark:border-border dark:bg-card border"
																aria-label="Delete Session"
																onclick={() => {
																	sessionToDelete = session.id;
																	showDeleteSessionConfirm = true;
																}}
															>
																<Trash2 class="h-4 w-4" />
															</Button>
														{/snippet}
													</Tooltip.Trigger>
													<Tooltip.Content>Delete Session</Tooltip.Content>
												</Tooltip.Root>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted-foreground py-8 text-center">
								No sessions completed yet. Start practicing to build your history!
							</p>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

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
			<Dialog.Description>{selectedSession?.routine.title}</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/updateSession" use:editSessionEnhance class="space-y-4">
			<input type="hidden" name="id" bind:value={$editSessionForm.id} />

			<div class="space-y-2">
				<Label for="hist_completed_at">Date & Time</Label>
				<Input
					id="hist_completed_at"
					name="completed_at"
					type="datetime-local"
					bind:value={$editSessionForm.completed_at}
				/>
				{#if $editSessionErrors.completed_at}
					<p class="text-destructive text-sm">{$editSessionErrors.completed_at}</p>
				{/if}
			</div>

			<div
				class="border-pen-mind/35 bg-pen-mind/12 text-pen-mind dark:border-pen-mind/40 dark:bg-pen-mind/8 dark:text-pen-mind rounded-lg border p-3 text-sm"
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
				<Label for="hist_pre_mood">Before Session — How were you feeling?</Label>
				<Input
					id="hist_pre_mood"
					name="pre_mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$editSessionForm.pre_mood_rating}
					placeholder="1–5"
				/>
				{#if $editSessionErrors.pre_mood_rating}
					<p class="text-destructive text-sm">{$editSessionErrors.pre_mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="hist_mood">After Session — How did you feel?</Label>
				<Input
					id="hist_mood"
					name="mood_rating"
					type="number"
					min="1"
					max="5"
					bind:value={$editSessionForm.mood_rating}
					placeholder="1–5"
				/>
				{#if $editSessionErrors.mood_rating}
					<p class="text-destructive text-sm">{$editSessionErrors.mood_rating}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="hist_notes">Notes (optional)</Label>
				<Textarea
					id="hist_notes"
					name="notes"
					bind:value={$editSessionForm.notes}
					placeholder="Any reflections or observations..."
					rows={3}
				/>
				{#if $editSessionErrors.notes}
					<p class="text-destructive text-sm">{$editSessionErrors.notes}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					type="submit"
					class="bg-pen-mind hover:bg-pen-mind"
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
