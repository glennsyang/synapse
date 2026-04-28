<script lang="ts">
	import JournalEntryForm from '$lib/components/journal/JournalEntryForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<JournalEntryForm {data} mode="new" />
