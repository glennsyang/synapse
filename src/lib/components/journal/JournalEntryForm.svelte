<script lang="ts">
import { ArrowLeft, ChevronDown, CircleAlert, Info, Thermometer } from '@lucide/svelte/icons';
import { fromAction } from 'svelte/attachments';
import { toast } from 'svelte-sonner';
import { type SuperValidated, superForm } from 'sveltekit-superforms';
import ContentSection from '$lib/components/app/ContentSection.svelte';
import PageShell from '$lib/components/app/PageShell.svelte';
import SectionHeader from '$lib/components/app/SectionHeader.svelte';
import JournalEntryEditor from '$lib/components/journal/JournalEntryEditor.svelte';
import * as Alert from '$lib/components/ui/alert';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Separator } from '$lib/components/ui/separator';
import * as Tooltip from '$lib/components/ui/tooltip';
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
const starterPrompt =
	starterPrompts[Math.floor(Math.random() * starterPrompts.length)] ?? starterPrompts[0];
let metadataOpen = $state(false);

// svelte-ignore state_referenced_locally
const { form, errors, enhance, message, submitting } = superForm(data.form, {
	onUpdate: () => {
		if ($message?.type === 'error') {
			toast.error(`Unable to save entry. ${$message.text}`);
		}
	}
});
let gettingWeather = $state(false);

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

<PageShell class="space-y-4 py-0 sm:py-6">
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

	<ContentSection
		color="blue"
		border={false}
		padding="none"
		class="-mx-4 overflow-hidden sm:mx-0 sm:border-l-4 sm:border-[oklch(var(--color-blue))] sm:p-6 md:p-8"
	>
		<form method="POST" action={formAction} {@attach fromAction(enhance)} class="space-y-6">
			<div
				class="px-2 py-3 sm:rounded-2xl sm:border sm:border-[oklch(var(--color-blue)/0.2)] sm:bg-white/88 sm:p-5 sm:shadow-sm sm:dark:bg-slate-950/72 md:p-7"
			>
				<div class="space-y-2">
					<h2 class="font-display text-2xl font-bold text-foreground md:text-3xl">Today's Story</h2>
					{#if isNewMode}
						<p class="text-sm italic text-[oklch(var(--color-blue)/0.68)]">{starterPrompt}</p>
					{/if}
				</div>

				<Separator class="my-5 bg-[oklch(var(--color-blue)/0.22)]" />

				<div class="space-y-5">
					<div class="space-y-2">
						<Label for="content">Content</Label>
						<JournalEntryEditor
							bind:markdown={$form.content}
							placeholder="Let the first sentence be simple. You can shape it after it's on the page."
						/>
						{#if $errors.content}
							<Alert.Root variant="destructive" class="mt-2">
								<CircleAlert class="h-4 w-4" />
								<Alert.Description>{$errors.content}</Alert.Description>
							</Alert.Root>
						{/if}
					</div>

					<Collapsible.Root bind:open={metadataOpen}>
						<div
							class="rounded-2xl border border-[oklch(var(--color-blue)/0.18)] bg-background/92 px-4 py-3 shadow-sm md:px-5"
						>
							<Collapsible.Trigger class="w-full text-left">
								<div class="flex items-center justify-between gap-4">
									<div class="space-y-2">
										<Badge variant="outline">Metadata</Badge>
										<p class="text-sm leading-6 text-muted-foreground">
											Capture the context around the entry without interrupting the writing flow.
										</p>
									</div>
									<ChevronDown
										class={['h-4 w-4 shrink-0 text-muted-foreground transition-transform', metadataOpen && 'rotate-180']}
									/>
								</div>
							</Collapsible.Trigger>

							<Collapsible.Content class="pt-6">
								<div class="grid gap-4 sm:grid-cols-2">
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
												<CircleAlert class="h-4 w-4" />
												<Alert.Description>{$errors.date}</Alert.Description>
											</Alert.Root>
										{/if}
									</div>

									<div class="space-y-2">
										<Label for="location">Location</Label>
										<Input
											id="location"
											name="location"
											bind:value={$form.location}
											placeholder="Home, cafe, shoreline, studio"
										/>
									</div>

									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<Label for="weatherTemp">Temperature (°C)</Label>
											<Info class="h-3.5 w-3.5 text-muted-foreground" />
										</div>
										<div class="flex items-center gap-2">
											<Input
												id="weatherTemp"
												name="weatherTemp"
												type="number"
												bind:value={$form.weatherTemp}
												placeholder="10, 22, etc."
											/>
											<Tooltip.Root>
												<Tooltip.Trigger>
													{#snippet child({ props })}
														<Button
															{...props}
															type="button"
															variant="outline"
															size="icon-sm"
															onclick={getWeather}
															disabled={gettingWeather}
															class="border-[oklch(var(--color-blue)/0.18)] hover:bg-[oklch(var(--color-blue)/0.1)]"
															aria-label="Fetch current weather"
														>
															<Thermometer class="h-4 w-4" />
														</Button>
													{/snippet}
												</Tooltip.Trigger>
												<Tooltip.Content>
													{gettingWeather ? 'Retrieving current weather...' : 'Get current weather'}
												</Tooltip.Content>
											</Tooltip.Root>
										</div>
									</div>

									<div class="space-y-2">
										<Label for="weatherCondition">Weather Condition</Label>
										<Input
											id="weatherCondition"
											name="weatherCondition"
											bind:value={$form.weatherCondition}
											placeholder="Partly cloudy, sunny, foggy"
										/>
									</div>
								</div>
							</Collapsible.Content>
						</div>
					</Collapsible.Root>

					<div class="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
						<Button
							type="submit"
							size="sm"
							disabled={$submitting}
							class="bg-blue-600 text-white hover:bg-blue-700 sm:min-w-32"
						>
							{$submitting ? 'Saving...' : 'Save'}
						</Button>
						<Button type="button" variant="outline" size="sm" href="/journal" class="sm:min-w-28">
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</form>
	</ContentSection>
</PageShell>
