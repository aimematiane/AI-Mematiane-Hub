import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

marked.setOptions({
	gfm: true,
	breaks: true
});

export function renderMarkdown(content) {
	if (!content) return '';
	return DOMPurify.sanitize(marked(content));
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
