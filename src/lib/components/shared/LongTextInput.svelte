<script lang="ts">
	import { cn, type WithoutChildren } from '$lib/utils';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		value = $bindable(),
		class: className,
		...restProps
	}: WithoutChildren<HTMLTextareaAttributes> = $props();
</script>

<textarea
	bind:value
	class={cn(
		'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none',
		className
	)}
	{...restProps}
></textarea>
