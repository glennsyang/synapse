<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { JournalEntry } from '$lib/types';
	import { formatDateHeuristic } from '$lib/utils/date';
	import { renderMarkdownToSafeHtml } from '$lib/utils/markdown';
	import { Cloud, MapPin, Pencil, Trash2 } from '@lucide/svelte/icons';

	import ConfirmDialog from '../shared/ConfirmDialog.svelte';

	let { entry }: { entry: JournalEntry } = $props();

	let openDeleteModal = $state<boolean>(false);

	let previewHtml = $derived(renderMarkdownToSafeHtml(entry.content));
	let hasMetadata = $derived(
		Boolean(entry.location) || Boolean(entry.weather?.temp) || Boolean(entry.weather?.condition)
	);

	// The margin date, as a planner prints it: numeral, weekday, month.
	const marginDate = $derived.by(() => {
		const d = new Date(`${entry.date.slice(0, 10)}T12:00:00`);
		if (Number.isNaN(d.getTime())) return null;
		return {
			day: d.getDate(),
			weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
			month: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
		};
	});
</script>

<article
	class="border-rule grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-4 border-b py-6 md:grid-cols-[6rem_minmax(0,1fr)] md:gap-x-8"
>
	<a
		href="/journal/{entry.id}"
		class="group flex flex-col items-start leading-none"
		aria-label={formatDateHeuristic(entry.date, { fallback: 'long' })}
	>
		{#if marginDate}
			<span
				class="group-hover:text-pen-journal text-5xl font-black tracking-[-0.04em] tabular-nums transition-colors md:text-6xl"
				>{marginDate.day}</span
			>
			<span class="text-pen-journal mt-1.5 text-sm font-black">{marginDate.weekday}</span>
			<span class="text-muted-foreground mt-1 text-xs">{marginDate.month}</span>
		{:else}
			<span class="text-sm font-black">{formatDateHeuristic(entry.date, { fallback: 'long' })}</span
			>
		{/if}
	</a>

	<div class="min-w-0">
		<div class="flex items-start justify-between gap-4">
			<a
				href="/journal/{entry.id}"
				class="hover:text-pen-journal text-sm font-bold transition-colors"
			>
				{formatDateHeuristic(entry.date, { fallback: 'long' })}
			</a>
			<div class="-mt-1 flex shrink-0 items-center gap-1">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								href="/journal/{entry.id}"
								variant="ghost"
								size="icon-sm"
								aria-label="Edit entry"
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
								type="button"
								variant="ghost"
								size="icon-sm"
								class="hover:text-destructive"
								aria-label="Delete entry"
								onclick={() => (openDeleteModal = true)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Delete</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>

		<div
			class="prose prose-slate dark:prose-invert prose-p:leading-7 prose-blockquote:border-l-pen-journal/40 prose-blockquote:text-muted-foreground mt-2 max-w-[68ch] text-[15px] leading-7"
		>
			{@html previewHtml}
		</div>

		{#if hasMetadata}
			<div class="mt-3 flex flex-wrap gap-2">
				{#if entry.location}
					<span class="washi bg-pen-journal/10 text-foreground gap-1.5">
						<MapPin class="text-pen-journal h-3.5 w-3.5" />
						{entry.location}
					</span>
				{/if}
				{#if entry.weather?.temp || entry.weather?.condition}
					<span class="washi bg-muted text-foreground gap-1.5">
						<Cloud class="h-3.5 w-3.5" />
						{#if entry.weather?.temp}
							<span class="tabular-nums">{entry.weather.temp}°C</span>
						{/if}
						{#if entry.weather?.condition}
							<span>{entry.weather.condition}</span>
						{/if}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</article>

<ConfirmDialog
	bind:open={openDeleteModal}
	id={entry.id}
	actionUrl={`/journal/${entry.id}?/delete`}
	title="Delete Journal Entry"
	message="Are you sure you want to delete this journal entry?"
	confirmButtonText="Delete"
/>
