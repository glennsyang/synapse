<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { enabled }: { enabled: boolean } = $props();
</script>

{#if enabled}
	<Badge
		variant="outline"
		class="border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-900 dark:text-green-200"
	>
		Active
	</Badge>
{:else}
	<Badge variant="destructive">Disabled</Badge>
{/if}
