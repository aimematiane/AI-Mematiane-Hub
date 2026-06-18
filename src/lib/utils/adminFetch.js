import { deserialize } from '$app/forms';

/**
 * Submit a SvelteKit form action programmatically with correct headers.
 */
export async function submitAction(action, formData, basePath = '') {
	const url = basePath ? `${basePath}?/${action}` : `?/${action}`;
	const response = await fetch(url, {
		method: 'POST',
		body: formData,
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		}
	});

	const text = await response.text();
	const result = deserialize(text);

	if (result.type === 'failure' || result.type === 'error') {
		const message = result.data?.message || result.error?.message || 'Action failed';
		throw new Error(message);
	}

	if (!response.ok) {
		throw new Error(`Request failed (${response.status})`);
	}

	return result;
}
