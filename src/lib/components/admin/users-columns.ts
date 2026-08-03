import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import type { User } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';

import DataTableSortButton from './DataTableSortButton.svelte';
import StatusBadge from './StatusBadge.svelte';

export const columns: ColumnDef<User>[] = [
	{
		accessorKey: 'email',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				columnName: 'Email',
				onclick: column.getToggleSortingHandler()
			})
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				columnName: 'Name',
				onclick: column.getToggleSortingHandler()
			})
	},
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ row }) => {
			const roleSnippet = createRawSnippet<[string]>(() => {
				const role = row.original.role ?? 'user';
				const badgeClass =
					role === 'admin'
						? 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
						: 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
				return {
					render: () => `<span class="${badgeClass}">${role}</span>`
				};
			});

			return renderSnippet(roleSnippet);
		}
	},
	{
		accessorKey: 'status',
		header: 'Status',
		accessorFn: (row) => (row.banned ? 'Banned' : 'Active'),
		cell: ({ row }) => renderComponent(StatusBadge, { banned: row.original.banned })
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell: ({ row }) => {
			return new Date(row.original.createdAt).toLocaleDateString();
		}
	}
];
