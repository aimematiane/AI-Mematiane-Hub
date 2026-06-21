<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import { ArrowUpRight, Loader2, Search } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { applyAiToolsQueryFilters } from '$lib/utils/pagination.js';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let tools = $state([]);
	let page = $state(1);
	let loading = $state(false);
	let loadMoreRef = $state(null);

	$effect(() => {
		tools = data.tools || [];
		page = data.page ?? 1;
	});

	let hasMore = $derived(page < Math.ceil(data.totalCount / data.perPage));
	const siteName = $derived(data.site?.site_name || 'AI Mematiane');
	const resultLabel = $derived(`${data.totalCount} ${data.totalCount === 1 ? 'result' : 'results'}`);
	const canonicalUrl = $derived(data.page > 1 ? `/ai-tools?page=${data.page}` : '/ai-tools');
	const prevUrl = $derived(data.page > 1 ? (data.page > 2 ? `/ai-tools?page=${data.page - 1}` : '/ai-tools') : '');
	const nextUrl = $derived(data.page < Math.ceil(data.totalCount / data.perPage) ? `/ai-tools?page=${data.page + 1}` : '');

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		let query = client.from('ai_tools').select('*');
		query = applyAiToolsQueryFilters(query, {
			category: data.category,
			search: data.search,
			pricing: data.pricing,
			sort: data.sort
		});
		const { data: newTools, error } = await query.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

		if (!error && newTools && newTools.length > 0) {
			tools.push(...newTools);
			page = nextPage;
		}
		loading = false;
	}

	$effect(() => {
		if (!loadMoreRef || !hasMore) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) loadMore();
		}, { rootMargin: '400px' });
		observer.observe(loadMoreRef);
		return () => observer.disconnect();
	});
</script>

<SeoHead
	title={data.page > 1 ? `Directory - Page ${data.page}` : `Directory — ${siteName}`}
	description="Browse a curated directory of products, services, tools, and resources."
	url={canonicalUrl}
	prevUrl={prevUrl}
	nextUrl={nextUrl}
	tags={['directory', 'resources', 'tools', 'showcase']}
/>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Directory' }]} />

	<div class="mb-8 border-b border-surface-800 pb-6">
		<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
			<div>
				<h1 class="text-3xl sm:text-4xl font-bold text-white">Directory</h1>
			</div>
			<p class="text-sm text-surface-500">{resultLabel}</p>
		</div>

		<form method="GET" action="/ai-tools" class="max-w-xl">
			<label class="relative block">
				<span class="sr-only">Search directory</span>
				<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
				<input
					name="q"
					value={data.search || ''}
					placeholder="Search..."
					class="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-900 border border-surface-800 text-sm text-white placeholder-surface-500 focus:border-accent-500 focus:outline-none"
				/>
			</label>
		</form>
	</div>

	{#if tools.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
			{#each tools as tool}
				<a href="/ai-tools/{tool.slug}" class="group block overflow-hidden rounded-xl bg-surface-900 border border-surface-800 hover:border-accent-500/30 transition-all hover:-translate-y-0.5">
					{#if tool.image_url}
					<div class="aspect-[16/9] bg-surface-800 overflow-hidden">
						{#if tool.image_url}
							<img src={optimizeImageUrl(tool.image_url, { width: 800, quality: 80 })} alt={tool.name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
						{/if}
					</div>
					{/if}
					<div class="p-5">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<h2 class="text-lg font-bold text-white mb-1 group-hover:text-accent-400 transition-colors">{tool.name}</h2>
								<p class="text-sm text-surface-400 line-clamp-2">{tool.description}</p>
							</div>
							<ArrowUpRight size={18} class="shrink-0 text-surface-500 group-hover:text-accent-400 transition-colors" />
						</div>
						<div class="mt-4 flex items-center gap-2 text-xs text-surface-500">
							<span class="uppercase tracking-wider">{tool.category || 'General'}</span>
							<span>•</span>
							<span>{tool.pricing || 'free'}</span>
							{#if tool.is_featured}
								<span>•</span>
								<span class="text-amber-400">Featured</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20 rounded-2xl border border-dashed border-surface-800 bg-surface-900/40">
			<Search size={36} class="mx-auto text-surface-600 mb-4" />
			<h2 class="text-xl font-semibold text-white mb-2">No matching listings</h2>
			<p class="text-surface-500 text-sm mb-5">Try a different search, category, or pricing filter.</p>
			<a href="/ai-tools" class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-surface-800 text-surface-200 hover:text-white text-sm">
				Clear filters
			</a>
		</div>
	{/if}

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex flex-col items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-accent-500" />
			{/if}
			<div class="sr-only focus:not-sr-only print:hidden mt-4">
				<a href="?page={page + 1}" class="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200">Next Page (Page {page + 1})</a>
			</div>
		</div>
	{/if}
</section>
