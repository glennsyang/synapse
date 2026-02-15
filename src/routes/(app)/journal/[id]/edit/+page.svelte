<script lang="ts">
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import ContentSection from '$lib/components/app/ContentSection.svelte';
	import SectionHeader from '$lib/components/app/SectionHeader.svelte';
	import TagInput from '$lib/components/journal/TagInput.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getCurrentLocationCity, getCurrentWeather } from '$lib/utils/journal-context';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				toast.success('Journal entry updated successfully!');
			}
			if ($message?.type === 'error') {
				toast.error(`Error updating journal entry. Reason: ${$message.text}`);
			}
		}
	});

	let gettingLocation = $state(false);
	let gettingWeather = $state(false);
	let locationError = $state('');
	let contextOpen = $state(false);

	async function getLocation() {
		locationError = '';

		gettingLocation = true;

		try {
			const city = await getCurrentLocationCity();
			$form.location = city;
			toast.success(`Location added to your entry: ${city}`);
		} catch (error) {
			locationError =
				error instanceof Error
					? error.message
					: 'Unable to retrieve your location. You can still enter it manually.';
			toast.error(locationError);
		} finally {
			gettingLocation = false;
		}
	}

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

<div class="container mx-auto max-w-3xl space-y-6 py-6">
	<SectionHeader
		title="Edit Journal Entry"
		description="An editorial writing surface for thoughts, reflection, and context."
		color="blue"
	>
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="blue" class="px-3 py-1">Journal</Badge>
			<Button href="/journal" variant="outline" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Journal
			</Button>
		</div>
	</SectionHeader>

	<ContentSection color="blue" border={true} padding="lg" class="overflow-hidden">
		<form method="POST" action="?/update" use:enhance class="space-y-6">
			<div class="grid gap-6 lg:grid-cols-12">
				<div class="space-y-6 lg:col-span-8">
					<div
						class="rounded-2xl border border-[oklch(var(--color-blue)/0.25)] bg-background/90 p-5 shadow-sm md:p-6"
					>
						<div class="space-y-1">
							<Badge variant="blue" class="px-3 py-1">Writing Canvas</Badge>
							<h2
								class="font-display bg-linear-to-r from-[oklch(var(--color-blue))] to-[oklch(var(--color-purple))] bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
							>
								Today's Story
							</h2>
							<p class="text-sm text-muted-foreground">
								Lead with what stood out, then capture details while they're clear.
							</p>
						</div>

						<Separator class="my-5 bg-[oklch(var(--color-blue)/0.2)]" />

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
									<span class="text-xs tracking-wide text-muted-foreground uppercase">
										Primary reflection
									</span>
								</div>
								<Textarea
									id="content"
									name="content"
									bind:value={$form.content}
									placeholder="What happened, what mattered, and what you learned..."
									rows={12}
									class={$errors.content ? 'border-destructive' : ''}
									required
								/>
								{#if $errors.content}
									<Alert.Root variant="destructive" class="mt-2">
										<AlertCircle class="h-4 w-4" />
										<Alert.Description>{$errors.content}</Alert.Description>
									</Alert.Root>
								{/if}
							</div>

							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label for="tags">Tags</Label>
									<span class="text-xs text-muted-foreground">Mood, focus, wins</span>
								</div>
								<TagInput bind:value={$form.tags} />
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-4 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
					<div
						class="rounded-2xl border border-[oklch(var(--color-blue)/0.2)] bg-[oklch(var(--color-blue)/0.05)] p-4"
					>
						<Badge variant="blue" class="mb-2">Ready to save</Badge>
						<p class="text-sm text-muted-foreground">
							Capture now, revise later. Your entry can be edited anytime.
						</p>
						<div class="mt-4 flex flex-col gap-2">
							<Button type="submit" variant="gradient-blue" disabled={$submitting} class="w-full">
								{$submitting ? 'Saving...' : 'Update Entry'}
							</Button>
							<Button type="button" variant="outline" href="/journal" class="w-full">Cancel</Button>
						</div>
					</div>

					<Collapsible.Root bind:open={contextOpen}>
						<div
							class="rounded-2xl border border-[oklch(var(--color-blue)/0.2)] bg-background/95 p-4 shadow-sm"
						>
							<Collapsible.Trigger class="w-full">
								<div class="flex w-full items-center justify-between text-left">
									<div>
										<Badge variant="outline">Optional context</Badge>
										<p class="mt-2 text-sm text-muted-foreground">Location and weather metadata</p>
									</div>
									<ChevronDown
										class={`h-4 w-4 transition-transform ${contextOpen ? 'rotate-180' : ''}`}
									/>
								</div>
							</Collapsible.Trigger>

							<Collapsible.Content class="mt-4 space-y-4">
								<Separator class="bg-[oklch(var(--color-blue)/0.2)]" />
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<Label for="location">Location</Label>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={getLocation}
											disabled={gettingLocation}
										>
											<MapPin class="h-4 w-4" />
										</Button>
									</div>
									<Input
										id="location"
										name="location"
										bind:value={$form.location}
										placeholder="e.g., Surrey, BC"
									/>
									{#if locationError}
										<Alert.Root variant="warning" class="mt-2">
											<AlertCircle class="h-4 w-4" />
											<Alert.Description>{locationError}</Alert.Description>
										</Alert.Root>
									{/if}
								</div>

								<div class="grid gap-4">
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<Label for="weatherTemp">Temperature (°C)</Label>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={getWeather}
												disabled={gettingWeather}
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
</div>
