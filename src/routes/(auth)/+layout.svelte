<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<!-- The closed planner: indigo cloth cover, one sheet of paper to sign in on. -->
<div class="flex min-h-dvh flex-col items-center justify-center bg-cover px-4 py-10">
	<a href="/" class="text-cover-foreground mb-8 flex flex-col items-center gap-2">
		<span
			class="border-cover-foreground/70 grid size-12 place-items-center rounded-full border-2 text-xl font-black"
			aria-hidden="true">S</span
		>
		<span class="text-sm font-black tracking-[0.3em] uppercase">Synapse</span>
		<span class="text-cover-muted text-xs">Your Second Brain</span>
	</a>

	<div class="auth-sheet w-full max-w-sm">{@render children()}</div>
</div>

<style>
	.auth-sheet :global([data-slot='card']) {
		border-radius: 3px;
		background-color: var(--paper);
		background-image:
			linear-gradient(var(--grid-line) 1px, transparent 1px),
			linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
		background-size: 14px 14px;
		background-position: -1px -1px;
	}
	.auth-sheet :global([data-slot='card-title']) {
		font-weight: 900;
		letter-spacing: -0.02em;
	}
</style>
