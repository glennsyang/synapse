<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { banned }: { banned: boolean } = $props();
</script>

{#if banned}
	<Badge variant="destructive">Banned</Badge>
{:else}
	<Badge
		variant="outline"
		class="border-pen-fitness/35 bg-pen-fitness/12 text-pen-fitness dark:border-pen-fitness/30 dark:bg-pen-fitness/18 dark:text-pen-fitness"
	>
		Active
	</Badge>
{/if}
