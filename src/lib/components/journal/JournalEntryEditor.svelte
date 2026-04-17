<script lang="ts">
import {
	Bold,
	Heading,
	Italic,
	Link2,
	List,
	ListOrdered,
	Pilcrow,
	Quote,
	Underline
} from '@lucide/svelte/icons';
import { marked } from 'marked';
import { Button } from '$lib/components/ui/button';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
import * as Tabs from '$lib/components/ui/tabs';
import { Textarea } from '$lib/components/ui/textarea';
import * as Tooltip from '$lib/components/ui/tooltip';

interface Props {
	markdown?: string;
	placeholder?: string;
}

let { markdown = $bindable(''), placeholder = 'Write your entry in Markdown...' }: Props = $props();

let activeTab = $state<'write' | 'preview'>('write');
let textareaRef = $state<HTMLTextAreaElement | null>(null);
const markdownOptions = {
	gfm: true,
	breaks: true,
	headerIds: true
} as const;
let previewHtml = $derived(marked.parse(markdown, markdownOptions));

function getLineStart(content: string, index: number): number {
	const previousNewline = content.lastIndexOf('\n', Math.max(0, index - 1));
	return previousNewline === -1 ? 0 : previousNewline + 1;
}

function getLineEnd(content: string, index: number): number {
	const nextNewline = content.indexOf('\n', index);
	return nextNewline === -1 ? content.length : nextNewline;
}

function getExpandedLineRange(
	content: string,
	selectionStart: number,
	selectionEnd: number
): { start: number; end: number } {
	const normalizedEnd =
		selectionEnd > selectionStart && content[selectionEnd - 1] === '\n'
			? selectionEnd - 1
			: selectionEnd;

	return {
		start: getLineStart(content, selectionStart),
		end: getLineEnd(content, normalizedEnd)
	};
}

function updateWithSelection(
	nextValue: string,
	selectionStart: number,
	selectionEnd: number
): void {
	markdown = nextValue;

	queueMicrotask(() => {
		if (!textareaRef) {
			return;
		}

		textareaRef.focus();
		textareaRef.setSelectionRange(selectionStart, selectionEnd);
	});
}

function wrapSelection(before: string, after: string, placeholderText: string): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;
	const selectedText = content.slice(start, end);
	const innerText = selectedText.length > 0 ? selectedText : placeholderText;
	const replacement = `${before}${innerText}${after}`;
	const nextValue = `${content.slice(0, start)}${replacement}${content.slice(end)}`;

	const nextStart = start + before.length;
	const nextEnd = nextStart + innerText.length;

	updateWithSelection(nextValue, nextStart, nextEnd);
}

function prefixLines(prefix: string, placeholderText: string): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;

	if (start === end) {
		const lineStart = getLineStart(content, start);
		const lineEnd = getLineEnd(content, start);
		const currentLine = content.slice(lineStart, lineEnd);

		if (!currentLine.trim()) {
			const replacement = `${prefix}${placeholderText}`;
			const nextValue = `${content.slice(0, lineStart)}${replacement}${content.slice(lineEnd)}`;
			const nextStart = lineStart + prefix.length;
			const nextEnd = nextStart + placeholderText.length;
			updateWithSelection(nextValue, nextStart, nextEnd);
			return;
		}

		const replacement = `${prefix}${currentLine}`;
		const nextValue = `${content.slice(0, lineStart)}${replacement}${content.slice(lineEnd)}`;
		const nextStart = lineStart + prefix.length;
		const nextEnd = nextStart + currentLine.length;
		updateWithSelection(nextValue, nextStart, nextEnd);
		return;
	}

	const expanded = getExpandedLineRange(content, start, end);
	const selectedText = content.slice(expanded.start, expanded.end);
	const prefixed = selectedText
		.split('\n')
		.map((line) => `${prefix}${line}`)
		.join('\n');
	const nextValue = `${content.slice(0, expanded.start)}${prefixed}${content.slice(expanded.end)}`;

	updateWithSelection(nextValue, expanded.start, expanded.start + prefixed.length);
}

function insertHeading(level: 1 | 2 | 3): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;
	const expanded = getExpandedLineRange(content, start, end);
	const selectedText = content.slice(expanded.start, expanded.end);
	const prefix = `${'#'.repeat(level)} `;
	const headedLines = selectedText
		.split('\n')
		.map((line) => {
			if (!line.trim()) {
				return `${prefix}Header`;
			}

			if (/^#{1,6}\s+/.test(line)) {
				return line.replace(/^#{1,6}\s+/, prefix);
			}

			return `${prefix}${line}`;
		})
		.join('\n');
	const nextValue = `${content.slice(0, expanded.start)}${headedLines}${content.slice(expanded.end)}`;

	updateWithSelection(nextValue, expanded.start, expanded.start + headedLines.length);
}

function prefixNumberedLines(placeholderText: string): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;

	if (start === end) {
		const lineStart = getLineStart(content, start);
		const lineEnd = getLineEnd(content, start);
		const currentLine = content.slice(lineStart, lineEnd);

		if (!currentLine.trim()) {
			const replacement = `1. ${placeholderText}`;
			const nextValue = `${content.slice(0, lineStart)}${replacement}${content.slice(lineEnd)}`;
			const nextStart = lineStart + 3;
			const nextEnd = nextStart + placeholderText.length;
			updateWithSelection(nextValue, nextStart, nextEnd);
			return;
		}

		const replacement = `1. ${currentLine}`;
		const nextValue = `${content.slice(0, lineStart)}${replacement}${content.slice(lineEnd)}`;
		const nextStart = lineStart + 3;
		const nextEnd = nextStart + currentLine.length;
		updateWithSelection(nextValue, nextStart, nextEnd);
		return;
	}

	const expanded = getExpandedLineRange(content, start, end);
	const selectedText = content.slice(expanded.start, expanded.end);
	const numbered = selectedText
		.split('\n')
		.map((line, index) => `${index + 1}. ${line}`)
		.join('\n');
	const nextValue = `${content.slice(0, expanded.start)}${numbered}${content.slice(expanded.end)}`;

	updateWithSelection(nextValue, expanded.start, expanded.start + numbered.length);
}

function insertBulletList(): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;

	if (start !== end) {
		prefixLines('- ', 'List item');
		return;
	}

	const lineStart = getLineStart(content, start);
	const lineEnd = getLineEnd(content, start);
	const currentLine = content.slice(lineStart, lineEnd);
	const bulletMatch = /^(\s*)([-*+])\s+/.exec(currentLine);

	if (!bulletMatch) {
		prefixLines('- ', 'List item');
		return;
	}

	const indentation = bulletMatch[1] ?? '';
	const marker = bulletMatch[2] ?? '-';
	const continuation = `\n${indentation}${marker} `;
	const nextValue = `${content.slice(0, lineEnd)}${continuation}${content.slice(lineEnd)}`;
	const nextCursor = lineEnd + continuation.length;

	updateWithSelection(nextValue, nextCursor, nextCursor);
}

function insertNumberedList(): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;

	if (start !== end) {
		prefixNumberedLines('List item');
		return;
	}

	const lineStart = getLineStart(content, start);
	const lineEnd = getLineEnd(content, start);
	const currentLine = content.slice(lineStart, lineEnd);
	const numberedMatch = /^(\s*)(\d+)\.\s+/.exec(currentLine);

	if (!numberedMatch) {
		prefixNumberedLines('List item');
		return;
	}

	const indentation = numberedMatch[1] ?? '';
	const nextNumber = Number(numberedMatch[2] ?? '1') + 1;
	const continuation = `\n${indentation}${nextNumber}. `;
	const nextValue = `${content.slice(0, lineEnd)}${continuation}${content.slice(lineEnd)}`;
	const nextCursor = lineEnd + continuation.length;

	updateWithSelection(nextValue, nextCursor, nextCursor);
}

function insertLink(): void {
	if (!textareaRef) {
		return;
	}

	const content = markdown ?? '';
	const start = textareaRef.selectionStart;
	const end = textareaRef.selectionEnd;
	const selectedText = content.slice(start, end);
	const linkText = selectedText.length > 0 ? selectedText : '';
	const replacement = `[${linkText}](url)`;
	const nextValue = `${content.slice(0, start)}${replacement}${content.slice(end)}`;

	const linkTargetStart = start + replacement.lastIndexOf('(') + 1;
	const linkTargetEnd = linkTargetStart + 3;

	updateWithSelection(nextValue, linkTargetStart, linkTargetEnd);
}
</script>

<div class="rounded-xl border border-[oklch(var(--color-blue)/0.22)] bg-background/90 shadow-sm">
	<Tabs.Root bind:value={activeTab} class="gap-0">
		<div class="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
			<Tabs.List>
				<Tabs.Trigger value="write" aria-label="Write markdown">Write</Tabs.Trigger>
				<Tabs.Trigger value="preview" aria-label="Preview markdown">Preview</Tabs.Trigger>
			</Tabs.List>

			{#if activeTab === 'write'}
				<Tooltip.Provider delayDuration={180}>
					<div class="flex flex-wrap items-center gap-1">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										aria-label="Insert heading"
									>
										<Heading class="h-4 w-4" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start" sideOffset={6} class="w-28 rounded-lg">
								<DropdownMenu.Item onclick={() => insertHeading(1)}> h1 </DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => insertHeading(2)}> h2 </DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => insertHeading(3)}> h3 </DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => wrapSelection('**', '**', 'bold text')}
										aria-label="Insert bold"
									>
										<Bold class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Bold</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => wrapSelection('*', '*', 'italic text')}
										aria-label="Insert italic"
									>
										<Italic class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Italic</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => wrapSelection('<u>', '</u>', 'underlined text')}
										aria-label="Insert underline"
									>
										<Underline class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Underline</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => prefixLines('> ', 'Quote')}
										aria-label="Insert quote"
									>
										<Quote class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Quote</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={insertLink}
										aria-label="Insert link"
									>
										<Link2 class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Link</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={insertBulletList}
										aria-label="Insert bullet list"
									>
										<List class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Bullet List</Tooltip.Content>
						</Tooltip.Root>

						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="sm"
										onclick={insertNumberedList}
										aria-label="Insert numbered list"
									>
										<ListOrdered class="h-4 w-4" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Numbered List</Tooltip.Content>
						</Tooltip.Root>
					</div>
				</Tooltip.Provider>
			{/if}
		</div>

		<Tabs.Content value="write" class="p-1 sm:p-3 md:p-4">
			<Textarea
				bind:ref={textareaRef}
				bind:value={markdown}
				id="content"
				name="content"
				{placeholder}
				class="min-h-[55vh] resize-y border-[oklch(var(--color-blue)/0.2)] bg-[oklch(var(--background))] font-mono text-[0.95rem] leading-6 md:min-h-90"
			/>
		</Tabs.Content>

		<Tabs.Content value="preview" class="p-2 md:p-4">
			{#if markdown?.trim()}
				<div class="prose prose-sm prose-slate dark:prose-invert">{@html previewHtml}</div>
			{:else}
				<div
					class="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-[oklch(var(--color-blue)/0.25)] bg-[oklch(var(--color-blue)/0.04)] px-4 text-center text-sm text-muted-foreground"
				>
					<Pilcrow class="mr-2 h-4 w-4" />
					Write something in the editor to preview your markdown here.
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
