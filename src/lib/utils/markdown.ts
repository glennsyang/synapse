import MarkdownIt from 'markdown-it';

const markdownRenderer = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: false,
	breaks: true
});

function decodeHtmlEntities(value: string): string {
	return value
		.replaceAll('&nbsp;', ' ')
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'");
}

/**
 * Render markdown to HTML while disallowing raw HTML tags in user input.
 */
export function renderMarkdownToSafeHtml(markdown: string | null | undefined): string {
	if (!markdown?.trim()) {
		return '';
	}

	return markdownRenderer.render(markdown);
}

/**
 * Convert markdown to plain text for compact previews.
 */
export function markdownToPlainText(markdown: string | null | undefined): string {
	if (!markdown?.trim()) {
		return '';
	}

	const html = renderMarkdownToSafeHtml(markdown);
	const text = html
		.replaceAll(/<[^>]*>/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.replaceAll(/\s+([.,!?;:])/g, '$1')
		.trim();

	return decodeHtmlEntities(text);
}

export function createMarkdownExcerpt(
	markdown: string | null | undefined,
	maxLength = 140
): string {
	const plainText = markdownToPlainText(markdown);

	if (plainText.length <= maxLength) {
		return plainText;
	}

	const clipped = plainText.slice(0, Math.max(0, maxLength - 3)).trimEnd();
	const boundary = clipped.lastIndexOf(' ');
	const excerpt = boundary > 0 ? clipped.slice(0, boundary).trimEnd() : clipped;

	return `${excerpt}...`;
}
