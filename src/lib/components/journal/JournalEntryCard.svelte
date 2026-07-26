<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { JournalEntry } from '$lib/types';
	import { formatDateHeuristic } from '$lib/utils/date';
	import { Calendar, Cloud, MapPin, Pencil, Trash2 } from '@lucide/svelte/icons';
	import { marked } from 'marked';

	import ConfirmDialog from '../shared/ConfirmDialog.svelte';

	let { entry }: { entry: JournalEntry } = $props();

	let openDeleteModal = $state<boolean>(false);

	let previewHtml = $derived(marked.parse(entry.content));
	let isLargeTile = $derived(entry.content.trim().length > 360);
	let hasMetadata = $derived(
		Boolean(entry.location) || Boolean(entry.weather?.temp) || Boolean(entry.weather?.condition)
	);
</script>

<Card.Root
	class={[
		'group relative overflow-hidden border border-white/65 bg-white/88 p-0 text-slate-900 shadow-[0_20px_70px_-46px_rgba(59,130,246,0.42)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/68 dark:text-slate-100',
		isLargeTile ? 'min-h-80' : 'min-h-54',
		'focus-within:-translate-y-1 focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.32),0_28px_90px_-40px_rgba(59,130,246,0.56)] hover:-translate-y-1 hover:shadow-[0_28px_90px_-40px_rgba(59,130,246,0.52)]'
	]}
>
	<div class="relative flex h-full flex-col gap-4 p-4 md:p-5">
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0 space-y-3">
				<p
					class="text-[11px] font-medium tracking-[0.35em] text-[oklch(var(--color-blue)/0.72)] uppercase"
				>
					Chronicle
				</p>
				<Card.Title class="font-display text-2xl leading-tight font-semibold md:text-[2rem]">
					<a
						href="/journal/{entry.id}"
						class="inline-flex items-center gap-2 rounded-md transition-colors hover:text-[oklch(var(--color-blue))] focus-visible:text-[oklch(var(--color-blue))]"
					>
						<Calendar class="h-4 w-4 shrink-0 opacity-70" />
						<span>{formatDateHeuristic(entry.date, { fallback: 'long' })}</span>
					</a>
				</Card.Title>
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								href="/journal/{entry.id}"
								variant="ghost"
								size="icon-sm"
								class="border border-white/55 bg-white/68 text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
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
								onclick={() => (openDeleteModal = true)}
								class="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/15 border border-white/55 bg-white/68 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
								aria-label="Delete entry"
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Delete</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>

		<Card.Content class="flex-1 p-0">
			<div
				class="prose prose-slate dark:prose-invert prose-headings:font-display prose-p:leading-7 prose-blockquote:border-l-blue-300 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-300 max-w-none text-[15px] leading-7"
			>
				{@html previewHtml}
			</div>
		</Card.Content>

		{#if hasMetadata}
			<div
				class="flex flex-wrap gap-2 text-xs tracking-[0.24em] text-slate-600/85 uppercase dark:text-slate-300/85"
			>
				{#if entry.location}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/68 px-3 py-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
					>
						<MapPin class="h-3.5 w-3.5" />
						{entry.location}
					</span>
				{/if}
				{#if entry.weather?.temp || entry.weather?.condition}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/68 px-3 py-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
					>
						<Cloud class="h-3.5 w-3.5" />
						{#if entry.weather?.temp}
							<span>{entry.weather.temp}°C</span>
						{/if}
						{#if entry.weather?.condition}
							<span>{entry.weather.condition}</span>
						{/if}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</Card.Root>

<ConfirmDialog
	bind:open={openDeleteModal}
	id={entry.id}
	actionUrl={`/journal/${entry.id}?/delete`}
	title="Delete Journal Entry"
	message="Are you sure you want to delete this journal entry?"
	confirmButtonText="Delete"
/>
