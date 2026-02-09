<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	interface Props {
		count?: number;
	}

	let { count = 3 }: Props = $props();
</script>

<div class="space-y-4">
	{#each Array(count) as _, i (i)}
		<Card.Root>
			<Card.Content class="p-6">
				<div class="space-y-3">
					<div class="flex items-start justify-between">
						<div class="flex-1 space-y-2">
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="h-3 w-1/2" />
						</div>
						<Skeleton class="h-8 w-20" />
					</div>
					<Skeleton class="h-20 w-full" />
					<div class="flex gap-2">
						<Skeleton class="h-6 w-16" />
						<Skeleton class="h-6 w-16" />
						<Skeleton class="h-6 w-16" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
