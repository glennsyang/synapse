<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	let { permissions }: { permissions: Record<string, string[]> | null } = $props();

	const scopes = $derived(
		permissions
			? Object.entries(permissions).flatMap(([resource, actions]) =>
					actions.map((action) => `${resource}:${action}`)
				)
			: []
	);
</script>

{#if scopes.length > 0}
	<div class="flex flex-wrap gap-1">
		{#each scopes as scope (scope)}
			<Badge variant="outline">{scope}</Badge>
		{/each}
	</div>
{:else}
	<span class="text-muted-foreground">—</span>
{/if}
