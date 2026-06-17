<script lang="ts">
	import JournalEntryForm from '$lib/components/journal/JournalEntryForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const form = $derived(data.form);
	const journalFormData = $derived({ form });
</script>

<JournalEntryForm data={journalFormData} mode="new" />
