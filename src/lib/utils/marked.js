import { marked } from 'marked';
import { browser } from '$app/environment';
import DOMPurify from 'dompurify';

marked.setOptions({
	gfm: true,
	breaks: true
});

const ALLOWED_TAGS = [
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
	'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
	'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
	'table', 'thead', 'tbody', 'tr', 'th', 'td',
	'img', 'figure', 'figcaption', 'div', 'span',
	'sup', 'sub', 'mark', 'abbr', 'details', 'summary'
];

const ALLOWED_ATTRS = [
	'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
	'width', 'height', 'loading', 'fetchpriority', 'colspan', 'rowspan',
	'start', 'type'
];

export function sanitizeHtml(html) {
	const value = typeof html === 'string' ? html : String(html ?? '');
	if (!value) return '';

	if (browser) {
		return DOMPurify.sanitize(value, {
			ALLOWED_TAGS,
			ALLOWED_ATTR: ALLOWED_ATTRS,
			ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
			FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
			FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
			RETURN_TRUSTED_TYPE: false
		});
	}

	// Server-side fallback: lightweight regex sanitization to remove scripts, styles, frames & handlers
	return value
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
		.replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, '')
		.replace(/javascript:\s*[^"']/gi, '');
}

export function renderMarkdown(content) {
	const value = typeof content === 'string' ? content : String(content ?? '');
	if (!value) return '';
	return sanitizeHtml(marked(value));
}

export function extractHeadings(content) {
	const headings = [];
	const lines = (typeof content === 'string' ? content : String(content ?? '')).split('\n');
	for (const line of lines) {
		const match = line.match(/^(#{2,3})\s+(.+)/);
		if (match) {
			const level = match[1].length;
			const text = match[2].replace(/[*_`]/g, '');
			const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
			headings.push({ level, text, id });
		}
	}
	return headings;
}
