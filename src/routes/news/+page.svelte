<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Clock, Loader2 } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const client = getSupabaseBrowserClient();

	let newsItems = $state([]);
	let page = $state(1);
	let loading = $state(false);
	let loadMoreRef = $state(null);

	$effect(() => {
		newsItems = data.newsItems || [];
		page = data.page ?? 1;
	});

	let hasMore = $derived(page < Math.ceil(data.totalCount / data.perPage));

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		const nextPage = page + 1;
		const { data: newItems, error } = await client
			.from('news')
			.select('*')
			.eq('is_published', true)
			.order('published_at', { ascending: false })
			.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

		if (!error && newItems && newItems.length > 0) {
			newsItems.push(...newItems);
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

	const canonicalUrl = $derived(data.page > 1 ? `/news?page=${data.page}` : '/news');
	const prevUrl = $derived(data.page > 1 ? (data.page > 2 ? `/news?page=${data.page - 1}` : '/news') : '');
	const nextUrl = $derived(data.page < Math.ceil(data.totalCount / data.perPage) ? `/news?page=${data.page + 1}` : '');

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead
	title={data.page > 1 ? `News - Page ${data.page}` : 'AI News — AI Mematiane'}
	description="Latest news and analysis from the world of AI."
	url={canonicalUrl}
	prevUrl={prevUrl}
	nextUrl={nextUrl}
	tags={[ 'AI news', 'machine learning news', 'industry updates' ]}
 />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'News' }]} />

	<div class="mb-6">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">News</h1>
		<p class="text-surface-400">Latest news, research, and announcements in AI.</p>
	</div>

	{#if newsItems.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each newsItems as item, i}
				<a href="/news/{item.slug}" class="glass-card group block rounded-2xl overflow-hidden animate-fade-in-up hover:border-rose-500/20">
					{#if item.cover_image_url}
						<div class="aspect-video overflow-hidden bg-surface-950/40 relative">
							<img src={optimizeImageUrl(item.cover_image_url, { width: 800, quality: 80 })} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
							<div class="absolute inset-0 bg-gradient-to-t from-surface-950/30 to-transparent pointer-events-none"></div>
						</div>
					{/if}
					<div class="p-6">
						<div class="flex items-center gap-3 mb-3">
							<CategoryBadge category={item.category} size="xs" />
							<span class="inline-flex items-center gap-1 text-xs text-surface-500">
								<Clock size={10} />
								{item.reading_time_min || '-'} min read
							</span>
						</div>
						<h2 class="text-xl font-bold text-white group-hover:text-rose-400 transition-colors mb-2 tracking-tight">{item.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4">{item.excerpt}</p>
						{#if item.published_at}
							<time class="text-xs text-surface-500">{formatDate(item.published_at)}</time>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-20">
			<p class="text-surface-500">No news articles yet.</p>
		</div>
	{/if}

	{#if hasMore}
		<div bind:this={loadMoreRef} class="flex flex-col items-center justify-center py-10 mt-4">
			{#if loading}
				<Loader2 size={24} class="animate-spin text-rose-400" />
			{/if}
			<div class="sr-only focus:not-sr-only print:hidden mt-4">
				<a href="?page={page + 1}" class="px-4 py-2 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-200">Next Page (Page {page + 1})</a>
			</div>
		</div>
	{/if}
</section>

