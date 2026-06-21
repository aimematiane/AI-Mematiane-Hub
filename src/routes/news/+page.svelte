<script>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import { Bookmark, Heart, Loader2, MessageCircle, Share2 } from '@lucide/svelte';
	import { optimizeImageUrl } from '$lib/utils/image';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { applyNewsQueryFilters } from '$lib/utils/pagination.js';

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
		let query = client.from('news').select('*');
		query = applyNewsQueryFilters(query, { category: data.category });
		const { data: newItems, error } = await query.range((nextPage - 1) * data.perPage, nextPage * data.perPage - 1);

		if (!error && newItems && newItems.length > 0) {
			const metrics = await fetchMetrics('news', newItems.map((item) => item.id));
			newsItems.push(...newItems.map((item) => ({ ...item, metrics: metrics[item.id] || emptyMetrics() })));
			page = nextPage;
		}
		loading = false;
	}

	function emptyMetrics() {
		return { upvotes: 0, bookmarks: 0, comments: 0 };
	}

	async function fetchMetrics(itemType, itemIds) {
		const { data: metrics } = await client.rpc('get_content_metrics', {
			p_item_type: itemType,
			p_item_ids: itemIds
		});
		return Object.fromEntries((metrics || []).map((row) => [row.item_id, {
			upvotes: row.upvotes_count || 0,
			bookmarks: row.bookmarks_count || 0,
			comments: row.comments_count || 0
		}]));
	}

	async function shareCard(event, item) {
		event.preventDefault();
		event.stopPropagation();
		const url = `${window.location.origin}/news/${item.slug}`;
		if (navigator.share) {
			await navigator.share({ title: item.title, text: item.excerpt, url });
		} else {
			await navigator.clipboard?.writeText(url);
		}
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
	const siteName = $derived(data.site?.site_name || 'AI Mematiane');
	const siteDescription = $derived(data.site?.site_description || 'Latest stories, updates, and announcements.');

	function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
</script>

<SeoHead
	title={data.page > 1 ? `News - Page ${data.page}` : `AI News — ${siteName}`}
	description={siteDescription}
	url={canonicalUrl}
	prevUrl={prevUrl}
	nextUrl={nextUrl}
	tags={[ 'AI news', 'machine learning news', 'industry updates' ]}
 />

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'News' }]} />

	<div class="mb-6">
		<h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">News</h1>
		<p class="text-surface-400">{siteDescription}</p>
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
							{#if item.author}
								<span class="text-xs text-surface-500">{item.author.display_name}</span>
							{/if}
							{#if item.created_at}
								<time class="text-xs text-surface-500">{formatDate(item.created_at)}</time>
							{/if}
						</div>
						<h2 class="text-xl font-bold text-white group-hover:text-rose-400 transition-colors mb-2 tracking-tight">{item.title}</h2>
						<p class="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4">{item.excerpt}</p>
						<div class="flex items-center justify-between gap-3 text-xs text-surface-500">
							<div class="flex items-center gap-3">
								<span class="inline-flex items-center gap-1" title="Likes"><Heart size={13} />{item.metrics?.upvotes || 0}</span>
								<span class="inline-flex items-center gap-1" title="Saves"><Bookmark size={13} />{item.metrics?.bookmarks || 0}</span>
								<span class="inline-flex items-center gap-1" title="Comments"><MessageCircle size={13} />{item.metrics?.comments || 0}</span>
							</div>
							<button type="button" onclick={(event) => shareCard(event, item)} class="inline-flex items-center gap-1 hover:text-accent-400 transition-colors" title="Share">
								<Share2 size={13} />
							</button>
						</div>
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
