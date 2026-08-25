import { type Features, renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';

import DataTableSortButton from './DataTableSortButton.svelte';

export type AdminApiLogEntry = {
	id: string;
	apiKeyId: string;
	apiKeyName: string | null;
	apiKeyExists: boolean;
	userId: string;
	user: { name: string | null; email: string };
	method: string;
	path: string;
	action: string;
	statusCode: number;
	createdAt: string;
};

export const columns: ColumnDef<Features, AdminApiLogEntry>[] = [
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				columnName: 'Created',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
	},
	{
		accessorKey: 'user',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				columnName: 'User',
				onclick: column.getToggleSortingHandler()
			}),
		accessorFn: (row) => row.user.email,
		cell: ({ row }) => row.original.user.name || row.original.user.email
	},
	{
		accessorKey: 'apiKeyId',
		header: 'API Key',
		cell: ({ row }) => {
			const keySnippet = createRawSnippet<[{ name: string | null; id: string; exists: boolean }]>(
				(getKey) => {
					const { name, id, exists } = getKey();
					return {
						render: () =>
							exists
								? `<span>${name || '(unnamed)'}</span>`
								: `<div><span class="font-mono text-xs">${id}</span><div class="text-sm text-muted-foreground">Key no longer exists</div></div>`
					};
				}
			);
			return renderSnippet(keySnippet, {
				name: row.original.apiKeyName,
				id: row.original.apiKeyId,
				exists: row.original.apiKeyExists
			});
		}
	},
	{
		accessorKey: 'method',
		header: 'Method'
	},
	{
		accessorKey: 'path',
		header: 'Path'
	},
	{
		accessorKey: 'action',
		header: 'Action'
	},
	{
		accessorKey: 'statusCode',
		header: 'Status',
		cell: ({ row }) => {
			const statusSnippet = createRawSnippet<[number]>((getStatus) => {
				const status = getStatus();
				const colorClass = status >= 400 ? 'text-red-600' : 'text-green-600';
				return {
					render: () => `<span class="font-medium ${colorClass}">${status}</span>`
				};
			});
			return renderSnippet(statusSnippet, row.original.statusCode);
		}
	}
];
