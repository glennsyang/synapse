import { renderSnippet } from '$lib/components/ui/data-table';
import type { people } from '$lib/server/db/schema';
import { formatDateMedium } from '$lib/utils/date';
import type { ColumnDef, SortingFn } from '@tanstack/table-core';
import type { Snippet } from 'svelte';

import { sortableHeader, type SortableHeaderProps } from './sortable-header';

export type ArchivedPerson = typeof people.$inferSelect & {
	ownerEmail: string;
	lastVisitDate: string | null;
};

const sortNullableDateString: SortingFn<ArchivedPerson> = (rowA, rowB, columnId) => {
	const a = rowA.getValue<string | null>(columnId);
	const b = rowB.getValue<string | null>(columnId);

	if (!a && !b) return 0;
	if (!a) return 1;
	if (!b) return -1;
	return a > b ? 1 : a < b ? -1 : 0;
};

export function createArchivedPersonsColumns(
	headerSnippet: Snippet<[SortableHeaderProps]>,
	unarchiveActionSnippet: Snippet<[ArchivedPerson]>
): ColumnDef<ArchivedPerson>[] {
	return [
		{
			accessorKey: 'ownerEmail',
			header: 'Owner'
		},
		{
			accessorKey: 'name',
			header: sortableHeader('Name', headerSnippet)
		},
		{
			accessorKey: 'lastVisitDate',
			header: sortableHeader('Last Visit Date', headerSnippet),
			sortingFn: sortNullableDateString,
			cell: ({ row }) =>
				row.original.lastVisitDate ? formatDateMedium(row.original.lastVisitDate) : '—'
		},
		{
			accessorKey: 'archivedAt',
			header: sortableHeader('Archived Date', headerSnippet),
			sortingFn: sortNullableDateString,
			cell: ({ row }) =>
				row.original.archivedAt ? formatDateMedium(row.original.archivedAt.slice(0, 10)) : '—'
		},
		{
			id: 'actions',
			header: 'Actions',
			enableSorting: false,
			enableGlobalFilter: false,
			cell: ({ row }) => renderSnippet(unarchiveActionSnippet, row.original)
		}
	];
}
