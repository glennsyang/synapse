<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent",
				secondary:
					"bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent",
				destructive:
					"bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 border-transparent text-white",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				teal: "bg-[oklch(var(--color-teal)/0.15)] text-[oklch(var(--color-teal))] border-[oklch(var(--color-teal)/0.3)] [a&]:hover:bg-[oklch(var(--color-teal)/0.25)]",
				blue: "bg-[oklch(var(--color-blue)/0.15)] text-[oklch(var(--color-blue))] border-[oklch(var(--color-blue)/0.3)] [a&]:hover:bg-[oklch(var(--color-blue)/0.25)]",
				green: "bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))] border-[oklch(var(--color-green)/0.3)] [a&]:hover:bg-[oklch(var(--color-green)/0.25)]",
				orange: "bg-[oklch(var(--color-orange)/0.15)] text-[oklch(var(--color-orange))] border-[oklch(var(--color-orange)/0.3)] [a&]:hover:bg-[oklch(var(--color-orange)/0.25)]",
				purple: "bg-[oklch(var(--color-purple)/0.15)] text-[oklch(var(--color-purple))] border-[oklch(var(--color-purple)/0.3)] [a&]:hover:bg-[oklch(var(--color-purple)/0.25)]",
				pink: "bg-[oklch(var(--color-pink)/0.15)] text-[oklch(var(--color-pink))] border-[oklch(var(--color-pink)/0.3)] [a&]:hover:bg-[oklch(var(--color-pink)/0.25)]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
