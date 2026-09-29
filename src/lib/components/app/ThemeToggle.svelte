<script lang="ts">
	import { cn } from '$lib';
	import { Moon, Sun } from '@lucide/svelte/icons';
	import { toggleMode } from 'mode-watcher';

	let { class: className = '' }: { class?: string } = $props();
</script>

<button
	type="button"
	onclick={toggleMode}
	class={cn(
		'relative grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2',
		className
	)}
>
	<Sun class="size-[1.1rem] scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
	<Moon
		class="absolute size-[1.1rem] scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
	/>
	<span class="sr-only">Toggle theme</span>
</button>
