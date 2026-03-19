<script lang="ts">
import type { HTMLTextareaAttributes } from 'svelte/elements';
import { cn, type WithoutChildren } from '$lib/utils';

let {
	value = $bindable(),
	class: className,
	...restProps
}: WithoutChildren<HTMLTextareaAttributes> = $props();
</script>

<textarea
	bind:value
	class={cn(
		'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
		className
	)}
	{...restProps}
></textarea>
