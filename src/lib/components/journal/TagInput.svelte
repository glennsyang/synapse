<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { quickFeelings } from '$lib/utils';

	let { value = $bindable() }: { value?: string } = $props();

	let inputValue = $state('');
	let tags = $derived(
		value
			? value
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			: []
	);

	function addTag(tag?: string) {
		const tagToAdd = tag || inputValue.trim();
		if (!tagToAdd) return;
		if (tags.some((currentTag) => currentTag.toLowerCase() === tagToAdd.toLowerCase())) {
			inputValue = '';
			return;
		}

		const newTags = [...tags, tagToAdd];
		value = newTags.join(', ');
		inputValue = '';
	}

	function removeTag(tagToRemove: string) {
		const newTags = tags.filter((t) => t !== tagToRemove);
		value = newTags.length > 0 ? newTags.join(', ') : undefined;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}
</script>

<div
	class="space-y-4 rounded-xl border border-[oklch(var(--color-blue)/0.2)] bg-[oklch(var(--color-blue)/0.04)] p-4"
>
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm font-medium">
				<Sparkles class="h-4 w-4 text-[oklch(var(--color-blue))]" />
				Quick tags
			</div>
			<Badge variant="blue">{tags.length} selected</Badge>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each quickFeelings as feeling (feeling)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-8 rounded-full border-[oklch(var(--color-blue)/0.3)] bg-background px-3 text-xs"
					onclick={() => addTag(feeling)}
					disabled={tags.some((currentTag) => currentTag.toLowerCase() === feeling.toLowerCase())}
				>
					<Plus size={12} class="mr-1" />
					{feeling}
				</Button>
			{/each}
		</div>
	</div>

	<Separator class="bg-[oklch(var(--color-blue)/0.2)]" />

	<div class="space-y-3">
		<div class="flex gap-2">
			<Input
				bind:value={inputValue}
				onkeydown={handleKeydown}
				placeholder="Add your own tag and press Enter"
				class="flex-1 bg-background"
			/>
			<Button type="button" variant="gradient-blue" onclick={() => addTag()}>Add</Button>
		</div>

		{#if tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each tags as tag (tag)}
					<Badge variant="blue" class="gap-1.5 px-2.5 py-1 text-xs">
						{tag}
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onclick={() => removeTag(tag)}
							class="size-5 rounded-full hover:bg-destructive/20"
						>
							<X class="h-3 w-3" />
						</Button>
					</Badge>
				{/each}
			</div>
		{/if}
	</div>

	<Input type="hidden" name="tags" value={value || ''} />
</div>
