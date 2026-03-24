<script lang="ts">
import AlertCircle from '@lucide/svelte/icons/alert-circle';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import ChevronDown from '@lucide/svelte/icons/chevron-down';
import Thermometer from '@lucide/svelte/icons/thermometer';
import { fromAction } from 'svelte/attachments';
import { toast } from 'svelte-sonner';
import { type SuperValidated, superForm } from 'sveltekit-superforms';
import ContentSection from '$lib/components/app/ContentSection.svelte';
import PageShell from '$lib/components/app/PageShell.svelte';
import SectionHeader from '$lib/components/app/SectionHeader.svelte';
import JournalEntryEditor from '$lib/components/journal/JournalEntryEditor.svelte';
import TagInput from '$lib/components/journal/TagInput.svelte';
import * as Alert from '$lib/components/ui/alert';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Separator } from '$lib/components/ui/separator';
import type { JournalEntryFormValues } from '$lib/schemas/journal';
import { getCurrentWeather } from '$lib/utils/journal-context';

const starterPrompts = [
	"What's one thing that went well today?",
	'What moment felt most meaningful today?',
	'What did you learn about yourself today?',
	'What helped you feel grounded today?',
	'What would you like to remember from today?',
	'What challenged you, and how did you respond?'
] as const;

interface Props {
	data: { form: SuperValidated<JournalEntryFormValues> };
	mode: 'new' | 'edit';
}

let { data, mode }: Props = $props();

const isNewMode = $derived(mode === 'new');
const formAction = $derived(mode === 'edit' ? '?/update' : undefined);
const pageTitle = $derived(mode === 'edit' ? 'Edit Journal Entry' : 'New Journal Entry');
const starterPrompt = $derived(
	isNewMode
		? (starterPrompts[Math.floor(Math.random() * starterPrompts.length)] ?? starterPrompts[0])
		: starterPrompts[0]
);

// svelte-ignore state_referenced_locally
const { form, errors, enhance, message, submitting } = superForm(data.form, {
	onUpdate: () => {
		if ($message?.type === 'error') {
			toast.error(`Unable to save entry. ${$message.text}`);
		}
	}
});
let gettingWeather = $state(false);
let weatherOpen = $state(false);

async function getWeather() {
	gettingWeather = true;

	try {
		const weather = await getCurrentWeather();
		$form.weatherTemp = weather.temperature;
		$form.weatherCondition = weather.condition;
		toast.success(`Weather added: ${weather.condition}, ${weather.temperature}°C`);
	} catch (error) {
		toast.error(
			error instanceof Error
				? error.message
				: 'Unable to retrieve your location for weather information.'
		);
	} finally {
		gettingWeather = false;
	}
}
</script>

<PageShell class="space-y-6 py-3 sm:py-6">
	<SectionHeader
		title={pageTitle}
		description="A focused, distraction-light writing space designed for flow."
		color="blue"
	>
		<div class="flex flex-wrap items-center gap-2">
			<Button href="/journal" variant="outline" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Journal
			</Button>
		</div>
	</SectionHeader>

	<ContentSection color="blue" border={true} padding="lg" class="overflow-hidden">
		<form method="POST" action={formAction} {@attach fromAction(enhance)} class="space-y-6">
			<input type="hidden" name="location" bind:value={$form.location}>
			<div
				class="rounded-2xl border border-[oklch(var(--color-blue)/0.24)] bg-[radial-gradient(circle_at_top,oklch(var(--color-blue)/0.14),transparent_58%)] p-5 shadow-sm md:p-7"
			>
				<div class="space-y-2">
					<h2
						class="font-display bg-linear-to-r from-[oklch(var(--color-blue))] to-[oklch(var(--color-teal))] bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
					>
						Today's Story
					</h2>
					{#if isNewMode}
						<p class="text-sm italic text-[oklch(var(--color-blue)/0.68)]">{starterPrompt}</p>
					{/if}
				</div>

				<Separator class="my-5 bg-[oklch(var(--color-blue)/0.22)]" />

				<div class="space-y-5">
					<div class="space-y-2">
						<Label for="date">Date</Label>
						<Input
							id="date"
							name="date"
							type="date"
							bind:value={$form.date}
							class={$errors.date ? 'border-destructive' : ''}
							required
						/>
						{#if $errors.date}
							<Alert.Root variant="destructive" class="mt-2">
								<AlertCircle class="h-4 w-4" />
								<Alert.Description>{$errors.date}</Alert.Description>
							</Alert.Root>
						{/if}
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label for="content">Content</Label>
						</div>
						<JournalEntryEditor
							bind:markdown={$form.content}
							placeholder="Let the first sentence be simple. You can shape it after it's on the page."
						/>
						{#if $errors.content}
							<Alert.Root variant="destructive" class="mt-2">
								<AlertCircle class="h-4 w-4" />
								<Alert.Description>{$errors.content}</Alert.Description>
							</Alert.Root>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="tags">What best describes your mood?</Label>
						<TagInput bind:value={$form.tags} />
					</div>

					<div class="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
						<Button type="button" variant="outline" href="/journal" class="sm:min-w-32"
							>Cancel</Button
						>
						<Button
							type="submit"
							variant="gradient-blue"
							disabled={$submitting}
							class="sm:min-w-40"
						>
							{$submitting ? 'Saving...' : 'Save'}
						</Button>
					</div>

					<Collapsible.Root bind:open={weatherOpen}>
						<div
							class="rounded-2xl border border-[oklch(var(--color-blue)/0.2)] bg-background/95 p-4 shadow-sm"
						>
							<Collapsible.Trigger class="w-full">
								<div class="flex w-full items-center justify-between text-left">
									<Badge variant="outline">Weather context (optional)</Badge>
									<ChevronDown
										class={`h-4 w-4 transition-transform ${weatherOpen ? 'rotate-180' : ''}`}
									/>
								</div>
							</Collapsible.Trigger>

							<Collapsible.Content class="mt-4 space-y-4">
								<Separator class="bg-[oklch(var(--color-blue)/0.2)]" />
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<Label for="weatherTemp">Temperature (°C)</Label>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={getWeather}
												disabled={gettingWeather}
												aria-label="Get current weather"
											>
												<Thermometer class="h-4 w-4" />
											</Button>
										</div>
										<Input
											id="weatherTemp"
											name="weatherTemp"
											type="number"
											bind:value={$form.weatherTemp}
											placeholder="10, 22, etc."
										/>
									</div>

									<div class="space-y-2">
										<Label for="weatherCondition">Weather Condition</Label>
										<Input
											id="weatherCondition"
											name="weatherCondition"
											bind:value={$form.weatherCondition}
											placeholder="Partly cloudy, sunny, etc."
										/>
									</div>
								</div>
							</Collapsible.Content>
						</div>
					</Collapsible.Root>
				</div>
			</div>
		</form>
	</ContentSection>
</PageShell>
