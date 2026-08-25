import { type Features, renderComponent } from '$lib/components/ui/data-table';
import type { people } from '$lib/server/db/schema';
import { formatDateMedium } from '$lib/utils/date';
import type { ColumnDef } from '@tanstack/table-core';

import DataTableActions from './archived-table-actions.svelte';
import DataTableSortButton from './DataTableSortButton.svelte';

export type ArchivedPerson = typeof people.$inferSelect & {
	ownerEmail: string;
	lastVisitDate: string | null;
};

export const columns: ColumnDef<Features, ArchivedPerson>[] = [
	{
		accessorKey: 'ownerEmail',
		header: 'Owner'
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
		accessorKey: 'lastVisitDate',
		header: 'Last Visit Date',
		cell: ({ row }) =>
			row.original.lastVisitDate ? formatDateMedium(row.original.lastVisitDate) : '—'
	},
	{
		accessorKey: 'archivedAt',
		header: 'Archived Date',
		cell: ({ row }) =>
			row.original.archivedAt ? formatDateMedium(row.original.archivedAt.slice(0, 10)) : '—'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(DataTableActions, {
				archivedPerson: row.original
			});
		}
	}
];
