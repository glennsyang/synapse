<script lang="ts">
	import { Check, ChevronsUpDown, X } from '@lucide/svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';

	const durationOptions = [
		{ value: 10, label: '10 min' },
		{ value: 15, label: '15 min' },
		{ value: 20, label: '20 min' },
		{ value: 30, label: '30 min' }
	];

	// Parse selected duration from URL (single value)
	let selectedDuration = $derived.by(() => {
		const param = page.url.searchParams.get('duration');
		if (!param) return null;
		const parsed = Number.parseInt(param, 10);
		return durationOptions.some((o) => o.value === parsed) ? parsed : null;
	});

	let selectedOption = $derived(durationOptions.find((o) => o.value === selectedDuration) ?? null);

	let open = $state(false);

	function toggleDuration(duration: number) {
		// Single-select: clicking same value deselects
		const newValue = selectedDuration === duration ? null : duration;
		updateUrl(newValue);
		open = false;
	}

	function updateUrl(duration: number | null) {
		const url = new URL(page.url);
		if (duration !== null) {
			url.searchParams.set('duration', String(duration));
		} else {
			url.searchParams.delete('duration');
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
						class="h-10 w-full justify-between bg-background/90"
					>
						<span class="truncate">
							{selectedDuration !== null ? `${selectedDuration} min` : 'Duration'}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-40 max-w-[calc(100vw-2rem)] p-0">
				<Command.Root>
					<Command.Group>
						{#each durationOptions as option (option.value)}
							<Command.Item value={option.label} onSelect={() => toggleDuration(option.value)}>
								<div
									class={cn(
										'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
										selectedDuration === option.value
											? 'bg-primary text-primary-foreground'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<Check class="h-4 w-4" />
								</div>
								<span>{option.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					{#if selectedDuration !== null}
						<Command.Separator />
						<Command.Group>
							<Command.Item
								onSelect={() => updateUrl(null)}
								class="justify-center text-center text-sm text-muted-foreground"
							>
								Clear duration
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if selectedOption !== null}
		<div class="flex flex-wrap gap-2">
			<Badge
				variant="outline"
				class="gap-1 border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-200"
			>
				{selectedOption.label}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onclick={() => updateUrl(null)}
					class="size-5 hover:text-destructive"
					aria-label="Remove duration filter"
				>
					<X class="h-3 w-3" />
				</Button>
			</Badge>
		</div>
	{/if}
</div>
