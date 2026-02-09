<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		fullScreen?: boolean;
	}

	let { size = 'md', fullScreen = false }: Props = $props();

	const sizeClasses = {
		sm: 'h-6 w-6 border-2',
		md: 'h-12 w-12 border-4',
		lg: 'h-16 w-16 border-4'
	};
</script>

{#if fullScreen}
	<div class="fixed inset-0 flex items-center justify-center">
		<div
			class="{sizeClasses[size]} animate-spin rounded-full border-black border-t-transparent"
		></div>
	</div>
{:else}
	<div class="flex items-center justify-center">
		<div
			class="{sizeClasses[size]} animate-spin rounded-full border-black border-t-transparent"
		></div>
	</div>
{/if}
