<script lang="ts" generics="TData, TValue">
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table';
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ChevronsLeftIcon,
		ChevronsRightIcon
	} from '@lucide/svelte';
	import type {
		ColumnDef,
		PaginationState,
		SortingState,
		VisibilityState
	} from '@tanstack/table-core';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';

	let {
		columns,
		data,
		searchPlaceholder,
		defaultPageSize = 10,
		defaultSorting = [],
		emptyMessage = 'No results found.'
	}: {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		searchPlaceholder?: string;
		defaultPageSize?: number;
		defaultSorting?: SortingState;
		emptyMessage?: string;
	} = $props();

	// svelte-ignore state_referenced_locally
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize });
	// svelte-ignore state_referenced_locally
	let sorting = $state<SortingState>(defaultSorting);
	let globalFilter = $state<string>('');
	let columnVisibility = $state<VisibilityState>({});

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onGlobalFilterChange: (updater) => {
			globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get globalFilter() {
				return globalFilter;
			},
			get columnVisibility() {
				return columnVisibility;
			}
		},
		globalFilterFn: 'includesString'
	});
</script>

<div class="space-y-4">
	{#if searchPlaceholder}
		<Input
			placeholder={searchPlaceholder}
			value={table.getState().globalFilter ?? ''}
			onchange={(e) => table.setGlobalFilter(e.currentTarget.value)}
			oninput={(e) => table.setGlobalFilter(e.currentTarget.value)}
			class="max-w-sm"
		/>
	{/if}

	<div class="overflow-x-auto rounded-xl border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="text-muted-foreground text-center">
							{emptyMessage}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex items-center justify-between py-4">
		<div class="hidden items-center gap-2 lg:flex">
			<Label for="rows-per-page" class="text-sm font-medium">Rows per page</Label>
			<Select.Root
				type="single"
				bind:value={
					() => `${table.getState().pagination.pageSize}`, (v) => table.setPageSize(Number(v))
				}
			>
				<Select.Trigger size="sm" class="w-20" id="rows-per-page">
					{table.getState().pagination.pageSize}
				</Select.Trigger>
				<Select.Content side="top">
					{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
						<Select.Item value={pageSize.toString()}>
							{pageSize}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex w-fit items-center justify-center text-sm font-medium">
			Page {table.getState().pagination.pageIndex + 1} of
			{table.getPageCount()}
		</div>
		<div class="ms-auto flex items-center gap-2 lg:ms-0">
			<Button
				variant="outline"
				class="hidden h-8 w-8 p-0 lg:flex"
				onclick={() => table.setPageIndex(0)}
				disabled={!table.getCanPreviousPage()}
			>
				<span class="sr-only">Go to first page</span>
				<ChevronsLeftIcon />
			</Button>
			<Button
				variant="outline"
				class="size-8"
				size="icon"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<span class="sr-only">Go to previous page</span>
				<ChevronLeftIcon />
			</Button>
			<Button
				variant="outline"
				class="size-8"
				size="icon"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				<span class="sr-only">Go to next page</span>
				<ChevronRightIcon />
			</Button>
			<Button
				variant="outline"
				class="hidden size-8 lg:flex"
				size="icon"
				onclick={() => table.setPageIndex(table.getPageCount() - 1)}
				disabled={!table.getCanNextPage()}
			>
				<span class="sr-only">Go to last page</span>
				<ChevronsRightIcon />
			</Button>
		</div>
	</div>
</div>
