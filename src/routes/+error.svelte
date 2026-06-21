<script>
	import { page } from '$app/state';
	import SeoHead from '$lib/components/SeoHead.svelte';

	// SvelteKit error details are available via the page store
	const status = $derived(page.status || 500);
	const message = $derived(page.error?.message || 'An unexpected error occurred');
	const siteName = $derived(page.data?.site?.site_name || 'this site');

	const title = $derived(`Error ${status} | ${siteName}`);
	const description = $derived(`Something went wrong on ${siteName}. Error ${status}: ${message}`);
</script>

<SeoHead {title} {description} noindex={true} />

<div class="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden">
	<!-- Ambient background glow -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		<div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl"></div>
		<div class="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
	</div>

	<div class="relative max-w-md w-full text-center z-10">
		<!-- Error Code Badge -->
		<div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-900/80 border border-surface-800 text-accent-400 text-4xl font-extrabold font-display shadow-2xl mb-8">
			{status}
		</div>

		<!-- Error Message -->
		<h1 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
			{#if status === 404}
				Page Not Found
			{:else}
				Unexpected Error
			{/if}
		</h1>

		<p class="text-surface-400 mb-8 text-base leading-relaxed max-w-sm mx-auto">
			{#if status === 404}
				The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
			{:else}
				{message}
			{/if}
		</p>

		<!-- Actions -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a
				href="/"
				class="px-6 py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-medium transition-all shadow-lg hover:shadow-accent-500/20 active:scale-95"
			>
				Back to Home
			</a>
			<a
				href="/ai-tools"
				class="px-6 py-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 text-surface-200 hover:text-white font-medium transition-all active:scale-95"
			>
				Browse AI Tools
			</a>
		</div>
	</div>
</div>
