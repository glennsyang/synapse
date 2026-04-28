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

	import { type TaskDueDateFilter, taskDueDateFilterOptions } from './task-ui';

	const validDueDateFilters = new Set<TaskDueDateFilter>(['overdue', 'today', 'upcoming']);

	let selectedDueDateFilters = $derived.by(() => {
		const dueDateParam = page.url.searchParams.get('dueDate');
		const parsedValues = dueDateParam
			? dueDateParam
					.split(',')
					.map((value) => value.trim())
					.filter((value): value is TaskDueDateFilter =>
						validDueDateFilters.has(value as TaskDueDateFilter)
					)
			: [];

		return Array.from(new Set(parsedValues));
	});

	let selectedDueDateOptions = $derived(
		taskDueDateFilterOptions.filter((option) => selectedDueDateFilters.includes(option.value))
	);

	let open = $state(false);

	function toggleDueDateFilter(filter: TaskDueDateFilter) {
		const current = new SvelteSet(selectedDueDateFilters);
		if (current.has(filter)) {
			current.delete(filter);
		} else {
			current.add(filter);
		}

		void updateUrl(Array.from(current));
	}

	function removeDueDateFilter(filter: TaskDueDateFilter) {
		void updateUrl(selectedDueDateFilters.filter((value) => value !== filter));
	}

	function clearAll() {
		void updateUrl([]);
	}

	async function updateUrl(filters: TaskDueDateFilter[]) {
		const url = new URL(page.url);
		if (filters.length > 0) {
			url.searchParams.set('dueDate', filters.join(','));
		} else {
			url.searchParams.delete('dueDate');
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
							{selectedDueDateFilters.length > 0
								? `${selectedDueDateFilters.length} due date filter${selectedDueDateFilters.length > 1 ? 's' : ''} selected`
								: 'Due date'}
						</span>
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-75 max-w-[calc(100vw-2rem)] p-0">
				<Command.Root>
					<Command.Input placeholder="Search due date filters..." />
					<Command.Empty>No due date filters found.</Command.Empty>
					<Command.Group>
						{#each taskDueDateFilterOptions as option (option.value)}
							<Command.Item
								value={`${option.label} ${option.valueLabel}`}
								onSelect={() => {
									toggleDueDateFilter(option.value);
								}}
							>
								<div
									class={cn(
										'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
										selectedDueDateFilters.includes(option.value)
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
					{#if selectedDueDateFilters.length > 0}
						<Command.Separator />
						<Command.Group>
							<Command.Item
								onSelect={clearAll}
								class="justify-center text-center text-sm text-muted-foreground"
							>
								Clear due date filters
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if selectedDueDateOptions.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedDueDateOptions as option (option.value)}
				<Badge variant="outline" class={['gap-1', option.badgeClass]}>
					{option.label}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removeDueDateFilter(option.value)}
						class="size-5 hover:text-destructive"
						aria-label={`Remove due date filter ${option.label}`}
					>
						<X class="h-3 w-3" />
					</Button>
				</Badge>
			{/each}
		</div>
	{/if}
</div>
