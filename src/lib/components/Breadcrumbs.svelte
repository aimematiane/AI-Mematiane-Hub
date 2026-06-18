<script>
	import { page } from '$app/stores';
	import { absoluteUrl } from '$lib/config/site.js';

	let { items = [] } = $props();

	const schema = $derived(JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.label,
			item: absoluteUrl(item.href || $page.url.pathname)
		}))
	}));
</script>

<svelte:head>
	<script type="application/ld+json">{schema}</script>
</svelte:head>

<nav aria-label="Breadcrumb" class="mb-6 text-sm text-surface-400">
	<ol class="flex items-center gap-1.5 flex-wrap">
		{#each items as item, i}
			{#if i > 0}
				<li class="text-surface-600">/</li>
			{/if}
			<li>
				{#if item.href}
					<a href={item.href} class="hover:text-white transition-colors">{item.label}</a>
				{:else}
					<span class="text-white">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
