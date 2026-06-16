<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Loader2, Star, ArrowUpRight } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

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

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		const { data: newTools, error } = await client
			.from('ai_tools')
			.select('*')
			.order('is_featured', { ascending: false })
			.order('created_at', { ascending: false })
			.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

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

	const canonicalUrl = $derived(data.page > 1 ? `/ai-tools?page=${data.page}` : '/ai-tools');
	const prevUrl = $derived(data.page > 1 ? (data.page > 2 ? `/ai-tools?page=${data.page - 1}` : '/ai-tools') : '');
	const nextUrl = $derived(data.page < Math.ceil(data.totalCount / data.perPage) ? `/ai-tools?page=${data.page + 1}` : '');
</script>

<SeoHead
	title={data.page > 1 ? `AI Tools - Page ${data.page}` : 'AI Showcase — AI Mematiane'}
	description="Directory of AI tools, models, and applications across categories."
	url={canonicalUrl}
	prevUrl={prevUrl}
	nextUrl={nextUrl}
	tags={[ 'AI tools', 'machine learning', 'models', 'ai showcase' ]}
 />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'AI Showcase' }]} />

	<div class="mb-6">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">AI Showcase</h1>
		<p class="text-surface-400">Explore curated AI tools, models, and applications.</p>
	</div>

	{#if tools.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each tools as tool, i}
				<a
					href="/ai-tools/{tool.slug}"
					class="glass-card group flex flex-col rounded-2xl overflow-hidden animate-fade-in-up hover:border-accent-500/20 hover:shadow-accent-500/10"
					style="animation-delay: {Math.min(i * 80, 600)}ms;"
				>
					{#if tool.cover_image_url}
						<div class="relative aspect-[16/10] overflow-hidden bg-surface-950/40">
							<img src={optimizeImageUrl(tool.cover_image_url, { width: 600, quality: 80 })} alt={tool.name} class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
							<div class="absolute inset-0 bg-gradient-to-t from-surface-950/40 to-transparent pointer-events-none"></div>
						</div>
					{:else}
						<div class="relative aspect-[16/10] bg-gradient-to-br from-accent-950/30 to-surface-900 flex items-center justify-center">
							<span class="text-4xl font-bold text-surface-700 group-hover:scale-110 transition-transform duration-500">{(tool.name || '?').charAt(0)}</span>
						</div>
					{/if}
					<div class="flex flex-col flex-1 p-5">
						<div class="flex items-center gap-2 mb-3">
							<CategoryBadge category={tool.category || 'general'} size="xs" />
							{#if tool.is_featured}
								<span class="inline-flex items-center gap-1 text-xs text-amber-400"><Star size={11} fill="currentColor" />Featured</span>
							{/if}
						</div>
						<h3 class="text-lg font-bold text-white mb-1.5 tracking-tight group-hover:text-accent-400 transition-colors">{tool.name}</h3>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-3 flex-1">{tool.description}</p>
						<div class="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-surface-500">
							<span class="font-medium text-surface-400">{tool.pricing || 'Free'}</span>
							<span class="inline-flex items-center gap-1 text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">View<ArrowUpRight size={12} /></span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500">No tools found.</p>
		</div>
	{/if}

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex flex-col items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-emerald-500" />
			{/if}
			<div class="sr-only focus:not-sr-only print:hidden mt-4">
				<a href="?page={page + 1}" class="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200">Next Page (Page {page + 1})</a>
			</div>
		</div>
	{/if}
</section>

