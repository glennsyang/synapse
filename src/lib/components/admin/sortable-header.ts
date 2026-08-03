import { renderSnippet } from '$lib/components/ui/data-table';
import type { HeaderContext } from '@tanstack/table-core';
import type { Snippet } from 'svelte';

export type SortableHeaderProps = {
	label: string;
	sorted: false | 'asc' | 'desc';
	onclick: (event: MouseEvent) => void;
};

export function sortableHeader<TData>(
	label: string,
	headerSnippet: Snippet<[SortableHeaderProps]>
) {
	return ({ column }: HeaderContext<TData, unknown>) =>
		renderSnippet(headerSnippet, {
			label,
			sorted: column.getIsSorted(),
			onclick: column.getToggleSortingHandler() ?? (() => {})
		});
}
