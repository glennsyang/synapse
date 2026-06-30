<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { MOOD_TAGS } from '$lib/schemas/meditation';
	import { Check, ChevronsUpDown, X } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	const moodOptions = [
		{
			value: 'Anxious',
			dotClass: 'bg-amber-500',
			badgeClass:
				'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
		},
		{
			value: 'Low Energy',
			dotClass: 'bg-blue-500',
			badgeClass:
				'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
		},
		{
			value: 'Focused',
			dotClass: 'bg-green-500',
			badgeClass:
				'border-green-200 bg-green-100 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200'
		},
		{
			value: 'Pre-Sleep',
			dotClass: 'bg-purple-500',
			badgeClass:
				'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-200'
		},
		{
			value: 'General',
			dotClass: 'bg-gray-400',
			badgeClass:
				'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200'
		}
	] as const;

	type MoodTag = (typeof MOOD_TAGS)[number];

	// Parse selected moods from URL
	let selectedMoods = $derived.by(() => {
		const moodParam = page.url.searchParams.get('mood');
		return moodParam
			? Array.from(
					new Set(
						moodParam
							.split(',')
							.map((m) => m.trim())
							.filter((m): m is MoodTag => MOOD_TAGS.includes(m as MoodTag))
					)
				)
			: [];
	});

	let selectedMoodOptions = $derived(moodOptions.filter((o) => selectedMoods.includes(o.value)));

	let open = $state(false);

	function toggleMood(mood: MoodTag) {
		const current = new SvelteSet(selectedMoods);
		if (current.has(mood)) {
			current.delete(mood);
		} else {
			current.add(mood);
		}
		updateUrl(Array.from(current));
	}

	function removeMood(mood: MoodTag) {
		updateUrl(selectedMoods.filter((m) => m !== mood));
	}

	function clearAll() {
		updateUrl([]);
	}

	function updateUrl(moods: MoodTag[]) {
		const url = new URL(page.url);
		if (moods.length > 0) {
			url.searchParams.set('mood', moods.join(','));
		} else {
			url.searchParams.delete('mood');
		}
		void goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}
</script>

<div class="w-full space-y-2">
	<div class="flex items-center gap-2">
		<Popover.Root bind:open>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						role="combobox"
						aria-expanded={open}
						class="bg-background/90 h-10 w-full justify-between"
					>
						<span class="truncate">
							{selectedMoods.length > 0
								? `${selectedMoods.length} mood${selectedMoods.length > 1 ? 's' : ''} selected`
								: 'Mood'}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-56 max-w-[calc(100vw-2rem)] p-0">
				<Command.Root>
					<Command.Input placeholder="Search moods..." />
					<Command.Empty>No moods found.</Command.Empty>
					<Command.Group>
						{#each moodOptions as option (option.value)}
							<Command.Item value={option.value} onSelect={() => toggleMood(option.value)}>
								<div
									class={cn(
										'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
										selectedMoods.includes(option.value)
											? 'bg-primary text-primary-foreground'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<Check class="h-4 w-4" />
								</div>
								<div class="flex items-center gap-2">
									<span class={['size-2.5 rounded-full', option.dotClass]}></span>
									<span>{option.value}</span>
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
					{#if selectedMoods.length > 0}
						<Command.Separator />
						<Command.Group>
							<Command.Item
								onSelect={clearAll}
								class="text-muted-foreground justify-center text-center text-sm"
							>
								Clear moods
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if selectedMoodOptions.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedMoodOptions as option (option.value)}
				<Badge variant="outline" class={['gap-1', option.badgeClass]}>
					{option.value}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removeMood(option.value)}
						class="hover:text-destructive size-5"
						aria-label={`Remove mood ${option.value}`}
					>
						<X class="h-3 w-3" />
					</Button>
				</Badge>
			{/each}
		</div>
	{/if}
</div>
