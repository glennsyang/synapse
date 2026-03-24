import { describe, expect, it } from 'vitest';

import { createMarkdownExcerpt, markdownToPlainText, renderMarkdownToSafeHtml } from './markdown';

describe('markdown utilities', () => {
	it('renders markdown formatting as html', () => {
		const html = renderMarkdownToSafeHtml('# Heading\n\n**Bold** text');

		expect(html).toContain('<h1>Heading</h1>');
		expect(html).toContain('<strong>Bold</strong>');
	});

	it('escapes raw html input for safe rendering', () => {
		const html = renderMarkdownToSafeHtml('<script>alert("xss")</script>');

		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
	});

	it('converts markdown to plain text', () => {
		const plainText = markdownToPlainText('Hello **world**. Visit [Synapse](https://example.com).');

		expect(plainText).toBe('Hello world. Visit Synapse.');
	});

	it('creates bounded excerpts from markdown', () => {
		const excerpt = createMarkdownExcerpt('One two three four five six seven eight nine ten', 18);

		expect(excerpt).toBe('One two three...');
	});

	it('returns empty excerpt for empty markdown', () => {
		expect(createMarkdownExcerpt('', 20)).toBe('');
	});
});
