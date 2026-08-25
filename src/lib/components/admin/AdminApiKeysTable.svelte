<script lang="ts">
	import type { AdminApiKey } from './api-keys-columns';
	import { columns } from './api-keys-columns';
	import DataTable from './DataTable.svelte';

	let { apiKeys }: { apiKeys: AdminApiKey[] } = $props();
</script>

<DataTable
	{columns}
	data={apiKeys}
	defaultPageSize={10}
	defaultSorting={[{ id: 'createdAt', desc: true }]}
	emptyMessage="No API keys yet."
/>
