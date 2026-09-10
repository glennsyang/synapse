<script lang="ts">
	// Renders a sveltekit-superforms banner from the shared `{ type, text }` payload
	// (App.Superforms.Message). Styling is driven by `type`, never by sniffing the
	// wording of `text`.

	interface Props {
		message: App.Superforms.Message | undefined;
	}

	let { message }: Props = $props();

	const isSuccess = $derived(message?.type === 'success');
</script>

{#if message}
	<div
		class="rounded-lg p-4 text-sm {isSuccess
			? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
			: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
		role={isSuccess ? 'status' : undefined}
	>
		{message.text}
	</div>
{/if}
