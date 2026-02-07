<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';

	let {
		consumed,
		target
	}: {
		consumed: number;
		target: number | null;
	} = $props();

	let percentage = $derived(target ? Math.min((consumed / target) * 100, 100) : 0);
	let remaining = $derived(target ? Math.max(target - consumed, 0) : 0);
	let isOverTarget = $derived(target ? consumed > target : false);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Daily Calorie Progress</Card.Title>
		<Card.Description>Today's calorie intake vs target</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="text-center">
				<p class="text-2xl font-bold">{consumed}</p>
				<p class="text-xs text-muted-foreground">Consumed</p>
			</div>
			{#if target}
				<div class="text-center">
					<p class="text-2xl font-bold">{target}</p>
					<p class="text-xs text-muted-foreground">Target</p>
				</div>
				<div class="text-center">
					<p
						class="text-2xl font-bold"
						class:text-destructive={isOverTarget}
						class:text-green-600={!isOverTarget}
					>
						{isOverTarget ? `+${consumed - target}` : remaining}
					</p>
					<p class="text-xs text-muted-foreground">{isOverTarget ? 'Over' : 'Remaining'}</p>
				</div>
			{/if}
		</div>

		{#if target}
			<div class="space-y-2">
				<Progress value={percentage} class="h-2" />
				<p class="text-center text-xs text-muted-foreground">
					{percentage.toFixed(1)}% of daily target
				</p>
			</div>
		{:else}
			<p class="text-center text-sm text-muted-foreground">
				Set a daily calorie target to track progress
			</p>
		{/if}
	</Card.Content>
</Card.Root>
