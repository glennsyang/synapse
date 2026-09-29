<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type'> & {
		/** Accessible name when no visible label sits beside the box. */
		label?: string;
	};

	let { checked = false, label, class: className = '', style, ...restProps }: Props = $props();
</script>

<!-- A ruled square ticked by a pen stroke; the native checkbox stays underneath. -->
<label
	class="pen-check relative inline-grid size-7 shrink-0 place-items-center {className}"
	{style}
>
	<input
		type="checkbox"
		class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
		{checked}
		aria-label={label}
		{...restProps}
	/>
	<span
		class="border-foreground/55 peer-focus-visible:outline-ring grid size-[1.05rem] place-items-center rounded-[2px] border-[1.5px] transition-colors duration-150 peer-checked:border-(--pen,currentColor) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50"
		aria-hidden="true"
	>
		<svg viewBox="0 0 16 16" class="size-3.5 overflow-visible">
			<path d="M3.2 8.6l3.1 3 6.4-7.4" pathLength="1" />
		</svg>
	</span>
</label>

<style>
	path {
		fill: none;
		stroke: var(--pen, currentColor);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transition: stroke-dashoffset 220ms cubic-bezier(0.16, 1, 0.3, 1) 60ms;
	}
	input:checked + span path {
		stroke-dashoffset: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		path {
			transition: none;
		}
	}
</style>
