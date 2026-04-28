<script lang="ts">
	import { RefreshCwIcon, TriangleAlert } from '@lucide/svelte/icons';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { logger } from '$lib/utils/logger';

	interface Props {
		error?: Error | string | null;
		title?: string;
		description?: string;
		showRetry?: boolean;
		onRetry?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		error = null,
		title = 'Something went wrong',
		description = 'An unexpected error occurred. Please try again.',
		showRetry = true,
		onRetry,
		children
	}: Props = $props();

	let hasError = $derived(error !== null);
	let errorMessage = $derived(
		error instanceof Error ? error.message : typeof error === 'string' ? error : description
	);

	function handleRetry() {
		if (onRetry) {
			onRetry();
		} else {
			// Default retry: reload page
			window.location.reload();
		}
	}

	$effect(() => {
		if (hasError) {
			logger.error('Error boundary caught error', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
		}
	});
</script>

{#if hasError}
	<Card.Root class="border-destructive">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-destructive">
				<TriangleAlert class="h-5 w-5" />
				{title}
			</Card.Title>
			<Card.Description>{errorMessage}</Card.Description>
		</Card.Header>
		{#if showRetry}
			<Card.Footer>
				<Button variant="outline" onclick={handleRetry} class="gap-2">
					<RefreshCwIcon class="h-4 w-4" />
					Try Again
				</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
{:else if children}
	{@render children()}
{/if}
