<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { banned }: { banned: boolean } = $props();
</script>

{#if banned}
	<Badge variant="destructive">Banned</Badge>
{:else}
	<Badge
		variant="outline"
		class="border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-900 dark:text-green-200"
	>
		Active
	</Badge>
{/if}
