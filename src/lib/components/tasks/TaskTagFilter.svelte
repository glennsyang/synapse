<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Check, ChevronsUpDown, X } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	type Props = {
		allTags: string[];
	};

	let { allTags }: Props = $props();

	// Parse selected tags from URL
	let selectedTags = $derived.by(() => {
		const tagParam = page.url.searchParams.get('tag');
		return tagParam
			? Array.from(
					new Set(
						tagParam
							.split(',')
							.map((tag) => tag.trim())
							.filter(Boolean)
					)
				)
			: [];
	});

	let open = $state(false);

	function toggleTag(tag: string) {
		const current = new SvelteSet(selectedTags);
		if (current.has(tag)) {
			current.delete(tag);
		} else {
			current.add(tag);
		}

		updateUrl(Array.from(current));
	}

	function removeTag(tag: string) {
		const current = selectedTags.filter((t) => t !== tag);
		updateUrl(current);
	}

	function clearAll() {
		updateUrl([]);
	}

	function updateUrl(tags: string[]) {
		const url = new URL(page.url);
		if (tags.length > 0) {
			url.searchParams.set('tag', tags.join(','));
		} else {
			url.searchParams.delete('tag');
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
							{selectedTags.length > 0
								? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
								: 'Tags'}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-75 max-w-[calc(100vw-2rem)] p-0">
				<Command.Root>
					<Command.Input placeholder="Search tags..." />
					<Command.Empty>No tags found.</Command.Empty>
					<Command.Group class="max-h-75 overflow-auto">
						{#each allTags as tag (tag)}
							<Command.Item
								value={tag}
								onSelect={() => {
									toggleTag(tag);
								}}
							>
								<div
									class={cn(
										'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
										selectedTags.includes(tag)
											? 'bg-primary text-primary-foreground'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<Check class="h-4 w-4" />
								</div>
								<span>{tag}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					{#if selectedTags.length > 0}
						<Command.Separator />
						<Command.Group>
							<Command.Item
								onSelect={clearAll}
								class="text-muted-foreground justify-center text-center text-sm"
							>
								Clear filters
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if selectedTags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedTags as tag (tag)}
				<Badge variant="secondary" class="gap-1">
					{tag}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removeTag(tag)}
						class="hover:text-destructive size-5"
						aria-label={`Remove tag ${tag}`}
					>
						<X class="h-3 w-3" />
					</Button>
				</Badge>
			{/each}
		</div>
	{/if}
</div>
