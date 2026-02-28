<script lang="ts">
import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

import * as Alert from '$lib/components/ui/alert';

interface Props {
	message?: string;
	variant?: 'default' | 'destructive';
}

let { message = 'An error occurred', variant = 'destructive' }: Props = $props();
</script>

<Alert.Root {variant}>
	<AlertCircleIcon class="h-4 w-4" />
	<Alert.Title>Error</Alert.Title>
	<Alert.Description>{message}</Alert.Description>
</Alert.Root>
