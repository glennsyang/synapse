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
			? 'bg-pen-fitness/12 text-pen-fitness dark:bg-pen-fitness/20 dark:text-pen-fitness'
			: 'bg-destructive/12 text-destructive dark:bg-destructive/20 dark:text-destructive'}"
		role={isSuccess ? 'status' : undefined}
	>
		{message.text}
	</div>
{/if}
