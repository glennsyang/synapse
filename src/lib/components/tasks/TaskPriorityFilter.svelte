<script lang="ts">
import { Check, ChevronsUpDown, X } from '@lucide/svelte';
import { SvelteSet } from 'svelte/reactivity';

import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Command from '$lib/components/ui/command';
import * as Popover from '$lib/components/ui/popover';
import { cn } from '$lib/utils';

import { type TaskPriority, taskPriorityOptions } from './task-ui';

const validPriorities = new Set<TaskPriority>([1, 2, 3, 4]);

let selectedPriorities = $derived.by(() => {
	const priorityParam = page.url.searchParams.get('priority');
	const parsedValues = priorityParam
		? priorityParam
				.split(',')
				.map((value) => Number.parseInt(value.trim(), 10))
				.filter((value): value is TaskPriority => validPriorities.has(value as TaskPriority))
		: [];

	return Array.from(new Set(parsedValues)).sort((left, right) => left - right) as TaskPriority[];
});

let selectedPriorityOptions = $derived(
	taskPriorityOptions.filter((option) => selectedPriorities.includes(option.value))
);

let open = $state(false);

function togglePriority(priority: TaskPriority) {
	const current = new SvelteSet(selectedPriorities);
	if (current.has(priority)) {
		current.delete(priority);
	} else {
		current.add(priority);
	}

	void updateUrl(Array.from(current).sort((left, right) => left - right) as TaskPriority[]);
}

function removePriority(priority: TaskPriority) {
	void updateUrl(selectedPriorities.filter((value) => value !== priority));
}

function clearAll() {
	void updateUrl([]);
}

async function updateUrl(priorities: TaskPriority[]) {
	const url = new URL(page.url);
	if (priorities.length > 0) {
		url.searchParams.set('priority', priorities.join(','));
	} else {
		url.searchParams.delete('priority');
	}

	await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
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
							{selectedPriorities.length > 0
								? `${selectedPriorities.length} priorit${selectedPriorities.length > 1 ? 'ies' : 'y'} selected`
								: 'Priority'}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-75 max-w-[calc(100vw-2rem)] p-0">
				<Command.Root>
					<Command.Input placeholder="Search priorities..." />
					<Command.Empty>No priorities found.</Command.Empty>
					<Command.Group>
						{#each taskPriorityOptions as option (option.value)}
							<Command.Item
								value={`${option.label} ${option.valueLabel}`}
								onSelect={() => {
									togglePriority(option.value);
								}}
							>
								<div
									class={cn(
										'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
										selectedPriorities.includes(option.value)
											? 'bg-primary text-primary-foreground'
											: 'opacity-50 [&_svg]:invisible'
									)}
								>
									<Check class="h-4 w-4" />
								</div>
								<div class="flex items-center gap-2">
									<span class={['size-2.5 rounded-full', option.dotClass]}></span>
									<span>{option.label}</span>
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
					{#if selectedPriorities.length > 0}
						<Command.Separator />
						<Command.Group>
							<Command.Item
								onSelect={clearAll}
								class="justify-center text-center text-sm text-muted-foreground"
							>
								Clear priorities
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if selectedPriorityOptions.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedPriorityOptions as option (option.value)}
				<Badge variant="outline" class={['gap-1', option.badgeClass]}>
					{option.label}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removePriority(option.value)}
						class="size-5 hover:text-destructive"
						aria-label={`Remove priority ${option.label}`}
					>
						<X class="h-3 w-3" />
					</Button>
				</Badge>
			{/each}
		</div>
	{/if}
</div>
