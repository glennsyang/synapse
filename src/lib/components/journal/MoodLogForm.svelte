<script lang="ts">
import { CircleAlert, NotebookPen } from '@lucide/svelte/icons';
import { fromAction } from 'svelte/attachments';
import { toast } from 'svelte-sonner';
import { type SuperValidated, superForm } from 'sveltekit-superforms';

import * as Alert from '$lib/components/ui/alert';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import type { MoodLogFormValues } from '$lib/schemas/mood';
import { moodOptions } from '$lib/utils/mood';

interface Props {
	form: SuperValidated<MoodLogFormValues>;
	todayLog: {
		resolvedMood: string;
		notes: string | null;
	} | null;
}

let { form: initialForm, todayLog }: Props = $props();

// svelte-ignore state_referenced_locally
const { form, errors, enhance, message, submitting } = superForm(initialForm, {
	resetForm: false,
	invalidateAll: true,
	onUpdate: () => {
		if ($message?.type === 'success') {
			toast.success($message.text);
		}

		if ($message?.type === 'error') {
			toast.error($message.text);
		}
	}
});
</script>

<Card.Root
	class="border-[oklch(var(--color-blue)/0.18)] bg-[radial-gradient(circle_at_top,oklch(var(--color-blue)/0.14),transparent_65%)]"
>
	<Card.Header class="space-y-4">
		<div class="flex items-start justify-between gap-3">
			<div class="space-y-2">
				<Badge variant="outline">Daily mood</Badge>
				<Card.Title class="font-display text-2xl">How are you feeling today?</Card.Title>
				<Card.Description> Log a single mood to build your trend over time. </Card.Description>
			</div>
			{#if todayLog}
				<div
					class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-right shadow-sm"
				>
					<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Logged</p>
					<p class="font-display text-lg font-semibold">{todayLog.resolvedMood}</p>
				</div>
			{/if}
		</div>
	</Card.Header>

	<Card.Content>
		<form method="POST" action="?/upsertMood" {@attach fromAction(enhance)} class="space-y-5">
			<Input type="hidden" name="date" bind:value={$form.date} />
			<Input type="hidden" name="mood" bind:value={$form.mood} />

			<div class="space-y-3">
				<Label for="mood-grid">Primary mood</Label>
				<div id="mood-grid" class="flex flex-wrap gap-2">
					{#each moodOptions as option (option.value)}
						<button
							type="button"
							onclick={() => ($form.mood = option.value)}
							class={[
								'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
								$form.mood === option.value
									? 'border-blue-600 bg-blue-600 text-white shadow-sm'
									: 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 hover:bg-blue-100'
							]}
						>
							{option.label}
						</button>
					{/each}
				</div>
				{#if $errors.mood}
					<Alert.Root variant="destructive">
						<CircleAlert class="h-4 w-4" />
						<Alert.Description>{$errors.mood}</Alert.Description>
					</Alert.Root>
				{/if}
			</div>

			{#if $form.mood === 'custom'}
				<div class="space-y-2">
					<Label for="customMood">Custom mood label</Label>
					<Input
						id="customMood"
						name="customMood"
						bind:value={$form.customMood}
						placeholder="Optimistic, unsettled, relieved..."
					/>
					{#if $errors.customMood}
						<Alert.Root variant="destructive">
							<CircleAlert class="h-4 w-4" />
							<Alert.Description>{$errors.customMood}</Alert.Description>
						</Alert.Root>
					{/if}
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="notes">Quick note</Label>
				<Input
					id="notes"
					name="notes"
					bind:value={$form.notes}
					placeholder="What shaped your mood today?"
				/>
				{#if $errors.notes}
					<Alert.Root variant="destructive">
						<CircleAlert class="h-4 w-4" />
						<Alert.Description>{$errors.notes}</Alert.Description>
					</Alert.Root>
				{/if}
			</div>

			<div
				class="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<NotebookPen class="h-4 w-4" />
					<span>One daily mood keeps the trend clean and easy to review.</span>
				</div>
				<Button
					type="submit"
					class=" bg-blue-600 hover:bg-blue-700"
					variant="default"
					disabled={$submitting}
				>
					{$submitting ? 'Saving...' : todayLog ? 'Update' : 'Log'}
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
