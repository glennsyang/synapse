<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { setGoalWeightSchema } from '$lib/schemas/fitness';
	import TargetIcon from '@lucide/svelte/icons/target';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	type SetGoalWeightData = Infer<typeof setGoalWeightSchema>;

	let {
		formData,
		onClose,
		open = $bindable(false)
	}: {
		formData: SuperValidated<SetGoalWeightData>;
		onClose?: () => void;
		open?: boolean;
	} = $props();

	let internalOpen = $state(false);
	const dialogOpen = $derived(open !== undefined ? open : internalOpen);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance } = superForm(formData, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				if (open !== undefined) {
					onClose?.();
				} else {
					internalOpen = false;
				}
				toast.success('Goal weight set successfully!');
				onClose?.();
			}
		},
		onError: ({ result }) => {
			toast.error(`Error setting goal weight: ${result.error.message}`);
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (open !== undefined) {
			// Externally controlled - notify via onClose
			if (!isOpen && onClose) {
				onClose();
			}
		} else {
			// Internally controlled
			internalOpen = isOpen;
			if (!isOpen) {
				onClose?.();
			}
		}
	}
</script>

{#if open === undefined}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					variant="ghost"
					size="icon"
					class="text-muted-foreground hover:text-foreground h-6 w-6"
					onclick={() => (internalOpen = true)}
					aria-label="Set goal weight"
				>
					<TargetIcon class="h-3.5 w-3.5" />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Set goal weight</Tooltip.Content>
	</Tooltip.Root>
{/if}

<Dialog.Root open={dialogOpen} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Set Goal Weight</Dialog.Title>
			<Dialog.Description>Define your target weight goal</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/setGoal" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="goal-weight">Target Weight (lbs)</Label>
					<Input
						id="goal-weight"
						name="targetWeightLbs"
						type="number"
						step="0.1"
						bind:value={$form.targetWeightLbs}
						placeholder="150.0"
						required
					/>
					{#if $errors.targetWeightLbs}
						<p class="text-destructive text-sm">{$errors.targetWeightLbs}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" class="bg-green-600 text-white hover:bg-green-700">Set Goal</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
