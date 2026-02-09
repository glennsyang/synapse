<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import X from '@lucide/svelte/icons/x';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
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

<div class="flex flex-wrap gap-2">
	{#each quickFeelings as feeling (feeling)}
		<Button
			variant="outline"
			size="sm"
			class="h-7 rounded-full px-2 text-xs"
			onclick={() => addTag(feeling)}
			disabled={tags.includes(feeling)}
		>
			<Plus size={12} class="mr-1" />
			{feeling}
		</Button>
	{/each}
</div>

<div class="space-y-2">
	<div class="flex gap-2">
		<Input
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Type a tag and press Enter"
			class="flex-1"
		/>
		<Button type="button" variant="outline" onclick={() => addTag()}>Add</Button>
	</div>

	{#if tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each tags as tag (tag)}
				<Badge variant="secondary" class="flex items-center gap-1">
					{tag}
					<button
						type="button"
						onclick={() => removeTag(tag)}
						class="ml-1 rounded-full hover:bg-destructive/20"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/each}
		</div>
	{/if}

	<input type="hidden" name="tags" value={value || ''} />
</div>
