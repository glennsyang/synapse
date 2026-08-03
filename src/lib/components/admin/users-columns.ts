import { renderComponent } from '$lib/components/ui/data-table';
import type { User } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';
import type { Snippet } from 'svelte';

import RoleBadge from './RoleBadge.svelte';
import { sortableHeader, type SortableHeaderProps } from './sortable-header';
import StatusBadge from './StatusBadge.svelte';

export function createUsersColumns(
	headerSnippet: Snippet<[SortableHeaderProps]>
): ColumnDef<User>[] {
	return [
		{
			accessorKey: 'email',
			header: sortableHeader('Email', headerSnippet)
		},
		{
			accessorKey: 'name',
			header: sortableHeader('Name', headerSnippet)
		},
		{
			accessorKey: 'role',
			header: sortableHeader('Role', headerSnippet),
			cell: ({ row }) => renderComponent(RoleBadge, { role: row.original.role })
		},
		{
			id: 'status',
			accessorFn: (row) => (row.banned ? 'Banned' : 'Active'),
			header: sortableHeader('Status', headerSnippet),
			cell: ({ row }) => renderComponent(StatusBadge, { banned: row.original.banned })
		},
		{
			accessorKey: 'createdAt',
			header: sortableHeader('Created Date', headerSnippet),
			sortingFn: 'datetime',
			cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
		}
	];
}
