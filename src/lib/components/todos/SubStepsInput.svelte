<script lang="ts">
	import { Plus, X } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import type { SubStep } from '$lib/schemas/todo';

	let {
		value = $bindable<string | null>(null),
		onValueChange
	}: {
		value?: string | null;
		onValueChange?: (newValue: string) => void;
	} = $props();

	// Parse initial value from JSON string
	let subSteps = $state<SubStep[]>([]);

	$effect(() => {
		if (value) {
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					subSteps = parsed;
				}
			} catch {
				subSteps = [];
			}
		}
	});

	let newSubStepTitle = $state('');

	const addSubStep = () => {
		if (newSubStepTitle.trim()) {
			subSteps = [...subSteps, { title: newSubStepTitle.trim(), completed: false }];
			newSubStepTitle = '';
			updateValue();
		}
	};

	const removeSubStep = (index: number) => {
		subSteps = subSteps.filter((_, i) => i !== index);
		updateValue();
	};

	const toggleSubStep = (index: number) => {
		subSteps = subSteps.map((step, i) =>
			i === index ? { ...step, completed: !step.completed } : step
		);
		updateValue();
	};

	const updateValue = () => {
		const jsonValue = JSON.stringify(subSteps);
		value = jsonValue;
		onValueChange?.(jsonValue);
	};
</script>

<div class="space-y-3">
	<!-- Existing sub-steps -->
	{#if subSteps.length > 0}
		<div class="space-y-2 rounded-md border p-3">
			{#each subSteps as step, index (step.title + index)}
				<div class="flex items-center gap-2">
					<Checkbox
						checked={step.completed}
						onCheckedChange={() => toggleSubStep(index)}
						aria-label={`Toggle ${step.title}`}
					/>
					<span
						class:line-through={step.completed}
						class:text-muted-foreground={step.completed}
						class="flex-1"
					>
						{step.title}
					</span>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => removeSubStep(index)}
						class="h-8 w-8 p-0"
					>
						<X class="h-4 w-4" />
					</Button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add new sub-step -->
	<div class="flex gap-2">
		<Input
			type="text"
			placeholder="Add a sub-step"
			bind:value={newSubStepTitle}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					addSubStep();
				}
			}}
		/>
		<Button type="button" variant="outline" onclick={addSubStep}>
			<Plus class="h-4 w-4" />
		</Button>
	</div>

	<!-- Hidden input for form submission -->
	<input type="hidden" name="subSteps" value={value || ''} />
</div>
