import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				warningFilter: (warning) => {
					const ignored = [
						'a11y_label_has_associated_control',
						'a11y_no_static_element_interactions',
						'state_referenced_locally'
					];
					return !ignored.includes(warning.code);
				}
			},
			adapter: adapter()
		})
	]
});
