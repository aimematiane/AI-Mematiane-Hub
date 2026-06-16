import { marked } from 'marked';

marked.setOptions({
	gfm: true,
	breaks: true
});

const ALLOWED_TAGS = new Set([
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
	'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
	'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
	'table', 'thead', 'tbody', 'tr', 'th', 'td',
	'img', 'figure', 'figcaption', 'div', 'span',
	'sup', 'sub', 'mark', 'abbr', 'details', 'summary'
]);

const ALLOWED_ATTRS = new Set([
	'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
	'width', 'height', 'loading', 'fetchpriority', 'colspan', 'rowspan',
	'start', 'type'
]);

function sanitizeHtml(html) {
	return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) => {
		const lower = tag.toLowerCase();
		if (!ALLOWED_TAGS.has(lower)) return '';
		if (match.startsWith('</')) return `</${lower}>`;
		const attrs = [];
		const attrRegex = /([a-zA-Z][a-zA-Z0-9-]*)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
		let m;
		while ((m = attrRegex.exec(match)) !== null) {
			const name = m[1].toLowerCase();
			const value = m[2] ?? m[3] ?? m[4] ?? '';
			if (ALLOWED_ATTRS.has(name)) {
				if (name === 'href' || name === 'src') {
					if (/^\s*javascript:/i.test(value)) continue;
				}
				attrs.push(`${name}="${value}"`);
			}
		}
		const selfClose = match.endsWith('/>') ? ' /' : '';
		return attrs.length ? `<${lower} ${attrs.join(' ')}${selfClose}>` : `<${lower}${selfClose}>`;
	});
}

export function renderMarkdown(content) {
	if (!content) return '';
	return sanitizeHtml(marked(content));
}

export function extractHeadings(content) {
	const headings = [];
	const lines = content.split('\n');
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

export function estimateReadingTime(content) {
	const words = content.split(/\s+/).length;
	return Math.max(1, Math.ceil(words / 200));
}
