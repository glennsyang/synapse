import { type Features, renderComponent } from '$lib/components/ui/data-table';
import type { User } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';

import DataTableSortButton from './DataTableSortButton.svelte';
import RoleBadge from './RoleBadge.svelte';
import StatusBadge from './StatusBadge.svelte';

export const columns: ColumnDef<Features, User>[] = [
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
		cell: ({ row }) => renderComponent(RoleBadge, { role: row.original.role ?? 'user' })
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
