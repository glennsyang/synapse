import { type Features, renderComponent } from '$lib/components/ui/data-table';
import type { ColumnDef } from '@tanstack/table-core';

import DataTableActions from './api-key-table-actions.svelte';
import ApiKeyScopesBadges from './ApiKeyScopesBadges.svelte';
import ApiKeyStatusBadge from './ApiKeyStatusBadge.svelte';

export type AdminApiKey = {
	id: string;
	name: string | null;
	start: string | null;
	enabled: boolean;
	permissions: Record<string, string[]> | null;
	expiresAt: Date | string | null;
	createdAt: Date | string;
	lastRequest: Date | string | null;
};

export const columns: ColumnDef<Features, AdminApiKey>[] = [
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => row.original.name || '(unnamed)'
	},
	{
		accessorKey: 'start',
		header: 'Key',
		cell: ({ row }) => (row.original.start ? `${row.original.start}…` : '—')
	},
	{
		id: 'scopes',
		header: 'Scopes',
		cell: ({ row }) =>
			renderComponent(ApiKeyScopesBadges, { permissions: row.original.permissions })
	},
	{
		accessorKey: 'enabled',
		header: 'Status',
		cell: ({ row }) => renderComponent(ApiKeyStatusBadge, { enabled: row.original.enabled })
	},
	{
		accessorKey: 'expiresAt',
		header: 'Expires',
		cell: ({ row }) =>
			row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'
	},
	{
		accessorKey: 'lastRequest',
		header: 'Last used',
		cell: ({ row }) =>
			row.original.lastRequest ? new Date(row.original.lastRequest).toLocaleDateString() : 'Never'
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
	},
	{
		id: 'actions',
		cell: ({ row }) => renderComponent(DataTableActions, { apiKey: row.original })
	}
];
