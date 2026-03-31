<script lang="ts">
import SettingsIcon from '@lucide/svelte/icons/settings';
import { toast } from 'svelte-sonner';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import { superForm } from 'sveltekit-superforms';

import { Button } from '$lib/components/ui/button';
import * as Dialog from '$lib/components/ui/dialog';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Tooltip from '$lib/components/ui/tooltip';
import type { setCalorieTargetSchema } from '$lib/schemas/fitness';

type SetCalorieTargetData = Infer<typeof setCalorieTargetSchema>;

let { formData }: { formData: SuperValidated<SetCalorieTargetData> } = $props();

let open = $state(false);

// svelte-ignore state_referenced_locally
const { form, errors, enhance } = superForm(formData, {
	onUpdate: ({ form }) => {
		if (form.valid) {
			open = false;
			toast.success('Calorie target set successfully!');
		}
	},
	onError: ({ result }) => {
		toast.error(`Error setting calorie target: ${result.error.message}`);
	}
});
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				type="button"
				variant="ghost"
				size="icon"
				class="h-6 w-6 text-muted-foreground hover:text-foreground"
				onclick={() => (open = true)}
				aria-label="Set calorie target"
			>
				<SettingsIcon class="h-3.5 w-3.5" />
			</Button>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content>Set calorie target</Tooltip.Content>
</Tooltip.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Set Calorie Target</Dialog.Title>
			<Dialog.Description>Define your daily calorie goal</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/setCalorieTarget" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="calorie-target">Daily Target (calories)</Label>
					<Input
						id="calorie-target"
						name="targetCalories"
						type="number"
						bind:value={$form.targetCalories}
						placeholder="2000"
						required
					/>
					{#if $errors.targetCalories}
						<p class="text-sm text-destructive">{$errors.targetCalories}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" class="bg-green-600 text-white hover:bg-green-700">Set Target</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
